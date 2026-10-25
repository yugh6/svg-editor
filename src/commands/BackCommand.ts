import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class BackCommand extends EditCommand {
  static readonly syntax = 'back <id>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(1, 1, BackCommand.syntax);
    document.sendToBack(this.args.at(0));
    return `${document.find(this.args.at(0)).label} sent to back`;
  }
}
