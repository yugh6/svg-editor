import assert from 'node:assert/strict';
import test from 'node:test';
import { Harness } from './Harness.js';

test('initialization defaults, partial defaults, canvas query and help', () => {
  const h = new Harness();
  assert.match(h.run('tree'), /error: no document\. use 'init' or 'read' first/);
  const help = h.run('help');
  for (const name of ['init', 'read', 'save', 'canvas', 'create', 'delete', 'move', 'scale', 'set', 'group', 'ungroup', 'addto', 'front', 'back', 'tree', 'show', 'undo', 'redo', 'help']) assert.match(help, new RegExp(`^${name}(?: |$)`, 'm'));
  assert.equal(h.run('init'), 'canvas 800x600 created');
  assert.equal(h.run('init 400'), 'canvas 400x600 created');
  assert.equal(h.run('canvas'), 'canvas 400x600');
  assert.equal(h.run('init 1.5 2.5'), 'canvas 1.5x2.5 created');
});

const shapes = [
  ['rect', '1 2 3 4', { x: '2', y: '4', width: '6', height: '8' }],
  ['circle', '1 2 3', { cx: '2', cy: '4', r: '6' }],
  ['ellipse', '1 2 3 4', { cx: '2', cy: '4', rx: '6', ry: '8' }],
  ['line', '1 2 3 4', { x1: '2', y1: '4', x2: '6', y2: '8' }],
  ['text', '1 2 "中文 <&>"', { x: '2', y: '4' }],
] as const;
for (const [type, params, scaled] of shapes) {
  test(`${type}: create in container, scale all geometry, set, undo/redo`, () => {
    const h = new Harness();
    h.ok('init', 'create g scene', `create ${type} item ${params} in scene`);
    assert.equal(h.editor.document.parentLabel('item'), 'g#scene');
    assert.equal(h.attribute('item', 'fill'), undefined);
    assert.equal(h.attribute('item', 'stroke'), undefined);
    const before = h.tree;
    h.ok('scale item 2');
    for (const [key, value] of Object.entries(scaled)) assert.equal(h.attribute('item', key), value);
    const after = h.tree;
    h.ok('undo'); assert.equal(h.tree, before);
    h.ok('redo'); assert.equal(h.tree, after);
    h.ok('set item fill blue', 'set item stroke black', 'set item stroke-width 2.5');
    assert.equal(h.attribute('item', 'stroke-width'), '2.5');
    assert.match(h.run('set item forbidden 1'), /error: unknown attribute: forbidden/);
    assert.match(h.run('show item'), new RegExp(`^${type}#item  parent=g#scene`));
  });
}

test('nested composite move, scale, style inheritance and delete are undo units', () => {
  const h = new Harness();
  h.ok('init', 'create g outer', 'create g inner in outer', 'create rect r 1 2 3 4 in inner',
    'create line l 10 20 30 40 in outer', 'move outer 5 -2');
  assert.equal(h.attribute('r', 'x'), '6'); assert.equal(h.attribute('r', 'y'), '0');
  assert.equal(h.attribute('l', 'x2'), '35'); assert.equal(h.attribute('l', 'y2'), '38');
  h.ok('scale outer 0.5', 'set inner fill red');
  assert.equal(h.attribute('r', 'width'), '1.5');
  assert.equal(h.attribute('inner', 'fill'), 'red');
  assert.equal(h.attribute('r', 'fill'), undefined);
  const before = h.tree;
  h.ok('delete outer'); assert.equal(h.editor.document.count, 0);
  h.ok('undo'); assert.equal(h.tree, before);
  h.ok('redo'); assert.equal(h.editor.document.count, 0);
});

test('group preserves document order, position and restores original parents', () => {
  const h = new Harness();
  h.ok('init', 'create rect a 0 0 1 1', 'create rect b 0 0 1 1', 'create rect c 0 0 1 1', 'create rect d 0 0 1 1');
  const before = h.tree;
  h.ok('group pack c a');
  assert.deepEqual(h.children(), ['pack', 'b', 'd']);
  assert.deepEqual(h.children('pack'), ['a', 'c']);
  h.ok('undo'); assert.equal(h.tree, before);
  h.ok('redo'); assert.deepEqual(h.children('pack'), ['a', 'c']);
});

