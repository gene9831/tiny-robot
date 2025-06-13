export class ShadowDomSelection
  implements Pick<Selection, 'getRangeAt' | 'addRange' | 'removeAllRanges' | 'rangeCount'>
{
  private ranges: Range[] = []

  constructor() {
    this.ranges = []
  }

  getRangeAt(index: number) {
    return this.ranges[index]
  }

  addRange(range: Range) {
    this.ranges.push(range)
  }

  removeAllRanges() {
    this.ranges = []
  }

  get rangeCount() {
    return this.ranges.length
  }

  // todo: implement remaining `Selection` methods and properties.
}
