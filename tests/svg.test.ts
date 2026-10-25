import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { Harness } from './Harness.js';

const codec = new SvgCodec();

test('assignment external SVG gives one warning and seven addressable elements', () => {
  const source = readFileSync(new URL('../examples/other.svg', import.meta.url), 'utf8');
  const result = codec.decode(source);
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.equal(result.document.count, 7);
  assert.equal(result.document.width, 400); assert.equal(result.document.height, 300);
  assert.equal(result.document.parentLabel('r2'), 'g#g1');
  assert.equal(codec.decode(codec.encode(result.document)).document.tree(), result.document.tree());
});

test('generated IDs reserve later explicit IDs globally and remain case-sensitive', () => {
  const result = codec.decode('<svg><rect/><g><rect id="rect1"/><rect/><g id="g1"/></g><rect id="RECT1"/></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g2 to unnamed <g>', 'warning: assigned id rect3 to unnamed <rect>',
  ]);
  assert.deepEqual(result.document.all().map(shape => shape.id), ['rect2', 'g2', 'rect1', 'rect3', 'g1', 'RECT1']);
});

test('all six shapes, nested groups, styles, text XML escaping and viewBox round trip', () => {
  const h = new Harness();
  h.ok('init 640 480', 'create g scene', 'create rect r -1.25 2.5 3 4 #fff in scene', 'create circle c 1 2 3 red in scene',
    'create ellipse e 1 2 3 4 in scene', 'create line l 1 2 3 4 black in scene',
    'create text t 1 2 "<tag> & \\"quote\\" 中文" in scene', 'set scene fill blue', 'set l stroke-width 2');
  const encoded = codec.encode(h.editor.document);
  assert.match(encoded, /<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(encoded, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(encoded, /&lt;tag&gt; &amp;/);
  const decoded = codec.decode(encoded);
  assert.deepEqual(decoded.warnings, []);
  assert.equal(decoded.document.tree(), h.tree);
  assert.equal(decoded.document.find('t').textContent, '<tag> & "quote" 中文');
  assert.equal(codec.encode(decoded.document), encoded);
});

test('viewBox, px canvas dimensions and presentation survive read/write', () => {
  const result = codec.decode('<svg width="400px" height="300px" viewBox="-10 -20 200 150" fill="red"><text id="t" x="2" y="3" font-size="18" text-anchor="middle">Text</text></svg>');
  const svg = codec.encode(result.document);
  assert.match(svg, /viewBox="-10 -20 200 150"/);
  assert.match(svg, /font-size="18" text-anchor="middle"/);
  assert.match(svg, /fill="red"/);
  const clone = result.document.clone();
  assert.equal(codec.encode(clone), svg);
  clone.resize(500, 400);
  assert.match(codec.encode(clone), /viewBox="0 0 500 400"/);
});

test('translate and nested positive uniform scale normalize geometry and inherited text size', () => {
  const result = codec.decode('<svg><g id="outer" transform="translate(60,40)"><g id="inner" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/><text id="t" x="60" y="38" font-size="16">End</text></g></g></svg>');
  const attrs = Object.fromEntries(result.document.find('r').attributes());
  assert.equal(attrs.x, '260'); assert.equal(attrs.y, '40');
  assert.equal(attrs.width, '96'); assert.equal(attrs.height, '48');
  const text = Object.fromEntries(result.document.find('t').attributes());
  assert.equal(text.x, '308'); assert.equal(text.y, '70.4'); assert.equal(text['font-size'], '12.8');
  assert.doesNotMatch(codec.encode(result.document), /transform=/);
  const inherited = codec.decode('<svg font-size="20" stroke-width="2"><g id="g" transform="scale(2) translate(3,4)"><text id="t" x="1" y="2">T</text></g></svg>');
  const inheritedAttrs = Object.fromEntries(inherited.document.find('t').attributes());
  assert.equal(inheritedAttrs.x, '8'); assert.equal(inheritedAttrs.y, '12');
  assert.equal(inheritedAttrs['font-size'], '40'); assert.equal(inheritedAttrs['stroke-width'], '4');
});

test('box metadata degrades to a normal group in Phase 1', () => {
  const result = codec.decode('<svg><g id="box" data-kind="box"><rect id="r" width="10" height="10"/></g></svg>');
  assert.equal(result.document.find('box').type, 'g');
  assert.match(codec.encode(result.document), /data-kind="box"/);
});

const invalidSVGs = [
  '<svg><rect id="x"/><circle id="x"/></svg>',
  '<svg><rect></svg>', '<not-svg/>', '<svg><path id="p" d="M0 0"/></svg>',
  '<svg><g id="a b"/></svg>', '<svg><rect width="-1"/></svg>',
  '<svg><rect x="NaN"/></svg>', '<svg><rect><circle/></rect></svg>',
  '<svg><text><tspan>Hello</tspan></text></svg>', '<svg><g>unexpected text</g></svg>',
  '<svg xmlns="urn:wrong"/>', '<svg><rect style="fill:red"/></svg>',
  '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>',
  '<svg viewBox="0 0 1"/>', '<svg viewBox="0 0 1 -2"/>',
  '<svg><g transform="rotate(30)"/></svg>', '<svg><g transform="scale(1,2)"/></svg>',
];
for (const source of invalidSVGs) test(`reject malformed or unsupported SVG: ${source}`, () => {
  assert.throws(() => codec.decode(source));
});

test('warnings and partial parse results do not escape when a later imported element is invalid', () => {
  const h = new Harness();
  h.ok('init', 'create g retained');
  h.store.files.set('bad.svg', '<svg><rect/><circle id="c" r="-1"/></svg>');
  const before = h.tree;
  const result = h.run('read bad.svg');
  assert.match(result, /^error:/); assert.doesNotMatch(result, /warning:/);
  assert.equal(h.tree, before);
  h.ok('undo'); assert.equal(h.editor.document.count, 0);
});
