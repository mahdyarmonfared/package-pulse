const test = require('node:test');
const assert = require('node:assert');
const { categorizeLicense, getComplianceReport } = require('../src/core/license-categorizer');

test('LicenseCategorizer - identifies permissive licenses correctly', () => {
  const mit = categorizeLicense('MIT');
  assert.strictEqual(mit.tier, 'permissive');
  assert.strictEqual(mit.viral, false);

  const apache = categorizeLicense('Apache-2.0');
  assert.strictEqual(apache.tier, 'permissive');
});

test('LicenseCategorizer - identifies copyleft viral licenses', () => {
  const gpl = categorizeLicense('GPL-3.0');
  assert.strictEqual(gpl.tier, 'strong_copyleft');
  assert.strictEqual(gpl.viral, true);

  const agpl = categorizeLicense('AGPL-3.0-only');
  assert.strictEqual(agpl.tier, 'strong_copyleft');
});

test('LicenseCategorizer - identifies unlicensed and unknown', () => {
  const missing = categorizeLicense(null);
  assert.strictEqual(missing.tier, 'unknown');

  const unlic = categorizeLicense('UNLICENSED');
  assert.strictEqual(unlic.tier, 'unknown');
  assert.strictEqual(unlic.riskLevel, 'high');
});

test('LicenseCategorizer - getComplianceReport aggregates risk counts', () => {
  const deps = [
    { name: 'a', license: 'MIT' },
    { name: 'b', license: 'GPL-3.0' },
    { name: 'c', license: 'UNLICENSED' }
  ];

  const report = getComplianceReport(deps);
  assert.strictEqual(report.total, 3);
  assert.strictEqual(report.permissiveCount, 1);
  assert.strictEqual(report.strongCopyleftCount, 1);
  assert.strictEqual(report.unknownCount, 1);
  assert.strictEqual(report.flagged.length, 2);
});
