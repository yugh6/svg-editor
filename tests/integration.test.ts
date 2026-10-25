import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { NodeSvgStore } from '../src/io/NodeSvgStore.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { Harness } from './Harness.js';

test('real file read/write, safe replacement, read errors and unwritable target', t => {
  const temp = mkdtempSync(join(tmpdir(), 'lab1-svg-test-'));
  t.after(() => { assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + sep + 'lab1-svg-test-')); rmSync(temp, { recursive: true }); });
  const store = new NodeSvgStore(), document = new SvgDocument(100, 80);
  document.add(new ShapeFactory().create('rect', 'r', ['1', '2', '3', '4']));
  const file = join(temp, '图形 with spaces.svg');
  store.write(file, document);
  assert.equal(store.read(file).document.tree(), document.tree());
  document.find('r').move(10, 20);
  store.write(file, document);
  assert.equal(store.read(file).document.tree(), document.tree());
  assert.throws(() => store.read(join(temp, 'missing.svg')), /cannot read file:/);
  assert.throws(() => store.write(join(temp, 'absent', 'no.svg'), document), /cannot write file:/);
  assert.throws(() => store.write(temp, document), /cannot write file:/);
  assert.deepEqual(readdirSync(temp), ['图形 with spaces.svg']);
});

test('npm CLI source entry accepts piped commands, keeps running after errors, exits on EOF', t => {
  const temp = mkdtempSync(join(tmpdir(), 'lab1-svg-test-'));
  t.after(() => { assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + sep + 'lab1-svg-test-')); rmSync(temp, { recursive: true }); });
  const main = fileURLToPath(new URL('../src/main.ts', import.meta.url));
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), main], {
    cwd: temp, encoding: 'utf8', timeout: 10000,
    input: '# script\r\ninit 300 200\r\ncreate text t 10 20 "中文 text"\r\nmove missing 1 2\r\nsave "with space.svg"\r\nundo\r\nread "with space.svg"\r\nshow t\r\n',
  });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /svg> init 300 200/);
  assert.match(result.stdout, /error: no such shape: missing/);
  assert.match(result.stdout, /error: undo not allowed after io command/);
  assert.match(result.stdout, /text="中文 text"/);
  assert.match(readFileSync(join(temp, 'with space.svg'), 'utf8'), /中文 text/);
});

test('assignment session script produces expected errors, final imported document and saved SVG', () => {
  const h = new Harness();
  h.store.files.set('examples/other.svg', readFileSync(new URL('../examples/other.svg', import.meta.url), 'utf8'));
  const outputs = readFileSync(new URL('../examples/session.cli', import.meta.url), 'utf8').split(/\r?\n/).map(line => h.run(line));
  assert.deepEqual(outputs.filter(line => line.startsWith('error:')), [
    'error: cannot group a container into its own descendant: markers', 'error: undo not allowed after io command',
  ]);
  assert.equal(h.editor.document.count, 7);
  assert.match(h.store.files.get('examples/demo.svg')!, /<g id="markers">/);
  assert.match(h.store.files.get('examples/other-roundtrip.svg')!, /id="rect1"/);
});

test('flowchart script reproduces eight-element nested composite and undoes node movement', () => {
  const h = new Harness();
  for (const line of readFileSync(new URL('../examples/flowchart.cli', import.meta.url), 'utf8').split(/\r?\n/)) h.ok(line);
  assert.equal(h.editor.document.count, 8);
  assert.equal(h.attribute('process', 'y'), '100');
  assert.equal(h.attribute('process-label', 'y'), '135');
  assert.equal(h.editor.document.find('process-label').textContent, '处理数据 v2');
  assert.deepEqual(h.children('flowchart'), ['node1', 'node2', 'arrow1']);
});

test('empty content and malformed files are errors without truncating an existing SVG', t => {
  const temp = mkdtempSync(join(tmpdir(), 'lab1-svg-test-'));
  t.after(() => { assert.ok(resolve(temp).startsWith(resolve(tmpdir()) + sep + 'lab1-svg-test-')); rmSync(temp, { recursive: true }); });
  const path = join(temp, 'invalid.svg'); writeFileSync(path, 'not xml');
  assert.throws(() => new NodeSvgStore().read(path), /invalid SVG|expected <svg>/);
  assert.equal(readFileSync(path, 'utf8'), 'not xml');
});
