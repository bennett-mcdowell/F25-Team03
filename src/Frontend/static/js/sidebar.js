// Sidebar helpers: wire logout from the sidebar to the central Auth helper.
document.addEventListener('DOMContentLoaded', function () {
  async function doLogout() {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
    try { localStorage.removeItem('jwt'); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem('ephemeral'); } catch (e) { /* ignore */ }
    window.location.href = '/login';
  }

  const sidebarLogout = document.getElementById('logoutBtnSidebar');
  if (sidebarLogout) {
    sidebarLogout.addEventListener('click', function (ev) {
      ev.preventDefault();
      doLogout();
    });
  }

  ['logoutBtn', 'logout'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        doLogout();
      });
    }
  });

  try {
    document.querySelectorAll('a[href="/logout"], [data-logout]').forEach(function (node) {
      node.addEventListener('click', function (ev) {
        ev.preventDefault();
        doLogout();
      });
    });
  } catch (e) { }
});

// Attempt to logout ephemeral sessions when the window/tab is closed.
window.addEventListener('beforeunload', function () {
  try {
    // If a 'skipUnloadLogout' flag is present (set immediately after login), skip one unload.
    if (sessionStorage.getItem('skipUnloadLogout')) {
      try { sessionStorage.removeItem('skipUnloadLogout'); } catch (e) { /* ignore */ }
      return;
    }
    if (sessionStorage.getItem('ephemeral')) {
      // Use sendBeacon for a best-effort background logout; some browsers may not send it reliably.
      const url = '/api/logout';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        // Fallback: synchronous XHR (deprecated) — keep minimal.
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, false);
        xhr.send(null);
      }
    }
  } catch (e) { /* ignore errors during unload */ }
});
