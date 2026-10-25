import type { ArgumentToken } from '../commands/Arguments.js';

export class Tokenizer {
  parse(line: string): ArgumentToken[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: ArgumentToken[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/.test(line[index]!)) { index++; continue; }
      let value = '';
      const quoted = line[index] === '"';
      if (quoted) {
        index++;
        let closed = false;
        while (index < line.length) {
          const character = line[index++]!;
          if (character === '"') { closed = true; break; }
          if (character === '\\' && (line[index] === '"' || line[index] === '\\')) value += line[index++]!;
          else value += character;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/.test(line[index]!)) throw new Error('expected whitespace after quoted argument');
      } else {
        while (index < line.length && !/\s/.test(line[index]!)) {
          if (line[index] === '"') throw new Error('quote must start an argument');
          value += line[index++]!;
        }
      }
      tokens.push({ value, quoted });
    }
    return tokens;
  }
}
