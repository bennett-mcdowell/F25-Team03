document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value.trim();
    var errorDiv = document.getElementById('error');
    if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password.';
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
        // Placeholder: No actual login logic yet
        alert('Login successful!');
    }
});
