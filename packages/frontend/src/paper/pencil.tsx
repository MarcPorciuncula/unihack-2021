export function PencilTool(
  paper: paper.PaperScope,
  {
    onPath,
    createPath: createCustomPath,
  }: { onPath?: (path: paper.Path) => void; createPath?: () => paper.Path }
) {
  let p: paper.Path

  const createPath = () => {
    if (createCustomPath) {
      p = createCustomPath()
    } else {
      p = new paper.Path()
      p.strokeColor = new paper.Color("black")
      p.strokeCap = "round"
      p.strokeWidth = 3
    }
  }

  const t = new paper.Tool()
  t.onMouseDown = (e: any) => {
    createPath()
    p.add(e.point)
  }
  t.onMouseDrag = (e: any) => {
    if (!p) createPath()
    p.add(e.point)
  }
  t.onMouseUp = (e: any) => {
    p.simplify()
    onPath?.(p)
  }

  return t
}
