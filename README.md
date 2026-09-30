# 💓 PackagePulse

> **Zero-dependency npm package health analyzer, software license compliance scanner, and visual web studio.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Core)-blue)](package.json)
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-brightgreen)](test/)
[![Port](https://img.shields.io/badge/Web%20Studio-Port%203012-79c0ff)](http://localhost:3012)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 💡 Why PackagePulse?

Managing npm dependencies in commercial software comes with hidden risks:
1. ⚖️ **Legal & License Compliance**: Inadvertently importing viral copyleft libraries (GPL, AGPL, SSPL) can legally force proprietary commercial software to open-source its entire codebase.
2. 📦 **Version Drift & Bloat**: Major outdated versions lead to security vulnerabilities, API breaks, and bloated `node_modules` footprints.
3. ⚠️ **Unmaintained / Deprecated Packages**: Unnoticed package deprecation causes broken production builds.

**PackagePulse (`pulse`)** solves this with a zero-dependency CLI auditor and visual dashboard:
- 🛡️ **License Risk Categorization**: Automatically groups open-source licenses into **Permissive** (MIT, Apache, BSD, ISC), **Weak Copyleft** (MPL, LGPL), **Strong Copyleft (Viral GPL/AGPL Risk)**, and **Unlicensed**.
- 📡 **Registry Drift Checker**: Queries `https://registry.npmjs.org` using pure Node.js HTTPS modules to detect major/minor version lag and deprecation alerts without external HTTP clients.
- 📊 **Disk Footprint Inspector**: Measures actual disk size consumed by each dependency inside `node_modules`.
- 🌐 **Visual Web Studio**: Modern dark-mode dashboard running locally on **port 3012**.
- ⚡ **Zero External Dependencies**: Fast, lightweight, pure standard library core.

---

## ⚡ Quick Start

Run instantly with `npx`:

```bash
# Run full health & license audit on current project
npx package-pulse audit

# Inspect another repository directory
npx package-pulse audit ./my-app

# Machine-readable JSON output for CI/CD gates
npx package-pulse audit --json

# Launch Visual Web Studio on localhost:3012
npx package-pulse ui
```

Or install globally:

```bash
npm install -g package-pulse
pulse --help
```

---

## 🖥️ Visual Web Studio (Port 3012)

Launch the visual dashboard locally with:

```bash
pulse ui
# Or with custom port:
pulse ui --port 3012
```

Open your browser to `http://localhost:3012` to access:
- **Project Health Score (0-100%)**: Gauge metric calculating penalties for viral GPL licenses, major version lag, and deprecated packages.
- **Interactive License Filters**: Filter dependencies by **Permissive**, **Copyleft Risk**, or **Unlicensed**.
- **Dependency Inventory**: Search by package name or license string with disk footprint calculations.

---

## 🛠️ CLI Reference

### 1. `pulse audit [dir]` (Default)
Analyzes `package.json`, verifies installed versions and licenses, queries npm registry for updates, and outputs an ASCII report table.

```bash
pulse audit
pulse audit ./projects/web-app
pulse audit --json
```

### 2. `pulse licenses [dir]`
Focuses specifically on legal license compliance, highlighting any copyleft or unlicensed risk items.

```bash
pulse licenses
```

### 3. `pulse outdated [dir]`
Queries npm registry to show installed vs latest published versions.

```bash
pulse outdated
```

---

## 🔬 Architecture

```text
package-pulse/
├── bin/
│   └── package-pulse.js       # Executable CLI entry binary (pulse / package-pulse)
├── src/
│   ├── core/
│   │   ├── license-categorizer.js # License risk tier classification (Permissive vs GPL)
│   │   ├── package-analyzer.js    # package.json & node_modules size analyzer
│   │   ├── registry-client.js     # Native HTTPS npm registry client & semver drift
│   │   ├── health-calculator.js   # Overall Health Score (0-100%) calculator
│   │   └── index.js               # Unified core barrel module
│   ├── cli/
│   │   ├── ansi.js                # Zero-dependency ANSI formatting & ASCII table printer
│   │   └── runner.js              # CLI argument parser & command handler
│   ├── server/
│   │   └── server.js              # HTTP server & REST API on port 3012
│   └── ui/
│       ├── index.html             # Web Studio dark-mode interface
│       ├── style.css              # Devtools aesthetic styling
│       └── app.js                 # Client JS application
└── test/
    ├── license-categorizer.test.js
    ├── package-analyzer.test.js
    ├── registry-client.test.js
    ├── health-calculator.test.js
    └── server.test.js             # REST API test suite
```

---

## 📄 License

MIT © [Mahdyar Monfared](https://github.com/mahdyarmonfared)
