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
            } else if (!passwordMeetsCriteria(newpassword)) {
                errorDiv.textContent = 'Password does not meet criteria.';
                errorDiv.style.display = 'block';
                return;
            } else {
                errorDiv.style.display = 'none';
            }               

            const response = await fetch('/api/passwordreset', {
                method: 'POST',
                credentials: 'same-origin',
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

function passwordMeetsCriteria(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}