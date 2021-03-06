import { PaperScope } from "paper"
import { useEffect, useRef } from "react"

export function usePaper(ref: React.RefObject<HTMLCanvasElement | null>) {
  const paperRef = useRef<paper.PaperScope>()

  useEffect(() => {
    const paper = new PaperScope()
    ref.current!.setAttribute("data-paper-resize", "true")
    ref.current!.style.width = "100%"
    ref.current!.style.height = "100%"
    paperRef.current = paper
    paper.setup(ref.current!)

    return () => {
      // @ts-ignore
      paper.remove()
    }
  }, [ref])

  return paperRef
}
