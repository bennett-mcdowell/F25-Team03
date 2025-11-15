import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import { sponsorService } from '../services/apiService';
import '../styles/Dashboard.css';

const SponsorReports = () => {
  const [activeReport, setActiveReport] = useState('driver_points');
  const [reportData, setReportData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      generateReport();
    }
  }, [filters, activeReport]);

  const fetchDrivers = async () => {
    try {
      const data = await sponsorService.getActiveDrivers();
      setDrivers(data.drivers || []);
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with actual API calls when backend is ready
      // const data = await reportService.generateReport(activeReport, filters);
      
      // Mock data for now
      const mockData = generateMockData(activeReport, filters);
      setReportData(mockData);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (reportType, filters) => {
    if (reportType === 'driver_points') {
      return [
        {
          driver_name: 'Danny Driver',
          total_points: 150.00,
          point_change: '+50',
          date: '2025-11-10',
          sponsor: 'Speedy Tires',
          reason: 'Monthly bonus',
        },
        {
          driver_name: 'Danny Driver',
          total_points: 100.00,
          point_change: '-25',
          date: '2025-11-08',
          sponsor: 'Speedy Tires',
          reason: 'Purchase order #1234',
        },
        {
          driver_name: 'Dina Driver',
          total_points: 200.00,
          point_change: '+100',
          date: '2025-11-05',
          sponsor: 'Speedy Tires',
          reason: 'Performance reward',
        },
      ];
    } else if (reportType === 'sponsor_audit') {
      return [
        {
          date: '2025-11-10 14:23:15',
          category: 'Point Change',
          user: 'Sam Sponsor',
          action: 'Added 50 points to Danny Driver',
          details: 'Reason: Monthly bonus',
        },
        {
          date: '2025-11-10 10:15:22',
          category: 'Driver Status',
          user: 'Sam Sponsor',
          action: 'Approved driver application',
          details: 'Driver: Dina Driver',
        },
        {
          date: '2025-11-09 16:45:30',
          category: 'Point Change',
          user: 'Sam Sponsor',
          action: 'Deducted 25 points from Danny Driver',
          details: 'Reason: Purchase order #1234',
        },
      ];
    }
    return [];
  };

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const columns = getColumnsForReport(activeReport);
    const headers = columns.map(col => col.label).join(',');
    const rows = reportData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getColumnsForReport = (reportType) => {
    if (reportType === 'driver_points') {
      return [
        { key: 'driver_name', label: 'Driver Name' },
        { key: 'total_points', label: 'Total Points', render: (val) => `${val.toFixed(2)}` },
        { key: 'point_change', label: 'Point Change' },
        { key: 'date', label: 'Date' },
        { key: 'sponsor', label: 'Sponsor' },
        { key: 'reason', label: 'Reason' },
      ];
    } else if (reportType === 'sponsor_audit') {
      return [
        { key: 'date', label: 'Date/Time' },
        { key: 'category', label: 'Category' },
        { key: 'user', label: 'User' },
        { key: 'action', label: 'Action' },
        { key: 'details', label: 'Details' },
      ];
    }
    return [];
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Reports</h1>
          <p>Generate and download reports for your organization</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Report Type Selection */}
        <div className="report-selector">
          <button
            className={`report-tab ${activeReport === 'driver_points' ? 'active' : ''}`}
            onClick={() => setActiveReport('driver_points')}
          >
            Driver Point Tracking
          </button>
          <button
            className={`report-tab ${activeReport === 'sponsor_audit' ? 'active' : ''}`}
            onClick={() => setActiveReport('sponsor_audit')}
          >
            Audit Log
          </button>
        </div>

        {/* Report Description */}
        <div className="report-description">
          {activeReport === 'driver_points' && (
            <p>Track driver points, changes, and history with detailed information about each transaction.</p>
          )}
          {activeReport === 'sponsor_audit' && (
            <p>View audit logs for your organization's activities, including point changes and driver status updates.</p>
          )}
        </div>

        {/* Filters */}
        <div className="card">
          <h3>Report Filters</h3>
          <ReportFilters
            reportType={activeReport}
            onFilterChange={setFilters}
            drivers={drivers}
            loading={loading}
          />
          <div className="filter-actions">
            <button
              className="btn btn-primary"
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={downloadCSV}
              disabled={loading || !reportData.length}
            >
              Download CSV
            </button>
          </div>
        </div>

        {/* Report Table */}
        <div className="card">
          <h3>
            {activeReport === 'driver_points' ? 'Driver Point Tracking Report' : 'Audit Log Report'}
          </h3>
          <ReportTable
            columns={getColumnsForReport(activeReport)}
            data={reportData}
            loading={loading}
            emptyMessage="No data found for selected filters"
          />
          {reportData.length > 0 && (
            <div className="report-footer">
              <p>Showing {reportData.length} records</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SponsorReports;
