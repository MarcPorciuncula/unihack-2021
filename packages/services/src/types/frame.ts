export type Segment = {
  id: string
  tiles: Tile[]
  isAvailable: boolean
  // if the segment has been claimed, has a reference to the user
  claimant: string | null
  claimedAt: Date | null
}

export type User = {
  uid: string
}

export type Tile = {
  id: string
  location: [number, number]
}

export type Frame = {
  id: string
  tiles: Tile[]
  createdAt: Date
}
