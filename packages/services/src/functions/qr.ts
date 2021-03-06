import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import * as z from "zod"
import { fromFirestoreTypes } from "../util/firestore"
import { QRcode } from "../types"
import { QRCodeService } from "../services/qr-service"
import { isPast } from "date-fns"

const InputSchema = z.object({
  shortId: z.string(),
})

export function register(builder: functions.FunctionBuilder) {
  return {
    service: builder.https.onCall(async (data, context) => {
      let body: z.TypeOf<typeof InputSchema>
      try {
        body = InputSchema.parse(data)
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
