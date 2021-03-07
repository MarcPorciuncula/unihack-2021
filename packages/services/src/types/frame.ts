export type Segment = {
  id: string
  tiles: string[]
  region: Region
  isAvailable: boolean
  // if the segment has been claimed, has a reference to the user
  claimant: string | null
  claimedAt: Date | null
  frameId: string
  provisionHash: string
  qrId: string
}

export type User = {
  uid: string
}

export type Region = {
  tl: [number, number]
  br: [number, number]
}

export type Tile = {
  id: string
  location: [number, number]
}

export type Frame = {
  id: string
  createdAt: Date
  size: { height: number; width: number }
  currentProvisionHash: string
}

export type Provision = {
  frameId: string
  id: string
  provisionedAt: Date
  tileCount: number
  regions: Region[]
  tiles: string[]
}
