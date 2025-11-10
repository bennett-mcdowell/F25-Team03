document.addEventListener('DOMContentLoaded', function () {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const nextBtn = document.getElementById('nextStep');
    const nextBtn2 = document.getElementById('nextStep2');
    const prevBtn = document.getElementById('prevStep');
    const prevBtn2 = document.getElementById('prevStep2');

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            step1.style.display = 'none';
            step2.style.display = 'block';
        });
    }
    if (nextBtn2) {
        nextBtn2.addEventListener('click', function () {
            if (step2 && step3) {
                step2.style.display = 'none';
                step3.style.display = 'block';
            }
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            step2.style.display = 'none';
            step1.style.display = 'block';
        });
    }
    if (prevBtn2) {
        prevBtn2.addEventListener('click', function () {
            if (step3 && step2) {
                step3.style.display = 'none';
                step2.style.display = 'block';
            }
        });
    }
    
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    if (form) {
        form.addEventListener('submit', async function (e) {
            if (step3 && step3.style.display !== 'block') {
                e.preventDefault();
                return;
            }
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

            if (!firstname || !lastname || !email || !ssn || !city || !state || !country || !username || !password) {
                errorDiv.textContent = 'Please fill out all fields.';
                errorDiv.style.display = 'block';
                if (successDiv) successDiv.style.display = 'none';
                return;
            }
            if (!passwordMeetsCriteria(password)) {
                errorDiv.textContent = 'Password does not meet the required criteria.';
                errorDiv.style.display = 'block';
                if (successDiv) successDiv.style.display = 'none';
                return;
            }
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    credentials: 'same-origin',
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
                    if (successDiv) {
                        successDiv.textContent = 'Registration successful! Redirecting to login...';
                        successDiv.style.display = 'block';
                    }
                    alert('Registration successful! You can now log in.');
                    window.location.href = '/login';
                } else {
                    errorDiv.textContent = data.error || 'Registration failed.';
                    errorDiv.style.display = 'block';
                    if (successDiv) successDiv.style.display = 'none';
                }
            } catch (err) {
                errorDiv.textContent = 'An error occurred. Please try again.';
                errorDiv.style.display = 'block';
                if (successDiv) successDiv.style.display = 'none';
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