test('cross-parent grouping uses lowest common ancestor and preorder', () => {
  const h = new Harness();
  h.ok('init', 'create g scene', 'create g left in scene', 'create g right in scene',
    'create circle a 0 0 1 in left', 'create circle b 2 2 1 in right');
  const before = h.tree;
  h.ok('group bundle b a');
  assert.deepEqual(h.children('bundle'), ['a', 'b']);
  assert.equal(h.editor.document.parentLabel('bundle'), 'g#scene');
  h.ok('undo'); assert.equal(h.tree, before);
});

test('ungroup promotes children at original sibling position, root groups are protected', () => {
  const h = new Harness();
  h.ok('init', 'create g scene', 'create g before in scene', 'create g pack in scene', 'create g after in scene',
    'create circle a 0 0 1 in pack', 'create circle b 1 1 1 in pack');
  const before = h.tree;
  h.ok('ungroup pack'); assert.deepEqual(h.children('scene'), ['before', 'a', 'b', 'after']);
  h.ok('undo'); assert.equal(h.tree, before);
  assert.equal(h.run('ungroup scene'), 'error: cannot ungroup top-level container: scene');
  h.ok('redo'); assert.deepEqual(h.children('scene'), ['before', 'a', 'b', 'after']);
});

test('addto appends; front means last in SVG paint order and back means first', () => {
  const h = new Harness();
  h.ok('init', 'create g scene', 'create g a in scene', 'create g b in scene', 'create g c', 'addto scene c');
  assert.deepEqual(h.children('scene'), ['a', 'b', 'c']);
  h.ok('front a'); assert.deepEqual(h.children('scene'), ['b', 'c', 'a']);
  h.ok('back a'); assert.deepEqual(h.children('scene'), ['a', 'b', 'c']);
  h.ok('undo'); assert.deepEqual(h.children('scene'), ['b', 'c', 'a']);
  h.ok('undo'); assert.deepEqual(h.children('scene'), ['a', 'b', 'c']);
  h.ok('undo'); assert.equal(h.editor.document.parentLabel('c'), 'svg');
});

test('cycles, ancestor selections, duplicate IDs and duplicate members are atomic', () => {
  const h = new Harness();
  h.ok('init', 'create g outer', 'create g inner in outer', 'create rect r 1 2 3 4 in inner');
  const before = h.tree;
  const failures = new Map([
    ['group bad r inner', 'cannot group a container into its own descendant: inner'],
    ['addto inner outer', 'cannot move a container into its own descendant: outer'],
    ['addto inner inner', 'cannot move a container into its own descendant: inner'],
    ['group bad r r', 'duplicate group member'],
    ['create g inner', 'id already exists: inner'],
    ['group inner r', 'id already exists: inner'],
    ['create g a in missing', 'no such container: missing'],
    ['create g a in r', 'not a container: r'],
    ['delete missing', 'no such shape: missing'],
    ['create box n 1 2 3 4 "title"', 'unknown shape type: box (is the plugin loaded?)'],
  ]);
  for (const [command, error] of failures) {
    assert.equal(h.run(command), `error: ${error}`, command);
    assert.equal(h.tree, before, command);
  }
  h.ok('create g INNER');
  assert.equal(h.editor.document.count, 4);
});

test('redo survives display and failed edits but is cleared by successful new editing', () => {
  const h = new Harness();
  h.ok('init', 'create circle c 1 2 3', 'move c 1 1', 'undo');
  const original = h.tree;
  h.ok('tree', 'show c', 'canvas', 'help');
  assert.match(h.run('scale c 0'), /scale factor must be positive/);
  assert.equal(h.tree, original);
  h.ok('redo'); assert.equal(h.attribute('c', 'cx'), '2');
  h.ok('undo', 'set c r 10');
  assert.equal(h.run('redo'), 'error: nothing to redo');
});

