import { useState } from 'react';
import { sponsorService, adminService } from '../services/apiService';

const BulkUpload = ({ userRole }) => {
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    setResults(null); // Clear previous results
  };

  const handleUpload = async () => {
    if (!file) {
      setResults({
        error: 'Please select a file first.',
        type: 'error'
      });
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      let response;
      
      if (userRole === 'Sponsor') {
        response = await sponsorService.bulkUploadDrivers(file, dryRun);
      } else if (userRole === 'Admin') {
        response = await adminService.bulkUploadAccounts(file);
      } else {
        throw new Error('Unauthorized role for bulk upload');
      }

      setResults({
        ...response,
        type: 'success'
      });
    } catch (error) {
      setResults({
        error: error.message || 'Upload failed. Please try again.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  const renderInstructions = () => {
    if (userRole === 'Sponsor') {
      return (
        <div className="upload-instructions">
          <p className="muted">
            Upload a <strong>pipe-delimited</strong> text file (<code>|</code>) with rows like:
          </p>
          <code className="example-code">D||First|Last|email@example.com</code>
          <p className="muted small">
            Note: Type must be 'D' (Driver) and organization name must be empty.
          </p>
        </div>
      );
    }

    if (userRole === 'Admin') {
      return (
        <div className="upload-instructions">
          <p className="muted">
            Upload a <strong>pipe-delimited</strong> text file with rows like:
          </p>
          <div className="example-codes">
            <code className="example-code">O|New Organization</code>
            <code className="example-code">S|Organization Name|First|Last|sponsor@example.com</code>
            <code className="example-code">D|Organization Name|First|Last|driver@example.com</code>
          </div>
          <p className="muted small">
            O = Organization, S = Sponsor, D = Driver
          </p>
        </div>
      );
    }

    return null;
  };

  const renderResults = () => {
    if (!results) return null;

    if (results.type === 'error') {
      return (
        <div className="bulk-results error">
          <p className="error-text">{results.error}</p>
        </div>
      );
    }

    const { processed = 0, success = 0, errors = 0, warnings = [], rows = [] } = results;

    return (
      <div className="bulk-results success">
        <div className="results-summary">
          <span className="stat">Processed: <strong>{processed}</strong></span>
          <span className="stat success">Success: <strong>{success}</strong></span>
          <span className="stat error">Errors: <strong>{errors}</strong></span>
        </div>

        {warnings.length > 0 && (
          <div className="warnings">
            <h4>Warnings:</h4>
            <ul>
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {rows.length > 0 && (
          <div className="details">
            <h4>Details:</h4>
            <ul>
              {rows.map((row, idx) => (
                <li key={idx} className={row.ok ? 'success-item' : 'error-item'}>
                  <span className="line-number">Line {row.line}:</span>
                  <span className="row-type">[{row.type}]</span>
                  {row.email && <span className="row-email">{row.email}</span>}
                  <span className="row-message">{row.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-card">
      <h2>
        {userRole === 'Sponsor' ? 'Bulk Driver Upload' : 'Bulk Account Upload'}
      </h2>

      {renderInstructions()}

      <div className="bulk-controls">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="bulk-upload-file"
            accept=".txt,.csv,.psv,.log,.data"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="bulk-upload-file" className="file-label">
            {file ? file.name : 'Choose a file...'}
          </label>
        </div>

        {userRole === 'Sponsor' && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              disabled={uploading}
            />
            <span>Dry run (validate only; don't write to DB)</span>
          </label>
        )}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? 'Processing...' : 'Process File'}
        </button>
      </div>

      {renderResults()}
    </div>
  );
};

export default BulkUpload;
