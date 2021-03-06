import * as functions from "firebase-functions"
import * as z from "zod"
import { QRCodeService } from "../services/qr-service"

const getInputSchema = z.object({
  shortId: z.string(),
})

export function register(builder: functions.FunctionBuilder) {
  return {
    get: builder.https.onCall(async (data, context) => {
      let body: z.TypeOf<typeof getInputSchema>
      try {
        body = getInputSchema.parse(data)
      } catch (e) {
        functions.logger.error("invalid input", data, e)
        throw new functions.https.HttpsError("invalid-argument", e)
      }

      const qrService = new QRCodeService()

      const qrData = await qrService.resolve(body.shortId)

      if (!qrData.segment.isAvailable) {
        throw new functions.https.HttpsError(
          "unavailable",
          "this segment is not available"
        )
      }

      return qrData
    }),
  }
}
