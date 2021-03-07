import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import { Frame, Provision } from "../types/frame"
import { fromFirestoreTypes } from "../util/firestore"
import * as z from "zod"
import { DocumentData } from "@google-cloud/firestore"

const ProvisionDataSchema = z.object({
  frameId: z.string(),
  id: z.string(),
  provisionedAt: z.date(),
  tileCount: z.number(),
  regions: z.array(
    z.object({
      tl: z.tuple([z.number(), z.number()]),
      br: z.tuple([z.number(), z.number()]),
    })
  ),
  tiles: z.array(z.string()),
})

export class ProvisionService {
  firestore: FirebaseFirestore.Firestore
  provisions: FirebaseFirestore.CollectionReference<DocumentData>
  frameId: string
  constructor(frameId: string) {
    this.firestore = admin.firestore()
    this.provisions = this.firestore
      .collection("frames")
      .doc(frameId)
      .collection("provisions")
    this.frameId = frameId
  }

  async get(provisionId: string): Promise<Provision> {
    const snapshot = await this.provisions.doc(provisionId).get()

    if (!snapshot.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        `could not find provision`
      )
    }

    return ProvisionDataSchema.parse({
      frameId: this.frameId,
      id: snapshot.id,
      ...fromFirestoreTypes(snapshot.data()!),
    }) as Provision
  }

  async getAll(): Promise<Provision[]> {
    const snapshots = await this.provisions.get()

    if (snapshots.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        `could not find any frames`
      )
    }

    return snapshots.docs.map(
      (snapshot) =>
        ProvisionDataSchema.parse({
          frameId: this.frameId,
          id: snapshot.id,
          ...fromFirestoreTypes(snapshot.data()!),
        }) as Provision
    )
  }

  async createProvision(
    id: string,
    data: Omit<Provision, "id" | "frameId" | "provisionedAt" | "tileCount">
  ) {
    admin.firestore().runTransaction(async (transaction) => {
      const provisionRef = this.provisions.doc(id)
      transaction.create(provisionRef, {
        frameId: this.frameId,
        provisionedAt: new Date(),
        tileCount: data.tiles.length,
        ...data,
      } as Provision)

      const frameRef = admin.firestore().collection("frames").doc(this.frameId)
      transaction.update(frameRef, {
        currentProvisionHash: id,
      } as Partial<Frame>)
    })
  }
}
