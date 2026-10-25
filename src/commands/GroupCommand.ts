import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class GroupCommand extends EditCommand {
  static readonly syntax = 'group <newGid> <id1> [id2...]';
  protected override apply(document: SvgDocument): string {
    this.args.expect(2, Infinity, GroupCommand.syntax);
    const group = document.group(this.args.at(0), this.args.values(1));
    return `${group.label} created with ${group.children.length} children`;
  }
}
