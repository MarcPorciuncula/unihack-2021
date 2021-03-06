import * as cbor from "cbor-web"
import React, { Fragment, useEffect, useMemo, useRef } from "react"

import { getDrawingCollection, getFramesCollection } from "../../../api"
import { firestore } from "../../../firebase"
import { useDocumentSub } from "../../../firestore-hooks"
import { Grid, usePaper } from "../../../paper"
import { PencilTool } from "../../../paper/pencil"

const BASIS = 150

export function DrawPage({ frameId }: { frameId: string }) {
  const { data: frame } = useDocumentSub(
    useMemo(() => getFramesCollection(firestore).doc(frameId), [frameId])
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paperRef = usePaper(canvasRef)
  const controllerRef = useRef<DrawController>()

  useEffect(() => {
    if (frame) {
      const controller = new DrawController(paperRef.current!, frame)
      controllerRef.current = controller
      return () => {
        controller.dispose()
      }
    }
  }, [frame, paperRef])

  const handleCompleteDrawing = () => {
    controllerRef.current?.completeDrawing()
  }

  return (
    <Fragment>
      <canvas ref={canvasRef} />
      <div className="fixed bottom-0 w-24 h-12 bg-gray-100 rounded-md">
        <button onClick={() => handleCompleteDrawing()}>Done</button>
      </div>
    </Fragment>
  )
}

class DrawController {
  readonly grid: Grid
  readonly pencil: paper.Tool
  readonly reference: paper.Group
  readonly coord: paper.Point

  constructor(
    private paper: paper.PaperScope,
    private frame: { size: { height: number; width: number }; id: string }
  ) {
    this.handleNewPath = this.handleNewPath.bind(this)
    this.handleResize = this.handleResize.bind(this)

    this.grid = new Grid(paper, BASIS, new paper.Size(3, 3))
    this.pencil = PencilTool(paper, {
      onPath: this.handleNewPath,
      createPath: () => {
        const p = new this.paper.Path()
        p.strokeColor = new this.paper.Color("red")
        p.strokeCap = "round"
        p.strokeWidth = 6
        return p
      },
    })

    this.coord = new this.paper.Point(1, 1)
    this.reference = new this.paper.Group()
      .set({
        position: this.coord.multiply(this.grid.unit),
      })
      .addTo(this.grid.group)

    const border = new this.paper.Path.Rectangle(
      new this.paper.Rectangle(
        this.coord.multiply(this.grid.unit),
        new this.paper.Size(1, 1).multiply(this.grid.unit)
      )
    )
      .set({
        strokeColor: new this.paper.Color("pink"),
      })
      .addTo(this.grid.group)

    this.paper.view.on("resize", this.handleResize)
    this.handleResize()
  }

  private handleResize() {
    this.grid.center()
  }

  private handleNewPath(path: paper.Path) {
    path.addTo(this.reference)
  }

  async completeDrawing() {
    if (!this.reference.children.length) return

    await getDrawingCollection(firestore, this.frame.id)
      .doc()
      .set({
        tile: { x: this.coord.x, y: this.coord.y },
        paths: this.reference.children.map((item) =>
          cbor.encode(item.exportJSON({ asString: false }))
        ),
      })

    this.reference.removeChildren()
  }

  dispose() {
    this.paper.view?.off("resize", this.handleResize)

    this.grid.remove()
    this.pencil.remove()
  }
}
