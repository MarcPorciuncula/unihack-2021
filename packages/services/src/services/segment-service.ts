import { DocumentData, DocumentReference } from "@google-cloud/firestore"
import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import * as z from "zod"
import { Segment } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"

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
  segments: FirebaseFirestore.CollectionReference<DocumentData>

  constructor(frameId: string) {
    this.firestore = admin.firestore()
    this.segments = this.firestore
      .collection("frames")
      .doc(frameId)
      .collection("segments")
  }

  async get(segmentId: string): Promise<Segment> {
    const snapshot = await this.segments.doc(segmentId).get()

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

  async claim(segmentId: string, uid: string) {
    const segment = await this.get(segmentId)

    if (!segment.isAvailable) {
      throw new functions.https.HttpsError(
        "unavailable",
        "this segment is no longer available"
      )
    }

    return this.update(segmentId, {
      claimant: uid,
      claimedAt: new Date(),
      isAvailable: false,
    })
  }

  private async update(
    segmentId: string,
    data: Partial<Segment>
  ): Promise<Segment> {
    const snapshot = await this.firestore.runTransaction(
      async (transaction) => {
        return transaction
          .update(this.segments.doc(segmentId), data)
          .get(this.segments.doc(segmentId))
      }
    )

    return SegmentDataSchema.parse({
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    }) as Segment
  }
}
