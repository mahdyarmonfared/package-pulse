#!/usr/bin/env node

/**
 * PackagePulse CLI Entry Binary
 */

const { execute } = require('../src/cli/runner');

execute(process.argv.slice(2)).then(exitCode => {
  if (typeof exitCode === 'number' && exitCode !== 0) {
    process.exit(exitCode);
  }
}).catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
