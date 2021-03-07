import { range, uniq } from "ramda"
import { shuffler } from "../util/shuffler"

type Coord = [number, number]

export class GridService {
  availabilityGrid: number[][]
  width: number
  height: number
  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.availabilityGrid = range(0, this.height).map(() =>
      Array.from(Array(this.width).fill(0))
    )
    console.log(
      "DIM",
      this.availabilityGrid.length,
      this.availabilityGrid[0].length
    )
  }

  setAvailability(available: [x: number, y: number][]) {
    available.forEach((coord) => {
      this.availabilityGrid![coord[1]][coord[0]] = 1
    })
    console.log(
      "ASSERT",
      this.availabilityGrid.every((r) => r.every((i) => i === 1))
    )
  }

  calculateProvisionedTiles(maxSize: number, targets: number[]) {
    let tiles: [Coord, Coord][] = []
    const shuffle = shuffler(Math.random)
    for (let i = maxSize; i > 0; i--) {
      console.log("check for size", i)
      const possibleRegions = shuffle(this.getPossibleRegionsForSize(i))

      console.log("possibleRegions", possibleRegions.length)
      let target = targets[i - 1]
      while (!!possibleRegions.length && target > 0) {
        const region = possibleRegions.pop() as [Coord, Coord]
        if (
          tiles.every(
            (tRegion) => !GridService.doRegionsIntersect(tRegion, region)
          )
        ) {
          target--
          tiles.push(region)
        }
      }
    }
    return tiles
  }

  private getPossibleRegionsForSize(size: number) {
    const possibleRegions: [Coord, Coord][] = []
    for (let y = 0; y <= this.height - size; y++) {
      for (let x = 0; x <= this.width - size; x++) {
        const region: [Coord, Coord] = [
          [x, y],
          [x + size - 1, y + size - 1],
        ]
        // console.log(
        //   "region",
        //   region,
        //   this.areCoordsAvailable(GridService.coordsForRegion(region))
        // )
        if (this.areCoordsAvailable(GridService.coordsForRegion(region))) {
          possibleRegions.push(region)
        }
      }
    }
    return possibleRegions
  }

  static coordsForRegion(region: [Coord, Coord]) {
    const [topLeft, bottomRight] = region
    const coords: Coord[] = []
    for (let x = topLeft[0]; x <= bottomRight[0]; x++) {
      for (let y = topLeft[1]; y <= bottomRight[1]; y++) {
        coords.push([x, y])
      }
    }
    return uniq(coords)
  }

  private areCoordsAvailable(coords: Coord[]) {
    return coords.every(
      (coord) => this.availabilityGrid![coord[1]][coord[0]] === 1
    )
  }

  static doRegionsIntersect(a: [Coord, Coord], b: [Coord, Coord]) {
    const aCoords = GridService.coordsForRegion(a)
    const bCoords = GridService.coordsForRegion(b)

    return aCoords.some((aCoord) =>
      bCoords.some(
        (bCoord) => aCoord[0] === bCoord[0] && aCoord[1] === bCoord[1]
      )
    )
  }

  static generateAllCoordsForGrid(width: number, height: number) {
    let coords: [number, number][] = []
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        coords.push([x, y])
      }
    }
    return coords
  }

  static convertRegionToTileCoordsString(region: [Coord, Coord]) {
    const coords = GridService.coordsForRegion(region)
    return coords.map((coord) => coord.join(","))
  }
}
