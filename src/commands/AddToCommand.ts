import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class AddToCommand extends EditCommand {
  static readonly syntax = 'addto <gid> <id>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(2, 2, AddToCommand.syntax);
    document.addTo(this.args.at(0), this.args.at(1));
    return `${document.find(this.args.at(1)).label} moved into g#${this.args.at(0)}`;
  }
}
