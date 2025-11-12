import { useState, useEffect } from 'react';

export const useProducts = () => {
  const [products, setProducts] = useState(() => {
    const cached = localStorage.getItem('products');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(products.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();

        if (isMounted && JSON.stringify(data) !== JSON.stringify(products)) {
          setProducts(data);
          localStorage.setItem('products', JSON.stringify(data));
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  return { products, loading, error };
};
