import { useState, useEffect } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (err) {
        console.error('Error loading cart:', err);
        localStorage.removeItem('cart');
      }
    }
    return [];
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Error loading cart:', err);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, sponsorId = null) => {
    setCart((prevCart) => {
      const existingItem = sponsorId 
        ? prevCart.find((item) => item.id === product.id && item.sponsor_id === sponsorId)
        : prevCart.find((item) => item.id === product.id && !item.sponsor_id);
      
      if (existingItem) {
        // Increase quantity if already in cart
        return prevCart.map((item) =>
          (sponsorId 
            ? (item.id === product.id && item.sponsor_id === sponsorId)
            : (item.id === product.id && !item.sponsor_id))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, { ...product, quantity: 1, sponsor_id: sponsorId }];
      }
    });
  };

  const removeFromCart = (productId, sponsorId = null) => {
    setCart((prevCart) => 
      prevCart.filter((item) => {
        if (sponsorId !== null) {
          return !(item.id === productId && item.sponsor_id === sponsorId);
        }
        return item.id !== productId;
      })
    );
  };

  const updateQuantity = (productId, quantity, sponsorId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, sponsorId);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (sponsorId !== null) {
          return (item.id === productId && item.sponsor_id === sponsorId)
            ? { ...item, quantity }
            : item;
        }
        return item.id === productId ? { ...item, quantity } : item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
  };
};
