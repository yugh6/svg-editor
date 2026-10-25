import { Numeric } from '../domain/Numeric.js';

export interface ArgumentToken { readonly value: string; readonly quoted: boolean; }

export class Arguments {
  constructor(private readonly tokens: readonly ArgumentToken[]) {}
  get length(): number { return this.tokens.length; }
  at(index: number): string {
    const token = this.tokens[index];
    if (!token) throw new Error('missing argument');
    return token.value;
  }
  optional(index: number): string | undefined { return this.tokens[index]?.value; }
  number(index: number): number { return Numeric.parse(this.at(index)); }
  values(start = 0, end = this.length): string[] { return this.tokens.slice(start, end).map(token => token.value); }
  expect(min: number, max: number, syntax: string): void {
    if (this.length < min || this.length > max) throw new Error(`usage: ${syntax}`);
  }
  parentSuffix(): { parameters: string[]; parentId?: string } {
    const marker = this.tokens.at(-2);
    if (this.length >= 4 && marker?.value === 'in' && !marker.quoted) {
      return { parameters: this.values(2, -2), parentId: this.at(this.length - 1) };
    }
    return { parameters: this.values(2) };
  }
}
