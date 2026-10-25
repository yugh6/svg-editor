import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class UngroupCommand extends EditCommand {
  static readonly syntax = 'ungroup <gid>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(1, 1, UngroupCommand.syntax);
    return `g#${this.args.at(0)} ungrouped (${document.ungroup(this.args.at(0))} children promoted)`;
  }
}
