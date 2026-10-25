import type { Editor } from '../application/Editor.js';
import type { Undoable } from '../application/Undoable.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { Command } from './Command.js';

export abstract class EditCommand extends Command implements Undoable {
  private before: SvgDocument | undefined;
  private after: SvgDocument | undefined;
  private result = '';
  get description(): string { return this.result; }
  override execute(editor: Editor): string[] { return editor.edit(this); }
  protected abstract apply(document: SvgDocument): string;
  run(document: SvgDocument): SvgDocument {
    const working = document.clone();
    const result = this.apply(working);
    // Publish the command's mementos only after every validation and mutation succeeds.
    this.before = document.clone();
    this.after = working.clone();
    this.result = result;
    return working;
  }
  undo(): SvgDocument {
    if (!this.before) throw new Error('command has not executed');
    return this.before.clone();
  }
  redo(): SvgDocument {
    if (!this.after) throw new Error('command has not executed');
    return this.after.clone();
  }
}
