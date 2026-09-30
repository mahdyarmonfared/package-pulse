/**
 * PackagePulse Core API Entry Point
 */

const licenseCategorizer = require('./license-categorizer');
const packageAnalyzer = require('./package-analyzer');
const registryClient = require('./registry-client');
const healthCalculator = require('./health-calculator');

module.exports = {
  ...licenseCategorizer,
  ...packageAnalyzer,
  ...registryClient,
  ...healthCalculator
};
