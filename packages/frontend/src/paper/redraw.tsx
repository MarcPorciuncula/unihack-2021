interface DrawFinishEvent extends Event {
  id?: number
}

export class PathRedrawer {
  private path: paper.Path
  private speed: number
  private paper: paper.PaperScope

  private newPath: paper.Path

  private offset: number
  private event: DrawFinishEvent

  constructor(
    paper: paper.PaperScope,
    path: paper.Path,
    speed: number,
    group: paper.Group
  ) {
    this.paper = paper
    this.path = path
    this.speed = speed

    this.newPath = new this.paper.Path()
    this.newPath.addTo(group)

    this.newPath.strokeColor = path.strokeColor
    this.newPath.strokeWidth = path.strokeWidth

    this.offset = 0
    this.event = new Event("frameoff")
    this.event.id = this.path.id
  }

  private createFrameHandler() {
    return (e: any) => {
      if (!this.offset) e.delta = 0.1

      if (this.offset < this.path.length) {
        this.newPath.add(this.path.getPointAt(this.offset))
        this.offset += e.delta * this.speed
      } else {
        dispatchEvent(this.event)
      }
    }
  }

  public draw() {
    const frameHandler = this.createFrameHandler()
    // Listen for the stop event.
    window.addEventListener(
      "frameOff",
      (e: DrawFinishEvent) => {
        if (e.id === this.newPath.id) {
          this.newPath.off("frame", frameHandler)
        }
      },
      false
    )

    this.newPath.onFrame = frameHandler
  }
}
