import { Numeric } from './Numeric.js';

export type GeometryField = readonly [name: string, axis: 'x' | 'y' | 'size'];

export class Geometry {
  private values = new Map<string, number>();

  constructor(private readonly fields: readonly GeometryField[]) {
    for (const [name] of fields) this.values.set(name, 0);
  }

  initialize(args: readonly string[]): void {
    if (args.length !== this.fields.length) throw new Error('invalid geometry arguments');
    this.fields.forEach(([name], index) => this.set(name, args[index]!));
  }

  has(name: string): boolean { return this.values.has(name); }
  get(name: string): number {
    const value = this.values.get(name);
    if (value === undefined) throw new Error(`unknown attribute: ${name}`);
    return value;
  }

  set(name: string, value: string): void {
    const field = this.fields.find(([key]) => key === name);
    if (!field) throw new Error(`unknown attribute: ${name}`);
    const number = Numeric.parse(value, name);
    if (field[1] === 'size' && number < 0) throw new Error(`${name} must be non-negative`);
    this.values.set(name, number);
  }

  move(dx: number, dy: number): void {
    this.values = new Map(this.fields.map(([name, axis]) => [name,
      Numeric.finite(this.get(name) + (axis === 'x' ? dx : axis === 'y' ? dy : 0), name)]));
  }

  scale(factor: number): void {
    Numeric.positive(factor, 'scale factor');
    this.values = new Map([...this.values].map(([name, value]) =>
      [name, Numeric.finite(value * factor, name)]));
  }

  entries(): [string, string][] {
    return [...this.values].map(([name, value]) => [name, String(value)]);
  }

  copyTo(target: Geometry): void { target.values = new Map(this.values); }
}
