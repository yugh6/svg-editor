import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class SetCommand extends EditCommand {
  static readonly syntax = 'set <id> <attr> <value>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(3, 3, SetCommand.syntax);
    const shape = document.find(this.args.at(0));
    shape.set(this.args.at(1), this.args.at(2));
    return `${shape.label} updated: ${this.args.at(1)}=${JSON.stringify(this.args.at(2))}`;
  }
}
