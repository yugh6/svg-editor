import type { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
export class MoveCommand extends EditCommand {
  static readonly syntax = 'move <id> <dx> <dy>';
  protected override apply(document: SvgDocument): string {
    this.args.expect(3, 3, MoveCommand.syntax);
    const shape = document.find(this.args.at(0)), dx = this.args.number(1), dy = this.args.number(2);
    shape.move(dx, dy);
    return shape.movedDescription(dx, dy);
  }
}
