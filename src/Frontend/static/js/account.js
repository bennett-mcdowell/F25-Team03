 (function () {

  // ---- Display policy ----
  const LABELS = {
    first_name: 'First name',
    last_name: 'Last name',
    email: 'Email',
    city: 'City',
    state: 'State',
    country: 'Country',
    type_name: 'Account type',

    // Sponsor
    name: 'Organization',
    description: 'Description',

    // Driver sponsors
    sponsor_name: 'Organization',
    balance: 'Balance',
    status: 'Status',
    since_at: 'Since',
    until_at: 'Until',
  };

  const USER_FIELDS = ['first_name','last_name','email','city','state','country'];         // no ids
  const TYPE_FIELDS = ['type_name'];                                                        // no ids

  // What to show as the main "role" table:
  const ROLE_FIELDS_BY_NAME = {
    'Admin': [],                                                                            // nothing special to show
    'Sponsor': ['name','description'],                                                      // only org + description
    'Driver': [],                                                                           // keep empty – we’ll show sponsors table below
  };

  // Columns for the Driver’s sponsors sub-table:
  const DRIVER_SPONSOR_COLUMNS = ['sponsor_name','balance','status','since_at','until_at'];

  // ===== Helpers =====
  function escapeHTML(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function pick(obj, keys) {
  const out = {};
  keys.forEach(k => { if (obj && obj[k] != null && obj[k] !== '') out[k] = obj[k]; });
  return out;
  }

  function toTableFromObjectWithPolicy(obj, fields) {
    const view = (fields && fields.length) ? pick(obj || {}, fields) : {};
    const entries = Object.entries(view);
    if (entries.length === 0) {
      return '<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>';
    }
    const rows = entries.map(([k,v]) => {
      const label = LABELS[k] || k;
      return `<tr><th>${escapeHTML(label)}</th><td>${escapeHTML(v)}</td></tr>`;
    }).join('');
    return `<div class="responsive-table"><table><tbody>${rows}</tbody></table></div>`;
  }


  function toTableFromArrayProjected(arr, columns) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return '<table><tbody><tr><td>No data</td></tr></tbody></table>';
    }
    const cols = (columns && columns.length)
      ? columns
      : Array.from(arr.reduce((s, r) => { Object.keys(r || {}).forEach(k => s.add(k)); return s; }, new Set()));
    const thead = `<thead><tr>${cols.map(c => `<th>${escapeHTML(LABELS[c] || c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${arr.map(r => `<tr>${cols.map(c => `<td>${escapeHTML(r?.[c] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  }


  function setNodeHtml(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
  }

  function setLoading(id, text = 'Loading…') {
    setNodeHtml(id, `<div class="loading">${escapeHTML(text)}</div>`);
  }

  function setError(id, text = 'Could not load this section.') {
    setNodeHtml(id, `<p class="error-text">${escapeHTML(text)}</p>`);
  }

  function toTableFromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return '<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>';
    }
    const rows = Object.entries(obj).map(([k,v]) => `<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('');
    return `<div class="responsive-table"><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function toTableFromArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return '<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>';
    }
    const cols = Array.from(arr.reduce((s,r) => { Object.keys(r||{}).forEach(k => s.add(k)); return s; }, new Set()));
    const thead = `<thead><tr>${cols.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${arr.map(r => `<tr>${cols.map(c => `<td>${escapeHTML(r?.[c])}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<div class="responsive-table"><table>${thead}${tbody}</table></div>`;
  }

  // === NEW: Authorization header helper ===
  function getAuthHeaders() {
    // Adjust storage key as used in your login flow
    const token = localStorage.getItem('token'); 
    const h = { 'Accept': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  // ===== Renderers =====
  function renderUser(user) {
    setNodeHtml('account-user',
      user ? toTableFromObjectWithPolicy(user, USER_FIELDS)
          : '<p class="error-text">No user profile found.</p>');
  }

  function renderType(typeInfo) {
    const obj = (typeInfo && !Array.isArray(typeInfo) && typeof typeInfo === 'object') ? typeInfo : null;
    setNodeHtml('account-type',
      obj ? toTableFromObjectWithPolicy(obj, TYPE_FIELDS)
          : '<p class="error-text">No account type found.</p>');
  }

function renderRole(roleName, roleData) {
  const title = document.getElementById('role-title');
  if (!title) return;

  const roleCard   = title.closest('.card');
  const driverCard = document.getElementById('driver-sponsors-card');

  // Reset/hide both cards, clear contents
  if (roleCard)  roleCard.style.display = 'none';
  if (driverCard) driverCard.style.display = 'none';
  setNodeHtml('account-role', '');
  setNodeHtml('driver-sponsors', '');
  setNodeHtml('driver-total-balance', ''); // harmless if you removed it in HTML

  if (!roleName) return;

  title.textContent = roleName;

  // Safe object usable in all branches
  const safeObj = (roleData && typeof roleData === 'object' && !Array.isArray(roleData)) ? roleData : {};

  // --- Sponsor: show curated org fields ---
  if (roleName === 'Sponsor') {
    const fields = ['name', 'description'];
    if (roleCard) roleCard.style.display = 'block';
    setNodeHtml('account-role', toTableFromObjectWithPolicy(safeObj, fields));
    return;
  }

  // --- Driver: show sponsors table ---
  if (roleName === 'Driver') {
    if (driverCard) driverCard.style.display = 'block';
    const safeObj = (roleData && typeof roleData === 'object' && !Array.isArray(roleData)) ? roleData : {};
    const sponsors = (safeObj.sponsors || []).map(s => ({
      sponsor_name: s.name,
      balance: s.balance != null ? Number(s.balance).toFixed(2) : '0.00',
      status: s.status,
      since_at: s.since_at,
      until_at: s.until_at
    }));
    setNodeHtml(
      'driver-sponsors',
      toTableFromArrayProjected(sponsors, ['sponsor_name','balance','status','since_at','until_at'])
    );
    return;
  }


}




  // ===== Sponsor tools =====
  function initSponsorBulkTools(roleName) {
    const shell = document.getElementById('sponsor-bulk-tools');
    if (!shell) return;
    if (roleName !== 'Sponsor') { shell.style.display = 'none'; return; }
    shell.style.display = 'block';

    const input = document.getElementById('bulk-file');
    const dryRun = document.getElementById('dry-run');
    const btn = document.getElementById('bulk-upload-btn');
    const out = document.getElementById('bulk-results');

    async function onUpload() {
      out.innerHTML = '<p class="loading">Uploading and processing…</p>';
      if (!input.files || input.files.length === 0) {
        out.innerHTML = '<p class="error-text">Choose a file first.</p>';
        return;
      }
      btn.disabled = true;

      const fd = new FormData();
      fd.append('file', input.files[0]);
      fd.append('dry_run', dryRun.checked ? '1' : '0');

      try {
        const res = await fetch('/api/sponsor/bulk_drivers', {
          method: 'POST',
          // IMPORTANT: Include Authorization header
          headers: getAuthHeaders(),
          body: fd
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { out.innerHTML = '<p class="error-text">Not authenticated. Please <a href="/login">log in</a>.</p>'; return; }
        if (!res.ok) { out.innerHTML = `<p class='error-text'>${escapeHTML(data.error || `Request failed (${res.status})`)}</p>`; return; }

        const lines = [];
        lines.push(`Processed: ${data.processed}  |  Success: ${data.success}  |  Errors: ${data.errors}`);
        if (data.warnings && data.warnings.length) { lines.push('\nWarnings:'); data.warnings.forEach(w => lines.push(` • ${w}`)); }
        if (data.rows && data.rows.length) {
          lines.push('\nDetails:');
          data.rows.forEach(r => {
            const tag = r.ok ? 'ok' : 'err';
            lines.push(` - line ${r.line}: [${r.type}] ${r.email || ''}  ->  <${tag}> ${r.message}`);
          });
        }
        out.innerHTML = `<pre>${escapeHTML(lines.join('\n'))}</pre>`;
      } catch (err) {
        console.error(err);
        out.innerHTML = '<p class="error-text">Network error.</p>';
      } finally {
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', onUpload);
  }

    // === Admin tools ===
  function initAdminBulkTools(roleName) {
    const shell = document.getElementById('admin-bulk-tools');
    if (!shell) return;
    if (roleName !== 'Admin') { shell.style.display = 'none'; return; }
    shell.style.display = 'block';

    const input = document.getElementById('admin-bulk-file');
    const btn = document.getElementById('admin-bulk-upload-btn');
    const dryRun = document.getElementById('admin-dry-run'); // optional toggle, if you want later
    const out = document.getElementById('admin-bulk-results');

    async function onUpload() {
      out.innerHTML = '<p class="loading">Uploading and processing…</p>';
      if (!input.files || input.files.length === 0) {
        out.innerHTML = '<p class="error-text">Choose a file first.</p>';
        return;
      }
      btn.disabled = true;

      const fd = new FormData();
      fd.append('file', input.files[0]);

      try {
        const res = await fetch('/api/admin/bulk_accounts', {
          method: 'POST',
          headers: getAuthHeaders(),     // IMPORTANT: Authorization header
          body: fd
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { out.innerHTML = '<p class="error-text">Not authenticated. Please <a href="/login">log in</a>.</p>'; return; }
        if (!res.ok) { out.innerHTML = `<p class='error-text'>${escapeHTML(data.error || `Request failed (${res.status})`)}</p>`; return; }

        const lines = [];
        lines.push(`Processed: ${data.processed}  |  Success: ${data.success}  |  Errors: ${data.errors}`);
        if (data.warnings && data.warnings.length) { lines.push('\nWarnings:'); data.warnings.forEach(w => lines.push(` • ${w}`)); }
        if (data.rows && data.rows.length) {
          lines.push('\nDetails:');
          data.rows.forEach(r => {
            const tag = r.ok ? 'ok' : 'err';
            const who = (r.email ? ` ${r.email}` : '');
            lines.push(` - line ${r.line}: [${r.type}]${who} -> <${tag}> ${r.message}`);
          });
        }
        out.innerHTML = `<pre>${escapeHTML(lines.join('\n'))}</pre>`;
      } catch (err) {
        console.error(err);
        out.innerHTML = '<p class="error-text">Network error.</p>';
      } finally {
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', onUpload);
  }

  // ===== Fetch account and render =====
  async function fetchAccount() {
    setLoading('account-user');
    setLoading('account-type');
    setLoading('account-role');
    setLoading('driver-sponsors');

    try {
      const res = await fetch('/api/account', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        setError('account-user', 'Not authenticated. <a href="/login">Log in</a>');
        setError('account-type', 'Not authenticated.');
        setError('account-role', 'Not authenticated.');
        setError('driver-sponsors', 'Not authenticated.');
        setNodeHtml('driver-total-balance', '');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError('account-user', body.error || `Request failed (${res.status}).`);
        setError('account-type', body.error || `Request failed (${res.status}).`);
        setError('account-role', body.error || `Request failed (${res.status}).`);
        setError('driver-sponsors', body.error || `Request failed (${res.status}).`);
        setNodeHtml('driver-total-balance', '');
        return;
      }

      const data = await res.json();
      renderUser(data.user || null);
      renderType(data.type || null);
      renderRole(data.role_name || null, data.role || null);
      initSponsorBulkTools(data.role_name || null);
      initAdminBulkTools(data.role_name || null);
    } catch (err) {
      console.error('Network error fetching /api/account:', err);
      setError('account-user', 'Network error.');
      setError('account-type', 'Network error.');
      setError('account-role', 'Network error.');
      setError('driver-sponsors', 'Network error.');
      setNodeHtml('driver-total-balance', '');
    }
  }

  document.addEventListener('DOMContentLoaded', fetchAccount);
})();
