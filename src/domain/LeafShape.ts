import { Geometry, type GeometryField } from './Geometry.js';
import { Shape } from './Shape.js';

export abstract class LeafShape extends Shape {
  protected readonly geometry: Geometry;

  protected constructor(id: string, type: string, private readonly fields: readonly GeometryField[],
    private readonly paint?: string) {
    super(id, type);
    this.geometry = new Geometry(fields);
  }

  override initialize(args: readonly string[]): void {
    if (args.length < this.fields.length || args.length > this.fields.length + (this.paint ? 1 : 0)) {
      throw new Error(`invalid arguments for ${this.type}`);
    }
    this.geometry.initialize(args.slice(0, this.fields.length));
    if (this.paint && args.length > this.fields.length) this.set(this.paint, args[this.fields.length]!);
  }

  override move(dx: number, dy: number): void { this.geometry.move(dx, dy); }
  override scale(factor: number): void { this.geometry.scale(factor); }
  override set(attribute: string, value: string): void {
    if (this.geometry.has(attribute)) this.geometry.set(attribute, value);
    else super.set(attribute, value);
  }

  protected override geometryEntries(): [string, string][] { return this.geometry.entries(); }
  protected override copyStateTo(target: LeafShape): void { this.geometry.copyTo(target.geometry); }
  override movedDescription(_dx: number, _dy: number): string {
    const x = this.fields.find(([, axis]) => axis === 'x')![0];
    const y = this.fields.find(([, axis]) => axis === 'y')![0];
    return `${this.label} moved to (${this.geometry.get(x)},${this.geometry.get(y)})`;
  }
}
