let currentAccount = null;
const userId = window.location.pathname.split('/').pop();

// Load account data on page load
window.addEventListener('DOMContentLoaded', loadAccountData);

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
  document.getElementById('username').value = user.username || '';
  document.getElementById('email').value = user.email || '';
  document.getElementById('first_name').value = user.first_name || '';
  document.getElementById('last_name').value = user.last_name || '';
  document.getElementById('type_id').value = typeId || '';

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
    document.getElementById('total-balance').textContent = 
      `Total Balance: $${(role.total_balance || 0).toFixed(2)}`;
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
    row.innerHTML = `
      <td style="padding: 1rem;">${sponsor.name || '-'}</td>
      <td style="padding: 1rem; color: var(--c-green-500);">$${(sponsor.balance || 0).toFixed(2)}</td>
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
    const typeId = parseInt(document.getElementById('type_id').value);

    const updateData = {
      username: document.getElementById('username').value,
      email: document.getElementById('email').value,
      first_name: document.getElementById('first_name').value,
      last_name: document.getElementById('last_name').value,
      type_id: typeId
    };

    // Add role-specific data
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