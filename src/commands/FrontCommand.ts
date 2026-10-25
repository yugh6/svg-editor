import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class FrontCommand extends EditCommand {
  static readonly syntax = 'front <id>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(1, 1, FrontCommand.syntax);
    document.bringToFront(this.args.at(0));
    return `${document.find(this.args.at(0)).label} brought to front`;
  }
}
