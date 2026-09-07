"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('craftnest_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    localStorage.setItem('craftnest_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    if (!product) return;
    const maxStock = product.quantity !== undefined && product.quantity !== null ? Number(product.quantity) : 10;
    if (maxStock <= 0) return;

    // Use seller's actual price only
    const price = Number(product.price) || 0;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const currentStockLimit = item.stockLimit !== undefined ? item.stockLimit : maxStock;
        const newQty = Math.min(existing.quantity + quantity, currentStockLimit);
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, price, quantity: newQty, stockLimit: currentStockLimit }
            : item
        );
      }
      const initialQty = Math.min(quantity, maxStock);
      return [...prev, { ...product, price, quantity: initialQty, stockLimit: maxStock }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const maxStock = item.stockLimit !== undefined ? item.stockLimit : (item.quantity !== undefined ? item.quantity : 99);
        return { ...item, quantity: Math.min(newQuantity, maxStock) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Total price MUST ALWAYS use actual seller price
  const cartTotal = cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal, 
      cartCount,
      isOpen,
      setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
