import anime from "animejs"
import * as cbor from "cbor-web"
import { AnimatePresence, motion } from "framer-motion"
import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  getDrawingCollection,
  getFramesCollection,
  getSegmentsCollection,
} from "../../api"
import { RoundButton } from "../../components/round-button"
import { AuthContext } from "../../contexts/AuthContext"
import { firestore } from "../../firebase"
import { useDocumentSub } from "../../firestore-hooks"
import { useDelayedCloudFunction } from "../../firestore-hooks/use-cloud-function"
import { Grid, usePaper } from "../../paper"
import { PencilTool } from "../../paper/pencil"
import { PathQueue } from "../frame"

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

  const { uid } = useContext(AuthContext)

  const [
    claimSegment,
    { data: result, errors: claimErrors },
  ] = useDelayedCloudFunction<SegmentsClaimResult>("segments-claim")

  useEffect(() => {
    if (uid && segment) {
      claimSegment({ qrId: segment.qrId, uid })
    }
  }, [uid, segment])

  const [status, setStatus] = useState<Status | null>(null)
  const [drawing, setDrawing] = useState<any[]>([])
  const [signature, setSignature] = useState<any[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const paperRef = usePaper(canvasRef)
  const controllerRef = useRef<DrawController>()

  const [bounds, setBounds] = useState<paper.Rectangle | null>(null)
  useEffect(() => {
    if (!segment) return

    const paper = paperRef.current!
    setBounds(
      new paper.Rectangle(
        new paper.Point(...segment.region.tl),
        new paper.Point(...segment.region.br).add(new paper.Point(1, 1))
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
    controllerRef.current!.start(bounds!, { placeholder: EXAMPLE_SIGNATURE })
    setStatus("sign")
  }

  const handleCompleteSignature = () => {
    const signature = controllerRef.current!.complete()
    setSignature(signature)
    setStatus("review")
    controllerRef.current!.draw(drawing)
  }

  const send = async () => {
    if (status === "done") return
    setStatus("done")

    await anime({
      targets: canvasRef.current!,
      keyframes: [{ scale: 0.8, borderWidth: 5, borderRadius: 32 }],
      easing: "easeOutElastic(1, .8)",
      duration: 1000,
    }).finished

    await anime({
      targets: [canvasRef.current!, buttonRef.current],
      keyframes: [
        { translateY: 32 },
        {
          translateY:
            -2 * window.innerHeight + 0.2 * canvasRef.current!.clientHeight,
        },
      ],
      easing: "easeOutElastic(1, .8)",
      duration: 3000,
    }).finished

    await anime({
      targets: [canvasRef.current!, buttonRef.current],
      keyframes: [
        {
          translateY:
            -2 * window.innerHeight + 0.2 * canvasRef.current!.clientHeight,
        },
      ],
      easing: "easeOutElastic(1, .8)",
      duration: 3000,
    }).finished

    const task = getDrawingCollection(firestore, frame!.id)
      .doc()
      .set({
        segmentId: segmentId,
        region: segment!.region,
        drawing: drawing.map((item) => cbor.encode(item)),
        signature: signature.map((item) => cbor.encode(item.signature)),
        createdAt: new Date(),
      })

    await task
  }

  return (
    <Fragment>
      <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          style={{
            borderColor: "black",
            opacity: status !== null ? 1 : 0,
            transition: "opacity 450ms ease",
          }}
        />
      </div>

      <div className="fixed left-0 top-0 right-0 flex items-center justify-center pt-8 px-8">
        {status && status !== "done" ? (
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
            {status === "review" || status === "done" ? (
              <RoundButton
                icon="send"
                rotateIcon={status === "done"}
                pulse
                onClick={send}
                ref={buttonRef}
              />
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
  private placeholder: paper.Group | undefined
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
        p.strokeWidth = 4
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
    this.placeholder?.remove()
    this.placeholder = undefined
  }

  async draw(items: any[]) {
    if (!items.length) return

    const queue = new PathQueue(
      this.paper,
      items.map((k) => {
        const path = new this.paper.Path()
        path.importJSON(k)
        path.set({ visible: false })
        return path
      }),
      this.drawing
    )
    queue.draw()

    // for (const item of items) {
    //   this.handleNewPath(path)

    // }
  }

  start(
    bounds: paper.Rectangle,
    { placeholder }: { placeholder?: any[] } = {}
  ) {
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

    if (placeholder) {
      // this.placeholder = new this.paper.Group()
      //   .set({
      //     position: this.coord.multiply(this.grid.unit),
      //     opacity: 0.1,
      //   })
      //   .addTo(this.grid.group)
      // for (const item of placeholder) {
      //   const path = new this.paper.Path()
      //   path.importJSON(item)
      //   path.addTo(this.placeholder)
      // }
    }

    this.pencil.activate()
  }

  complete() {
    if (!this.drawing.children.length) return []

    const paths = this.drawing.children.map((item) =>
      item.exportJSON({ asString: false })
    )
    this.drawing.removeChildren()
    this.border?.remove()
    this.border = undefined
    this.placeholder?.remove()
    this.placeholder = undefined
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

const EXAMPLE_SIGNATURE = [
  [
    "Path",
    {
      applyMatrix: true,
      segments: [
        [
          [187.02128, 224.61146],
          [0, 0],
          [-1.87827, 7.5129],
        ],
        [
          [189.93524, 250.25438],
          [-2.36428, -7.09282],
          [1.32109, 3.96324],
        ],
        [
          [197.9001, 246.3691],
          [-0.34279, 3.08495],
          [0, 0],
        ],
      ],
      strokeColor: [0, 0, 0],
      strokeWidth: 4,
      strokeCap: "round",
    },
  ],
  [
    "Path",
    {
      applyMatrix: true,
      segments: [
        [
          [188.18687, 206.9334],
          [0, 0],
          [-0.06476, 0.25902],
        ],
        [
          [187.9926, 207.71045],
          [0.06476, -0.25902],
          [0, 0],
        ],
      ],
      strokeColor: [0, 0, 0],
      strokeWidth: 4,
      strokeCap: "round",
    },
  ],
  [
    "Path",
    {
      applyMatrix: true,
      segments: [
        [
          [209.36171, 224.80573],
          [0, 0],
          [0.90358, -1.50595],
        ],
        [
          [217.13229, 222.08602],
          [-1.05949, -6.35691],
          [1.21813, 7.30874],
        ],
        [
          [220.62905, 244.03792],
          [0.87207, -7.35805],
          [-0.30864, 2.60415],
        ],
        [
          [214.02405, 248.31174],
          [2.2202, -1.39555],
          [-2.24786, 1.41294],
        ],
        [
          [209.9445, 243.45513],
          [0.07324, 0.61033],
          [-1.20491, -10.041],
        ],
        [
          [222.18317, 239.18131],
          [-4.97931, -12.75948],
          [1.09054, 2.79452],
        ],
        [
          [224.32008, 247.92322],
          [-0.7123, -2.91397],
          [0, 0],
        ],
      ],
      strokeColor: [0, 0, 0],
      strokeWidth: 4,
      strokeCap: "round",
    },
  ],
  [
    "Path",
    {
      applyMatrix: true,
      segments: [
        [
          [235.78169, 220.53191],
          [0, 0],
          [0.50952, 4.58576],
        ],
        [
          [236.94729, 234.32469],
          [-0.35938, -4.59996],
          [0.1361, 1.74201],
        ],
        [
          [237.3358, 239.56983],
          [-0.11633, -1.74504],
          [0.78111, 11.71668],
        ],
        [
          [240.83256, 224.61146],
          [-1.43704, 4.02369],
          [0.92403, -2.58726],
        ],
        [
          [246.6605, 218.78352],
          [-1.88945, -1.99442],
          [6.24631, 6.59332],
        ],
        [
          [255.01388, 245.59204],
          [-2.19913, -8.79652],
          [0, 0],
        ],
      ],
      strokeColor: [0, 0, 0],
      strokeWidth: 4,
      strokeCap: "round",
    },
  ],
]

type SegmentsClaimResult = {
  id: string
  tiles: {
    id: string
    location: [number, number]
  }[]
  isAvailable: boolean
  // if the segment has been claimed, has a reference to the user
  claimant: string | null
  claimedAt: Date | null
  frameId: string
}
