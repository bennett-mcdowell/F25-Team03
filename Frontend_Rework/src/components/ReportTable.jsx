import PropTypes from 'prop-types';

/**
 * ReportTable - Reusable table component for displaying report data
 * @param {array} columns - Column definitions [{ key, label, render }]
 * @param {array} data - Report data rows
 * @param {boolean} loading - Whether data is loading
 * @param {string} emptyMessage - Message to show when no data
 */
const ReportTable = ({ columns, data, loading, emptyMessage = 'No data available' }) => {
  if (loading) {
    return (
      <div className="report-table-container">
        <div className="loading-report">Loading report data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="report-table-container">
        <div className="no-data-report">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="report-table-container">
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ReportTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
};

export default ReportTable;
