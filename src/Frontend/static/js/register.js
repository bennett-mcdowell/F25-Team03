document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const firstname = document.getElementById('firstname').value.trim();
            const lastname = document.getElementById('lastname').value.trim();
            const email = document.getElementById('email').value.trim();
            const ssn = document.getElementById('ssn').value.trim();
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            const country = document.getElementById('country').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorDiv = document.getElementById('error');

            if (!firstname || !lastname || !email || !ssn || !city || !state || !country || !username || !password) {
                errorDiv.textContent = 'Please fill out all fields.';
                errorDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstname,
                        lastname,
                        email,
                        ssn,
                        city,
                        state,
                        country,
                        username,
                        password
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    errorDiv.style.display = 'none';
                    alert('Registration successful! You can now log in.');
                    window.location.href = '/login';
                } else {
                    errorDiv.textContent = data.error || 'Registration failed.';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    }
});