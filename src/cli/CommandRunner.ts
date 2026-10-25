import type { Editor } from '../application/Editor.js';
import { CommandRegistry } from './CommandRegistry.js';

export class CommandRunner {
  private readonly registry = new CommandRegistry();
  constructor(private readonly editor: Editor) {}
  run(line: string): string[] {
    try { return this.registry.parse(line)?.execute(this.editor) ?? []; }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return [`error: ${message.replace(/[\r\n]+/g, ' ')}`];
    }
  }
}
