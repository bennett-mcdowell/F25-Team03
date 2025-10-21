document.addEventListener('DOMContentLoaded', function () {
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

                // Submit login form to your existing endpoint that sets JWT cookie
                const response = await fetch('/api/login', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, remember })
                });

                if (!response.ok) {
                    const data = await response.json();
                    errorDiv.textContent = data.error || 'Login failed.';
                    errorDiv.style.display = 'block';
                    return;
                }

                // Now fetch /api/account to get role_name
                const accountRes = await fetch('/api/account', { method: 'GET', credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
                if (!accountRes.ok) throw new Error('Failed to fetch account info');

                const accountData = await accountRes.json();
                const role = accountData.role_name; // role_name comes from your backend
                if (role === 'Admin') {
                    window.location.href = '/admin/home';
                } else if (role === 'Sponsor') {
                    window.location.href = '/sponsor/home';
                } else if (role === 'Driver') {
                    window.location.href = '/driver/home';
                } else {
                    window.location.href = '/home';
                }

            } catch (err) {
                console.error(err);
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }
});
