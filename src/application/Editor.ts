import { SvgDocument } from '../domain/SvgDocument.js';
import type { DocumentStore } from './DocumentStore.js';
import type { Undoable } from './Undoable.js';

export class Editor {
  private current: SvgDocument | undefined;
  private currentPath: string | undefined;
  private undoStack: Undoable[] = [];
  private redoStack: Undoable[] = [];
  private ioBarrier = true;

  constructor(private readonly store: DocumentStore) {}
  get document(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  private blockHistory(): void { this.undoStack = []; this.redoStack = []; this.ioBarrier = true; }
  init(width: number, height: number): string[] {
    this.current = new SvgDocument(width, height);
    this.currentPath = undefined;
    this.blockHistory();
    return [`canvas ${width}x${height} created`];
  }
  read(path: string): string[] {
    const loaded = this.store.read(path);
    this.current = loaded.document;
    this.currentPath = path;
    this.blockHistory();
    return [...loaded.warnings, `read ${path} (${this.document.count} elements)`];
  }
  save(path?: string): string[] {
    const document = this.document;
    const destination = path ?? this.currentPath;
    if (!destination) throw new Error('no file path. use save <file.svg>');
    this.store.write(destination, document);
    this.currentPath = destination;
    this.blockHistory();
    return [`saved to ${destination} (${document.count} elements)`];
  }
  canvas(width?: number, height?: number): string[] {
    const document = this.document;
    if (width === undefined || height === undefined) return [`canvas ${document.width}x${document.height}`];
    const resized = document.clone();
    resized.resize(width, height);
    this.current = resized;
    this.blockHistory();
    return [`canvas resized to ${width}x${height}`];
  }
  edit(command: Undoable): string[] {
    const changed = command.run(this.document);
    this.current = changed;
    this.undoStack.push(command);
    this.redoStack = [];
    this.ioBarrier = false;
    return [command.description];
  }
  undo(): string[] {
    this.document;
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const command = this.undoStack.at(-1);
    if (!command) throw new Error('nothing to undo');
    const previous = command.undo();
    this.current = previous;
    this.undoStack.pop(); this.redoStack.push(command);
    return [`undone: ${command.description}`];
  }
  redo(): string[] {
    this.document;
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const command = this.redoStack.at(-1);
    if (!command) throw new Error('nothing to redo');
    const next = command.redo();
    this.current = next;
    this.redoStack.pop(); this.undoStack.push(command);
    return [`redone: ${command.description}`];
  }
}
