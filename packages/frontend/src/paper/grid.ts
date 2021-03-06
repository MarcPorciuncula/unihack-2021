export class Grid {
  readonly group: paper.Group
  readonly lines: paper.Group

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
    this.paper.view.translate(
      this.paper.view.center.subtract(this.group.bounds.center)
    )

    const ratio = this.paper.view.size.divide(this.group.bounds.size)
    this.paper.view.scale(Math.min(ratio.width, ratio.height))
  }

  remove() {
    this.group.remove()
  }
}
