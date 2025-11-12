import React from "react";
import Layout from "../components/Layout";
import { useCart } from "../hooks/useCart";
import ProductCard from "../components/ProductCard";
import "../styles/Dashboard.css";

const Cart = () => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
  } = useCart();


  const handleCheckout = () => {
    // TODO: Integrate with backend purchase endpoint
    alert("Checkout functionality WIP");
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
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">Your cart is empty.</div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item-card">
                <ProductCard product={item} hideActions />
                <div className="cart-item-controls">
                  <label>
                    Qty:
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    />
                  </label>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={cart.length === 0}
        >
          Checkout
        </button>
      </div>
    </Layout>
  );
};

export default Cart;
