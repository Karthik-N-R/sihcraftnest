"use client";

import React, { useState, useEffect } from 'react';
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

  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('craftnest_theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      console.error('Failed to load theme preference', e);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('craftnest_theme', nextTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          <span className="logo-brand-text">CraftNest</span>
        </Link>

        <div className="navbar-links">
          <Link href="/shop" className="nav-link">{t('shopCrafts')}</Link>
          {user?.role === 'seller' ? (
            <Link href="/dashboard" className="nav-link">{t('sellerDashboard')}</Link>
          ) : (
            <Link href="/sell" className="nav-link">{t('artisanPortal')}</Link>
          )}
        </div>

        <div className="navbar-actions">
          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* UI Language Selector */}
          <div className="ui-language-selector">
            <span className="lang-globe-icon" aria-hidden="true">🌐</span>
            <select
              value={language || 'en'}
              onChange={(e) => setLanguage && setLanguage(e.target.value)}
              className="lang-select-dropdown"
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </button>

          {/* User Auth Info & Actions */}
          {user ? (
            <div className="user-profile-menu">
              <span className="user-name-label">
                👤 {user.name}
              </span>
              <span className="badge badge-terracotta user-role-badge">
                {user.role}
              </span>
              <button 
                type="button" 
                className="btn-logout"
                onClick={logout}
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <Link href="/login" className="nav-link nav-auth-link">
                {t('logIn')}
              </Link>
              <Link href="/signup" className="nav-link nav-auth-link nav-signup-link">
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
