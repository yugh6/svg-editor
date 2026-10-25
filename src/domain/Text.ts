import { LeafShape } from './LeafShape.js';

export class Text extends LeafShape {
  private content = '';
  constructor(id: string) { super(id, 'text', [['x', 'x'], ['y', 'y']]); }
  override get textContent(): string { return this.content; }
  override initialize(args: readonly string[]): void {
    if (args.length !== 3) throw new Error('invalid arguments for text');
    super.initialize(args.slice(0, 2));
    this.content = args[2]!;
  }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = value;
    else super.set(attribute, value);
  }
  protected override fresh(): Text { return new Text(this.id); }
  protected override copyStateTo(target: Text): void { super.copyStateTo(target); target.content = this.content; }
  protected override describeGeometry(): string {
    return `(${this.geometry.get('x')},${this.geometry.get('y')}) ${JSON.stringify(this.content)}`;
  }
}
