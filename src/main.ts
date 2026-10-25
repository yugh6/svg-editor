import { Editor } from './application/Editor.js';
import { CommandRunner } from './cli/CommandRunner.js';
import { Repl } from './cli/Repl.js';
import { NodeSvgStore } from './io/NodeSvgStore.js';

const editor = new Editor(new NodeSvgStore());
new Repl(new CommandRunner(editor)).start(process.stdin, process.stdout, Boolean(process.stdin.isTTY && process.stdout.isTTY));
