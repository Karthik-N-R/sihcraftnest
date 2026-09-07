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

  useEffect(() => {
    refreshProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}
