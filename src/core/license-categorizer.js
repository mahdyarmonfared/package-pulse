/**
 * Software License Compliance Categorizer.
 * Categorizes licenses into Permissive, Weak Copyleft, Strong Copyleft, and Unknown tiers.
 */

const PERMISSIVE_PATTERNS = [
  /^MIT$/i,
  /^Apache-2\.0$/i,
  /^BSD-2-Clause$/i,
  /^BSD-3-Clause$/i,
  /^ISC$/i,
  /^Unlicense$/i,
  /^CC0-1\.0$/i,
  /^WTFPL$/i,
  /^Python-2\.0$/i,
  /^BSD$/i,
  /^Apache$/i
];

const WEAK_COPYLEFT_PATTERNS = [
  /^MPL-2\.0$/i,
  /^LGPL-2\.1(-only|-or-later)?$/i,
  /^LGPL-3\.0(-only|-or-later)?$/i,
  /^EPL-1\.0$/i,
  /^EPL-2\.0$/i,
  /^CDDL-1\.0$/i
];

const STRONG_COPYLEFT_PATTERNS = [
  /^GPL-2\.0(-only|-or-later)?$/i,
  /^GPL-3\.0(-only|-or-later)?$/i,
  /^AGPL-3\.0(-only|-or-later)?$/i,
  /^SSPL-1\.0$/i,
  /^BSL-1\.1$/i,
  /^OSL-3\.0$/i,
  /^GPL$/i,
  /^AGPL$/i
];

function categorizeLicense(licenseStr) {
  if (!licenseStr || typeof licenseStr !== 'string') {
    return {
      tier: 'unknown',
      name: 'Missing / Unspecified',
      riskLevel: 'medium',
      viral: false,
      badge: 'UNKNOWN',
      description: 'Package has no license specified in package.json'
    };
  }

  const clean = licenseStr.trim().replace(/^\(|\)$/g, '');

  if (/UNLICENSED|PROPRIETARY/i.test(clean)) {
    return {
      tier: 'unknown',
      name: clean,
      riskLevel: 'high',
      viral: false,
      badge: 'UNLICENSED',
      description: 'Private / Proprietary license. Commercial distribution prohibited without authorization.'
    };
  }

  // Permissive check
  for (const pattern of PERMISSIVE_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        tier: 'permissive',
        name: clean,
        riskLevel: 'low',
        viral: false,
        badge: 'PERMISSIVE',
        description: 'Safe for commercial & proprietary use with standard attribution.'
      };
    }
  }

  // Weak Copyleft check
  for (const pattern of WEAK_COPYLEFT_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        tier: 'weak_copyleft',
        name: clean,
        riskLevel: 'medium',
        viral: false,
        badge: 'WEAK COPYLEFT',
        description: 'Source modifications must be disclosed, but can link with proprietary code.'
      };
    }
  }

  // Strong Copyleft check
  for (const pattern of STRONG_COPYLEFT_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        tier: 'strong_copyleft',
        name: clean,
        riskLevel: 'critical',
        viral: true,
        badge: 'STRONG COPYLEFT (VIRAL)',
        description: 'Viral copyleft license. Integrating this package may force your entire codebase to be open-sourced.'
      };
    }
  }

  return {
    tier: 'permissive', // default fallback for open source strings
    name: clean,
    riskLevel: 'low',
    viral: false,
    badge: 'PERMISSIVE',
    description: 'Custom or open-source license string'
  };
}

function getComplianceReport(dependencies) {
  const summary = {
    total: dependencies.length,
    permissiveCount: 0,
    weakCopyleftCount: 0,
    strongCopyleftCount: 0,
    unknownCount: 0,
    flagged: []
  };

  for (const dep of dependencies) {
    const category = categorizeLicense(dep.license);
    dep.licenseCategory = category;

    if (category.tier === 'permissive') summary.permissiveCount++;
    else if (category.tier === 'weak_copyleft') summary.weakCopyleftCount++;
    else if (category.tier === 'strong_copyleft') {
      summary.strongCopyleftCount++;
      summary.flagged.push({ name: dep.name, license: dep.license, risk: 'critical', reason: category.description });
    } else {
      summary.unknownCount++;
      if (category.riskLevel === 'high') {
        summary.flagged.push({ name: dep.name, license: dep.license, risk: 'high', reason: category.description });
      }
    }
  }

  return summary;
}

module.exports = {
  categorizeLicense,
  getComplianceReport
};
