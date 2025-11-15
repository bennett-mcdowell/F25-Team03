import { useState, useEffect, useMemo } from 'react';

export const useProducts = (allowedCategories = null) => {
  const [allProducts, setAllProducts] = useState(() => {
    const cached = localStorage.getItem('products');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(allProducts.length === 0);
  const [error, setError] = useState(null);

  // Fetch all products from Fake Store API
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();

        if (isMounted && JSON.stringify(data) !== JSON.stringify(allProducts)) {
          setAllProducts(data);
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

    // Filter products based on allowed categories
  const filteredProducts = useMemo(() => {
    // If no filter (null), show all products
    if (!allowedCategories) {
      return allProducts;
    }
    
    // If empty array, show no products
    if (allowedCategories.length === 0) {
      return [];
    }
    
    // Filter products by allowed categories
    const filtered = allProducts.filter(product => 
      allowedCategories.includes(product.category)
    );
    
    return filtered;
  }, [allProducts, allowedCategories]);

  return { products: filteredProducts, loading, error };
};
