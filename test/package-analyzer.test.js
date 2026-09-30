const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { analyzeProject, getFolderSize } = require('../src/core/package-analyzer');

test('PackageAnalyzer - analyzes package.json and dependencies', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-test-'));
  const pkgPath = path.join(tmpDir, 'package.json');

  fs.writeFileSync(pkgPath, JSON.stringify({
    name: 'test-pkg',
    version: '2.0.0',
    dependencies: {
      'express': '^4.18.2'
    },
    devDependencies: {
      'jest': '^29.0.0'
    }
  }), 'utf8');

  const result = analyzeProject(tmpDir);
  assert.strictEqual(result.projectName, 'test-pkg');
  assert.strictEqual(result.projectVersion, '2.0.0');
  assert.strictEqual(result.totalDependencies, 2);

  const expressDep = result.dependencies.find(d => d.name === 'express');
  assert.ok(expressDep);
  assert.strictEqual(expressDep.type, 'prod');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('PackageAnalyzer - getFolderSize computes directory sizes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-size-test-'));
  fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'hello world', 'utf8');

  const size = getFolderSize(tmpDir);
  assert.ok(size > 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
