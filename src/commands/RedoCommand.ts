import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class RedoCommand extends Command {
  static readonly syntax = 'redo';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 0, RedoCommand.syntax);
    return editor.redo();
  }
}
