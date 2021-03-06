import { PaperScope } from "paper"
import { useEffect, useRef } from "react"

interface DrawFinishEvent extends Event {
  id?: number;
}

/*
  path - The path that we are animating
  speed - SANIC
  p - Optional path to write into, or null to create path in the function 
*/
const drawOnPath = (path: paper.Path, speed: number, p: paper.Path | null = null) => {

  return new Promise<void>((resolve) => {
    const event: DrawFinishEvent = new Event('frameOff');

    const newP = p ? p : new paper.Path
    event.id = newP.id

    let offset = 0
    const onFrameHandler = (e: any) => {
      if (offset < path.length) {
        newP.add(path.getPointAt(offset))
        offset += e.delta * speed;
      }
      else {

        dispatchEvent(event)
      }

    }

    // Listen for the stop event.
    window.addEventListener('frameOff', (e: DrawFinishEvent) => {
      if (e.id === newP.id) {
        newP.off('frame', onFrameHandler)
        resolve()
      }
    }, false);

    newP.onFrame = onFrameHandler
  })


}

export function Redraw() {
  const ref = useRef<HTMLCanvasElement | null>(null)


  useEffect(() => {
    const paper = new PaperScope()

    paper.setup(ref.current!)

    let finalP: paper.Path

    const t = new paper.Tool()
    t.onMouseDown = (e: any) => {
      finalP = new paper.Path()

      finalP.strokeColor = new paper.Color("red")
      finalP.fullySelected = true
      finalP.strokeCap = "round"
      finalP.strokeWidth = 3

      finalP.add(e.point)
    }
    t.onMouseDrag = (e: any) => {
      finalP.add(e.point)
    }
    t.onMouseUp = (e: any) => {
      finalP.simplify()


      const p = new paper.Path()
      p.fullySelected = true
      p.strokeColor = new paper.Color("black")

      //You can not specify p and it will create a new path for you
      drawOnPath(finalP, 150, p).then(() => console.log("Done"))
    }





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
