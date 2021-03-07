import { firebase, FirestoreDataConverter } from "../firebase"

export type Frame = {
  size: { width: number; height: number }
  id: string
}

export const FrameConverter: FirestoreDataConverter<Frame> = {
  fromFirestore: (snapshot) => {
    return {
      ...snapshot.data(),
      id: snapshot.id,
    } as Frame
  },
  toFirestore: null!,
}

export function getFramesCollection(firestore: firebase.firestore.Firestore) {
  return firestore.collection("frames").withConverter(FrameConverter)
}

export type Drawing = {
  region: Segment["region"]
  drawing: Uint8Array[]
  signature: Uint8Array[]
  createdAt: Date
  segmentId: string
}

export const DrawingConverter: FirestoreDataConverter<Drawing> = {
  fromFirestore: (snapshot) => {
    return {
      drawing: (snapshot.get(
        "drawing"
      ) as firebase.firestore.Blob[]).map((item) => item.toUint8Array()),
      signature: (snapshot.get(
        "signature"
      ) as firebase.firestore.Blob[]).map((item) => item.toUint8Array()),
      createdAt: snapshot.get("createdAt").toDate(),
      segmentId: snapshot.get("segmentId"),
      region: snapshot.get("region"),
    }
  },
  toFirestore: (value: Drawing) => {
    return {
      ...value,
      signature: value.signature.map((path) =>
        firebase.firestore.Blob.fromUint8Array(path)
      ),
      drawing: value.drawing.map((path) =>
        firebase.firestore.Blob.fromUint8Array(path)
      ),
      createdAt: firebase.firestore.Timestamp.fromDate(value.createdAt),
    }
  },
}

export function getDrawingCollection(
  firestore: firebase.firestore.Firestore,
  frameId: string
) {
  return firestore
    .collection("frames")
    .doc(frameId)
    .collection("drawings")
    .withConverter(DrawingConverter)
}

export type Segment = {
  claimant: string | null
  claimedAt: Date | null
  isAvailable: boolean
  region: {
    br: [number, number]
    tl: [number, number]
  }
}

export function getSegmentsCollection(
  firestore: firebase.firestore.Firestore,
  frameId: string
) {
  return firestore
    .collection("frames")
    .doc(frameId)
    .collection("segments")
    .withConverter(SegmentConverter)
}

export const SegmentConverter: FirestoreDataConverter<Segment> = {
  fromFirestore: (snapshot) => {
    return {
      claimant: snapshot.get("claimant"),
      claimedAt: snapshot.get("claimedAt")?.toDate() || null,
      isAvailable: snapshot.get("isAvailable"),
      region: snapshot.get("region"),
    }
  },
  toFirestore: null!,
}
