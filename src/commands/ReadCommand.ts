import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class ReadCommand extends Command {
  static readonly syntax = 'read <file.svg>';
  override execute(editor: Editor): string[] {
    this.args.expect(1, 1, ReadCommand.syntax);
    return editor.read(this.args.at(0));
  }
}
