document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('passwordresetForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const newpassword = document.getElementById('newpassword').value;
            const confirmpassword = document.getElementById('confirmpassword').value;
            const errorDiv = document.getElementById('error');

            if (newpassword !== confirmpassword) {
                errorDiv.textContent = 'Passwords do not match.';
                errorDiv.style.display = 'block';
                return;
            } else {
                errorDiv.style.display = 'none';
            }               

            const response = await fetch('/api/passwordreset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, newpassword })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('Password reset successful! You can now log in with your new password.');
                    window.location.href = '/';
                } else {
                    showError(data.message);
                }
            } else {
                showError("An error occurred");
            }
        });
    }
});