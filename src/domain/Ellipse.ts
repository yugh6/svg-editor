import { LeafShape } from './LeafShape.js';

export class Ellipse extends LeafShape {
  constructor(id: string) { super(id, 'ellipse', [['cx', 'x'], ['cy', 'y'], ['rx', 'size'], ['ry', 'size']], 'fill'); }
  protected override fresh(): Ellipse { return new Ellipse(this.id); }
  protected override describeGeometry(): string { return this.geometry.entries().map(([k, v]) => `${k}=${v}`).join(' '); }
}
