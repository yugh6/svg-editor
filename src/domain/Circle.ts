import { LeafShape } from './LeafShape.js';

export class Circle extends LeafShape {
  constructor(id: string) { super(id, 'circle', [['cx', 'x'], ['cy', 'y'], ['r', 'size']], 'fill'); }
  protected override fresh(): Circle { return new Circle(this.id); }
  protected override describeGeometry(): string { return this.geometry.entries().map(([k, v]) => `${k}=${v}`).join(' '); }
}
