import * as cbor from "cbor-web"
import { max, min } from "ramda"
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react"

import {
  getDrawingCollection,
  getFramesCollection,
  getSegmentsCollection,
} from "../../api"
import { firestore } from "../../firebase"
import { useDocumentSub } from "../../firestore-hooks"
import { Grid, usePaper } from "../../paper"
import { PencilTool } from "../../paper/pencil"

const BASIS = 150

export function DrawPage({
  frameId,
  segmentId,
}: {
  frameId: string
  segmentId: string
}) {
  const { data: frame } = useDocumentSub(
    useMemo(() => getFramesCollection(firestore).doc(frameId), [frameId])
  )

  const { data: segment } = useDocumentSub(
    useMemo(() => getSegmentsCollection(firestore, frameId).doc(segmentId), [
      frameId,
      segmentId,
    ])
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paperRef = usePaper(canvasRef)
  const controllerRef = useRef<DrawController>()

  const [bounds, setBounds] = useState<paper.Rectangle | null>(null)
  useEffect(() => {
    if (!segment) return
    const left = segment.tiles.map((tile) => tile.location[0]).reduce(min)
    const top = segment.tiles.map((tile) => tile.location[1]).reduce(min)
    const right = segment.tiles.map((tile) => tile.location[0]).reduce(max)
    const bottom = segment.tiles.map((tile) => tile.location[1]).reduce(max)

    const paper = paperRef.current!
    setBounds(
      new paper.Rectangle(
        new paper.Point(left, top),
        new paper.Point(right + 1, bottom + 1)
      )
    )
  }, [paperRef, segment])

  useEffect(() => {
    const paper = paperRef.current!

    if (frame) {
      const controller = new DrawController(paperRef.current!, {
        frameDimensions: new paper.Size(frame.size.width, frame.size.height),
        onComplete: async (paths) => {
          await getDrawingCollection(firestore, frame.id)
            .doc()
            .set({
              segmentId: segmentId,
              tile: { x: 4, y: 4 },
              paths: paths,
            })
        },
      })
      controllerRef.current = controller
      return () => {
        controller.dispose()
      }
    }
  }, [frame, paperRef, segmentId])

  useEffect(() => {
    if (bounds) {
      controllerRef.current?.startDrawing(bounds)
    }
  }, [bounds])

  const handleCompleteDrawing = () => {
    controllerRef.current?.completeDrawing()
  }

  return (
    <Fragment>
      <canvas ref={canvasRef} />
      <div className="fixed left-0 bottom-0 right-0 h-12 bg-gray-100 rounded-md flex">
        <button onClick={() => handleCompleteDrawing()}>Done</button>
      </div>
    </Fragment>
  )
}

class DrawController {
  readonly grid: Grid
  readonly pencil: paper.Tool
  readonly drawing: paper.Group
  readonly coord: paper.Point
  readonly onComplete: (paths: Uint8Array[]) => void

  constructor(
    private paper: paper.PaperScope,
    {
      onComplete,
      frameDimensions,
    }: {
      onComplete: (paths: Uint8Array[]) => void
      frameDimensions: paper.Size
    }
  ) {
    this.handleNewPath = this.handleNewPath.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.onComplete = onComplete

    this.grid = new Grid(paper, BASIS, frameDimensions)
    this.pencil = PencilTool(paper, {
      onPath: this.handleNewPath,
      createPath: () => {
        const p = new this.paper.Path()
        p.strokeColor = new this.paper.Color("black")
        p.strokeCap = "round"
        p.strokeWidth = 6
        return p
      },
    })

    this.coord = new this.paper.Point(1, 1)
    this.drawing = new this.paper.Group()
      .set({
        position: this.coord.multiply(this.grid.unit),
      })
      .addTo(this.grid.group)

    this.paper.view.on("resize", this.handleResize)
    this.grid.center()
  }

  private handleResize() {
    this.grid.updateView()
  }

  private handleNewPath(path: paper.Path) {
    path.addTo(this.drawing)
  }

  startDrawing(bounds: paper.Rectangle) {
    this.grid.focus(bounds, 0.2)

    const border = new this.paper.Path.Rectangle(
      new this.paper.Rectangle(
        bounds.point.multiply(this.grid.unit),
        bounds.size.multiply(this.grid.unit)
      )
    )
      .set({
        strokeColor: new this.paper.Color("black"),
        opacity: 0.4,
      })
      .addTo(this.grid.group)
  }

  completeDrawing() {
    if (!this.drawing.children.length) return

    this.onComplete(
      this.drawing.children.map((item) =>
        cbor.encode(item.exportJSON({ asString: false }))
      )
    )

    this.drawing.removeChildren()
  }

  dispose() {
    this.paper.view?.off("resize", this.handleResize)

    this.grid.remove()
    this.pencil.remove()
  }
}
