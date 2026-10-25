import type { Editor } from '../application/Editor.js';
import type { Arguments } from './Arguments.js';

export abstract class Command {
  constructor(protected readonly args: Arguments) {}
  abstract execute(editor: Editor): string[];
}
