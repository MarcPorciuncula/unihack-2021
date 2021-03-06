import { PaperScope } from "paper"
import { useEffect, useRef } from "react"
import * as cbor from "cbor-web"

import { firestore, firebase } from "../firebase"

export function Draw() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const paper = new PaperScope()

    paper.setup(ref.current!)

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

      console.log(cbor.decode(blob))

      firestore
        .collection("paths")
        .doc()
        .set({
          data: firebase.firestore.Blob.fromUint8Array(blob),
        })
    }

    paper.tools.push(t)
  }, [])

  return (
    <div>
      <canvas
        ref={ref}
        width="500"
        height="500"
        style={{ border: "1px dashed black" }}
      />
    </div>
  )
}
