"use client";

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './checkout.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { products = [], refreshProducts } = useProducts() || {};
  const { t } = useLanguage() || {};

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
        clearCart();
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

    const purchasedIds = new Set(purchasedItems.map(item => item.id));
    const purchasedCategories = new Set(
      purchasedItems.map(item => {
        if (item.category) return item.category;
        const found = products.find(p => p.id === item.id);
        return found?.category;
      }).filter(Boolean)
    );

    const recommendedProducts = products.filter(p => {
      if (!p) return false;
      if (purchasedIds.has(p.id)) return false;
      if (Number(p.quantity || 0) <= 0) return false;
      return purchasedCategories.has(p.category);
    }).slice(0, 4);

    return (
      <main className="checkout-page">
        <Navbar />
        <div className="container mt-xl">
          <div className="order-success-card animate-fade-in">
            <div className="success-header text-center">
              <div className="success-icon">🎉</div>
              <h1 className="text-gradient">{t('orderSuccessTitle')}</h1>
              <p className="order-id-badge">{t('orderId')}: <strong>{orderSuccess.orderId}</strong></p>
              <p className="text-gray mt-xs" style={{ fontSize: '0.85rem' }}>
                {t('thankYouSupport')}
              </p>
            </div>

            <div className="order-details-section mt-lg">
              <h3>{t('shippingDetails')}</h3>
              <div className="buyer-summary-box">
                <p><strong>{t('recipient')}:</strong> {orderSuccess.buyerInfo?.fullName || buyerInfo.fullName}</p>
                <p><strong>{t('phoneNumber')}:</strong> {orderSuccess.buyerInfo?.phone || buyerInfo.phone}</p>
                <p><strong>{t('streetAddress')}:</strong> {orderSuccess.buyerInfo?.address || buyerInfo.address}, {orderSuccess.buyerInfo?.city || buyerInfo.city}</p>
              </div>
            </div>

            <div className="order-items-section mt-lg">
              <h3>{t('purchasedItems')}</h3>
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
                <span>{t('totalPaid')}</span>
                <span className="total-price">₹{Math.round(totalAmount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {recommendedProducts.length > 0 && (
              <div className="order-recommendations-section mt-xl text-left" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                <h3 className="mb-md" style={{ color: 'var(--charcoal)', fontSize: '1.25rem' }}>
                  {t('recommendedForYou')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {recommendedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mt-xl">
              <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                {t('returnToMarketplace')}
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
        <h1 className="text-center mb-sm font-accent text-gradient" style={{ fontSize: '2.5rem' }}>{t('completeOrder')}</h1>
        <p className="text-center text-gray mb-xl">{t('empoweringArtisans')}</p>

        {errorMessage && (
          <div className="checkout-error-banner animate-fade-in" role="alert">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="empty-checkout-card text-center">
            <h3>{t('cartCurrentlyEmpty')}</h3>
            <p className="text-gray mb-lg">{t('tryDifferentCategory')}</p>
            <Link href="/shop" className="btn btn-primary">
              {t('browseMarketplace')}
            </Link>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Left Column: Buyer Shipping Details Form */}
            <div className="checkout-form-card">
              <h2 className="mb-md">{t('buyerDetails')}</h2>
              <form onSubmit={handlePlaceOrder}>
                <div className="form-group mb-md">
                  <label className="field-label" htmlFor="fullName">{t('fullName')}</label>
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
                  <label className="field-label" htmlFor="phone">{t('phoneNumber')}</label>
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
                  <label className="field-label" htmlFor="address">{t('streetAddress')}</label>
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
                  <label className="field-label" htmlFor="city">{t('cityPincode')}</label>
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
                  {isSubmitting ? t('processingOrder') : `${t('placeOrder')} (₹${Math.round(cartTotal).toLocaleString('en-IN')})`}
                </button>
              </form>
            </div>

            {/* Right Column: Order Summary */}
            <div className="checkout-summary-card">
              <h2 className="mb-md">{t('orderSummary')}</h2>
              
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
                  <span>{t('subtotal')}</span>
                  <span>₹{Math.round(cartTotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="pricing-line">
                  <span>{t('artisanShipping')}</span>
                  <span style={{ color: '#2f855a', fontWeight: 'bold' }}>{t('free')}</span>
                </div>
                <div className="pricing-line total-line">
                  <span>{t('totalAmount')}</span>
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
