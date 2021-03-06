/**
 * Functions to serialize and deserialize to and from Firestore and JavaScript
 * native types.
 */
import { Timestamp } from "@google-cloud/firestore"
import { map, mapObjIndexed } from "ramda"

type FLeafValue = string | number | boolean | null | Timestamp | undefined
type FDocValue = { [key: string]: FFieldValue }
type FFieldValue = FLeafValue | FLeafValue[] | FDocValue | FDocValue[]

type LeafValue = string | number | boolean | null | Date | undefined
type ObjectValue = { [key: string]: FieldValue }
type FieldValue = LeafValue | LeafValue[] | ObjectValue | ObjectValue[]

export type ToFirestore<T> = T extends Date
  ? Timestamp
  : T extends LeafValue
  ? T
  : T extends LeafValue[]
  ? ToFirestore<LiftArray<T>>[]
  : T extends ObjectValue
  ? { [key in keyof T]: ToFirestore<T[key]> }
  : T extends ObjectValue[]
  ? ToFirestore<LiftArray<T>>[]
  : never

export type FromFirestore<T> = T extends Timestamp
  ? Date
  : T extends FLeafValue
  ? T
  : T extends FLeafValue[]
  ? FromFirestore<LiftArray<T>>[]
  : T extends FDocValue
  ? { [key in keyof T]: FromFirestore<T[key]> }
  : T extends FDocValue[]
  ? FromFirestore<LiftArray<T>>[]
  : never

type LiftArray<T> = T extends (infer U)[] ? U : null

export type FirestoreSerializable = ObjectValue

/**
 * Serializes data into Firestore supported types
 */
export function toFirestoreTypes<T extends ObjectValue>(
  data: T
): ToFirestore<T> {
  return toFirestoreDocument(data) as ToFirestore<T>
}

function toFirestoreDocument(data: ObjectValue): FDocValue {
  return mapObjIndexed(toFirestoreField)(data)
}

function toFirestoreField(data: FieldValue): FFieldValue {
  if (Array.isArray(data)) {
    if (data.length && isSerializableLeaf(data[0])) {
      return map(toFirestoreLeaf)(data as LeafValue[])
    } else if (data.length) {
      return map(toFirestoreDocument)(data as ObjectValue[])
    } else {
      return []
    }
  } else if (typeof data === "object" && data !== null && !isDate(data)) {
    return toFirestoreDocument(data)
  } else {
    return toFirestoreLeaf(data)
  }
}

function toFirestoreLeaf(data: LeafValue): FLeafValue {
  if (data instanceof Date) {
    return Timestamp.fromDate(data)
  }

  return data
}

/**
 * Deserializes Firestore specific types into vanilla JavaScript types
 */
export function fromFirestoreTypes<T extends FDocValue>(
  data: T
): FromFirestore<T> {
  return fromFirestoreDocument(data) as FromFirestore<T>
}

function fromFirestoreDocument(data: FDocValue): ObjectValue {
  return mapObjIndexed(deserializeField, data)
}

function deserializeField(data: FFieldValue): FieldValue {
  if (Array.isArray(data)) {
    if (data.length && isFirestoreLeaf(data[0])) {
      return map(deserializeLeaf)(data as FLeafValue[])
    } else if (data.length) {
      return map(fromFirestoreDocument)(data as FDocValue[])
    } else {
      return []
    }
  } else if (typeof data === "object" && data !== null && !isTimestamp(data)) {
    return fromFirestoreDocument(data)
  } else {
    return deserializeLeaf(data)
  }
}

function deserializeLeaf(data: FLeafValue): LeafValue {
  if (isTimestamp(data)) {
    return data.toDate()
  }

  return data
}

function isDate(value: any): value is Date {
  return value instanceof Date
}

function isTimestamp(value: any): value is Timestamp {
  return value instanceof Timestamp
}

function isSerializableLeaf(value: any): value is LeafValue {
  return !(!isDate(value) && typeof value === "object")
}

function isFirestoreLeaf(value: any): value is FLeafValue {
  return !(!isTimestamp(value) && typeof value === "object")
}
