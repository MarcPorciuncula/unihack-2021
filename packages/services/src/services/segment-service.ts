import { DocumentData, DocumentReference } from "@google-cloud/firestore"
import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import * as z from "zod"
import { Segment } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"
import shortid from "shortid"
import { GridService } from "./grid-service"

const SegmentDataSchema = z.object({
  id: z.string(),
  frameId: z.string(),
  tiles: z.array(z.string()),
  region: z.object({
    tl: z.tuple([z.number(), z.number()]),
    br: z.tuple([z.number(), z.number()]),
  }),
  claimedAt: z.date().nullable().default(null),
  claimant: z.string().nullable().default(null),
  isAvailable: z.boolean(),
  provisionHash: z.string().default("default"),
})

type GetAllOptions = {
  provisionHash?: string
}

export class SegmentService {
  firestore: FirebaseFirestore.Firestore
  segments: FirebaseFirestore.CollectionReference<DocumentData>
  frameId: string

  constructor(frameId: string) {
    this.firestore = admin.firestore()
    this.segments = this.firestore
      .collection("frames")
      .doc(frameId)
      .collection("segments")
    this.frameId = frameId
  }

  async get(segmentId: string): Promise<Segment> {
    const snapshot = await this.segments.doc(segmentId).get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `Could not find segment.`
      )
    }

    return SegmentDataSchema.parse({
      id: snapshot.id,
      frameId: this.frameId,
      ...fromFirestoreTypes(snapshot.data()!),
      frameId: snapshot.ref.parent.parent!.id,
    }) as Segment
  }

  async getAll(options?: GetAllOptions): Promise<Segment[]> {
    let snapshots: FirebaseFirestore.QuerySnapshot<DocumentData>
    if (options?.provisionHash) {
      snapshots = await this.segments
        .where("provisionHash", "==", options?.provisionHash)
        .get()
    } else {
      snapshots = await this.segments.get()
    }

    return snapshots.docs.map(
      (snapshot) =>
        SegmentDataSchema.parse({
          id: snapshot.id,
          frameId: this.frameId,
          ...fromFirestoreTypes(snapshot.data()!),
        }) as Segment
    )
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

  async provision(region: [[number, number], [number, number]], hash: string) {
    const id = shortid.generate()
    await this.segments.doc(id).set({
      isAvailable: true,
      tiles: GridService.convertRegionToTileCoordsString(region),
      region: { tl: region[0], br: region[1] },
      provisionHash: hash,
    } as Partial<Segment>)

    return await this.get(id)
  }

  private async update(
    segmentId: string,
    data: Partial<Segment>
  ): Promise<Segment> {
    await this.firestore.runTransaction(async (transaction) => {
      return transaction.update(this.segments.doc(segmentId), data)
    })

    return await this.get(segmentId)
  }
}
