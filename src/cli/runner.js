/**
 * CLI command runner for PackagePulse.
 */

const fs = require('fs');
const path = require('path');

const {
  analyzeProject,
  checkOutdatedBatch,
  calculateHealthScore,
  formatBytes
} = require('../core');

const { chalk, renderTable } = require('./ansi');

function parseArgs(args) {
  const parsed = {
    command: null,
    dir: process.cwd(),
    options: {
      port: 3012,
      json: false,
      help: false,
      version: false
    }
  };

  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      parsed.options.version = true;
    } else if (arg === '--json') {
      parsed.options.json = true;
    } else if (arg === '--ui') {
      parsed.command = 'ui';
    } else if (arg === '--port' && args[i + 1]) {
      parsed.options.port = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    if (['audit', 'licenses', 'outdated', 'ui', 'studio', 'help'].includes(positional[0])) {
      parsed.command = positional[0];
      if (positional[1]) parsed.dir = path.resolve(process.cwd(), positional[1]);
    } else {
      parsed.dir = path.resolve(process.cwd(), positional[0]);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
${chalk.bold(chalk.cyan('💓 PackagePulse'))} ${chalk.dim('v1.0.0')}
${chalk.dim('Zero-dependency npm package health, license compliance scanner, and visual studio.')}

${chalk.bold('USAGE:')}
  ${chalk.green('pulse')} ${chalk.yellow('[command]')} ${chalk.cyan('[dir]')} ${chalk.dim('[options]')}

${chalk.bold('COMMANDS:')}
  ${chalk.yellow('audit')}             Run full project dependency health, license & version audit (default)
  ${chalk.yellow('licenses')}          License compliance breakdown & viral copyleft risk scanner
  ${chalk.yellow('outdated')}          Check registry for major/minor version updates
  ${chalk.yellow('ui, studio')}        Launch interactive Web Studio on localhost:3012
  ${chalk.yellow('help')}              Show this help message

${chalk.bold('OPTIONS:')}
  ${chalk.cyan('--json')}              Output results as machine-readable JSON
  ${chalk.cyan('--port <number>')}     Port for Web Studio (default: 3012)
  ${chalk.cyan('-v, --version')}       Display version number
  ${chalk.cyan('-h, --help')}          Display this help guide

${chalk.bold('EXAMPLES:')}
  $ pulse audit
  $ pulse licenses ./my-project
  $ pulse outdated --json
  $ pulse ui --port 3012
`);
}

async function runAudit(targetDir, options) {
  let projectData;
  try {
    projectData = analyzeProject(targetDir);
  } catch (err) {
    console.error(chalk.red(`✖ Error: ${err.message}`));
    return 1;
  }

  console.log(`\n${chalk.bold(chalk.cyan('💓 PackagePulse Audit'))} ${chalk.dim(`(${projectData.projectName}@${projectData.projectVersion})`)}`);
  console.log(chalk.dim(`Inspecting ${projectData.totalDependencies} dependencies in ${targetDir}...\n`));

  const checkedDeps = await checkOutdatedBatch(projectData.dependencies);
  const healthReport = calculateHealthScore(checkedDeps);

  if (options.json) {
    console.log(JSON.stringify({
      project: projectData.projectName,
      version: projectData.projectVersion,
      healthScore: healthReport.healthScore,
      summary: healthReport,
      dependencies: checkedDeps
    }, null, 2));
    return healthReport.compliance.strongCopyleftCount > 0 ? 1 : 0;
  }

  // Health Score Gauge
  const scoreColor = healthReport.healthScore >= 85 ? chalk.green : healthReport.healthScore >= 65 ? chalk.yellow : chalk.red;
  console.log(`Project Health Score: ${scoreColor(chalk.bold(`${healthReport.healthScore} / 100`))}\n`);

  // Table output
  const headers = ['Package', 'Type', 'License', 'Installed', 'Latest', 'Disk Size', 'Status'];
  const rows = checkedDeps.map(dep => {
    let statusBadge = chalk.green('✔ SAFE');
    if (dep.licenseCategory.tier === 'strong_copyleft') {
      statusBadge = chalk.red('✖ COPYLEFT');
    } else if (dep.deprecated) {
      statusBadge = chalk.red('✖ DEPRECATED');
    } else if (dep.drift === 'major') {
      statusBadge = chalk.yellow('⚠ OUTDATED (MAJOR)');
    } else if (dep.licenseCategory.tier === 'unknown') {
      statusBadge = chalk.yellow('⚠ NO LICENSE');
    }

    return [
      chalk.bold(dep.name),
      chalk.dim(dep.type),
      dep.licenseCategory.tier === 'strong_copyleft' ? chalk.red(dep.license) : chalk.cyan(dep.license),
      dep.installedVersion || chalk.dim('n/a'),
      dep.latestVersion || chalk.dim('n/a'),
      formatBytes(dep.sizeBytes),
      statusBadge
    ];
  });

  console.log(renderTable(headers, rows));

  // Compliance Alerts
  if (healthReport.compliance.flagged.length > 0) {
    console.log(`\n${chalk.bold(chalk.red(' ⚠️  COMPLIANCE RISKS DETECTED '))}`);
    for (const flag of healthReport.compliance.flagged) {
      console.log(`  ${chalk.red('✖')} ${chalk.bold(flag.name)} (${flag.license}): ${flag.reason}`);
    }
  }

  console.log(`\n${chalk.bold('Summary Metrics:')}`);
  console.log(`  Total Dependencies:    ${projectData.totalDependencies}`);
  console.log(`  Permissive (Safe):     ${chalk.green(healthReport.compliance.permissiveCount)}`);
  if (healthReport.compliance.strongCopyleftCount > 0) {
    console.log(`  Strong Copyleft (GPL): ${chalk.red(healthReport.compliance.strongCopyleftCount)}`);
  }
  if (healthReport.outdatedSummary.majorOutdatedCount > 0) {
    console.log(`  Major Version Lag:     ${chalk.yellow(healthReport.outdatedSummary.majorOutdatedCount)}`);
  }
  console.log('');

  return healthReport.compliance.strongCopyleftCount > 0 ? 1 : 0;
}

function runUi(targetDir, options) {
  const { startServer } = require('../server/server');
  startServer(options.port, targetDir);
}

async function execute(args = process.argv.slice(2)) {
  const { command, dir, options } = parseArgs(args);

  if (options.version) {
    const pkg = require('../../package.json');
    console.log(`package-pulse v${pkg.version}`);
    return 0;
  }

  if (options.help || command === 'help') {
    printHelp();
    return 0;
  }

  switch (command) {
    case 'audit':
    case 'licenses':
    case 'outdated':
    case undefined:
    case null:
      return await runAudit(dir, options);

    case 'ui':
    case 'studio':
      runUi(dir, options);
      return 0;

    default:
      console.error(chalk.red(`✖ Unknown command: ${command}`));
      printHelp();
      return 1;
  }
}

module.exports = {
  execute,
  parseArgs
};
