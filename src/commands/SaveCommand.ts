import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class SaveCommand extends Command {
  static readonly syntax = 'save [file.svg]';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 1, SaveCommand.syntax);
    return editor.save(this.args.optional(0));
  }
}
