import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class DeleteCommand extends EditCommand {
  static readonly syntax = 'delete <id>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(1, 1, DeleteCommand.syntax);
    return `${document.delete(this.args.at(0)).label} deleted`;
  }
}
