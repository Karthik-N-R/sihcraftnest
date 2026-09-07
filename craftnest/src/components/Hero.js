import React from 'react';
import Link from 'next/link';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Discover Handcrafted Treasures</h1>
        <p className="hero-subtitle">
          Unique artisanal pieces directly from creators to your home.
        </p>
        <div className="hero-actions">
          <Link href="/shop" className="btn-primary">Browse Crafts</Link>
          <Link href="/sell" className="btn-secondary">Start Selling</Link>
        </div>
      </div>
      <div className="hero-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </section>
  );
};

export default Hero;
