import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { sponsorService, accountService } from '../services/apiService';
import '../styles/Dashboard.css';

const SponsorDashboard = () => {
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointsForm, setPointsForm] = useState({
    driverId: '',
    points: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [driversData, applicationsData] = await Promise.all([
        sponsorService.getActiveDrivers(),
        sponsorService.getPendingApplications(),
      ]);
      setActiveDrivers(driversData.drivers || []);
      setPendingApplications(applicationsData.applications || []);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await sponsorService.approveApplication(applicationId);
      fetchData();
    } catch (err) {
      alert('Failed to approve application');
      console.error(err);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    try {
      await sponsorService.rejectApplication(applicationId);
      fetchData();
    } catch (err) {
      alert('Failed to reject application');
      console.error(err);
    }
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    try {
      await sponsorService.addPoints(
        pointsForm.driverId,
        parseInt(pointsForm.points),
        pointsForm.reason
      );
      setPointsForm({ driverId: '', points: '', reason: '' });
      fetchData();
    } catch (err) {
      alert('Failed to add points');
      console.error(err);
    }
  };

  const handleSubtractPoints = async (driverId, points) => {
    const reason = prompt('Enter reason for subtracting points:');
    if (!reason) return;

    try {
      await sponsorService.subtractPoints(driverId, points, reason);
      fetchData();
    } catch (err) {
      alert('Failed to subtract points');
      console.error(err);
    }
  };

  const handleImpersonate = async (accountId) => {
    try {
      await accountService.impersonate(accountId);
      window.location.reload();
    } catch (err) {
      alert('Failed to impersonate user');
      console.error(err);
    }
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Sponsor Dashboard</h1>

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
                  <tr key={driver.id}>
                    <td>{driver.id}</td>
                    <td>
                      {driver.first_name} {driver.last_name}
                    </td>
                    <td>{driver.username}</td>
                    <td>{driver.email}</td>
                    <td>{driver.points || 0}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleImpersonate(driver.id)}
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

        {/* Pending Applications */}
        <div className="dashboard-card">
          <h2>Pending Applications</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver Name</th>
                  <th>Email</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApplications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.id}</td>
                    <td>
                      {application.first_name} {application.last_name}
                    </td>
                    <td>{application.email}</td>
                    <td>{new Date(application.applied_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleApproveApplication(application.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRejectApplication(application.id)}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Points Form */}
        <div className="dashboard-card">
          <h2>Manage Points</h2>
          <form onSubmit={handleAddPoints} className="points-form">
            <div className="form-group">
              <label htmlFor="driver">Driver</label>
              <select
                id="driver"
                value={pointsForm.driverId}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, driverId: e.target.value })
                }
                required
              >
                <option value="">Select a driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name} ({driver.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="points">Points</label>
              <input
                type="number"
                id="points"
                value={pointsForm.points}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, points: e.target.value })
                }
                required
                min="1"
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
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add Points
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SponsorDashboard;
