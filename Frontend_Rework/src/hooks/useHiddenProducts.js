import { useState, useEffect } from 'react';
import api from '../services/api';

export const useHiddenProducts = () => {
  const [hiddenProducts, setHiddenProducts] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load hidden products on mount
  useEffect(() => {
    const loadHiddenProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/driver/catalog/hidden');
        const hidden = new Set(response.data.hidden_products || []);
        setHiddenProducts(hidden);
      } catch (err) {
        // If not a driver or not logged in, just use empty set
        console.log('Could not load hidden products:', err.message);
        setHiddenProducts(new Set());
      } finally {
        setLoading(false);
      }
    };

    loadHiddenProducts();
  }, []);

  const hideProduct = async (productId) => {
    try {
      await api.post('/driver/catalog/hide', { product_id: productId });
      setHiddenProducts((prev) => new Set([...prev, productId]));
      return true;
    } catch (err) {
      console.error('Error hiding product:', err);
      return false;
    }
  };

  const unhideProduct = async (productId) => {
    try {
      await api.post('/driver/catalog/unhide', { product_id: productId });
      setHiddenProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      return true;
    } catch (err) {
      console.error('Error unhiding product:', err);
      return false;
    }
  };

  const isHidden = (productId) => {
    return hiddenProducts.has(productId);
  };

  return {
    hiddenProducts,
    hideProduct,
    unhideProduct,
    isHidden,
    loading,
  };
};
