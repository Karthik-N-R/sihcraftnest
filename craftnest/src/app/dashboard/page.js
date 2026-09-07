"use client";

import { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isSeller } = useAuth() || {};
  const { products = [], refreshProducts } = useProducts() || {};
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (refreshProducts) {
      refreshProducts();
    }
  }, []);

  if (isLoading) {
    return (
      <main className="dashboard-page">
        <Navbar />
        <div className="container text-center mt-xl p-xl">
          <p className="text-gray">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isSeller) {
    return (
      <main className="dashboard-page">
        <Navbar />
        <div className="container mt-xl">
          <div className="dashboard-card text-center p-xl">
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <h2 className="mt-md mb-xs">{t('sellerAccessOnly')}</h2>
            <p className="text-gray mb-lg">
              {t('buyerNotice', { name: user?.name })}
            </p>
            <div className="btn-group" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/login" className="btn btn-primary">
                {t('switchToSeller')}
              </Link>
              <Link href="/shop" className="btn btn-secondary" style={{ background: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', padding: '10px 20px', borderRadius: '8px' }}>
                {t('browseMarketplace')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Filter products belonging ONLY to the logged-in seller
  const myProducts = products.filter(p => {
    if (!p) return false;
    if (p.artisanId === user.id) return true;
    if (p.artisanName && user.name && p.artisanName.toLowerCase() === user.name.toLowerCase()) return true;
    // Pre-seeded demo seller mapping
    if (user.id === 'u_demo_seller' && (p.artisanId === 'a1' || p.artisanId === 'u_demo_seller' || p.artisanId === 'a_self')) return true;
    return false;
  });

  const totalProductsCount = myProducts.length;
  const totalStockCount = myProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const outOfStockCount = myProducts.filter(p => Number(p.quantity || 0) <= 0).length;

  return (
    <main className="dashboard-page">
      <Navbar />

      <div className="container mt-xl">
        {/* Header Title & Add Product Action */}
        <div className="dashboard-header-row mb-xl">
          <div>
            <span className="badge badge-terracotta mb-xs">{t('artisanPortal')}</span>
            <h1 className="font-accent text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
              {t('sellerDashboardTitle')}
            </h1>
            <p className="text-gray" style={{ margin: '4px 0 0 0' }}>
              {t('dashboardSub')}
            </p>
          </div>

          <button 
            type="button"
            className="btn btn-primary add-product-btn"
            onClick={() => router.push('/sell')}
          >
            {t('addNewProduct')}
          </button>
        </div>

        {/* Stats Overview Grid */}
        <div className="stats-grid mb-xl">
          <div className="stat-card">
            <div className="stat-icon">🎨</div>
            <div className="stat-details">
              <span className="stat-label">{t('artisanAccount')}</span>
              <h3 className="stat-value">{user.name}</h3>
              <span className="stat-subtext">{user.email}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-details">
              <span className="stat-label">{t('totalListings')}</span>
              <h3 className="stat-value">{totalProductsCount}</h3>
              <span className="stat-subtext">{t('activeCraftProducts')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-label">{t('itemsInStock')}</span>
              <h3 className="stat-value">{totalStockCount}</h3>
              <span className="stat-subtext">{t('availableInventory')}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-details">
              <span className="stat-label">{t('outOfStock')}</span>
              <h3 className="stat-value" style={{ color: outOfStockCount > 0 ? '#e53e3e' : 'var(--emerald)' }}>
                {outOfStockCount}
              </h3>
              <span className="stat-subtext">{t('productsRestock')}</span>
            </div>
          </div>
        </div>

        {/* My Products Table / List */}
        <div className="dashboard-card">
          <div className="card-header-row mb-md">
            <h2>{t('myPublishedProducts')} ({totalProductsCount})</h2>
            <span className="text-gray" style={{ fontSize: '0.85rem' }}>
              {t('sellingPriceReflects')}
            </span>
          </div>

          {myProducts.length === 0 ? (
            <div className="empty-dashboard text-center p-xl">
              <span style={{ fontSize: '3rem' }}>🎨</span>
              <h3 className="mt-md mb-xs">{t('noProductsPublishedYet')}</h3>
              <p className="text-gray mb-lg">{t('digitizeFirstCraft')}</p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => router.push('/sell')}
              >
                {t('addNewProduct')}
              </button>
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>{t('product')}</th>
                    <th>{t('category')}</th>
                    <th>{t('sellerPriceTable')}</th>
                    <th>{t('stockQuantity')}</th>
                    <th>{t('inventoryStatus')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {myProducts.map(product => {
                    const priceVal = product.price !== undefined && product.price !== null ? Number(product.price) : 0;
                    const qtyVal = product.quantity !== undefined && product.quantity !== null ? Number(product.quantity) : 0;
                    const isOut = qtyVal <= 0;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-table-cell">
                            <img src={product.image || '/images/products/pottery-1.jpg'} alt={product.title || product.name} className="table-product-thumb" />
                            <div>
                              <strong className="table-product-title">{product.title || product.name}</strong>
                              <p className="table-product-subtext">{product.dimensions || product.size || 'Standard Size'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-terracotta" style={{ fontSize: '0.75rem' }}>
                            {product.category || 'Handcrafted'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--charcoal)', fontSize: '1.05rem' }}>
                            ₹{Math.round(priceVal).toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: isOut ? '#e53e3e' : '#2d3748' }}>
                            {qtyVal}
                          </span>
                        </td>
                        <td>
                          {isOut ? (
                            <span className="stock-status-badge status-out-of-stock">
                              {t('outOfStockStatus')}
                            </span>
                          ) : (
                            <span className="stock-status-badge status-in-stock">
                              {t('inStockStatus')} ({qtyVal})
                            </span>
                          )}
                        </td>
                        <td>
                          <Link href="/shop" className="table-action-link">
                            {t('viewInShop')}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
