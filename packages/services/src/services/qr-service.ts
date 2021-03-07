import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { QRcode } from "../types"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"
import { SegmentService } from "./segment-service"
import shortid from "shortid"

const QRcodeDataSchema = z.object({
  id: z.string(),
  frameId: z.string(),
  createdAt: z.date(),
  segmentId: z.string(),
})

export class QRCodeService {
  firestore: FirebaseFirestore.Firestore
  constructor() {
    this.firestore = admin.firestore()
  }

  async resolve(id: string): Promise<QRcode> {
    const snapshot = await admin.firestore().collection("qrcodes").doc(id).get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `The QR code could not be found.`
      )
    }

    const qrData = QRcodeDataSchema.parse({
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    })

    const segmentService = new SegmentService(qrData.frameId)

    const segmentData = await segmentService.get(qrData.segmentId)

    return { ...qrData, segment: segmentData }
  }

  async createSegmentQr(frameId: string, segmentId: string) {
    const id = shortid.generate()
    await admin
      .firestore()
      .collection("qrcodes")
      .doc(id)
      .set({ frameId, segmentId, createdAt: new Date() })
  }
}
