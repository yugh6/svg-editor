import type { SvgDocument } from '../domain/SvgDocument.js';

export interface Undoable {
  readonly description: string;
  run(document: SvgDocument): SvgDocument;
  undo(): SvgDocument;
  redo(): SvgDocument;
}
