/**
 * PackagePulse Web Studio Client App
 */

let state = {
  data: null,
  searchQuery: '',
  selectedTier: 'all',
  selectedType: 'all'
};

// DOM Elements
const healthScoreEl = document.getElementById('healthScore');
const projectSubEl = document.getElementById('projectSub');

const statTotalEl = document.getElementById('statTotal');
const statPermissiveEl = document.getElementById('statPermissive');
const statCopyleftEl = document.getElementById('statCopyleft');
const statOutdatedEl = document.getElementById('statOutdated');

const searchInput = document.getElementById('searchInput');
const tierSelect = document.getElementById('tierSelect');
const typeSelect = document.getElementById('typeSelect');
const btnRefresh = document.getElementById('btnRefresh');

const depsTableBody = document.getElementById('depsTableBody');

async function loadData() {
  try {
    depsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Analyzing project dependencies...</td></tr>`;

    const res = await fetch('/api/analysis');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.data = data;

    renderUI();
  } catch (err) {
    depsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color: var(--color-danger);">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderUI() {
  if (!state.data) return;
  const { project, health, dependencies } = state.data;

  // Header Subtitle
  projectSubEl.textContent = `${project.projectName} v${project.projectVersion} — ${project.description || 'Package Analysis'}`;

  // Health Score
  healthScoreEl.textContent = `${health.healthScore}%`;
  healthScoreEl.style.color = health.healthScore >= 85 ? 'var(--color-success)' : health.healthScore >= 65 ? 'var(--color-warning)' : 'var(--color-danger)';

  // Stats
  statTotalEl.textContent = project.totalDependencies || 0;
  statPermissiveEl.textContent = health.compliance.permissiveCount || 0;
  statCopyleftEl.textContent = health.compliance.strongCopyleftCount || 0;
  statOutdatedEl.textContent = health.outdatedSummary.majorOutdatedCount || 0;

  // Table
  renderTableRows(dependencies);
}

function renderTableRows(dependencies) {
  const filtered = dependencies.filter(dep => {
    // Search
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchName = dep.name.toLowerCase().includes(q);
      const matchLicense = dep.license && dep.license.toLowerCase().includes(q);
      if (!matchName && !matchLicense) return false;
    }

    // Tier Filter
    if (state.selectedTier === 'permissive' && dep.licenseCategory.tier !== 'permissive') return false;
    if (state.selectedTier === 'copyleft' && dep.licenseCategory.tier !== 'strong_copyleft' && dep.licenseCategory.tier !== 'weak_copyleft') return false;
    if (state.selectedTier === 'unknown' && dep.licenseCategory.tier !== 'unknown') return false;

    // Type Filter
    if (state.selectedType === 'prod' && dep.type !== 'prod') return false;
    if (state.selectedType === 'dev' && dep.type !== 'dev') return false;

    return true;
  });

  if (filtered.length === 0) {
    depsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">No dependencies matching criteria.</td></tr>`;
    return;
  }

  depsTableBody.innerHTML = filtered.map(dep => {
    const tier = dep.licenseCategory.tier;
    const badgeClass = `license-badge ${tier}`;
    const badgeText = dep.licenseCategory.name || dep.license;

    let statusText = `<span style="color: var(--color-success);">✔ Safe</span>`;
    if (tier === 'strong_copyleft') {
      statusText = `<span style="color: var(--color-danger); font-weight:700;">✖ Copyleft Risk</span>`;
    } else if (dep.deprecated) {
      statusText = `<span style="color: var(--color-danger);">✖ Deprecated</span>`;
    } else if (dep.drift === 'major') {
      statusText = `<span style="color: var(--color-warning); font-weight:700;">⚠ Major Drift</span>`;
    }

    const latestVerDisplay = dep.latestVersion
      ? (dep.drift === 'major' ? `<span class="ver-tag drift-major">${escapeHtml(dep.latestVersion)} ⬆</span>` : escapeHtml(dep.latestVersion))
      : '<span style="color: var(--text-muted);">n/a</span>';

    return `
      <tr>
        <td><span class="pkg-name">${escapeHtml(dep.name)}</span></td>
        <td><span class="type-pill">${escapeHtml(dep.type)}</span></td>
        <td><span class="${badgeClass}">${escapeHtml(badgeText)}</span></td>
        <td><span class="ver-tag">${escapeHtml(dep.installedVersion || 'n/a')}</span></td>
        <td>${latestVerDisplay}</td>
        <td>${formatBytes(dep.sizeBytes)}</td>
        <td>${statusText}</td>
      </tr>
    `;
  }).join('');
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  if (state.data) renderTableRows(state.data.dependencies);
});

tierSelect.addEventListener('change', (e) => {
  state.selectedTier = e.target.value;
  if (state.data) renderTableRows(state.data.dependencies);
});

typeSelect.addEventListener('change', (e) => {
  state.selectedType = e.target.value;
  if (state.data) renderTableRows(state.data.dependencies);
});

btnRefresh.addEventListener('click', loadData);

// Initial Load
loadData();
