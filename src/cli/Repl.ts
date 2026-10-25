import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CommandRunner } from './CommandRunner.js';

export class Repl {
  constructor(private readonly runner: CommandRunner) {}
  start(input: Readable, output: Writable, terminal: boolean): void {
    output.write("svg-editor 0.1 — type 'help' for commands\n");
    const reader = createInterface({ input, output, terminal, crlfDelay: Infinity });
    const prompt = (): void => { output.write('svg> '); };
    prompt();
    reader.on('line', line => {
      // Echo piped scripts so redirected output is also a readable transcript.
      if (!terminal) output.write(`${line}\n`);
      for (const result of this.runner.run(line)) output.write(`${result}\n`);
      prompt();
    });
    reader.on('close', () => output.write('\n'));
  }
}
