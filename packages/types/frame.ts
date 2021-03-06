export type Segment = {
  id: string
  tiles: Tile[]
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
