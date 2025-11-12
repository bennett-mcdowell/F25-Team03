import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { driverService } from '../services/apiService';
import '../styles/Dashboard.css';

const DriverDashboard = () => {
  const [enrolledSponsors, setEnrolledSponsors] = useState([]);
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get enrolled sponsors and point balance
      const enrolledData = await driverService.getSponsors();
      setEnrolledSponsors(enrolledData.sponsors || []);
      setPointBalance(enrolledData.total_points || 0);

      // Get all available sponsors
      const availableData = await driverService.getAvailableSponsors();
      setAvailableSponsors(availableData.sponsors || []);
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

  const getSponsorStatus = (sponsor) => {
    if (!sponsor.has_relationship) {
      return { label: 'Available', className: 'available', canApply: true };
    }
    if (sponsor.relationship_status === 'ACTIVE') {
      return { label: 'Active', className: 'active', canApply: false };
    }
    if (sponsor.relationship_status === 'PENDING') {
      return { label: 'Pending', className: 'pending', canApply: false };
    }
    return { label: 'Unknown', className: 'unknown', canApply: false };
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

        {/* My Sponsors */}
        <div className="dashboard-card">
          <h2>My Sponsors</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sponsor Name</th>
                  <th>Description</th>
                  <th>Point Balance</th>
                </tr>
              </thead>
              <tbody>
                {enrolledSponsors.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{textAlign: 'center'}}>No enrolled sponsors yet</td>
                  </tr>
                ) : (
                  enrolledSponsors.map((sponsor) => (
                    <tr key={sponsor.sponsor_id}>
                      <td>{sponsor.sponsor_name}</td>
                      <td>{sponsor.description || 'N/A'}</td>
                      <td>{sponsor.balance || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Sponsors */}
        <div className="dashboard-card">
          <h2>Available Sponsors</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sponsor Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {availableSponsors.map((sponsor) => {
                  const status = getSponsorStatus(sponsor);
                  return (
                    <tr key={sponsor.sponsor_id}>
                      <td>{sponsor.sponsor_name}</td>
                      <td>{sponsor.description || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        {status.canApply && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleApplyToSponsor(sponsor.sponsor_id)}
                          >
                            Apply
                          </button>
                        )}
                        {!status.canApply && status.label === 'Pending' && (
                          <span className="text-muted">Application pending</span>
                        )}
                        {!status.canApply && status.label === 'Active' && (
                          <span className="text-success">Enrolled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DriverDashboard;
