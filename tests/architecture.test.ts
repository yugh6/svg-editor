import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const rules: Record<string, readonly string[]> = {
  domain: ['domain'], application: ['application', 'domain'],
  commands: ['commands', 'application', 'domain'],
  io: ['io', 'application', 'domain'], cli: ['cli', 'commands', 'application'],
};

test('production imports follow the documented layer direction', () => {
  for (const [layer, allowed] of Object.entries(rules)) {
    for (const name of readdirSync(join(root, layer)).filter(name => name.endsWith('.ts'))) {
      const filename = join(root, layer, name), source = readFileSync(filename, 'utf8');
      for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const dependency = match[1]!;
        if (dependency.startsWith('.')) {
          const target = relative(root, resolve(dirname(filename), dependency)).split(/[\\/]/)[0]!;
          assert.ok(allowed.includes(target), `${layer}/${name} must not depend on ${target}`);
        } else assert.ok(layer === 'io' || layer === 'cli', `${layer}/${name} must not import infrastructure: ${dependency}`);
      }
    }
  }
});

test('each production class occupies its own matching file; behavior is object-oriented', () => {
  for (const layer of Object.keys(rules)) {
    for (const name of readdirSync(join(root, layer)).filter(name => name.endsWith('.ts'))) {
      const source = readFileSync(join(root, layer, name), 'utf8');
      const classes = [...source.matchAll(/export (?:abstract )?class (\w+)/g)].map(match => match[1]);
      assert.ok(classes.length <= 1, `${layer}/${name}: multiple classes`);
      if (classes.length) assert.equal(classes[0], basename(name, '.ts'));
      assert.doesNotMatch(source, /export (?:async )?function\s/);
      assert.doesNotMatch(source, /switch\s*\([^)]*(?:tag|type)/);
    }
  }
});
