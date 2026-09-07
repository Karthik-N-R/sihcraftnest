"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

const Navbar = () => {
  const { cartCount = 0, setIsOpen } = useCart() || {};
  const { user, logout } = useAuth() || {};
  const { language, setLanguage, t } = useLanguage() || {};
  const itemCount = cartCount;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          {t('appName')}
        </Link>

        <div className="navbar-links">
          <Link href="/shop" className="nav-link">{t('shopCrafts')}</Link>
          {user?.role === 'seller' ? (
            <Link href="/dashboard" className="nav-link">{t('sellerDashboard')}</Link>
          ) : (
            <Link href="/sell" className="nav-link">{t('artisanPortal')}</Link>
          )}
        </div>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* UI Language Selector */}
          <div className="ui-language-selector" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '1.1rem' }} aria-hidden="true">🌐</span>
            <select
              value={language || 'en'}
              onChange={(e) => setLanguage && setLanguage(e.target.value)}
              className="lang-select-dropdown"
              style={{
                background: '#fffaf5',
                border: '1px solid #fbd38d',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#7b341e',
                cursor: 'pointer'
              }}
              aria-label="Select UI Language"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <Link href="/sell" className="btn-sell">{t('sellCraft')}</Link>

          {/* Cart Icon */}
          <button 
            className="navbar-cart" 
            onClick={() => setIsOpen && setIsOpen(true)} 
            aria-label="Cart"
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          {/* User Auth Info & Actions */}
          {user ? (
            <div className="user-profile-menu" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-name-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                👤 {user.name}
              </span>
              <span className="badge badge-terracotta" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                {user.role}
              </span>
              <button 
                type="button" 
                className="btn-logout"
                onClick={logout}
                style={{
                  background: '#edf2f7',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login" className="nav-link" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {t('logIn')}
              </Link>
              <Link href="/signup" className="nav-link" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--terracotta)' }}>
                {t('signUp')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
