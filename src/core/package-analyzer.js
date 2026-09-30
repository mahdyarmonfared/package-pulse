/**
 * Analyzes local project package.json and installed node_modules.
 */

const fs = require('fs');
const path = require('path');
const { categorizeLicense } = require('./license-categorizer');

function getFolderSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getFolderSize(fullPath);
      } else if (entry.isFile()) {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  } catch {
    // Ignore unreadable files/symlinks
  }

  return totalSize;
}

function analyzeProject(projectDir = process.cwd()) {
  const pkgPath = path.resolve(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(`No package.json found at: ${projectDir}`);
  }

  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkgJson = JSON.parse(raw);

  const nodeModulesDir = path.resolve(projectDir, 'node_modules');

  const dependencies = [];

  const types = [
    { key: 'dependencies', type: 'prod' },
    { key: 'devDependencies', type: 'dev' },
    { key: 'peerDependencies', type: 'peer' }
  ];

  for (const { key, type } of types) {
    const depsObj = pkgJson[key] || {};
    for (const [name, spec] of Object.entries(depsObj)) {
      let installedVersion = spec.replace(/[\^~>=<]/g, '');
      let license = 'Missing';
      let sizeBytes = 0;
      let isInstalled = false;

      const installedPkgPath = path.join(nodeModulesDir, name, 'package.json');
      if (fs.existsSync(installedPkgPath)) {
        try {
          const installedJson = JSON.parse(fs.readFileSync(installedPkgPath, 'utf8'));
          installedVersion = installedJson.version || installedVersion;
          license = typeof installedJson.license === 'string'
            ? installedJson.license
            : typeof installedJson.license === 'object' && installedJson.license?.type
              ? installedJson.license.type
              : 'Missing';
          isInstalled = true;
          sizeBytes = getFolderSize(path.join(nodeModulesDir, name));
        } catch {
          // keep fallback
        }
      }

      const licenseInfo = categorizeLicense(license);

      dependencies.push({
        name,
        spec,
        installedVersion,
        type,
        license,
        licenseCategory: licenseInfo,
        sizeBytes,
        isInstalled
      });
    }
  }

  return {
    projectName: pkgJson.name || 'unnamed-project',
    projectVersion: pkgJson.version || '1.0.0',
    description: pkgJson.description || '',
    repository: typeof pkgJson.repository === 'string' ? pkgJson.repository : pkgJson.repository?.url || '',
    totalDependencies: dependencies.length,
    dependencies
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  analyzeProject,
  getFolderSize,
  formatBytes
};
