import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../contexts/AuthContext";
import ProductCard from "../components/ProductCard";
import api from "../services/api";
import "../styles/Dashboard.css";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  } = useCart();

  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  // Group cart items by sponsor
  const cartBySponsor = useMemo(() => {
    const grouped = {};
    cart.forEach(item => {
      const sponsorId = item.sponsor_id || 'no-sponsor';
      if (!grouped[sponsorId]) {
        grouped[sponsorId] = [];
      }
      grouped[sponsorId].push(item);
    });
    return grouped;
  }, [cart]);

  // Get driver's sponsors
  const driverSponsors = useMemo(() => {
    if (!user || user.role_name !== 'Driver' || !user.role?.sponsors) {
      return [];
    }
    return user.role.sponsors;
  }, [user]);

  // Calculate total and check balance for each sponsor
  const sponsorCheckouts = useMemo(() => {
    const checkouts = [];
    
    Object.entries(cartBySponsor).forEach(([sponsorIdStr, items]) => {
      if (sponsorIdStr === 'no-sponsor') return;
      
      const sponsorId = parseInt(sponsorIdStr);
      const sponsor = driverSponsors.find(s => s.sponsor_id === sponsorId);
      
      if (sponsor) {
        const total = items.reduce((sum, item) => 
          sum + Math.round(item.price * 100) * item.quantity, 0
        );
        const balance = Math.round(sponsor.balance * 100); // Convert dollars to points
        
        checkouts.push({
          sponsor_id: sponsorId,
          sponsor_name: sponsor.name,
          items,
          total,
          balance,
          hasSufficientBalance: balance >= total,
        });
      }
    });
    
    return checkouts;
  }, [cartBySponsor, driverSponsors]);

  // Check if all sponsors have sufficient balance
  const canCheckout = useMemo(() => {
    return sponsorCheckouts.length > 0 && 
           sponsorCheckouts.every(checkout => checkout.hasSufficientBalance);
  }, [sponsorCheckouts]);

  const handleCheckout = async () => {
    if (!user || user.role_name !== 'Driver') {
      setPurchaseError('Only drivers can make purchases');
      return;
    }

    if (cart.length === 0) {
      setPurchaseError('Your cart is empty');
      return;
    }

    if (sponsorCheckouts.length === 0) {
      setPurchaseError('No valid sponsor items in cart');
      return;
    }

    if (!canCheckout) {
      setPurchaseError('Insufficient balance for one or more sponsors');
      return;
    }

    setPurchasing(true);
    setPurchaseError('');
    setPurchaseSuccess('');

    try {
      // Process purchase for each sponsor
      const purchasePromises = sponsorCheckouts.map(checkout => {
        return api.post('/purchase', {
          sponsor_id: checkout.sponsor_id,
          items: checkout.items.map(item => ({
            id: item.id,
            price: item.price, // Send original dollar price - backend expects dollars
            quantity: item.quantity,
          })),
        });
      });

      const results = await Promise.all(purchasePromises);
      
      // Calculate totals
      const totalItems = results.reduce((sum, r) => sum + r.data.items_purchased, 0);
      const totalSpent = results.reduce((sum, r) => sum + r.data.total_spent, 0);

      setPurchaseSuccess(
        `Purchase successful! ${totalItems} item(s) purchased for ${totalSpent} points across ${results.length} sponsor(s).`
      );
      
      clearCart();
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Purchase failed. Please try again.';
      
      if (error.response?.data?.shortfall) {
        const { required, available, shortfall } = error.response.data;
        setPurchaseError(
          `Insufficient balance. Required: ${required} points, Available: ${available} points, Short: ${shortfall} points.`
        );
      } else {
        setPurchaseError(errorMsg);
      }
      
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="market-header">
          <div>
            <h1>Shopping Cart</h1>
            <p className="market-subtitle">Review your selected items and proceed to checkout</p>
          </div>
          <div className="market-header-actions">
            <span className="balance-label">Items:</span>
            <span className="balance-value">{getCartItemCount()}</span>
            <span className="balance-label">Total Points:</span>
            <span className="balance-value">{getCartTotal().toLocaleString()} points</span>
            <button className="clear-cart-btn" onClick={clearCart} disabled={cart.length === 0}>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Show sponsor breakdown if items exist */}
        {sponsorCheckouts.length > 0 && (
          <div className="dashboard-card">
            <h2>Checkout Summary</h2>
            {sponsorCheckouts.map(checkout => (
              <div key={checkout.sponsor_id} className="sponsor-checkout-section">
                <h3>{checkout.sponsor_name}</h3>
                <div className="checkout-details">
                  <div className="checkout-row">
                    <span>Items:</span>
                    <span>{checkout.items.length}</span>
                  </div>
                  <div className="checkout-row">
                    <span>Total:</span>
                    <span>{checkout.total} points</span>
                  </div>
                  <div className="checkout-row">
                    <span>Available Balance:</span>
                    <span>{checkout.balance} points</span>
                  </div>
                  <div className="checkout-row status-row">
                    <span>Status:</span>
                    {checkout.hasSufficientBalance ? (
                      <span className="status-success">✓ Sufficient balance</span>
                    ) : (
                      <span className="status-error">
                        ✗ Insufficient (short by {checkout.total - checkout.balance} points)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error/Success Messages */}
        {purchaseError && (
          <div className="dashboard-card error-card">
            <p className="error-text">{purchaseError}</p>
          </div>
        )}

        {purchaseSuccess && (
          <div className="dashboard-card success-card">
            <p className="success-text">{purchaseSuccess}</p>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button className="btn btn-primary" onClick={() => navigate('/market')}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.id}-${item.sponsor_id || 'no-sponsor'}`} className="cart-item-card">
                <ProductCard product={item} hideActions />
                {item.sponsor_id && (
                  <div className="cart-item-sponsor">
                    <small>
                      From: {driverSponsors.find(s => s.sponsor_id === item.sponsor_id)?.name || 'Unknown Sponsor'}
                    </small>
                  </div>
                )}
                <div className="cart-item-controls">
                  <label>
                    Qty:
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value), item.sponsor_id)}
                    />
                  </label>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id, item.sponsor_id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={purchasing || !canCheckout}
          >
            {purchasing ? 'Processing...' : 'Complete Purchase'}
          </button>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
