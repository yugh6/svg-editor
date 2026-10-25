import type { Editor } from '../application/Editor.js';
import { Command } from './Command.js';
export class CanvasCommand extends Command {
  static readonly syntax = 'canvas [w h]';
  override execute(editor: Editor): string[] {
    this.args.expect(0, 2, CanvasCommand.syntax);
    if (this.args.length === 1) throw new Error(`usage: ${CanvasCommand.syntax}`);
    return this.args.length ? editor.canvas(this.args.number(0), this.args.number(1)) : editor.canvas();
  }
}
