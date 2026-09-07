import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { cartCount = 0 } = useCart() || {};
  const itemCount = cartCount;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          CraftNest
        </Link>
        <div className="navbar-links">
          <Link href="/categories" className="nav-link">Categories</Link>
          <Link href="/artisans" className="nav-link">Artisans</Link>
          <Link href="/about" className="nav-link">About</Link>
        </div>
        <div className="navbar-actions">
          <Link href="/sell" className="btn-sell">+ Sell</Link>
          <Link href="/cart" className="navbar-cart" aria-label="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
