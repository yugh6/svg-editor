import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRunner } from '../src/cli/CommandRunner.js';
import { MemoryStore } from './MemoryStore.js';

export class Harness {
  readonly store = new MemoryStore();
  readonly editor = new Editor(this.store);
  readonly runner = new CommandRunner(this.editor);
  run(line: string): string { return this.runner.run(line).join('\n'); }
  ok(...lines: string[]): void {
    for (const line of lines) assert.doesNotMatch(this.run(line), /^error:/m, line);
  }
  get tree(): string { return this.editor.document.tree(); }
  attribute(id: string, name: string): string | undefined {
    return this.editor.document.find(id).attributes().find(([key]) => key === name)?.[1];
  }
  children(id?: string): string[] {
    return (id ? this.editor.document.find(id).children : this.editor.document.children).map(shape => shape.id);
  }
}
