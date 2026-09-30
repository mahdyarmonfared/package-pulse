/**
 * Native HTTPS client to query npm registry APIs for latest versions and deprecations.
 * Uses pure Node.js https module without external HTTP dependencies.
 */

const https = require('https');

function fetchPackageRegistryInfo(pkgName, timeoutMs = 2500) {
  return new Promise((resolve) => {
    // Escape scoped package names (e.g. @babel/core -> @babel%2fcore)
    const encodedName = pkgName.startsWith('@') ? pkgName.replace('/', '%2f') : pkgName;
    const reqUrl = `https://registry.npmjs.org/${encodedName}/latest`;

    const req = https.get(reqUrl, { headers: { 'User-Agent': 'package-pulse/1.0.0' } }, (res) => {
      if (res.statusCode !== 200) {
        return resolve({ name: pkgName, success: false, error: `HTTP ${res.statusCode}` });
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            name: pkgName,
            success: true,
            latestVersion: json.version || null,
            deprecated: json.deprecated || null,
            license: json.license || null,
            description: json.description || null
          });
        } catch (err) {
          resolve({ name: pkgName, success: false, error: err.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ name: pkgName, success: false, error: err.message });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ name: pkgName, success: false, error: 'Timeout' });
    });
  });
}

function calculateSemverDrift(installedStr, latestStr) {
  if (!installedStr || !latestStr) return 'unknown';
  if (installedStr === latestStr) return 'up-to-date';

  const cleanInstalled = installedStr.replace(/[^0-9.]/g, '');
  const cleanLatest = latestStr.replace(/[^0-9.]/g, '');

  const instParts = cleanInstalled.split('.').map(Number);
  const latestParts = cleanLatest.split('.').map(Number);

  if (latestParts[0] > instParts[0]) return 'major';
  if (latestParts[1] > instParts[1]) return 'minor';
  if (latestParts[2] > instParts[2]) return 'patch';

  return 'up-to-date';
}

async function checkOutdatedBatch(dependencies, maxConcurrency = 5) {
  const results = [];
  const items = [...dependencies];

  for (let i = 0; i < items.length; i += maxConcurrency) {
    const chunk = items.slice(i, i + maxConcurrency);
    const chunkResults = await Promise.all(
      chunk.map(dep => fetchPackageRegistryInfo(dep.name))
    );

    for (let j = 0; j < chunk.length; j++) {
      const dep = chunk[j];
      const reg = chunkResults[j];

      const latestVersion = reg.success ? reg.latestVersion : null;
      const drift = calculateSemverDrift(dep.installedVersion, latestVersion);

      results.push({
        ...dep,
        latestVersion: latestVersion || dep.installedVersion,
        drift,
        deprecated: reg.deprecated || null,
        registryChecked: reg.success
      });
    }
  }

  return results;
}

module.exports = {
  fetchPackageRegistryInfo,
  calculateSemverDrift,
  checkOutdatedBatch
};
