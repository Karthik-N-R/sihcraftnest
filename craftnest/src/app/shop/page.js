"use client";

import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../context/ProductContext';
import { useState, useEffect } from 'react';
import './shop.css';

export default function Shop() {
  const { products, refreshProducts } = useProducts();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  const categories = ['All', 'Pottery & Ceramics', 'Woven Textiles', 'Handmade Jewelry', 'Woodcraft', 'Block Print Art', 'Leather Goods'];

  const filteredProducts = filter === 'All' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <main>
      <Navbar />
      
      <div className="shop-header">
        <div className="container">
          <h1 className="mb-sm">Browse Crafts</h1>
          <p className="text-gray">Discover unique items from artisans across the globe.</p>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className="shop-sidebar">
          <h3>Categories</h3>
          <ul className="category-list mt-md">
            {categories.map(cat => (
              <li key={cat}>
                <button 
                  className={`category-btn ${filter === cat ? 'active' : ''}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="shop-main">
          <div className="shop-controls mb-xl">
            <p>Showing {filteredProducts.length} products</p>
            <select className="input select" style={{ width: 'auto' }}>
              <option>Sort by: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          <div className="product-grid-3">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state text-center mt-xl">
              <h3>No products found</h3>
              <p>Try selecting a different category.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
