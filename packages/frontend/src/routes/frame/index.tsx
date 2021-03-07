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
import { Grid, usePaper, PathRedrawer } from "../../paper"


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
    const dataArr = snapshot.docChanges().reduce((acc: Drawing[], change: any) => {
      if (change.type === "added") {
        return [...acc, change.doc.data()]
      }
      else return acc
    }, [])
    console.log(dataArr)
    this.handleNewDrawing(dataArr)
    /*
    for (const change of snapshot.docChanges()) {
      if (change.type === "added") {
        this.handleNewDrawing(change.doc.data())
      }
    }
    */
  }

  handleNewDrawing(data: Drawing[]) {
    const drawQueue = new DrawQueue(this.paper, this, data, this.drawings, this.grid)
    //const drawing = new PaperDrawing(this.paper, this, data)
    drawQueue.draw()
    //this.drawings.push(drawing)
    //drawing.group.addTo(this.grid.group)
  }

  dispose() {
    this.grid.remove()
    for (const drawing of this.drawings) drawing.remove()
  }
}

class PaperDrawing {
  public readonly group: paper.Group
  private pathArr: paper.Path[]

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

    this.pathArr = data.paths.map(blob => {
      const p = new this.paper.Path()
      p.visible = false
      p.importJSON(cbor.decode(blob))
      return p
    })

  }

  draw() {
    return new Promise<void>(resolve => new PathQueue(this.paper, this.pathArr, this.group).draw().then(() => resolve()))

  }

  remove() {
    this.group.remove()
  }
}

class DrawQueue {
  constructor(
    private paper: paper.PaperScope,
    private frame: FrameController,
    private data: Drawing[],
    private drawings: any[] = [],
    private grid: Grid,
    private delayFunction: ((i: number) => number) | null = null
  ) {

  }

  private dispatchDraw = (i: number) => {
    if (i < this.data.length) {
      const drawing = new PaperDrawing(this.paper, this.frame, this.data[i])
      const drawPromise = drawing.draw()
      this.drawings.push(drawing)
      drawing.group.addTo(this.grid.group)
      if (this.delayFunction) {
        setTimeout(() => {
          this.dispatchDraw(i + 1)
        }, this.delayFunction(i))
      }
      else {
        drawPromise.then(() => this.dispatchDraw(i + 1))
      }

    }
  }

  draw() {
    this.dispatchDraw(0)
  }

}

class PathQueue {

  constructor(
    private paper: paper.PaperScope,
    private pathArr: paper.Path[],
    private group: paper.Group,
    private delayFunction: ((i: number) => number) | null = null,
    private speedFunction: ((i: number) => number) | null = null
  ) {
  }

  private dispatchDraw = (i: number, resolve: (value: void | PromiseLike<void>) => void) => {
    if (i < this.pathArr.length) {
      const delay = this.delayFunction ? this.delayFunction(i) : 300
      const speed = this.speedFunction ? this.speedFunction(i) : 500
      const drawer = new PathRedrawer(this.paper, this.pathArr[i], speed, this.group)
      drawer.draw()
      setTimeout(() => {
        this.dispatchDraw(i + 1, resolve)
      }, delay)
    }
    else {
      resolve()
    }
  }

  draw() {
    return new Promise<void>(resolve => {
      this.dispatchDraw(0, resolve)
    })

  }
}