import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { doc } from "prettier"
import { Segment } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"

const SegmentDataSchema = z.object({
  id: z.string(),
  tiles: z.array(
    z.object({
      id: z.string(),
      location: z.tuple([z.number(), z.number()]),
    })
  ),
  claimedAt: z.date().nullable().default(null),
  claimant: z.string().nullable(),
  isAvailable: z.boolean(),
})

export class SegmentService {
  firestore: FirebaseFirestore.Firestore
  constructor() {
    this.firestore = admin.firestore()
  }

  async get(frameId: string, segmentId: string): Promise<Segment> {
    const snapshot = await admin
      .firestore()
      .collection("frames")
      .doc(frameId)
      .collection("segments")
      .doc(segmentId)
      .get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `could not find segment`
      )
    }

    return SegmentDataSchema.parse({
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    }) as Segment
  }
}
