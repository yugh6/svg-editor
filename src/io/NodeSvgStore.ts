import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DocumentStore, LoadedDocument } from '../application/DocumentStore.js';
import type { SvgDocument } from '../domain/SvgDocument.js';
import { SvgCodec } from './SvgCodec.js';

export class NodeSvgStore implements DocumentStore {
  constructor(private readonly codec = new SvgCodec()) {}
  read(path: string): LoadedDocument {
    let content: string;
    try { content = readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(content);
  }
  write(path: string, document: SvgDocument): void {
    const content = this.codec.encode(document);
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' });
      renameSync(temporary, path);
    } catch { throw new Error(`cannot write file: ${path}`); }
    finally { try { unlinkSync(temporary); } catch { /* No temporary file remains after a successful rename. */ } }
  }
}
