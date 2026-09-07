"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { initialProducts } from '../data/products.js';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);

  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
    return products;
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, quantity: newQuantity })
      });
      if (res.ok) {
        await refreshProducts();
        return true;
      }
    } catch (error) {
      console.error("Failed to update product quantity", error);
    }
    return false;
  };

  const rateProduct = async (productId, ratingValue) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, rating: ratingValue })
      });
      if (res.ok) {
        await refreshProducts();
        return true;
      }
    } catch (error) {
      console.error("Failed to rate product", error);
    }
    return false;
  };

  const updateProduct = async (productId, updatedFields) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, updatedFields })
      });
      if (res.ok) {
        await refreshProducts();
        return true;
      }
    } catch (error) {
      console.error("Failed to update product details", error);
    }
    return false;
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, refreshProducts, updateQuantity, rateProduct, updateProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
