import { Arguments } from '../commands/Arguments.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { BackCommand } from '../commands/BackCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import type { Command } from '../commands/Command.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { FrontCommand } from '../commands/FrontCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { Tokenizer } from './Tokenizer.js';

export class CommandRegistry {
  private readonly tokenizer = new Tokenizer();
  private readonly factories = new Map<string, (args: Arguments) => Command>();
  private readonly syntaxes: string[] = [];

  constructor() {
    // Name dispatch site 2/2: future plugins may supply registrations at the composition root.
    const constructors = [InitCommand, ReadCommand, SaveCommand, CanvasCommand, CreateCommand,
      DeleteCommand, MoveCommand, ScaleCommand, SetCommand, GroupCommand, UngroupCommand,
      AddToCommand, FrontCommand, BackCommand, TreeCommand, ShowCommand, UndoCommand, RedoCommand];
    for (const Constructor of constructors) {
      this.syntaxes.push(Constructor.syntax);
      this.factories.set(Constructor.syntax.split(' ')[0]!, args => new Constructor(args));
    }
    this.syntaxes.push(HelpCommand.syntax);
    this.factories.set('help', args => new HelpCommand(args, this.syntaxes));
  }
  parse(line: string): Command | undefined {
    const tokens = this.tokenizer.parse(line);
    const name = tokens[0]?.value;
    if (name === undefined) return undefined;
    const factory = this.factories.get(name);
    if (!factory) throw new Error(`unknown command: ${name}`);
    return factory(new Arguments(tokens.slice(1)));
  }
}
