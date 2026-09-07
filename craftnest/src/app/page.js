"use client";

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useEffect } from 'react';

export default function Home() {
  const { products, refreshProducts } = useProducts();

  // On mount, we might want to refresh to get latest products
  useEffect(() => {
    refreshProducts();
  }, []);

  return (
    <main>
      <Navbar />
      <Hero />
      
      <section className="section-sand" style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div className="section-divider"></div>
          <h2 className="text-center mb-xl">Trending Crafts</h2>
          
          <div className="product-grid">
            {products.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      
      <section className="section-white" style={{ padding: 'var(--space-4xl) 0' }}>
        <div className="container">
          <div className="section-divider"></div>
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="mb-md">Empowering Artisans</h2>
            <p className="mb-lg" style={{ fontSize: 'var(--text-lg)', color: 'var(--charcoal-light)' }}>
              CraftNest is more than a marketplace. We use cutting-edge AI to help artisans digitize their crafts using just their voice and phone camera, bringing traditional artistry to the global market.
            </p>
            <a href="/sell" className="btn btn-primary btn-lg">
              Start Selling Your Craft
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
