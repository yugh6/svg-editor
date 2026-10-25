import type { Editor } from '../application/Editor.js';
import type { Arguments } from './Arguments.js';
import { Command } from './Command.js';
export class HelpCommand extends Command {
  static readonly syntax = 'help';
  constructor(args: Arguments, private readonly syntaxes: readonly string[]) { super(args); }
  override execute(_editor: Editor): string[] {
    this.args.expect(0, 0, HelpCommand.syntax);
    return [...this.syntaxes,
      '', 'Shape parameters:',
      '  rect <id> <x> <y> <w> <h> [fill]',
      '  circle <id> <cx> <cy> <r> [fill]',
      '  ellipse <id> <cx> <cy> <rx> <ry> [fill]',
      '  line <id> <x1> <y1> <x2> <y2> [stroke]',
      '  text <id> <x> <y> "content"', '  g <id>',
      'Every create supports a trailing in <containerId>.',
      'set: fill / stroke / stroke-width, shape geometry, text content.',
      'Double-quote arguments containing spaces; lines beginning with # are comments.',
      'End input (Ctrl+D on Unix, Ctrl+Z then Enter on Windows) to exit.'];
  }
}
