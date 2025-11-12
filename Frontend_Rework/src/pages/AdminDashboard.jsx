import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import EditUserModal from '../components/EditUserModal';
import { accountService } from '../services/apiService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setError('');
      const data = await accountService.getAccounts();
      console.log('Admin accounts data:', data);
      setAccounts(data.accounts || []);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (accountId) => {
    const account = accounts.find(acc => acc.user.user_id === accountId);
    const accountEmail = account?.user?.email || 'this user';
    const accountRole = account?.role_name || 'user';
    
    if (!window.confirm(`Impersonate ${accountEmail} (${accountRole})? You will be logged in as them.`)) {
      return;
    }
    
    try {
      setError('');
      await accountService.impersonate(accountId);
      // Reload to reflect new impersonated session
      window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to impersonate user';
      setError(errorMsg);
      console.error('Impersonate error:', err);
    }
  };

  const handleEditUser = (account) => {
    setEditingUser(account);
  };

  const handleSaveUser = async (userId, formData) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await accountService.updateAccount(userId, formData);
      
      setSuccessMessage('User updated successfully');
      
      // Refresh accounts list
      await fetchAccounts();
      
      // Close modal
      setEditingUser(null);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update user';
      setError(errorMsg);
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleDeleteAccount = async (accountId) => {
    // Find account details for confirmation message
    const account = accounts.find(acc => acc.user.user_id === accountId);
    const accountEmail = account?.user?.email || 'this account';
    
    if (!window.confirm(`Are you sure you want to delete ${accountEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      
      await accountService.deleteAccount(accountId);
      
      setSuccessMessage(`Account ${accountEmail} deleted successfully`);
      
      // Remove account from local state for immediate UI update
      setAccounts(prevAccounts => 
        prevAccounts.filter(acc => acc.user.user_id !== accountId)
      );
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete account';
      setError(errorMsg);
      console.error('Delete error:', err);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Admin Dashboard</h1>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="dashboard-card">
          <h2>All Accounts</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.user.user_id}>
                    <td>{account.user.user_id}</td>
                    <td>{account.user.email}</td>
                    <td>
                      {account.user.first_name} {account.user.last_name}
                    </td>
                    <td>
                      <span className={`role-badge role-${account.role_name}`}>
                        {account.role_name}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${account.user.status || 'active'}`}>
                        {account.user.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditUser(account)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleImpersonate(account.user.user_id)}
                        >
                          Impersonate
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteAccount(account.user.user_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </Layout>
  );
};

export default AdminDashboard;
