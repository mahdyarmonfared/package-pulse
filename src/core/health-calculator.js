/**
 * Calculates overall Project Health Score (0-100%) and aggregates metrics.
 */

const { getComplianceReport } = require('./license-categorizer');

function calculateHealthScore(dependencies) {
  let score = 100;
  const compliance = getComplianceReport(dependencies);

  let majorOutdatedCount = 0;
  let deprecatedCount = 0;

  for (const dep of dependencies) {
    if (dep.drift === 'major') {
      majorOutdatedCount++;
      score -= 8;
    }
    if (dep.deprecated) {
      deprecatedCount++;
      score -= 15;
    }
  }

  // License risk penalties
  score -= (compliance.strongCopyleftCount * 25);
  score -= (compliance.weakCopyleftCount * 8);
  score -= (compliance.unknownCount * 12);

  score = Math.max(0, Math.min(100, score));

  return {
    healthScore: score,
    compliance,
    outdatedSummary: {
      majorOutdatedCount,
      deprecatedCount
    }
  };
}

module.exports = {
  calculateHealthScore
};
