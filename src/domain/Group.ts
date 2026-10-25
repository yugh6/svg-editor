import { Numeric } from './Numeric.js';
import { Shape } from './Shape.js';

export class Group extends Shape {
  private members: Shape[] = [];
  constructor(id: string) { super(id, 'g'); }
  override get children(): readonly Shape[] { return [...this.members]; }
  override initialize(args: readonly string[]): void {
    if (args.length) throw new Error('invalid arguments for g');
  }
  override asGroup(): Group { return this; }
  override move(dx: number, dy: number): void { this.members.forEach(child => child.move(dx, dy)); }
  override scale(factor: number): void {
    Numeric.positive(factor, 'scale factor');
    this.members.forEach(child => child.scale(factor));
  }
  insert(child: Shape, index = this.members.length): void {
    if (child.contains(this)) throw new Error(`cannot move a container into its own descendant: ${child.id}`);
    this.members.splice(index, 0, child);
  }
  remove(child: Shape): void {
    const index = this.members.indexOf(child);
    if (index < 0) throw new Error(`no such child: ${child.id}`);
    this.members.splice(index, 1);
  }
  indexOf(child: Shape): number { return this.members.indexOf(child); }
  protected override fresh(): Group { return new Group(this.id); }
  protected override copyStateTo(target: Group): void { target.members = this.members.map(child => child.clone()); }
  protected override geometryEntries(): [string, string][] { return []; }
  protected override describeGeometry(): string { return ''; }
}
