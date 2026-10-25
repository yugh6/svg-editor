import { LeafShape } from './LeafShape.js';

export class Line extends LeafShape {
  constructor(id: string) { super(id, 'line', [['x1', 'x'], ['y1', 'y'], ['x2', 'x'], ['y2', 'y']], 'stroke'); }
  protected override fresh(): Line { return new Line(this.id); }
  protected override describeGeometry(): string {
    return `(${this.geometry.get('x1')},${this.geometry.get('y1')}) -> (${this.geometry.get('x2')},${this.geometry.get('y2')})`;
  }
}
