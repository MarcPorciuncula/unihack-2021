export class Grid {
  readonly group: paper.Group
  readonly lines: paper.Group
  private viewBounds: paper.Rectangle | null = null
  private viewPadding: number = 0

  constructor(
    private paper: paper.PaperScope,
    public unit: number,
    public size: paper.Size
  ) {
    this.group = new this.paper.Group().set({ applyMatrix: false })
    this.lines = new this.paper.Group().set({}).addTo(this.group)

    const { width, height } = this.size

    for (let y = 0; y < height + 1; y++) {
      const p = new this.paper.Path.Line(
        new this.paper.Point(0, y).multiply(this.unit),
        new this.paper.Point(width, y).multiply(this.unit)
      )
      p.set({ strokeColor: new this.paper.Color("black") })
      p.addTo(this.lines)
    }

    // vertical
    for (let x = 0; x < width + 1; x++) {
      const p = new this.paper.Path.Line(
        new this.paper.Point(x, 0).multiply(this.unit),
        new this.paper.Point(x, height).multiply(this.unit)
      )
      p.set({ strokeColor: new this.paper.Color("black") })
      p.addTo(this.lines)
    }

    this.lines.set({ opacity: 0.1 })
  }

  center() {
    this.focus(new this.paper.Rectangle(new this.paper.Point(0, 0), this.size))
  }

  focus(bounds: paper.Rectangle, padding: number = 0) {
    this.viewBounds = bounds
    this.viewPadding = padding

    this.updateView()
  }

  updateView() {
    if (!this.viewBounds) return

    const scaledBounds = new this.paper.Rectangle(
      this.viewBounds.topLeft
        .subtract(new this.paper.Point(this.viewPadding, this.viewPadding))
        .multiply(this.unit),
      this.viewBounds.bottomRight
        .add(new this.paper.Point(this.viewPadding, this.viewPadding))
        .multiply(this.unit)
    )

    this.paper.view.translate(
      this.paper.view.center.subtract(scaledBounds.center)
    )

    const ratio = this.paper.view.size.divide(scaledBounds.size)
    this.paper.view.zoom =
      this.paper.view.zoom * Math.min(ratio.width, ratio.height)
  }

  remove() {
    this.group.remove()
  }
}
