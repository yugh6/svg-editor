import { ShapeFactory } from '../domain/ShapeFactory.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class CreateCommand extends EditCommand {
  static readonly syntax = 'create <type> <id> [params...] [in <containerId>]';
  protected override apply(document: SvgDocument): string {
    this.args.expect(2, Infinity, CreateCommand.syntax);
    const { parameters, parentId } = this.args.parentSuffix();
    const shape = new ShapeFactory().create(this.args.at(0), this.args.at(1), parameters);
    document.add(shape, parentId);
    return `${shape.label} created${parentId === undefined ? '' : ` in g#${parentId}`}`;
  }
}
