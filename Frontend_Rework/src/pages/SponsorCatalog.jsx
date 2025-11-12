import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { sponsorService } from '../services/apiService';
import '../styles/Dashboard.css';

const SponsorCatalog = () => {
  const [allowedCategories, setAllowedCategories] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const AVAILABLE_CATEGORIES = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'jewelery', label: 'Jewelery' },
    { value: "men's clothing", label: "Men's Clothing" },
    { value: "women's clothing", label: "Women's Clothing" },
  ];

  useEffect(() => {
    fetchCatalogFilters();
  }, []);

  const fetchCatalogFilters = async () => {
    try {
      const data = await sponsorService.getCatalogFilters();
      setAllowedCategories(data.allowed_categories);
    } catch (err) {
      console.error('Failed to load catalog filters:', err);
      setError('Failed to load catalog settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (category) => {
    if (allowedCategories === null) {
      // Currently allowing all, switch to only this category
      setAllowedCategories([category]);
    } else if (allowedCategories.includes(category)) {
      // Remove this category
      const newCategories = allowedCategories.filter(c => c !== category);
      // If empty, set to null (allow all)
      setAllowedCategories(newCategories.length === 0 ? null : newCategories);
    } else {
      // Add this category
      setAllowedCategories([...allowedCategories, category]);
    }
  };

  const handleSaveCatalogFilters = async () => {
    setCatalogLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      await sponsorService.updateCatalogFilters(allowedCategories);
      setSuccessMessage('Catalog filters updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update catalog filters');
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleAllowAllCategories = () => {
    if (allowedCategories === null) {
      setAllowedCategories([]);
    } else {
      setAllowedCategories(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading-spinner">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>Catalog Management</h1>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="dashboard-card">
          <h2>Product Category Filters</h2>
          <p className="card-description">
            Choose which product categories your drivers can shop from. 
            By default, all categories are available.
          </p>
          
          <div className="catalog-filters">
            <div className="filter-option all-categories">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowedCategories === null}
                  onChange={handleAllowAllCategories}
                />
                <span className="checkbox-text">
                  <strong>Allow All Categories</strong>
                  <small>Drivers can shop from any product category</small>
                </span>
              </label>
            </div>

            <div className="filter-divider">
              <span>OR select specific categories:</span>
            </div>

            <div className="category-grid">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isChecked = allowedCategories === null || (allowedCategories && allowedCategories.includes(cat.value));
                const isDisabled = allowedCategories === null;
                
                return (
                  <div key={cat.value} className="filter-option">
                    <label className={`checkbox-label ${isDisabled ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => handleToggleCategory(cat.value)}
                      />
                      <span className="checkbox-text">{cat.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="catalog-summary">
              {allowedCategories === null ? (
                <p className="summary-text">
                  <strong>Current Setting:</strong> All categories allowed
                </p>
              ) : allowedCategories.length === 0 ? (
                <p className="summary-text warning">
                  <strong>Warning:</strong> No categories selected - drivers won't see any products!
                </p>
              ) : (
                <p className="summary-text">
                  <strong>Current Setting:</strong> {allowedCategories.length} {allowedCategories.length === 1 ? 'category' : 'categories'} allowed
                </p>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCatalogFilters}
                disabled={catalogLoading}
              >
                {catalogLoading ? 'Saving...' : 'Save Catalog Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SponsorCatalog;
