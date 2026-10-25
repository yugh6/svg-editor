import { LeafShape } from './LeafShape.js';

export class Rect extends LeafShape {
  constructor(id: string) { super(id, 'rect', [['x', 'x'], ['y', 'y'], ['width', 'size'], ['height', 'size']], 'fill'); }
  protected override fresh(): Rect { return new Rect(this.id); }
  protected override describeGeometry(): string {
    return `x=${this.geometry.get('x')} y=${this.geometry.get('y')} w=${this.geometry.get('width')} h=${this.geometry.get('height')}`;
  }
}
