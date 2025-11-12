import PropTypes from 'prop-types';
import '../styles/Dashboard.css';

/**
 * ProductCard component - displays a single product
 * Follows Single Responsibility Principle - only displays product info
 */
const ProductCard = ({ product, onAddToCart, onHide, isHidden, showHideButton = true }) => {
  const priceInPoints = Math.round(product.price * 100);

  return (
    <div className={`product-card ${isHidden ? 'hidden-product' : ''}`}>
      <div className="product-image">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <div className="product-rating">
          <span className="rating-value">{product.rating?.rate || 'N/A'}</span>
          <span className="rating-count">({product.rating?.count || 0} reviews)</span>
        </div>
        <p className="product-description">
          {product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description}
        </p>
        <div className="product-footer">
          <div className="product-price">{priceInPoints.toLocaleString()} points</div>
          <div className="product-actions">
            {!isHidden && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAddToCart(product)}
                title="Add to cart"
              >
                Add to Cart
              </button>
            )}
            {showHideButton && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onHide(product.id)}
                title={isHidden ? 'Show product' : 'Hide product'}
              >
                {isHidden ? 'Show' : 'Hide'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    rating: PropTypes.shape({
      rate: PropTypes.number,
      count: PropTypes.number,
    }),
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  isHidden: PropTypes.bool,
  showHideButton: PropTypes.bool,
};

export default ProductCard;
