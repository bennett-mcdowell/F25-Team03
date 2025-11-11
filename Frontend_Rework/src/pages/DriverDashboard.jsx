import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { driverService } from '../services/apiService';
import '../styles/Dashboard.css';

const DriverDashboard = () => {
  const [sponsors, setSponsors] = useState([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [applicationStatus, setApplicationStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // /api/driver/sponsors returns sponsors, total_points, and driver_id
      const sponsorsData = await driverService.getSponsors();
      setSponsors(sponsorsData.sponsors || []);
      setPointBalance(sponsorsData.total_points || 0);
      // TODO: Fetch application status
      setApplicationStatus([]);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToSponsor = async (sponsorId) => {
    try {
      await driverService.applyToSponsor(sponsorId);
      fetchData();
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit application');
      console.error(err);
    }
  };

  const isApplied = (sponsorId) => {
    return applicationStatus.some(
      (app) => app.sponsor_id === sponsorId && app.status === 'pending'
    );
  };

  const isAccepted = (sponsorId) => {
    return applicationStatus.some(
      (app) => app.sponsor_id === sponsorId && app.status === 'approved'
    );
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;

  return (
    <Layout>
      <div className="dashboard">
        <h1>Driver Dashboard</h1>

        {/* Point Balance */}
        <div className="dashboard-card">
          <h2>Point Balance</h2>
          <div className="points-display">
            <span className="points-value">{pointBalance}</span>
            <span className="points-label">points</span>
          </div>
        </div>

        {/* Available Sponsors */}
        <div className="dashboard-card">
          <h2>Available Sponsors</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((sponsor) => (
                  <tr key={sponsor.id}>
                    <td>{sponsor.id}</td>
                    <td>
                      {sponsor.first_name} {sponsor.last_name}
                    </td>
                    <td>{sponsor.company || 'N/A'}</td>
                    <td>{sponsor.email}</td>
                    <td>
                      {isAccepted(sponsor.id) ? (
                        <span className="status-badge status-active">Active</span>
                      ) : isApplied(sponsor.id) ? (
                        <span className="status-badge status-pending">Pending</span>
                      ) : (
                        <span className="status-badge status-available">Available</span>
                      )}
                    </td>
                    <td>
                      {!isAccepted(sponsor.id) && !isApplied(sponsor.id) && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApplyToSponsor(sponsor.id)}
                        >
                          Apply
                        </button>
                      )}
                      {isApplied(sponsor.id) && (
                        <span className="text-muted">Application pending</span>
                      )}
                      {isAccepted(sponsor.id) && (
                        <span className="text-success">Enrolled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application History */}
        <div className="dashboard-card">
          <h2>Application History</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sponsor</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applicationStatus.map((application, index) => (
                  <tr key={index}>
                    <td>{application.sponsor_name}</td>
                    <td>{new Date(application.applied_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${application.status}`}>
                        {application.status}
                      </span>
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

export default DriverDashboard;
