"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './checkout.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { refreshProducts } = useProducts() || {};

  const [buyerInfo, setBuyerInfo] = useState({
    fullName: 'Rohan Sharma',
    phone: '+91 98765 43210',
    address: '123 Heritage Lane, Craft Nagar',
    city: 'Bengaluru, Karnataka - 560001'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handleInputChange = (field, value) => {
    setBuyerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart,
          buyerInfo
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Clear cart in context and local storage
        clearCart();
        // Refresh products in ProductContext so stock updates on shop page
        if (refreshProducts) {
          await refreshProducts();
        }
        setOrderSuccess(data);
      } else {
        setErrorMessage(data?.error || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage('Connection error while placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ORDER SUCCESS STATE
  if (orderSuccess) {
    const purchasedItems = orderSuccess.purchasedItems || [];
    const totalAmount = purchasedItems.reduce((acc, item) => acc + (Number(item.price || 0) * item.purchasedQuantity), 0);

    return (
      <main className="checkout-page">
        <Navbar />
        <div className="container mt-xl">
          <div className="order-success-card animate-fade-in">
            <div className="success-header text-center">
              <div className="success-icon">🎉</div>
              <h1 className="text-gradient">Order Placed Successfully!</h1>
              <p className="order-id-badge">Order ID: <strong>{orderSuccess.orderId}</strong></p>
              <p className="text-gray mt-xs" style={{ fontSize: '0.85rem' }}>
                Thank you for supporting traditional Indian artisans on CraftNest!
              </p>
            </div>

            <div className="order-details-section mt-lg">
              <h3>Shipping Details</h3>
              <div className="buyer-summary-box">
                <p><strong>Recipient:</strong> {orderSuccess.buyerInfo?.fullName || buyerInfo.fullName}</p>
                <p><strong>Phone:</strong> {orderSuccess.buyerInfo?.phone || buyerInfo.phone}</p>
                <p><strong>Delivery Address:</strong> {orderSuccess.buyerInfo?.address || buyerInfo.address}, {orderSuccess.buyerInfo?.city || buyerInfo.city}</p>
              </div>
            </div>

            <div className="order-items-section mt-lg">
              <h3>Purchased Items</h3>
              <div className="purchased-items-list">
                {purchasedItems.map((item, idx) => (
                  <div key={idx} className="purchased-item-row">
                    <img src={item.image || '/images/products/pottery-1.jpg'} alt={item.name} className="purchased-item-thumb" />
                    <div className="purchased-item-info">
                      <h4>{item.name}</h4>
                      <p className="purchased-item-meta">
                        Price: <strong>₹{Math.round(item.price).toLocaleString('en-IN')}</strong> × {item.purchasedQuantity} unit(s)
                      </p>
                    </div>
                    <div className="purchased-item-total">
                      ₹{Math.round(item.price * item.purchasedQuantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="purchased-grand-total">
                <span>Total Amount Paid:</span>
                <span className="total-price">₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="text-center mt-xl">
              <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                Return to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <Navbar />

      <div className="container mt-xl">
        <h1 className="text-center mb-sm font-accent text-gradient" style={{ fontSize: '2.5rem' }}>Complete Your Order</h1>
        <p className="text-center text-gray mb-xl">Directly empowering authentic traditional artisans.</p>

        {errorMessage && (
          <div className="checkout-error-banner animate-fade-in" role="alert">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-checkout-card text-center">
            <h3>Your cart is currently empty</h3>
            <p className="text-gray mb-lg">Browse our handcrafted catalog to add items to your cart.</p>
            <Link href="/shop" className="btn btn-primary">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Left Column: Buyer Shipping Details Form */}
            <div className="checkout-form-card">
              <h2 className="mb-md">Buyer Delivery Details</h2>
              <form onSubmit={handlePlaceOrder}>
                <div className="form-group mb-md">
                  <label className="field-label" htmlFor="fullName">Full Name</label>
                  <input 
                    type="text" 
                    id="fullName"
                    className="input" 
                    value={buyerInfo.fullName} 
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-md">
                  <label className="field-label" htmlFor="phone">Phone Number</label>
                  <input 
                    type="text" 
                    id="phone"
                    className="input" 
                    value={buyerInfo.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-md">
                  <label className="field-label" htmlFor="address">Street Address</label>
                  <input 
                    type="text" 
                    id="address"
                    className="input" 
                    value={buyerInfo.address} 
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-lg">
                  <label className="field-label" htmlFor="city">City / Pincode</label>
                  <input 
                    type="text" 
                    id="city"
                    className="input" 
                    value={buyerInfo.city} 
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block place-order-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing Order...' : `Place Order (₹${Math.round(cartTotal).toLocaleString('en-IN')})`}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="checkout-summary-card">
              <h2 className="mb-md">Order Summary</h2>
              
              <div className="summary-items-list">
                {cart.map(item => (
                  <div key={item.id} className="summary-item-row">
                    <img src={item.image || '/images/products/pottery-1.jpg'} alt={item.name || item.title} className="summary-item-thumb" />
                    <div className="summary-item-details">
                      <h4 className="summary-item-title">{item.name || item.title}</h4>
                      <p className="summary-item-price">
                        ₹{Math.round(item.price || 0).toLocaleString('en-IN')} × {item.quantity}
                      </p>
                    </div>
                    <div className="summary-item-subtotal">
                      ₹{Math.round((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-pricing-breakdown mt-lg">
                <div className="pricing-line">
                  <span>Subtotal</span>
                  <span>₹{Math.round(cartTotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="pricing-line">
                  <span>Artisan Shipping</span>
                  <span style={{ color: '#2f855a', fontWeight: 'bold' }}>FREE</span>
                </div>
                <div className="pricing-line total-line">
                  <span>Total Amount</span>
                  <span>₹{Math.round(cartTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
