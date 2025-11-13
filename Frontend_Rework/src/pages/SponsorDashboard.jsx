import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BulkUpload from '../components/BulkUpload';
import CreateUserModal from '../components/CreateUserModal';
import { sponsorService, accountService } from '../services/apiService';
import '../styles/Dashboard.css';

const SponsorDashboard = () => {
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateSponsorUserModal, setShowCreateSponsorUserModal] = useState(false);
  const [pointsForm, setPointsForm] = useState({
    driverId: '',
    points: '',
    reason: '',
    action: 'add', // 'add' or 'subtract'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const driversData = await sponsorService.getActiveDrivers();
      console.log('Sponsor data:', driversData);
      setActiveDrivers(driversData.drivers || []);
      const pendingRes = await sponsorService.getPendingDrivers();
      setPendingDrivers(pendingRes.pending_drivers || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePendingDriver = async (driverId) => {
    try {
      await sponsorService.approvePendingDriver(driverId);
      await fetchData();
    } catch (err) {
      alert('Failed to approve application');
      console.error(err);
    }
  };

  const handleRejectPendingDriver = async (driverId) => {
    // Placeholder: implement backend endpoint for rejection if needed
    alert('Reject functionality not yet implemented in backend.');
  };

  const handleManagePoints = async (e) => {
    e.preventDefault();
    try {
      const points = parseInt(pointsForm.points);
      if (pointsForm.action === 'add') {
        await sponsorService.addPoints(
          pointsForm.driverId,
          points,
          pointsForm.reason
        );
      } else {
        await sponsorService.subtractPoints(
          pointsForm.driverId,
          points,
          pointsForm.reason
        );
      }
      setPointsForm({ driverId: '', points: '', reason: '', action: 'add' });
      await fetchData();
      alert(`Successfully ${pointsForm.action === 'add' ? 'added' : 'deducted'} ${points} points`);
    } catch (err) {
      alert(`Failed to ${pointsForm.action} points: ${err.response?.data?.error || err.message}`);
      console.error(err);
    }
  };

  const handleCreateSponsorUser = async (userData) => {
    try {
      setError('');
      setSuccessMessage('');
      
      await sponsorService.createSponsorUser(userData);
      
      setSuccessMessage('Sponsor user created successfully');
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create sponsor user';
      setError(errorMsg);
      console.error('Create sponsor user error:', err);
      throw new Error(errorMsg);
    }
  };

  const handleImpersonate = async (accountId) => {
    const driver = activeDrivers.find(d => d.user_id === accountId);
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'this driver';
    const driverEmail = driver?.email || '';
    
    if (!window.confirm(`Impersonate ${driverName} (${driverEmail})? You will be logged in as them.`)) {
      return;
    }
    
    try {
      await sponsorService.impersonate(accountId);
      // Reload to reflect new impersonated session
      window.location.reload();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to impersonate driver';
      alert(errorMsg);
      console.error('Impersonate error:', err);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Sponsor Dashboard</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Create Sponsor User Section */}
        <div className="dashboard-card">
          <h2>Manage Sponsor Users</h2>
          <p>Create additional sponsor users for your organization (self-managed, no application process required)</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateSponsorUserModal(true)}
          >
            + Create Sponsor User
          </button>
        </div>

        {/* Active Drivers */}
        <div className="dashboard-card">
          <h2>Active Drivers</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDrivers.map((driver) => (
                  <tr key={driver.driver_id}>
                    <td>{driver.driver_id}</td>
                    <td>
                      {driver.first_name} {driver.last_name}
                    </td>
                    <td>{driver.email}</td>
                    <td>{driver.email}</td>
                    <td>{driver.balance || 0}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleImpersonate(driver.user_id)}
                      >
                        Impersonate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Driver Applications */}
        <div className="dashboard-card">
          <h2>Pending Driver Applications</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Active Sponsor Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDrivers.length === 0 ? (
                  <tr><td colSpan={4}>No pending applications.</td></tr>
                ) : (
                  pendingDrivers.map(driver => (
                    <tr key={driver.driver_id}>
                      <td>{driver.first_name}</td>
                      <td>{driver.last_name}</td>
                      <td>{driver.active_sponsor_count}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprovePendingDriver(driver.driver_id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRejectPendingDriver(driver.driver_id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Points Form */}
        <div className="dashboard-card">
          <h2>Manage Points</h2>
          <form onSubmit={handleManagePoints} className="points-form">
            <div className="form-group">
              <label htmlFor="driver">Select Driver</label>
              <select
                id="driver"
                value={pointsForm.driverId}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, driverId: e.target.value })
                }
                required
              >
                <option value="">Choose a driver...</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.driver_id} value={driver.driver_id}>
                    {driver.first_name} {driver.last_name} - Balance: {driver.balance || 0} pts
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Action</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="action"
                    value="add"
                    checked={pointsForm.action === 'add'}
                    onChange={(e) =>
                      setPointsForm({ ...pointsForm, action: e.target.value })
                    }
                  />
                  <span>Add Points</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="action"
                    value="subtract"
                    checked={pointsForm.action === 'subtract'}
                    onChange={(e) =>
                      setPointsForm({ ...pointsForm, action: e.target.value })
                    }
                  />
                  <span>Deduct Points</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="points">Points Amount</label>
              <input
                type="number"
                id="points"
                value={pointsForm.points}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, points: e.target.value })
                }
                required
                min="1"
                placeholder="Enter points amount"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <input
                type="text"
                id="reason"
                value={pointsForm.reason}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, reason: e.target.value })
                }
                required
                placeholder={`Why are you ${pointsForm.action === 'add' ? 'adding' : 'deducting'} points?`}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className={`btn ${pointsForm.action === 'add' ? 'btn-success' : 'btn-danger'}`}
              >
                {pointsForm.action === 'add' ? '+ Add Points' : '− Deduct Points'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setPointsForm({ driverId: '', points: '', reason: '', action: 'add' })}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Bulk Upload Section */}
        <BulkUpload userRole="Sponsor" />
      </div>

      {/* Create Sponsor User Modal */}
      <CreateUserModal
        isOpen={showCreateSponsorUserModal}
        onClose={() => setShowCreateSponsorUserModal(false)}
        onSubmit={handleCreateSponsorUser}
        userType="sponsor"
        allowedTypes={['sponsor']}
      />
    </Layout>
  );
};

export default SponsorDashboard;
