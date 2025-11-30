import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import { accountService, reportService } from '../services/apiService';
import '../styles/Dashboard.css';

const AdminReports = () => {
  const [activeReport, setActiveReport] = useState('sales_by_sponsor');
  const [reportData, setReportData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [filters, setFilters] = useState({ viewType: 'summary' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSponsorsAndDrivers();
  }, []);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      // Clear existing data to prevent column mismatch issues
      setReportData([]);
      generateReport();
    }
  }, [filters, activeReport]);

  const fetchSponsorsAndDrivers = async () => {
    try {
      // Get all accounts to extract sponsors and drivers
      const response = await accountService.getAccounts();
      const accountsData = response.accounts || [];
      
      // Filter sponsors (type_id = 2)
      const sponsorAccounts = accountsData.filter(acc => acc.user?.type_id === 2);
      const sponsorsList = sponsorAccounts.map(acc => ({
        sponsor_id: acc.role?.sponsor_id,
        name: acc.role?.name || `${acc.user?.first_name} ${acc.user?.last_name}`
      }));
      
      // Filter drivers (type_id = 3)
      const driverAccounts = accountsData.filter(acc => acc.user?.type_id === 3);
      const driversList = driverAccounts.map(acc => ({
        driver_id: acc.role?.driver_id,
        first_name: acc.user?.first_name,
        last_name: acc.user?.last_name
      }));
      
      setSponsors(sponsorsList);
      setDrivers(driversList);
    } catch (err) {
      console.error('Failed to load data:', err);
      // Fallback to empty arrays if API fails
      setSponsors([]);
      setDrivers([]);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      
      // Map frontend report types to backend API calls
      switch (activeReport) {
        case 'sales_by_sponsor':
          response = await reportService.getSalesReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            sponsorId: filters.sponsorId,
            viewType: filters.viewType || 'summary'
          });
          setReportData(response.data || []);
          break;
          
        case 'driver_activity':
          response = await reportService.getDriversReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            sponsorId: filters.sponsorId
          });
          setReportData(response.data || []);
          break;
          
        case 'sponsor_overview':
          response = await reportService.getSponsorsReport({
            startDate: filters.startDate,
            endDate: filters.endDate
          });
          setReportData(response.data || []);
          break;
          
        case 'sales_by_driver':
          response = await reportService.getSalesByDriverReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            sponsorId: filters.sponsorId,
            driverId: filters.driverId,
            viewType: filters.viewType || 'summary'
          });
          setReportData(response.data || []);
          break;
          
        case 'invoice':
          response = await reportService.getInvoiceReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            sponsorId: filters.sponsorId,
            feeRate: filters.feeRate || 0.05
          });
          setReportData(response.data || []);
          break;
          
        case 'audit_log':
        case 'admin_audit':
          response = await reportService.getAuditLogReport({
            startDate: filters.startDate,
            endDate: filters.endDate,
            sponsorId: filters.sponsorId,
            category: filters.auditCategory || 'all'
          });
          setReportData(response.data || []);
          break;
          
        default:
          setReportData([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
      console.error('Report generation error:', err);
      setReportData([]);
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
          { key: 'amount', label: 'Amount', render: (val) => `$${Number(val).toFixed(2)}` },
          { key: 'order_id', label: 'Order ID' },
        ];
      } else {
        return [
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'total_sales', label: 'Total Sales', render: (val) => `$${Number(val).toFixed(2)}` },
          { key: 'order_count', label: 'Order Count' },
          { key: 'active_drivers', label: 'Active Drivers' },
        ];
      }
    } else if (reportType === 'sales_by_driver') {
      if (viewType === 'detailed') {
        return [
          { key: 'driver_name', label: 'Driver' },
          { key: 'driver_email', label: 'Email' },
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'date', label: 'Date' },
          { key: 'product', label: 'Product' },
          { key: 'amount', label: 'Amount', render: (val) => `$${Number(val).toFixed(2)}` },
          { key: 'order_id', label: 'Order ID' },
        ];
      } else {
        return [
          { key: 'driver_name', label: 'Driver' },
          { key: 'driver_email', label: 'Email' },
          { key: 'sponsor_name', label: 'Sponsor' },
          { key: 'order_count', label: 'Order Count' },
          { key: 'total_spent', label: 'Total Spent', render: (val) => `$${Number(val).toFixed(2)}` },
          { key: 'active_days', label: 'Active Days' },
        ];
      }
    } else if (reportType === 'driver_activity') {
      return [
        { key: 'driver_name', label: 'Driver Name' },
        { key: 'email', label: 'Email' },
        { key: 'enrolled_sponsors', label: 'Enrolled Sponsors' },
        { key: 'total_balance', label: 'Total Balance', render: (val) => `$${Number(val).toFixed(2)}` },
        { key: 'order_count', label: 'Order Count' },
        { key: 'total_spent', label: 'Total Spent', render: (val) => `$${Number(val).toFixed(2)}` },
      ];
    } else if (reportType === 'sponsor_overview') {
      return [
        { key: 'sponsor_name', label: 'Sponsor Name' },
        { key: 'description', label: 'Description' },
        { key: 'active_drivers', label: 'Active Drivers' },
        { key: 'pending_drivers', label: 'Pending Drivers' },
        { key: 'total_points_distributed', label: 'Points Distributed', render: (val) => `$${Number(val).toFixed(2)}` },
        { key: 'total_points_spent', label: 'Points Spent', render: (val) => `$${Number(val).toFixed(2)}` },
        { key: 'order_count', label: 'Order Count' },
      ];
    } else if (reportType === 'invoice') {
      return [
        { key: 'sponsor_name', label: 'Sponsor' },
        { key: 'driver_name', label: 'Driver', render: (val, row) => row.is_summary ? <strong>{val}</strong> : val },
        { key: 'driver_email', label: 'Email' },
        { key: 'order_count', label: 'Orders' },
        { key: 'total_purchases', label: 'Total Purchases', render: (val) => `$${Number(val).toFixed(2)}` },
        { key: 'fee_rate', label: 'Fee Rate', render: (val) => typeof val === 'string' ? val : `${(val * 100).toFixed(1)}%` },
        { key: 'fee_amount', label: 'Fee Amount', render: (val) => val ? `$${Number(val).toFixed(2)}` : '' },
      ];
    } else if (reportType === 'audit_log' || reportType === 'admin_audit') {
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
