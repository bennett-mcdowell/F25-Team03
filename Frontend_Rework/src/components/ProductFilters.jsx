import PropTypes from 'prop-types';
import '../styles/Dashboard.css';

/**
 * ProductFilters component - handles category filtering
 * Follows Single Responsibility Principle - only handles filtering UI
 */
const ProductFilters = ({ categories, selectedCategory, onCategoryChange, productCount }) => {
  return (
    <div className="product-filters">
      <div className="filter-header">
        <h3>Filters</h3>
        <span className="product-count">{productCount} products</span>
      </div>
      
      <div className="filter-section">
        <h4>Category</h4>
        <div className="filter-options">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange('all')}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

ProductFilters.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  productCount: PropTypes.number.isRequired,
};

export default ProductFilters;
