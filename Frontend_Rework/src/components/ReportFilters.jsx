import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ReportFilters - Reusable filter component for reports
 * @param {string} reportType - Type of report being generated
 * @param {function} onFilterChange - Callback when filters change
 * @param {array} drivers - Available drivers (for driver selection)
 * @param {array} sponsors - Available sponsors (for sponsor selection)
 * @param {boolean} loading - Whether filters are loading
 */
const ReportFilters = ({
  reportType,
  onFilterChange,
  drivers = [],
  sponsors = [],
  loading = false,
}) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    driverId: 'all',
    sponsorId: 'all',
    viewType: 'summary', // detailed or summary
    auditCategory: 'all',
  });

  // Set default date range (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  }, []);

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const auditCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'login_attempts', label: 'Login Attempts' },
    { value: 'point_changes', label: 'Point Changes' },
    { value: 'driver_applications', label: 'Driver Applications' },
    { value: 'password_changes', label: 'Password Changes' },
  ];

  return (
    <div className="report-filters">
      {/* Date Range */}
      <div className="filter-group">
        <div className="filter-row">
          <div className="filter-item">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              disabled={loading}
              className="form-control"
            />
          </div>
          <div className="filter-item">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              disabled={loading}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Driver Selection (for applicable reports) */}
      {(reportType === 'driver_points' || reportType === 'sales_by_driver' || reportType === 'invoice') && (
        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="driverId">Driver</label>
            <select
              id="driverId"
              value={filters.driverId}
              onChange={(e) => handleChange('driverId', e.target.value)}
              disabled={loading}
              className="form-control"
            >
              <option value="all">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.driver_id} value={driver.driver_id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sponsor Selection (for admin reports) */}
      {(reportType === 'sales_by_sponsor' || reportType === 'sales_by_driver' || 
        reportType === 'invoice' || reportType === 'admin_audit') && (
        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="sponsorId">Sponsor</label>
            <select
              id="sponsorId"
              value={filters.sponsorId}
              onChange={(e) => handleChange('sponsorId', e.target.value)}
              disabled={loading}
              className="form-control"
            >
              <option value="all">All Sponsors</option>
              {sponsors.map((sponsor) => (
                <option key={sponsor.sponsor_id} value={sponsor.sponsor_id}>
                  {sponsor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* View Type (detailed/summary) */}
      {(reportType === 'sales_by_sponsor' || reportType === 'sales_by_driver') && (
        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="viewType">View Type</label>
            <select
              id="viewType"
              value={filters.viewType}
              onChange={(e) => handleChange('viewType', e.target.value)}
              disabled={loading}
              className="form-control"
            >
              <option value="detailed">Detailed</option>
              <option value="summary">Summary</option>
            </select>
          </div>
        </div>
      )}

      {/* Audit Category */}
      {(reportType === 'sponsor_audit' || reportType === 'admin_audit') && (
        <div className="filter-group">
          <div className="filter-item">
            <label htmlFor="auditCategory">Audit Category</label>
            <select
              id="auditCategory"
              value={filters.auditCategory}
              onChange={(e) => handleChange('auditCategory', e.target.value)}
              disabled={loading}
              className="form-control"
            >
              {auditCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

ReportFilters.propTypes = {
  reportType: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  drivers: PropTypes.array,
  sponsors: PropTypes.array,
  loading: PropTypes.bool,
};

export default ReportFilters;
