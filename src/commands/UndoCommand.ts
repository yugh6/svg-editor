import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class UndoCommand extends Command {
  static readonly syntax = 'undo';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 0, UndoCommand.syntax);
    return editor.undo();
  }
}
