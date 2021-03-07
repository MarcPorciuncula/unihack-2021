import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import * as z from "zod"
import { flatten, __, difference, uniq, unnest } from "ramda"
import { FrameService } from "../services/frame-service"
import { SegmentService } from "../services/segment-service"
import { differenceInMinutes } from "date-fns"
import shortid from "shortid"
import { GridService } from "../services/grid-service"
import { ProvisionService } from "../services/provision-service"
import { QRCodeService } from "../services/qr-service"

const provision = async () => {
  const frames = await new FrameService().getAll()

  for (const frame of frames) {
    const segmentService = new SegmentService(frame.id)
    const { width, height } = frame.size
    const segments = await segmentService.getAll({
      provisionHash: frame.id,
    })
    const newAvailableToSegment = unnest(
      segments
        .filter(
          (segment) =>
            segment.isAvailable ||
            (!segment.isAvailable &&
              differenceInMinutes(new Date(), segment.claimedAt!) > 15)
        )
        .map((segment) => segment.region)
        .map((region) => GridService.coordsForRegion([region.tl, region.br]))
    )

    console.log("newAvailable", newAvailableToSegment)

    const allTiles = GridService.generateAllCoordsForGrid(width, height)

    const missingTiles = difference(
      allTiles,
      unnest(
        segments
          .map((segment) => segment.region)
          .map((region) => GridService.coordsForRegion([region.tl, region.br]))
      )
    )

    const allPossibleTiles = uniq([...newAvailableToSegment, ...missingTiles])

    console.log(
      "ALL",
      allPossibleTiles.length,
      allTiles.length,
      allTiles[0].length
    )

    // clear available segments as they are no longer useful
    admin.firestore().runTransaction(async (transaction) => {
      const toRemoveSnapshots = await transaction.get(
        admin
          .firestore()
          .collection("frames")
          .doc(frame.id)
          .collection("segments")
          .where("isAvailable", "==", true)
      )
      toRemoveSnapshots.forEach((snapshot) => transaction.delete(snapshot.ref))
    })

    // provision new segments
    const provisionHash = shortid.generate()

    const gridService = new GridService(width, height)
    gridService.setAvailability(allPossibleTiles)

    // target 2 3x3. 4 2x2, else 1x1s
    const regions = gridService.calculateProvisionedTiles(3, [300, 4, 2])

    const provisionService = new ProvisionService(frame.id)
    const qrService = new QRCodeService()
    console.log("Calculated regions")

    await provisionService.createProvision(provisionHash, {
      regions: regions.map((region) => ({ tl: region[0], br: region[1] })),
      tiles: flatten(
        regions.map((regions) =>
          GridService.convertRegionToTileCoordsString(regions)
        )
      ),
    })

    console.log(
      "provision tiles",
      flatten(
        regions.map((regions) =>
          GridService.convertRegionToTileCoordsString(regions)
        )
      ).length
    )

    console.log("Created provision")

    for (const region of regions) {
      const id = shortid.generate()
      const segment = await segmentService.provision(region, provisionHash, id)
      await qrService.createSegmentQr(id, frame.id, segment.id)
    }

    console.log("Created new segments")
  }
}

export function register(builder: functions.FunctionBuilder) {
  return {
    segmentProvisioning: builder.https.onRequest(async (req, res) => {
      await provision()
      res.json({ a: "done" })
    }),
    segmentProvisioningTask: builder.pubsub
      .schedule("every 1 minutes")
      .onRun(async (context) => {
        await provision()
      }),
  }
}
