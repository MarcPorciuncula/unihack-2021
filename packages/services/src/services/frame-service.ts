import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { Frame } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"

const FrameDataSchema = z.object({
  id: z.string(),
  tiles: z.array(
    z.object({
      id: z.string(),
      location: z.tuple([z.number(), z.number()]),
    })
  ),
  createdAt: z.date(),
})

export class SegmentService {
  firestore: FirebaseFirestore.Firestore
  constructor() {
    this.firestore = admin.firestore()
  }

  async get(frameId: string): Promise<Frame> {
    const snapshot = await admin
      .firestore()
      .collection("frames")
      .doc(frameId)
      .get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError("not-found", `could not find frame`)
    }

    return FrameDataSchema.parse({
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    }) as Frame
  }
}
