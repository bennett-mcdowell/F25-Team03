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
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (response.ok) {
                    if (data.token) {
                        try {
                            if (window.Auth && typeof window.Auth.saveToken === 'function') {
                                window.Auth.saveToken(data.token);
                            } else {
                                localStorage.setItem('jwt', data.token);
                            }
                        } catch (e) {
                            localStorage.setItem('jwt', data.token);
                        }
                    }
                    alert('Login successful!');
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
