import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import { sponsorService, reportService } from '../services/apiService';
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

  console.log('Current filters:', filters);  // ADD THIS
  console.log('Active report:', activeReport);  // ADD THIS
  
  

  try {
    let response;
    
    if (activeReport === 'driver_points') {
      response = await reportService.getSponsorPointsReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        driverId: filters.driverId,
      });
    } else if (activeReport === 'sponsor_audit') {
      response = await reportService.getAuditLogReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.category,
      }, 'sponsor');
    }
    
    console.log('Full response:', response);  // ADD THIS
    console.log('Response.data:', response?.data);  // ADD THIS
    
    setReportData(Array.isArray(response?.data) ? response.data : []);
  } catch (err) {
    setError('Failed to generate report');
    console.error(err);
  } finally {
    setLoading(false);
  }
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
        const value = row[col.key] ?? '';
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
        { key: 'total_points', label: 'Total Points', render: (val) => val?.toFixed?.(2) ?? val ?? '0.00' },
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


        <div className="report-description">
          {activeReport === 'driver_points' && (
            <p>Track driver points, changes, and history with detailed information about each transaction.</p>
          )}
          {activeReport === 'sponsor_audit' && (
            <p>View audit logs for your organization's activities, including point changes and driver status updates.</p>
          )}
        </div>


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

