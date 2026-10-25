import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class ScaleCommand extends EditCommand {
  static readonly syntax = 'scale <id> <factor>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(2, 2, ScaleCommand.syntax);
    const shape = document.find(this.args.at(0)), factor = this.args.number(1);
    shape.scale(factor);
    return `${shape.label} scaled by ${factor}`;
  }
}
