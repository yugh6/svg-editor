import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class TreeCommand extends Command {
  static readonly syntax = 'tree [id]';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 1, TreeCommand.syntax);
    return [editor.document.tree(this.args.optional(0))];
  }
}
