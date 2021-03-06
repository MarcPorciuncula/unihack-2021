import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { QRcode } from "../types"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"
import { SegmentService } from "./segment-service"

const QRcodeDataSchema = z.object({
  id: z.string(),
  frameId: z.string(),
  createdAt: z.date(),
  segmentId: z.string(),
})

export class QRCodeService {
  firestore: FirebaseFirestore.Firestore
  segmentService: SegmentService
  constructor() {
    this.firestore = admin.firestore()
    this.segmentService = new SegmentService()
  }

  async resolve(id: string): Promise<QRcode> {
    const snapshot = await admin.firestore().collection("qrcodes").doc(id).get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `could not find data for given short url`
      )
    }

    const qrData = QRcodeDataSchema.parse({
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    })

    const segmentData = await this.segmentService.get(
      qrData.frameId,
      qrData.segmentId
    )

    return { ...qrData, segment: segmentData }
  }
}
