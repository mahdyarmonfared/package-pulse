const test = require('node:test');
const assert = require('node:assert');
const { calculateHealthScore } = require('../src/core/health-calculator');

test('HealthCalculator - computes correct health score with copyleft & drift penalties', () => {
  const safeDeps = [
    { name: 'express', license: 'MIT', drift: 'up-to-date' }
  ];

  const safeReport = calculateHealthScore(safeDeps);
  assert.strictEqual(safeReport.healthScore, 100);

  const riskyDeps = [
    { name: 'gpl-tool', license: 'GPL-3.0', drift: 'major' },
    { name: 'old-dep', license: 'MIT', deprecated: 'Use new-dep instead' }
  ];

  const riskyReport = calculateHealthScore(riskyDeps);
  assert.ok(riskyReport.healthScore < 60);
  assert.strictEqual(riskyReport.compliance.strongCopyleftCount, 1);
});
