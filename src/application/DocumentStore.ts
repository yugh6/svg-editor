import type { SvgDocument } from '../domain/SvgDocument.js';

export interface LoadedDocument { document: SvgDocument; warnings: readonly string[]; }
export interface DocumentStore {
  read(path: string): LoadedDocument;
  write(path: string, document: SvgDocument): void;
}
