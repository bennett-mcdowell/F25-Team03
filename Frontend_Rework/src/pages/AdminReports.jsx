import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import { accountService } from '../services/apiService';
import '../styles/Dashboard.css';

const AdminReports = () => {
  const [activeReport, setActiveReport] = useState('sales_by_sponsor');
  const [reportData, setReportData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSponsorsAndDrivers();
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      generateReport();
    }
  }, [filters, activeReport]);

  const fetchSponsorsAndDrivers = async () => {
    try {
      // TODO: Replace with actual API calls
      // const sponsorsData = await adminService.getAllSponsors();
      // const driversData = await adminService.getAllDrivers();
      
      setSponsors([
        { sponsor_id: 1, name: 'Speedy Tires' },
        { sponsor_id: 2, name: 'FuelMax' },
      ]);
      setDrivers([
        { driver_id: 1, first_name: 'Danny', last_name: 'Driver' },
        { driver_id: 2, first_name: 'Dina', last_name: 'Driver' },
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      // TODO: Replace with actual API calls when backend is ready
      // const data = await reportService.generateAdminReport(activeReport, filters);
      
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
    const isDetailed = filters.viewType === 'detailed';
    
    if (reportType === 'sales_by_sponsor') {
      if (isDetailed) {
        return [
          {
            sponsor_name: 'Speedy Tires',
            driver_name: 'Danny Driver',
            date: '2025-11-10',
            product: 'Tire Set (4)',
            amount: 25.00,
            order_id: '#1234',
          },
          {
            sponsor_name: 'Speedy Tires',
            driver_name: 'Dina Driver',
            date: '2025-11-09',
            product: 'Oil Change Kit',
            amount: 15.00,
            order_id: '#1235',
          },
          {
            sponsor_name: 'FuelMax',
            driver_name: 'Danny Driver',
            date: '2025-11-08',
            product: 'Fuel Card $50',
            amount: 50.00,
            order_id: '#1236',
          },
        ];
      } else {
        return [
          {
            sponsor_name: 'Speedy Tires',
            total_sales: 40.00,
            order_count: 2,
            driver_count: 2,
          },
          {
            sponsor_name: 'FuelMax',
            total_sales: 50.00,
            order_count: 1,
            driver_count: 1,
          },
        ];
      }
    } else if (reportType === 'sales_by_driver') {
      if (isDetailed) {
        return [
          {
            driver_name: 'Danny Driver',
            sponsor_name: 'Speedy Tires',
            date: '2025-11-10',
            product: 'Tire Set (4)',
            amount: 25.00,
            order_id: '#1234',
          },
          {
            driver_name: 'Danny Driver',
            sponsor_name: 'FuelMax',
            date: '2025-11-08',
            product: 'Fuel Card $50',
            amount: 50.00,
            order_id: '#1236',
          },
          {
            driver_name: 'Dina Driver',
            sponsor_name: 'Speedy Tires',
            date: '2025-11-09',
            product: 'Oil Change Kit',
            amount: 15.00,
            order_id: '#1235',
          },
        ];
      } else {
        return [
          {
            driver_name: 'Danny Driver',
            total_spent: 75.00,
            order_count: 2,
            sponsor_count: 2,
          },
          {
            driver_name: 'Dina Driver',
            total_spent: 15.00,
            order_count: 1,
            sponsor_count: 1,
          },
        ];
      }
    } else if (reportType === 'invoice') {
      return [
        {
          sponsor_name: 'Speedy Tires',
          driver_name: 'Danny Driver',
          total_purchases: 25.00,
          fee_rate: '5%',
          fee_amount: 1.25,
        },
        {
          sponsor_name: 'Speedy Tires',
          driver_name: 'Dina Driver',
          total_purchases: 15.00,
          fee_rate: '5%',
          fee_amount: 0.75,
        },
        {
          sponsor_name: 'Speedy Tires',
          summary: 'TOTAL DUE',
          total_purchases: 40.00,
          fee_rate: '',
          fee_amount: 2.00,
        },
      ];
    } else if (reportType === 'admin_audit') {
      return [
        {
          date: '2025-11-10 14:23:15',
          category: 'Point Change',
          sponsor: 'Speedy Tires',
          user: 'Sam Sponsor',
          action: 'Added 50 points to Danny Driver',
          details: 'Reason: Monthly bonus',
        },
        {
          date: '2025-11-10 10:15:22',
          category: 'Driver Status',
          sponsor: 'Speedy Tires',
          user: 'Sam Sponsor',
          action: 'Approved driver application',
          details: 'Driver: Dina Driver',
        },
        {
          date: '2025-11-09 09:30:45',
          category: 'Account Change',
          sponsor: 'N/A',
          user: 'Alice Adminson',
          action: 'Created new sponsor account',
          details: 'Sponsor: FuelMax',
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

    const columns = getColumnsForReport(activeReport, filters.viewType);
    const headers = columns.map(col => col.label).join(',');
    const rows = reportData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        const escaped = String(value || '').replace(/"/g, '""');
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

  const getColumnsForReport = (reportType, viewType) => {
    if (reportType === 'sales_by_sponsor') {
      if (viewType === 'detailed') {
        return [
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'driver_name', label: 'Driver' },
          { key: 'date', label: 'Date' },
          { key: 'product', label: 'Product' },
          { key: 'amount', label: 'Amount', render: (val) => `$${val.toFixed(2)}` },
          { key: 'order_id', label: 'Order ID' },
        ];
      } else {
        return [
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'total_sales', label: 'Total Sales', render: (val) => `$${val.toFixed(2)}` },
          { key: 'order_count', label: 'Order Count' },
          { key: 'driver_count', label: 'Driver Count' },
        ];
      }
    } else if (reportType === 'sales_by_driver') {
      if (viewType === 'detailed') {
        return [
          { key: 'driver_name', label: 'Driver' },
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'date', label: 'Date' },
          { key: 'product', label: 'Product' },
          { key: 'amount', label: 'Amount', render: (val) => `$${val.toFixed(2)}` },
          { key: 'order_id', label: 'Order ID' },
        ];
      } else {
        return [
          { key: 'driver_name', label: 'Driver' },
          { key: 'total_spent', label: 'Total Spent', render: (val) => `$${val.toFixed(2)}` },
          { key: 'order_count', label: 'Order Count' },
          { key: 'sponsor_count', label: 'Sponsor Count' },
        ];
      }
    } else if (reportType === 'invoice') {
      return [
        { key: 'sponsor_name', label: 'Sponsor' },
        { key: 'driver_name', label: 'Driver', render: (val, row) => row.summary || val },
        { key: 'total_purchases', label: 'Total Purchases', render: (val) => `$${val.toFixed(2)}` },
        { key: 'fee_rate', label: 'Fee Rate' },
        { key: 'fee_amount', label: 'Fee Amount', render: (val) => val ? `$${val.toFixed(2)}` : '' },
      ];
    } else if (reportType === 'admin_audit') {
      return [
        { key: 'date', label: 'Date/Time' },
        { key: 'category', label: 'Category' },
        { key: 'sponsor', label: 'Sponsor' },
        { key: 'user', label: 'User' },
        { key: 'action', label: 'Action' },
        { key: 'details', label: 'Details' },
      ];
    }
    return [];
  };

  const getReportTitle = () => {
    switch (activeReport) {
      case 'sales_by_sponsor':
        return 'Sales by Sponsor';
      case 'sales_by_driver':
        return 'Sales by Driver';
      case 'invoice':
        return 'Invoice';
      case 'admin_audit':
        return 'Audit Log';
      default:
        return 'Report';
    }
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Admin Reports</h1>
          <p>Generate comprehensive reports across all sponsors and drivers</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Report Type Selection */}
        <div className="report-selector">
          <button
            className={`report-tab ${activeReport === 'sales_by_sponsor' ? 'active' : ''}`}
            onClick={() => setActiveReport('sales_by_sponsor')}
          >
            Sales by Sponsor
          </button>
          <button
            className={`report-tab ${activeReport === 'sales_by_driver' ? 'active' : ''}`}
            onClick={() => setActiveReport('sales_by_driver')}
          >
            Sales by Driver
          </button>
          <button
            className={`report-tab ${activeReport === 'invoice' ? 'active' : ''}`}
            onClick={() => setActiveReport('invoice')}
          >
            Invoice
          </button>
          <button
            className={`report-tab ${activeReport === 'admin_audit' ? 'active' : ''}`}
            onClick={() => setActiveReport('admin_audit')}
          >
            Audit Log
          </button>
        </div>

        {/* Report Description */}
        <div className="report-description">
          {activeReport === 'sales_by_sponsor' && (
            <p>View sales data grouped by sponsor with detailed or summary views.</p>
          )}
          {activeReport === 'sales_by_driver' && (
            <p>View sales data grouped by driver with detailed or summary views.</p>
          )}
          {activeReport === 'invoice' && (
            <p>Generate invoices showing purchases by driver and calculated fees per sponsor.</p>
          )}
          {activeReport === 'admin_audit' && (
            <p>View comprehensive audit logs across all sponsors and system activities.</p>
          )}
        </div>

        {/* Filters */}
        <div className="card">
          <h3>Report Filters</h3>
          <ReportFilters
            reportType={activeReport}
            onFilterChange={setFilters}
            drivers={drivers}
            sponsors={sponsors}
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
          <h3>{getReportTitle()}</h3>
          <ReportTable
            columns={getColumnsForReport(activeReport, filters.viewType)}
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

export default AdminReports;
