import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { accountService } from '../services/apiService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountService.getAccounts();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (accountId) => {
    try {
      await accountService.impersonate(accountId);
      window.location.reload(); // Reload to update user context
    } catch (err) {
      alert('Failed to impersonate user');
      console.error(err);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await accountService.deleteAccount(accountId);
      fetchAccounts(); // Refresh the list
    } catch (err) {
      alert('Failed to delete account');
      console.error(err);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-card">
          <h2>All Accounts</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.username}</td>
                    <td>{account.email}</td>
                    <td>
                      {account.first_name} {account.last_name}
                    </td>
                    <td>
                      <span className={`role-badge role-${account.role}`}>
                        {account.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${account.status}`}>
                        {account.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleImpersonate(account.id)}
                      >
                        Impersonate
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
