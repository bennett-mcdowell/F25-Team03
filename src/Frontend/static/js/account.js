// static/js/account.js
(function () {
  // ---- Config ----
  const TOKEN_STORAGE_KEY = "auth_token"; // change if your login saves under a different key
  const LOGIN_PATH = "/login";

  // ---- Helpers ----
  function getToken() {
    // Swap for sessionStorage or cookie read if that's your setup
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  function redirectToLogin() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (_) {}
    window.location.href = LOGIN_PATH;
  }

  function setLoading(el, text = "Loading…") {
    if (!el) return;
    el.innerHTML = `<div class="loading">${escapeHTML(text)}</div>`;
  }

  function setError(el, text = "Could not load this section.") {
    if (!el) return;
    el.innerHTML = `<p class="error-text">${escapeHTML(text)}</p>`;
  }

  function escapeHTML(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Build a simple two-column table from a flat object
  function objectToTable(obj) {
    if (!obj || typeof obj !== "object") {
      return `<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>`;
    }
    const rows = Object.entries(obj).map(([k, v]) => {
      return `<tr>
        <th>${escapeHTML(k)}</th>
        <td>${escapeHTML(v)}</td>
      </tr>`;
    }).join("");
    return `
      <div class="responsive-table">
        <table>
          <thead><tr><th>Field</th><th>Value</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // Build a table from array-of-objects (fallback if backend ever returns arrays)
  function arrayToTable(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return `<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>`;
    }
    const cols = Array.from(
      arr.reduce((set, row) => {
        Object.keys(row || {}).forEach((k) => set.add(k));
        return set;
      }, new Set())
    );

    const thead = `<thead><tr>${cols.map(c => `<th>${escapeHTML(c)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${arr.map(row => {
      return `<tr>${cols.map(c => `<td>${escapeHTML(row?.[c])}</td>`).join("")}</tr>`;
    }).join("")}</tbody>`;

    return `<div class="responsive-table"><table>${thead}${tbody}</table></div>`;
  }

  // Renderers for the three cards
  function renderUser(user) {
    const mount = document.getElementById("account-user");
    if (!mount) return;
    if (!user) {
      setError(mount, "No user profile found.");
      return;
    }
    mount.innerHTML = objectToTable(user);
  }

  function renderType(typeInfo) {
    const mount = document.getElementById("account-type");
    if (!mount) return;
    if (!typeInfo) {
      setError(mount, "No account type found.");
      return;
    }
    // If backend returns a flat object
    if (typeof typeInfo === "object" && !Array.isArray(typeInfo)) {
      mount.innerHTML = objectToTable(typeInfo);
    } else {
      // fallback for arrays
      mount.innerHTML = arrayToTable(typeInfo);
    }
  }

  function renderRole(roleName, roleData) {
    const title = document.getElementById("role-title");
    const mount = document.getElementById("account-role");
    if (!title || !mount) return;

    if (!roleName) {
      // Hide role section if no role
      title.style.display = "none";
      mount.innerHTML = `<div class="responsive-table"><table><tbody><tr><td>No role data.</td></tr></tbody></table></div>`;
      return;
    }

    // Title
    title.textContent = roleName;
    title.style.display = "block";

    if (!roleData) {
      setError(mount, `No ${roleName} details found.`);
      return;
    }

    if (typeof roleData === "object" && !Array.isArray(roleData)) {
      mount.innerHTML = objectToTable(roleData);
    } else {
      mount.innerHTML = arrayToTable(roleData);
    }
  }

  // ---- Fetch & flow ----
  async function fetchAccount() {
    const token = getToken();
    const userEl = document.getElementById("account-user");
    const typeEl = document.getElementById("account-type");
    const roleEl = document.getElementById("account-role");

    // Initial loading states
    setLoading(userEl);
    setLoading(typeEl);
    setLoading(roleEl);

    if (!token) {
      redirectToLogin();
      return;
    }

    let res;
    try {
      res = await fetch("/api/account", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
    } catch (e) {
      setError(userEl, "Network error.");
      setError(typeEl, "Network error.");
      setError(roleEl, "Network error.");
      console.error("Network error fetching /api/account:", e);
      return;
    }

    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(userEl, body.error || `Request failed (${res.status}).`);
      setError(typeEl, body.error || `Request failed (${res.status}).`);
      setError(roleEl, body.error || `Request failed (${res.status}).`);
      return;
    }

    const data = await res.json();

    // Expecting: { user: {}, type: {}, role_name: "Admin|Sponsor|Driver", role: {} }
    renderUser(data.user || null);
    renderType(data.type || null);
    renderRole(data.role_name || null, data.role || null);
  }

  // ---- init ----
  document.addEventListener("DOMContentLoaded", fetchAccount);
})();
