import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { sponsorService } from '../services/apiService';
import '../styles/Dashboard.css';

const CommissionDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sponsorService.getCommissionSummary();
      setData(response);
    } catch (err) {
      setError(err.message || 'Failed to load commission data');
      console.error('Commission data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading-message">Loading commission data...</div>
        </div>
      </Layout>
    );
  }

  const summary = data?.summary || {};
  const transactions = data?.transactions || [];
  const purchases = transactions.filter(t => t.type === 'purchase');

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Commission Dashboard</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/sponsor')}>
            ← Back to Dashboard
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <h3>Total Purchases</h3>
              <p className="stat-number">{summary.purchase_count || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Points Redeemed</h3>
              <p className="stat-number">{summary.total_points_redeemed?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>Total Sales</h3>
              <p className="stat-number">{formatCurrency(summary.total_sales_dollars || 0)}</p>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Commission Owed (1%)</h3>
              <p className="stat-number">{formatCurrency(summary.commission_owed || 0)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Active Drivers</h3>
              <p className="stat-number">{summary.active_drivers || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎁</div>
            <div className="stat-content">
              <h3>Points Awarded</h3>
              <p className="stat-number">{summary.total_points_awarded?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        {/* Purchase Details Table */}
        <div className="dashboard-card">
          <h2>Purchase History</h2>
          <p className="text-muted">Point Value: {formatCurrency(summary.point_value || 0.01)} per point</p>
          
          {purchases.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Item ID</th>
                    <th>Points Spent</th>
                    <th>Dollar Value</th>
                    <th>Commission (1%)</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.transaction_id}>
                      <td>{formatDate(purchase.date)}</td>
                      <td>{purchase.driver_name}</td>
                      <td>{purchase.item_id || 'N/A'}</td>
                      <td>{purchase.points.toLocaleString()}</td>
                      <td>{formatCurrency(purchase.dollar_value)}</td>
                      <td>{formatCurrency(purchase.dollar_value * 0.01)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="3"><strong>Total</strong></td>
                    <td>
                      <strong>
                        {purchases.reduce((sum, p) => sum + p.points, 0).toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {formatCurrency(purchases.reduce((sum, p) => sum + p.dollar_value, 0))}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {formatCurrency(summary.commission_owed || 0)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="no-data">No purchases found.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CommissionDashboard;
