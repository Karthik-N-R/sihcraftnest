"use client";

import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../context/ProductContext';
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import './shop.css';

export default function Shop() {
  const { products, refreshProducts } = useProducts();
  const { t } = useLanguage() || {};
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  const categories = ['All', 'Pottery & Ceramics', 'Woven Textiles', 'Handmade Jewelry', 'Woodcraft', 'Block Print Art', 'Leather Goods'];

  const filteredProducts = filter === 'All' 
    ? (products || []) 
    : (products || []).filter(p => p.category === filter);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') {
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    }
    if (sortBy === 'price-desc') {
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    }
    // Default: newest
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return 0;
  });

  return (
    <main>
      <Navbar />
      
      <div className="shop-header">
        <div className="container">
          <h1 className="mb-sm">{t('browseCrafts')}</h1>
          <p className="text-gray">{t('discoverCrafts')}</p>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className="shop-sidebar">
          <h3>{t('categories')}</h3>
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
            <p>{t('showingProducts', { count: sortedProducts.length })}</p>
            <select 
              className="input select" 
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">{t('sortByNewest')}</option>
              <option value="price-asc">{t('priceLowToHigh')}</option>
              <option value="price-desc">{t('priceHighToLow')}</option>
            </select>
          </div>

          <div className="product-grid-3">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className="empty-state text-center mt-xl">
              <h3>{t('noProductsFound')}</h3>
              <p>{t('tryDifferentCategory')}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
