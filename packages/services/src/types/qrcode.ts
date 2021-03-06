import { Frame, Segment } from "./frame"

export type QRcode = {
  id: string
  frameId: string
  createdAt: Date
  segment: Segment
}
