import type { DocumentStore, LoadedDocument } from '../src/application/DocumentStore.js';
import type { SvgDocument } from '../src/domain/SvgDocument.js';
import { SvgCodec } from '../src/io/SvgCodec.js';

export class MemoryStore implements DocumentStore {
  readonly files = new Map<string, string>();
  private readonly codec = new SvgCodec();
  read(path: string): LoadedDocument {
    const value = this.files.get(path);
    if (value === undefined) throw new Error(`cannot read file: ${path}`);
    return this.codec.decode(value);
  }
  write(path: string, document: SvgDocument): void {
    if (path === 'denied.svg') throw new Error(`cannot write file: ${path}`);
    this.files.set(path, this.codec.encode(document));
  }
}
