import * as cbor from "cbor-web"
import { PaperScope } from "paper"
import { useEffect, useRef } from "react"

import { firebase, firestore } from "../firebase"
import { useQuerySub } from "../firestore-hooks"

const BASIS = 150

function createGrid(paper: paper.PaperScope, unit: number, cells: paper.Size) {
  const g = new paper.Group()

  const { width, height } = cells

  for (let y = 0; y < height; y++) {
    const p = new paper.Path.Line(
      new paper.Point(0, y).multiply(unit),
      new paper.Point(width, y).multiply(unit)
    )
    p.set({ strokeColor: new paper.Color("black") })
    p.addTo(g)
  }

  // vertical
  for (let x = 0; x < width; x++) {
    const p = new paper.Path.Line(
      new paper.Point(x, 0).multiply(unit),
      new paper.Point(x, height).multiply(unit)
    )
    p.set({ strokeColor: new paper.Color("black") })
    p.addTo(g)
  }

  g.set({ opacity: 0.1 })

  return g
}

function createDrawingTool(paper: paper.PaperScope) {
  let p: paper.Path

  const t = new paper.Tool()
  t.onMouseDown = (e: any) => {
    p = new paper.Path()
    p.strokeColor = new paper.Color("black")
    p.strokeCap = "round"
    p.strokeWidth = 3
    p.add(e.point)
  }
  t.onMouseDrag = (e: any) => {
    p.add(e.point)
  }
  t.onMouseUp = (e: any) => {
    p.simplify()
    let blob = cbor.encode(p.exportJSON({ asString: false }))

    firestore
      .collection("paths")
      .doc()
      .set({
        data: firebase.firestore.Blob.fromUint8Array(blob),
      })
  }

  return t
}

const paths = firestore.collection("paths")

export function Draw() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const paperRef = useRef<paper.PaperScope>()

  useEffect(() => {
    const paper = new PaperScope()
    paperRef.current = paper

    paper.setup(ref.current!)

    const grid = createGrid(
      paper,
      BASIS,
      paper.view.size.divide(new paper.Size(BASIS, BASIS)).ceil()
    )

    const t = createDrawingTool(paper)
    t.activate()

    return () => {
      // @ts-ignore
      paper.remove()
    }
  }, [])

  const { changes } = useQuerySub(paths)

  const groupRef = useRef<paper.Group>()
  useEffect(() => {
    const paper = paperRef.current!
    if (!groupRef.current) groupRef.current = new paper.Group()

    return () => {
      groupRef.current!.remove()
    }
  }, [])

  useEffect(() => {
    const paper = paperRef.current!
    const g = groupRef.current!

    for (const change of changes) {
      if (change.type === "added") {
        const i = new paper.Path()
        i.addTo(g)
        i.importJSON(cbor.decode(change.doc.data().data.toUint8Array()) as any)
      }
    }
  }, [changes])

  return (
    <canvas
      data-paper-resize="true"
      ref={ref}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
