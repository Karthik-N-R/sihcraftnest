"use client";

import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import './CartDrawer.css';

export default function CartDrawer() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal, isOpen, setIsOpen } = useCart();

  if (!isOpen) return null;

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    router.push('/checkout');
  };

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
              {cart.map(item => {
                const maxStock = item.stockLimit !== undefined ? item.stockLimit : (item.quantityLimit !== undefined ? item.quantityLimit : 99);
                const isMaxReached = item.quantity >= maxStock;

                return (
                  <li key={item.id} className="cart-item">
                    <img src={item.image || '/images/products/pottery-1.jpg'} alt={item.name || item.title} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name || item.title}</h4>
                      <p className="cart-item-price">₹{Math.round(item.price || 0).toLocaleString('en-IN')}</p>
                      
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isMaxReached}
                          title={isMaxReached ? "Max available stock reached" : "Increase quantity"}
                        >
                          +
                        </button>
                      </div>

                      {isMaxReached && (
                        <p className="text-gray" style={{ fontSize: '0.75rem', color: '#c05621', margin: '4px 0 0 0' }}>
                          Max stock reached ({maxStock})
                        </p>
                      )}
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)} aria-label="Remove item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{Math.round(cartTotal).toLocaleString('en-IN')}</span>
            </div>
            <button 
              className="btn btn-primary checkout-btn"
              onClick={handleProceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
