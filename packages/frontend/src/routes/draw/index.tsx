import * as cbor from "cbor-web"
import { AnimatePresence, motion } from "framer-motion"
import { max, min } from "ramda"
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react"

import {
  getDrawingCollection,
  getFramesCollection,
  getSegmentsCollection,
} from "../../api"
import { RoundButton } from "../../components/round-button"
import { firestore } from "../../firebase"
import { useDocumentSub } from "../../firestore-hooks"
import { Grid, usePaper } from "../../paper"
import { PencilTool } from "../../paper/pencil"

const BASIS = 150

type Status = "draw" | "sign" | "review" | "done"

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

  const [status, setStatus] = useState<Status | null>(null)
  const [drawing, setDrawing] = useState<Uint8Array[]>([])
  const [signature, setSignature] = useState<Uint8Array[]>([])

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
      })
      controllerRef.current = controller
      return () => {
        controller.dispose()
      }
    }
  }, [frame, paperRef, segmentId])

  const handleUndo = () => {
    controllerRef.current?.undo()
  }

  const handleStart = () => {
    setStatus("draw")
    controllerRef.current?.start(bounds!)
  }

  const handleCompleteDrawing = () => {
    const paths = controllerRef.current!.complete()
    setDrawing(paths)
    controllerRef.current!.start(bounds!)
    setStatus("sign")
  }

  const handleCompleteSignature = () => {
    const signature = controllerRef.current!.complete()
    setSignature(signature)
    setStatus("review")
  }

  const send = async () => {
    await getDrawingCollection(firestore, frame!.id)
      .doc()
      .set({
        segmentId: segmentId,
        tile: { x: 4, y: 4 },
        paths: drawing,
      })
  }

  return (
    <Fragment>
      <canvas
        ref={canvasRef}
        style={{
          opacity: status !== null ? 1 : 0,
          transition: "opacity 450ms ease",
        }}
      />

      <div className="fixed left-0 top-0 right-0 flex items-center justify-center pt-8 px-8">
        {status ? (
          <div className="border-gray-100  border-2 w-full rounded-lg text-center p-4 bg-white bg-opacity-50">
            <AnimatePresence exitBeforeEnter>
              {status === "draw" ? (
                <FlipText key="draw">Leave your mark</FlipText>
              ) : null}
              {status === "sign" ? (
                <FlipText key="sign">Sign off on your work</FlipText>
              ) : null}
              {status === "review" ? (
                <FlipText key="sign">Send it off!</FlipText>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>

      <div className="fixed left-0 bottom-0 right-0 flex items-center justify-center pb-8">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gridGap: "1rem",
          }}
        >
          <div className="flex items-center">
            {status === "draw" || status === "sign" ? (
              <RoundButton icon="undo" size="small" onClick={handleUndo} />
            ) : null}
          </div>
          <div>
            {bounds && status === null ? (
              <RoundButton icon="edit" pulse onClick={handleStart} />
            ) : null}
            {status === "draw" ? (
              <RoundButton icon="done" onClick={handleCompleteDrawing} />
            ) : null}
            {status === "sign" ? (
              <RoundButton icon="done" onClick={handleCompleteSignature} />
            ) : null}
            {status === "review" ? (
              <RoundButton icon="send" pulse onClick={send} />
            ) : null}
          </div>
          <div className="flex items-center">
            {/* <RoundButton icon="delete" size="small" /> */}
          </div>
        </div>
      </div>
    </Fragment>
  )
}

class DrawController {
  readonly grid: Grid
  readonly pencil: paper.Tool
  readonly noop: paper.Tool
  readonly drawing: paper.Group
  readonly coord: paper.Point
  private border: paper.Item | undefined

  constructor(
    private paper: paper.PaperScope,
    {
      frameDimensions,
    }: {
      frameDimensions: paper.Size
    }
  ) {
    this.handleNewPath = this.handleNewPath.bind(this)
    this.handleResize = this.handleResize.bind(this)

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
    this.noop = new this.paper.Tool()

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

  start(bounds: paper.Rectangle) {
    this.grid.focus(bounds, 0.2)
    this.border = new this.paper.Path.Rectangle(
      new this.paper.Rectangle(
        bounds.point.multiply(this.grid.unit),
        bounds.size.multiply(this.grid.unit)
      ),
      new this.paper.Size(5, 5)
    )
      .set({
        strokeColor: new this.paper.Color("black"),
        strokeCap: "round",
        strokeWidth: 3,
        opacity: 0.2,
      })
      .addTo(this.grid.group)
    this.pencil.activate()
  }

  complete() {
    if (!this.drawing.children.length) return []

    const paths = this.drawing.children.map((item) =>
      cbor.encode(item.exportJSON({ asString: false }))
    )
    this.drawing.removeChildren()
    this.border?.remove()
    this.noop.activate()

    return paths
  }

  undo() {
    this.drawing.lastChild?.remove()
  }

  dispose() {
    this.paper.view?.off("resize", this.handleResize)

    this.grid.remove()
    this.pencil.remove()
    this.noop.remove()
  }
}

function FlipText({ children }: { children?: React.ReactNode }) {
  return (
    <motion.p
      className="text-lg"
      initial={{ y: "50%", opacity: 0 }}
      animate={{ y: "0", opacity: 1 }}
      exit={{ y: "-50%" }}
      transition={{ stiffness: 50 }}
    >
      {children}
    </motion.p>
  )
}
