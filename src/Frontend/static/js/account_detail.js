let currentAccount = null;
let isAdminView = false;
let currentUserRole = null;
const pathSegments = window.location.pathname.split('/');
const userId = pathSegments[pathSegments.length - 1];

// Load account data on page load
window.addEventListener('DOMContentLoaded', async () => {
  await initializePage();
  await loadAccountData();
});

async function initializePage() {
  try {
    // Fetch current user info to determine if admin
    const token = localStorage.getItem('token');
    const res = await fetch('/api/account', { 
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error('Failed to get account info');
    const data = await res.json();
    currentUserRole = data.role_name;

    // Determine if this is admin view or self-view
    isAdminView = currentUserRole === 'Admin' && parseInt(userId) !== data.user_id;

    // Set up back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
      if (isAdminView) {
        backButton.setAttribute('href', '/admin/accounts');
        backButton.textContent = '← Back to Accounts';
      } else {
        backButton.setAttribute('href', '/account');
        backButton.textContent = '← Back to Account';
      }
    }

    // Set page subtitle
    const subtitle = document.getElementById('page-subtitle');
    if (subtitle) {
      subtitle.textContent = isAdminView ? 'Admin Panel' : 'My Account';
    }

  } catch (err) {
    console.error('Could not initialize page:', err);
  }
}

async function loadAccountData() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/admin/account/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load account data');
    }

    const data = await response.json();
    currentAccount = data;
    isAdminView = data.is_admin_view || false;
    populateForm(data);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
  } catch (error) {
    console.error('Error loading account:', error);
    showAlert('Failed to load account data: ' + error.message, 'error');
    document.getElementById('loading').style.display = 'none';
  }
}

function populateForm(data) {
  const user = data.user;
  const role = data.role;
  const typeId = user.type_id;

  // Populate user fields
  document.getElementById('user_id').value = user.user_id || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('first_name').value = user.first_name || '';
  document.getElementById('last_name').value = user.last_name || '';
  document.getElementById('type_id').value = data.role_name || '';

  // Show role-specific section
  document.getElementById('role-section').style.display = 'block';
  document.getElementById('role-title').textContent = `${data.role_name} Details`;

  // Hide all role sections first
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('sponsor-section').style.display = 'none';
  document.getElementById('driver-section').style.display = 'none';

  // Show appropriate role section
  if (typeId == 1 && role) {
    // Admin
    document.getElementById('admin-section').style.display = 'block';
    document.getElementById('admin_permissions').value = role.admin_permissions || '';
  } else if (typeId == 2 && role) {
    // Sponsor
    document.getElementById('sponsor-section').style.display = 'block';
    document.getElementById('sponsor_name').value = role.name || '';
    document.getElementById('sponsor_description').value = role.description || '';
  } else if (typeId == 3 && role) {
    // Driver
    document.getElementById('driver-section').style.display = 'block';
    populateSponsorsTable(role.sponsors || []);
    const totalBalance = parseFloat(role.total_balance) || 0;
    document.getElementById('total-balance').textContent = 
      `Total Balance: ${totalBalance.toFixed(2)}`;
  }
}

function populateSponsorsTable(sponsors) {
  const tbody = document.getElementById('sponsors-tbody');
  tbody.innerHTML = '';

  if (sponsors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--c-text-tertiary);">No sponsors associated</td></tr>';
    return;
  }

  sponsors.forEach(sponsor => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--c-gray-600)';
    const balance = parseFloat(sponsor.balance) || 0;
    row.innerHTML = `
      <td style="padding: 1rem;">${sponsor.name || '-'}</td>
      <td style="padding: 1rem; color: var(--c-green-500);">${balance.toFixed(2)}</td>
      <td style="padding: 1rem;">${sponsor.status || '-'}</td>
      <td style="padding: 1rem; color: var(--c-text-tertiary);">${sponsor.since_at ? new Date(sponsor.since_at).toLocaleDateString() : '-'}</td>
      <td style="padding: 1rem; color: var(--c-text-tertiary);">${sponsor.until_at ? new Date(sponsor.until_at).toLocaleDateString() : '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

async function saveChanges() {
  try {
    const token = localStorage.getItem('token');

    const updateData = {
      email: document.getElementById('email').value,
      first_name: document.getElementById('first_name').value,
      last_name: document.getElementById('last_name').value
    };

    // Add role-specific data
    const typeId = currentAccount.user.type_id;
    if (typeId == 1) {
      updateData.role_data = {
        admin_permissions: document.getElementById('admin_permissions').value
      };
    } else if (typeId == 2) {
      updateData.role_data = {
        name: document.getElementById('sponsor_name').value,
        description: document.getElementById('sponsor_description').value
      };
    }

    const response = await fetch(`/api/admin/account/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update account');
    }

    showAlert('Account updated successfully!', 'success');
    
    // Reload data to show updated values
    setTimeout(() => loadAccountData(), 1500);
  } catch (error) {
    console.error('Error saving changes:', error);
    showAlert('Failed to save changes: ' + error.message, 'error');
  }
}

async function resetPassword() {
  if (!confirm('Are you sure you want to reset this user\'s password?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/admin/account/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }

    const data = await response.json();
    showAlert(`Password reset successfully! New password: ${data.new_password}`, 'success');
  } catch (error) {
    console.error('Error resetting password:', error);
    showAlert('Failed to reset password: ' + error.message, 'error');
  }
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = 'alert';
  alert.style.display = 'block';
  alert.style.padding = '1rem';
  alert.style.marginBottom = '1.5rem';
  alert.style.borderRadius = '8px';
  
  if (type === 'success') {
    alert.style.backgroundColor = 'var(--c-green-500)';
    alert.style.color = 'var(--c-gray-900)';
  } else {
    alert.style.backgroundColor = 'var(--c-gray-700)';
    alert.style.color = 'var(--c-text-primary)';
    alert.style.border = '1px solid var(--c-gray-600)';
  }

  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}