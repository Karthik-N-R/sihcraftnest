"use client";

import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, cartTotal, isOpen, setIsOpen } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={() => setIsOpen(false)}></div>
      <div className="cart-drawer slide-in">
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close cart">&times;</button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button className="btn btn-primary mt-md" onClick={() => setIsOpen(false)}>Continue Shopping</button>
            </div>
          ) : (
            <ul className="cart-items">
              {cart.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">₹{Math.round(item.price).toLocaleString('en-IN')}</p>
                    <div className="quantity-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)} aria-label="Remove item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{Math.round(cartTotal).toLocaleString('en-IN')}</span>
            </div>
            <button className="btn btn-primary checkout-btn">Proceed to Checkout</button>
          </div>
        )}
      </div>
    </>
  );
}
