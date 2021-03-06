import * as functions from "firebase-functions"
import * as z from "zod"
import { QRCodeService } from "../services/qr-service"
import { SegmentService } from "../services/segment-service"

const claimInputSchema = z.object({
  qrId: z.string(),
  uid: z.string(),
})

export function register(builder: functions.FunctionBuilder) {
  return {
    claim: builder.https.onCall(async (data, context) => {
      let body: z.TypeOf<typeof claimInputSchema>
      try {
        body = claimInputSchema.parse(data)
      } catch (e) {
        functions.logger.error("invalid input", data, e)
        throw new functions.https.HttpsError("invalid-argument", e)
      }

      const qrService = new QRCodeService()

      const qrData = await qrService.resolve(body.qrId)

      if (!qrData.segment.isAvailable) {
        throw new functions.https.HttpsError(
          "unavailable",
          "This segment is not available."
        )
      }

      const segmentService = new SegmentService(qrData.frameId)

      const segmentData = await segmentService.claim(
        qrData.segment.id,
        body.uid
      )

      return segmentData
    }),
  }
}