for (const barrier of ['init', 'canvas 200 100', 'save example.svg', 'read source.svg']) {
  test(`${barrier} blocks undo/redo until next edit and clears old history`, () => {
    const h = new Harness();
    h.store.files.set('source.svg', '<svg width="10" height="20"/>');
    h.ok('init', 'create circle c 1 2 3', barrier);
    assert.equal(h.run('undo'), 'error: undo not allowed after io command');
    assert.equal(h.run('redo'), 'error: undo not allowed after io command');
    h.ok('create g next', 'undo');
    assert.equal(h.run('undo'), 'error: nothing to undo');
    h.ok('redo');
  });
}

test('failed IO, resize and init preserve document, history and default save path', () => {
  const h = new Harness();
  h.store.files.set('original.svg', '<svg><circle id="c" r="2"/></svg>');
  h.store.files.set('broken.svg', '<svg><rect></svg>');
  h.ok('read original.svg', 'move c 1 2');
  const before = h.tree;
  for (const command of ['save denied.svg', 'read missing.svg', 'read broken.svg', 'init -1 2', 'canvas 4 -2']) {
    assert.match(h.run(command), /^error:/);
    assert.equal(h.tree, before);
  }
  h.ok('undo'); assert.equal(h.attribute('c', 'cx'), '0');
  assert.match(h.run('save'), /^saved to original.svg/);
});

test('numeric validation and a mid-recursion overflow leave all descendants unchanged', () => {
  const h = new Harness();
  h.ok('init', 'create g scene', 'create rect small 1 2 3 4 in scene', 'create circle huge 1e308 0 1 in scene');
  const before = h.tree;
  for (const command of ['scale scene 10', 'move scene 1e308 0', 'scale scene -1', 'scale scene 0', 'move small NaN 0',
    'move small Infinity 0', 'set small width -1', 'set small stroke-width -2', 'create rect bad 1 2 -3 4', 'canvas NaN 200']) {
    assert.match(h.run(command), /^error:/, command);
    assert.equal(h.tree, before, command);
  }
  h.ok('undo'); assert.deepEqual(h.children('scene'), ['small']);
});

test('quoted text, escaped quotes, literal in, hex colors, Unicode and Windows paths', () => {
  const h = new Harness();
  h.ok('init', 'create g node', 'create text t 1 2 "say \\"hello\\" & 中文" in node');
  assert.equal(h.editor.document.find('t').textContent, 'say "hello" & 中文');
  h.ok('set t text "in"', 'create text empty 1 2 ""', 'set t fill #abcdef');
  assert.equal(h.editor.document.find('empty').textContent, '');
  assert.equal(h.attribute('t', 'fill'), '#abcdef');
  assert.deepEqual(h.runner.run('  # comment'), []);
  assert.deepEqual(h.runner.run('  '), []);
  const before = h.tree;
  assert.match(h.run('set t text "unterminated'), /^error: unterminated/);
  assert.equal(h.tree, before);
  h.ok('save "C:\\diagrams\\my file.svg"');
  assert.ok(h.store.files.has('C:\\diagrams\\my file.svg'));
});

test('tree subtree and show expose geometry and parent, not only names', () => {
  const h = new Harness();
  h.ok('init 400 300', 'create g markers', 'create circle c 100 80 20 red in markers');
  assert.equal(h.run('tree markers'), 'g#markers\n└── circle#c  cx=100 cy=80 r=20  fill=red');
  assert.equal(h.run('show c'), 'circle#c  parent=g#markers\n  cx=100 cy=80 r=20\n  fill=red');
});

const badArity = ['init 1 2 3', 'read', 'save a b', 'canvas 2', 'create', 'delete', 'move a 1', 'scale a',
  'set a x', 'group a', 'ungroup', 'addto a', 'front', 'back a b', 'tree a b', 'show', 'help x', 'undo x', 'redo x'];
for (const command of badArity) test(`invalid arity: ${command}`, () => {
  const h = new Harness(); h.ok('init');
  const before = h.tree;
  assert.match(h.run(command), /^error: usage:/);
  assert.equal(h.tree, before);
});
