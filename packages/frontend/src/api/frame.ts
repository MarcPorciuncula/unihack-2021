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
  tile: { x: number; y: number }
  paths: Uint8Array[]
}

export const DrawingConverter: FirestoreDataConverter<Drawing> = {
  fromFirestore: (snapshot) => {
    return {
      ...snapshot.data(),
      paths: (snapshot.data().paths as firebase.firestore.Blob[]).map((item) =>
        item.toUint8Array()
      ),
    } as Drawing
  },
  toFirestore: (value: Drawing) => {
    return {
      ...value,
      paths: value.paths.map((path) =>
        firebase.firestore.Blob.fromUint8Array(path)
      ),
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
