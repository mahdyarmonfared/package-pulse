const test = require('node:test');
const assert = require('node:assert');
const { calculateSemverDrift } = require('../src/core/registry-client');

test('RegistryClient - calculateSemverDrift correctly identifies version drift', () => {
  assert.strictEqual(calculateSemverDrift('1.0.0', '1.0.0'), 'up-to-date');
  assert.strictEqual(calculateSemverDrift('1.0.0', '2.0.0'), 'major');
  assert.strictEqual(calculateSemverDrift('1.1.0', '1.2.0'), 'minor');
  assert.strictEqual(calculateSemverDrift('1.1.1', '1.1.2'), 'patch');
});
