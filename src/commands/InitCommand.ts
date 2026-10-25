import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class InitCommand extends Command {
  static readonly syntax = 'init [w] [h]';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 2, InitCommand.syntax);
    return editor.init(this.args.length > 0 ? this.args.number(0) : 800, this.args.length > 1 ? this.args.number(1) : 600);
  }
}
