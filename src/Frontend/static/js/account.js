(function () {
  const TOKEN_STORAGE_KEY = "jwt";    // <<< must match account.html check
  const LOGIN_PATH = "/login";

  function setLoading(el, text = "Loading…") {
    if (el) el.innerHTML = `<div class="loading">${escapeHTML(text)}</div>`;
  }
  function setError(el, text = "Could not load this section.") {
    if (el) el.innerHTML = `<p class="error-text">${escapeHTML(text)}</p>`;
  }
  function escapeHTML(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function objectToTable(obj) {
    if (!obj || typeof obj !== "object") {
      return `<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>`;
    }
    const rows = Object.entries(obj).map(([k, v]) =>
      `<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`
    ).join("");
    return `<div class="responsive-table"><table>
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
  }
  function arrayToTable(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return `<div class="responsive-table"><table><tbody><tr><td>No data</td></tr></tbody></table></div>`;
    }
    const cols = Array.from(arr.reduce((s, r) => { Object.keys(r||{}).forEach(k=>s.add(k)); return s;}, new Set()));
    const thead = `<thead><tr>${cols.map(c=>`<th>${escapeHTML(c)}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${arr.map(r => `<tr>${cols.map(c => `<td>${escapeHTML(r?.[c])}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<div class="responsive-table"><table>${thead}${tbody}</table></div>`;
  }
  function renderUser(user) {
    const el = document.getElementById("account-user");
    if (!el) return;
    if (!user) return setError(el, "No user profile found.");
    el.innerHTML = objectToTable(user);
  }
  function renderType(typeInfo) {
    const el = document.getElementById("account-type");
    if (!el) return;
    if (!typeInfo) return setError(el, "No account type found.");
    el.innerHTML = (typeof typeInfo === "object" && !Array.isArray(typeInfo))
      ? objectToTable(typeInfo) : arrayToTable(typeInfo);
  }
  function renderRole(roleName, roleData) {
    const title = document.getElementById("role-title");
    const el = document.getElementById("account-role");
    if (!title || !el) return;

    if (!roleName) {
      title.style.display = "none";
      el.innerHTML = `<div class="responsive-table"><table><tbody><tr><td>No role data.</td></tr></tbody></table></div>`;
      return;
    }
    title.textContent = roleName;
    title.style.display = "block";

    if (!roleData) return setError(el, `No ${roleName} details found.`);
    el.innerHTML = (typeof roleData === "object" && !Array.isArray(roleData))
      ? objectToTable(roleData) : arrayToTable(roleData);
  }

// Sponsor-only: wire up bulk driver upload UI
function initSponsorBulkTools(roleName) {
  const shell = document.getElementById("sponsor-bulk-tools");
  if (!shell) return;
  if (roleName !== "Sponsor") {
    shell.style.display = "none";
    return;
  }
  shell.style.display = "block";

  const input = document.getElementById("bulk-file");
  const dryRun = document.getElementById("dry-run");
  const btn = document.getElementById("bulk-upload-btn");
  const out = document.getElementById("bulk-results");

  const token = localStorage.getItem("jwt");
  btn.onclick = async () => {
    out.innerHTML = "<p class='loading'>Uploading and processing…</p>";
    if (!input.files || input.files.length === 0) {
      out.innerHTML = "<p class='error-text'>Choose a file first.</p>";
      return;
    }
    const fd = new FormData();
    fd.append("file", input.files[0]);
    fd.append("dry_run", dryRun.checked ? "1" : "0");

    try {
      const res = await fetch("/api/sponsor/bulk_drivers", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: fd
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        out.innerHTML = `<p class='error-text'>${data.error || `Request failed (${res.status})`}</p>`;
        return;
      }

      // Pretty print results
      const lines = [];
      lines.push(`Processed: ${data.processed}  |  Success: ${data.success}  |  Errors: ${data.errors}`);
      if (data.warnings && data.warnings.length) {
        lines.push("\nWarnings:");
        data.warnings.forEach(w => lines.push(` • ${w}`));
      }
      if (data.rows && data.rows.length) {
        lines.push("\nDetails:");
        data.rows.forEach(r => {
          const tag = r.ok ? "ok" : "err";
          lines.push(` - line ${r.line}: [${r.type}] ${r.email || ""}  ->  <${tag}> ${r.message}`);
        });
      }
      out.innerHTML = `<pre>${lines.join("\n")}</pre>`;
    } catch (e) {
      console.error(e);
      out.innerHTML = "<p class='error-text'>Network error.</p>";
      }
    };
  }

  async function fetchAccount() {
    const userEl = document.getElementById("account-user");
    const typeEl = document.getElementById("account-type");
    const roleEl = document.getElementById("account-role");

    setLoading(userEl);
    setLoading(typeEl);
    setLoading(roleEl);

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      window.location.href = LOGIN_PATH;
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
      window.location.href = LOGIN_PATH;
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
    renderUser(data.user || null);
    renderType(data.type || null);
    renderRole(data.role_name || null, data.role || null);
    initSponsorBulkTools(data.role_name || null);
  }

  document.addEventListener("DOMContentLoaded", fetchAccount);
})();
