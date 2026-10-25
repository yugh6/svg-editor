import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Group } from './Group.js';
import { Line } from './Line.js';
import { Rect } from './Rect.js';
import type { Shape } from './Shape.js';
import { Text } from './Text.js';

export class ShapeFactory {
  // Name dispatch site 1/2: replace this fixed registry with providers in the plugin phase.
  private readonly constructors = new Map<string, new (id: string) => Shape>([
    ['rect', Rect], ['circle', Circle], ['ellipse', Ellipse], ['line', Line], ['text', Text], ['g', Group],
  ]);

  empty(type: string, id: string): Shape {
    const Constructor = this.constructors.get(type);
    if (!Constructor) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return new Constructor(id);
  }

  create(type: string, id: string, args: readonly string[]): Shape {
    const shape = this.empty(type, id);
    shape.initialize(args);
    return shape;
  }
}
