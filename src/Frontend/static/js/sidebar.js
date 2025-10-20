// Sidebar helpers: wire logout from the sidebar to the central Auth helper.
document.addEventListener('DOMContentLoaded', function () {
  function doLogout() {
    try {
      if (window.Auth && typeof window.Auth.removeToken === 'function') {
        window.Auth.removeToken();
      } else {
        localStorage.removeItem('jwt');
      }
    } catch (e) {
      try { localStorage.removeItem('jwt'); } catch (_) {}
    }
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
