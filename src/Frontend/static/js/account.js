 (function () {
  // Lightweight helpers
  function escapeHTML(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
    if (!obj || typeof obj !== 'object') return '<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>';
    const rows = Object.entries(obj).map(([k,v]) => `<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('');
    return `<div class="responsive-table"><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function toTableFromArray(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return '<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>';
    const cols = Array.from(arr.reduce((s,r) => { Object.keys(r||{}).forEach(k => s.add(k)); return s; }, new Set()));
    const thead = `<thead><tr>${cols.map(c => `<th>${escapeHTML(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${arr.map(r => `<tr>${cols.map(c => `<td>${escapeHTML(r?.[c])}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<div class="responsive-table"><table>${thead}${tbody}</table></div>`;
  }

  // Renderers
  function renderUser(user) { setNodeHtml('account-user', user ? toTableFromObject(user) : '<p class="error-text">No user profile found.</p>'); }
  function renderType(typeInfo) { setNodeHtml('account-type', typeInfo ? (typeof typeInfo === 'object' && !Array.isArray(typeInfo) ? toTableFromObject(typeInfo) : toTableFromArray(typeInfo)) : '<p class="error-text">No account type found.</p>'); }
  function renderRole(roleName, roleData) {
    const title = document.getElementById('role-title');
    if (!title) return;
    if (!roleName) {
      title.style.display = 'none';
      setNodeHtml('account-role', '<div class="responsive-table"><table><tbody><tr><td>No role data.</td></tr></tbody></table></div>');
      return;
    }
    title.textContent = roleName;
    title.style.display = 'block';
    setNodeHtml('account-role', roleData ? (typeof roleData === 'object' && !Array.isArray(roleData) ? toTableFromObject(roleData) : toTableFromArray(roleData)) : `<p class="error-text">No ${escapeHTML(roleName)} details found.</p>`);
  }

  // Sponsor tools
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
        const res = await fetch('/api/sponsor/bulk_drivers', { method: 'POST', credentials: 'same-origin', body: fd });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { out.innerHTML = '<p class="error-text">Not authenticated. Please <a href="/login">log in</a>.</p>'; return; }
        if (!res.ok) { out.innerHTML = `<p class='error-text'>${escapeHTML(data.error || `Request failed (${res.status})`)}</p>`; return; }

        const lines = [];
        lines.push(`Processed: ${data.processed}  |  Success: ${data.success}  |  Errors: ${data.errors}`);
        if (data.warnings && data.warnings.length) { lines.push('\nWarnings:'); data.warnings.forEach(w => lines.push(` • ${w}`)); }
        if (data.rows && data.rows.length) { lines.push('\nDetails:'); data.rows.forEach(r => { const tag = r.ok ? 'ok' : 'err'; lines.push(` - line ${r.line}: [${r.type}] ${r.email || ''}  ->  <${tag}> ${r.message}`); }); }
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

  // Fetch account and render
  async function fetchAccount() {
    setLoading('account-user');
    setLoading('account-type');
    setLoading('account-role');

    try {
      const res = await fetch('/api/account', { method: 'GET', credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
      if (res.status === 401) {
        setError('account-user', 'Not authenticated. <a href="/login">Log in</a>');
        setError('account-type', 'Not authenticated.');
        setError('account-role', 'Not authenticated.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError('account-user', body.error || `Request failed (${res.status}).`);
        setError('account-type', body.error || `Request failed (${res.status}).`);
        setError('account-role', body.error || `Request failed (${res.status}).`);
        return;
      }

      const data = await res.json();
      renderUser(data.user || null);
      renderType(data.type || null);
      renderRole(data.role_name || null, data.role || null);
      initSponsorBulkTools(data.role_name || null);
    } catch (err) {
      console.error('Network error fetching /api/account:', err);
      setError('account-user', 'Network error.');
      setError('account-type', 'Network error.');
      setError('account-role', 'Network error.');
    }
  }

  document.addEventListener('DOMContentLoaded', fetchAccount);
})();
