document.addEventListener('DOMContentLoaded', function () {
    // If there's a valid session cookie, redirect to /home automatically.
    (async function checkSignedIn() {
        try {
            const res = await fetch('/api/account', { method: 'GET', credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
            if (res.ok) {
                // If account returns OK, redirect to landing/home automatically
                window.location.href = '/home';
                return;
            }
        } catch (e) {
            // ignore network errors and let login proceed
        }
    })();
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorDiv = document.getElementById('error');
            if (!username || !password) {
                errorDiv.textContent = 'Please enter both username and password.';
                errorDiv.style.display = 'block';
                return;
            }
            errorDiv.style.display = 'none';
            try {
                const remember = document.getElementById('check') ? document.getElementById('check').checked : false;
                const response = await fetch('/api/login', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, remember })
                });
                const data = await response.json();
                if (response.ok) {
                    // Backend sets an httpOnly cookie with the JWT; do not store token in localStorage.
                    // The backend also returns the user's role for UI purposes in `data.role`.
                    // Mark ephemeral session if the user did NOT ask to be remembered.
                    if (!remember) {
                        try {
                            sessionStorage.setItem('ephemeral', '1');
                            // Skip the unload-logout that runs when navigating immediately after login.
                            sessionStorage.setItem('skipUnloadLogout', '1');
                        } catch (e) { /* ignore */ }
                    } else {
                        try { sessionStorage.removeItem('ephemeral'); } catch (e) { /* ignore */ }
                    }
                    // Login succeeded — redirect to app.
                    window.location.href = '/home'; // redirect after login
                } else {
                    errorDiv.textContent = data.error || 'Login failed.';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }
});
