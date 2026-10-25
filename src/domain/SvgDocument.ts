import { Group } from './Group.js';
import { Numeric } from './Numeric.js';
import type { Shape } from './Shape.js';

export class SvgDocument {
  private root = new Group('document-root');
  private canvasWidth: number;
  private canvasHeight: number;
  private viewBox: readonly number[];
  private readonly presentation = new Map<string, string>();

  constructor(width = 800, height = 600) {
    this.canvasWidth = Numeric.positive(width, 'canvas width');
    this.canvasHeight = Numeric.positive(height, 'canvas height');
    this.viewBox = [0, 0, width, height];
  }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return this.root.children; }
  get count(): number { return this.all().length; }
  resize(width: number, height: number): void {
    Numeric.positive(width, 'canvas width');
    Numeric.positive(height, 'canvas height');
    this.canvasWidth = width;
    this.canvasHeight = height; this.viewBox = [0, 0, width, height];
  }
  clone(): SvgDocument {
    const copy = new SvgDocument(this.width, this.height);
    copy.root = this.root.clone().asGroup();
    copy.viewBox = [...this.viewBox];
    for (const [key, value] of this.presentation) copy.presentation.set(key, value);
    return copy;
  }
  setViewBox(values: readonly number[]): void {
    if (values.length !== 4) throw new Error('viewBox requires four numbers');
    values.forEach(value => Numeric.finite(value, 'viewBox'));
    Numeric.positive(values[2]!, 'viewBox width');
    Numeric.positive(values[3]!, 'viewBox height');
    this.viewBox = [...values];
  }
  importPresentation(key: string, value: string): void { this.presentation.set(key, value); }
  canvasAttributes(): [string, string][] {
    return [['width', String(this.width)], ['height', String(this.height)],
      ['viewBox', this.viewBox.join(' ')], ...this.presentation];
  }
  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (shape: Shape): void => { result.push(shape); shape.children.forEach(visit); };
    this.children.forEach(visit);
    return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  container(id: string): Group {
    const shape = this.all().find(item => item.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    return shape.asGroup();
  }
  private ensureAvailable(id: string): void {
    if (this.all().some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`);
  }
  private parent(shape: Shape): Group {
    const parent = [this.root, ...this.all()].find(item => item.children.includes(shape));
    if (!parent) throw new Error(`no such shape: ${shape.id}`);
    return parent.asGroup();
  }
  parentLabel(id: string): string {
    const parent = this.parent(this.find(id));
    return parent === this.root ? 'svg' : parent.label;
  }
  add(shape: Shape, parentId?: string): void {
    const seen = new Set<string>();
    const validate = (node: Shape): void => {
      this.ensureAvailable(node.id);
      if (seen.has(node.id)) throw new Error(`id already exists: ${node.id}`);
      seen.add(node.id);
      node.children.forEach(validate);
    };
    validate(shape);
    (parentId === undefined ? this.root : this.container(parentId)).insert(shape);
  }
  delete(id: string): Shape {
    const shape = this.find(id);
    this.parent(shape).remove(shape);
    return shape;
  }
  addTo(groupId: string, id: string): void {
    const group = this.container(groupId);
    const shape = this.find(id);
    if (shape.contains(group)) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape);
    group.insert(shape);
  }
  private ancestors(shape: Shape): Group[] {
    const chain: Group[] = [];
    let current = this.parent(shape);
    while (current !== this.root) { chain.unshift(current); current = this.parent(current); }
    return [this.root, ...chain];
  }
  group(id: string, ids: readonly string[]): Group {
    this.ensureAvailable(id);
    if (!ids.length) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(key => this.find(key));
    for (const shape of selected) {
      if (selected.some(other => other !== shape && shape.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const ordered = this.all().filter(shape => selected.includes(shape));
    const chains = ordered.map(shape => this.ancestors(shape));
    const common = chains[0]!.filter((ancestor, index) => chains.every(chain => chain[index] === ancestor));
    const parent = common[common.length - 1]!;
    const firstBranch = parent.children.find(child => ordered.some(shape => child.contains(shape)))!;
    const insertionIndex = parent.indexOf(firstBranch);
    const group = new Group(id);
    for (const shape of ordered) { this.parent(shape).remove(shape); group.insert(shape); }
    parent.insert(group, insertionIndex);
    return group;
  }
  ungroup(id: string): number {
    const group = this.find(id).asGroup();
    const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.indexOf(group);
    const children = group.children;
    parent.remove(group);
    children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
    return children.length;
  }
  bringToFront(id: string): void {
    const shape = this.find(id), parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape);
  }
  sendToBack(id: string): void {
    const shape = this.find(id), parent = this.parent(shape);
    parent.remove(shape); parent.insert(shape, 0);
  }
  tree(id?: string): string {
    const lines: string[] = [];
    const append = (children: readonly Shape[], prefix: string): void => {
      children.forEach((child, index) => {
        const last = index === children.length - 1;
        lines.push(`${prefix}${last ? '└── ' : '├── '}${child.summary()}`);
        append(child.children, `${prefix}${last ? '    ' : '│   '}`);
      });
    };
    if (id !== undefined) {
      const shape = this.find(id);
      lines.push(shape.summary()); append(shape.children, '');
    } else { lines.push(`svg (${this.width}x${this.height})`); append(this.children, ''); }
    return lines.join('\n');
  }
  show(id: string): string {
    const shape = this.find(id);
    return [`${shape.label}  parent=${this.parentLabel(id)}`, ...shape.details().map(line => `  ${line}`)].join('\n');
  }
}
