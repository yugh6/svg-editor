import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class ShowCommand extends Command {
  static readonly syntax = 'show <id>';
  override execute(editor: Editor): string[] {
    this.args.expect(1, 1, ShowCommand.syntax);
    return [editor.document.show(this.args.at(0))];
  }
}
