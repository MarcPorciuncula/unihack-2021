import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { Frame } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"

const FrameDataSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  size: z.object({ height: z.number(), width: z.number() }),
  currentProvisionHash: z.string(),
})

export class FrameService {
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

  async getAll(): Promise<Frame[]> {
    const snapshots = await admin.firestore().collection("frames").get()

    if (snapshots.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        `could not find any frames`
      )
    }

    return snapshots.docs.map(
      (snapshot) =>
        FrameDataSchema.parse({
          id: snapshot.id,
          ...fromFirestoreTypes(snapshot.data()!),
        }) as Frame
    )
  }

  async update(frameId: string, data: Partial<Frame>) {
    console.log("update frame")
    await this.firestore.collection("frames").doc(frameId).update(data)
    return this.get(frameId)
  }
}
