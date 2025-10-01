// src/Frontend/static/js/account.js
(function () {
  function getToken() {
    try {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    } catch {
      return null;
    }
  }

  function humanizeKey(k) {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function renderKVTable(targetId, obj) {
    const el = document.getElementById(targetId);
    if (!el) return;

    if (!obj || Object.keys(obj).length === 0) {
      el.innerHTML = '<p>No data.</p>';
      return;
    }

    const rows = Object.entries(obj).map(([k, v]) => {
      const val = (v === null || v === undefined) ? '' : v;
      return `<tr><th>${humanizeKey(k)}</th><td>${val}</td></tr>`;
    }).join('');

    el.innerHTML = `<table class="table"><tbody>${rows}</tbody></table>`;
  }

  async function loadAccount() {
    const token = getToken();
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      const res = await fetch('/api/account', { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      renderKVTable('account-user', data.user);
      renderKVTable('account-type', data.type);

      const roleTitle = document.getElementById('role-title');
      if (data.role && data.role_name) {
        roleTitle.textContent = `${data.role_name} Details`;
        roleTitle.style.display = '';
        renderKVTable('account-role', data.role);
      } else {
        roleTitle.style.display = 'none';
        document.getElementById('account-role').innerHTML = '<p>No role details.</p>';
      }
    } catch (e) {
      document.getElementById('account-user').innerHTML =
        `<p>Could not load account data: ${e.message}</p>`;
      document.getElementById('account-type').innerHTML = '';
      const roleTitle = document.getElementById('role-title');
      if (roleTitle) roleTitle.style.display = 'none';
      document.getElementById('account-role').innerHTML = '';
    }
  }

  document.addEventListener('DOMContentLoaded', loadAccount);
})();
