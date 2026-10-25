import { Numeric } from './Numeric.js';
import type { Group } from './Group.js';

export abstract class Shape {
  private readonly styles = new Map<string, string>();
  private readonly presentation = new Map<string, string>();

  protected constructor(private readonly shapeId: string, private readonly tag: string) {
    if (!shapeId || /\s/.test(shapeId)) throw new Error('id must be non-empty and contain no whitespace');
  }

  get id(): string { return this.shapeId; }
  get type(): string { return this.tag; }
  get label(): string { return `${this.type}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get textContent(): string | null { return null; }
  abstract initialize(args: readonly string[]): void;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  protected abstract fresh(): Shape;
  protected abstract copyStateTo(target: Shape): void;
  protected abstract geometryEntries(): [string, string][];
  protected abstract describeGeometry(): string;

  clone(): Shape {
    const copy = this.fresh();
    for (const [key, value] of this.styles) copy.styles.set(key, value);
    for (const [key, value] of this.presentation) copy.presentation.set(key, value);
    this.copyStateTo(copy);
    return copy;
  }

  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      throw new Error(`unknown attribute: ${attribute}`);
    }
    if (attribute === 'stroke-width') {
      const width = Numeric.parse(value, attribute);
      if (width < 0) throw new Error('stroke-width must be non-negative');
      value = String(width);
    }
    this.styles.set(attribute, value);
  }

  importPresentation(attribute: string, value: string): void {
    this.presentation.set(attribute, value);
  }

  attributes(): [string, string][] {
    return [['id', this.id], ...this.geometryEntries(), ...this.styles, ...this.presentation];
  }

  summary(): string {
    return [this.label, this.describeGeometry(), ...[...this.styles].map(([key, value]) => `${key}=${value}`)]
      .filter(Boolean).join('  ');
  }

  details(): string[] {
    const lines = [this.geometryEntries().map(([key, value]) => `${key}=${value}`).join(' '),
      ...[...this.styles, ...this.presentation].map(([key, value]) => `${key}=${value}`)];
    if (this.textContent !== null) lines.push(`text=${JSON.stringify(this.textContent)}`);
    return lines.filter(Boolean);
  }

  movedDescription(dx: number, dy: number): string { return `${this.label} moved by (${dx},${dy})`; }
  asGroup(): Group { throw new Error(`not a container: ${this.id}`); }
  contains(other: Shape): boolean {
    return this === other || this.children.some(child => child.contains(other));
  }
}
