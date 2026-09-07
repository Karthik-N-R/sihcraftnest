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
            <p>{t('showingProducts', { count: filteredProducts.length })}</p>
            <select className="input select" style={{ width: 'auto' }}>
              <option>{t('sortByNewest')}</option>
              <option>{t('priceLowToHigh')}</option>
              <option>{t('priceHighToLow')}</option>
            </select>
          </div>

          <div className="product-grid-3">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
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
