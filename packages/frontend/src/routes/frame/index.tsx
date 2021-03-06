import * as cbor from "cbor-web"
import { useEffect, useMemo, useRef } from "react"

import {
  Drawing,
  Frame,
  getDrawingCollection,
  getFramesCollection,
} from "../../api"
import { firebase, firestore } from "../../firebase"
import { useDocumentSub } from "../../firestore-hooks"
import { Grid, usePaper } from "../../paper"

const BASIS = 150

export function FrameView({ frameId }: { frameId: string }) {
  const { data: frame } = useDocumentSub(
    useMemo(() => getFramesCollection(firestore).doc(frameId), [frameId])
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paperRef = usePaper(canvasRef)
  useEffect(() => {
    if (frame) {
      const controller = new FrameController(paperRef.current!, frame)

      return () => {
        controller.dispose()
      }
    }
  }, [frame])

  return <canvas ref={canvasRef} />
}

class FrameController {
  public grid: Grid
  private drawings: any[] = []

  constructor(private paper: paper.PaperScope, private frame: Frame) {
    this.handleDrawingsSnapshot = this.handleDrawingsSnapshot.bind(this)
    this.handleNewDrawing = this.handleNewDrawing.bind(this)

    this.grid = new Grid(
      this.paper,
      BASIS,
      new this.paper.Size(frame.size.width, frame.size.height)
    )

    this.paper.view.onResize = () => {
      this.grid.center()
    }
    this.grid.center()

    getDrawingCollection(firestore, this.frame.id).onSnapshot(
      this.handleDrawingsSnapshot
    )
  }

  handleDrawingsSnapshot(snapshot: firebase.firestore.QuerySnapshot<Drawing>) {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        this.handleNewDrawing(change.doc.data())
      }
    }
  }

  handleNewDrawing(data: Drawing) {
    const drawing = new PaperDrawing(this.paper, this, data)
    this.drawings.push(drawing)
    drawing.group.addTo(this.grid.group)
  }

  dispose() {
    this.grid.remove()
    for (const drawing of this.drawings) drawing.remove()
  }
}

class PaperDrawing {
  public readonly group: paper.Group

  constructor(
    private paper: paper.PaperScope,
    private frame: FrameController,
    private data: Drawing
  ) {
    this.group = new this.paper.Group()
      .set({ applyMatrix: false })
      .addTo(frame.grid.group)

    // const reference = new this.paper.Path.Rectangle(
    //   new this.paper.Rectangle(
    //     new this.paper.Point(data.tile).multiply(frame.grid.unit),
    //     new this.paper.Size(1, 1).multiply(frame.grid.unit)
    //   )
    // )
    //   .set({
    //     strokeColor: new this.paper.Color("pink"),
    //   })
    //   .addTo(frame.grid.group)

    for (const blob of data.paths) {
      const p = new this.paper.Path()
      p.importJSON(cbor.decode(blob))
      p.addTo(this.group)
    }
  }

  remove() {
    this.group.remove()
  }
}
