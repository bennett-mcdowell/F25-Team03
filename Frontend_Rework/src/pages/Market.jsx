import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useHiddenProducts } from '../hooks/useHiddenProducts';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Market = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showHidden, setShowHidden] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  
  // Get driver's sponsors if they are a driver
  const driverSponsors = useMemo(() => {
    if (!user || user.role_name !== 'Driver' || !user.role?.sponsors) {
      return [];
    }
    return user.role.sponsors;
  }, [user]);
  
  // Set default sponsor when sponsors list loads
  useEffect(() => {
    if (driverSponsors.length > 0 && !selectedSponsor) {
      setSelectedSponsor(driverSponsors[0].sponsor_id.toString());
    }
  }, [driverSponsors, selectedSponsor]);
  
  // Calculate allowed categories based on selected sponsor
  const allowedCategories = useMemo(() => {
    if (!user || user.role_name !== 'Driver' || !user.role?.sponsors) {
      return null;
    }
    
    if (!selectedSponsor) {
      return null;
    }
    
    // Get the specific sponsor's allowed categories
    const sponsor = user.role.sponsors.find(s => s.sponsor_id === parseInt(selectedSponsor));
    if (!sponsor) {
      return null;
    }
    
    if (!sponsor.allowed_categories || sponsor.allowed_categories === null) {
      return null;
    }
    
    return sponsor.allowed_categories;
  }, [user, selectedSponsor]);
  
  // Get point balance for selected sponsor
  const pointBalance = useMemo(() => {
    if (!user || !user.role) return 0;
    
    // For drivers
    if (user.role_name === 'Driver' && user.role?.sponsors && selectedSponsor) {
      // Get balance for specific sponsor
      const sponsor = user.role.sponsors.find(s => s.sponsor_id === parseInt(selectedSponsor));
      return Math.floor(sponsor?.balance || 0);
    }
    
    return 0;
  }, [user, selectedSponsor]);
  
  const { products, loading: productsLoading, error: productsError } = useProducts(allowedCategories);
  const { addToCart, getCartItemCount } = useCart();
  const { isHidden, hideProduct, unhideProduct } = useHiddenProducts();

  // Extract unique categories from products (memoized for performance)
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))];
  }, [products]);

  // Filter products by category and hidden status (memoized for performance)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesHidden = showHidden || !isHidden(product.id);
      return matchesCategory && matchesHidden;
    });
  }, [products, selectedCategory, showHidden, isHidden]);

  // Handlers
  const handleAddToCart = (product) => {
    const sponsorIdToUse = (user && user.role_name === 'Driver' && selectedSponsor) 
      ? parseInt(selectedSponsor) 
      : null;
    
    addToCart(product, sponsorIdToUse);
    showNotification(`Added "${product.title}" to cart!`);
  };

  const handleToggleHide = async (productId) => {
    if (!user || user.role_name?.toLowerCase() !== 'driver') {
      showNotification('Only drivers can hide products', 'error');
      return;
    }

    const hidden = isHidden(productId);
    const success = hidden ? await unhideProduct(productId) : await hideProduct(productId);
    
    if (success) {
      showNotification(hidden ? 'Product shown' : 'Product hidden', 'success');
    } else {
      showNotification('Failed to update product visibility', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoToCart = () => {
    navigate('/cart');
  };

  // Loading and error states
  if (productsLoading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="loading-spinner">Loading products...</div>
        </div>
      </Layout>
    );
  }

  if (productsError) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="error-message">
            Error loading products: {productsError}
          </div>
        </div>
      </Layout>
    );
  }

  const isDriver = user?.role_name?.toLowerCase() === 'driver';
  const cartItemCount = getCartItemCount();

  return (
    <Layout>
      <div className="dashboard market-page">
        {/* Header */}
        <div className="market-header">
          <div>
            <h1>Product Catalog</h1>
            <p className="market-subtitle">Browse and shop our selection of products</p>
          </div>
          <div className="market-header-actions">
            {isDriver && (
              <div className="balance-display">
                <span className="balance-label">Your Balance:</span>
                <span className="balance-value">{pointBalance.toLocaleString()} points</span>
              </div>
            )}
            <button
              className="btn btn-primary cart-btn"
              onClick={handleGoToCart}
            >
              Cart ({cartItemCount})
            </button>
          </div>
        </div>

        {/* Sponsor Selector for Drivers */}
        {isDriver && driverSponsors.length > 0 && (
          <div className="dashboard-card sponsor-selector-card">
            <div className="sponsor-selector">
              <label htmlFor="sponsor-select">
                <strong>Shopping with:</strong>
              </label>
              <select
                id="sponsor-select"
                value={selectedSponsor || ''}
                onChange={(e) => setSelectedSponsor(e.target.value)}
                className="sponsor-select"
              >
                {driverSponsors.map((sponsor) => (
                  <option key={sponsor.sponsor_id} value={sponsor.sponsor_id}>
                    {sponsor.name} - {Math.floor(sponsor.balance || 0)} points
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`notification notification-${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Controls */}
        <div className="market-controls">
          {isDriver && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              Show hidden products
            </label>
          )}
        </div>

        {/* Main Content */}
        <div className="market-content">
          {/* Filters Sidebar */}
          <aside className="market-sidebar">
            <ProductFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              productCount={filteredProducts.length}
            />
          </aside>

          {/* Product Grid */}
          <main className="market-main">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found.</p>
                {!showHidden && isDriver && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowHidden(true)}
                  >
                    Show hidden products
                  </button>
                )}
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onHide={handleToggleHide}
                    isHidden={isHidden(product.id)}
                    showHideButton={isDriver}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default Market;
