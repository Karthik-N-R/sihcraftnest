"use client";

import { useEffect, useState } from 'react';
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
  const { products = [], refreshProducts, updateQuantity, updateProduct } = useProducts() || {};
  const { t } = useLanguage();

  const [optimizingProductId, setOptimizingProductId] = useState(null);
  const [optimizationModal, setOptimizationModal] = useState(null);
  const [optimizationError, setOptimizationError] = useState(null);

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
  const b2bReadyCount = myProducts.filter(p => p.b2bSpecs?.isB2bReady).length;

  // AI Optimization Call
  const handleOptimizeClick = async (product) => {
    setOptimizingProductId(product.id);
    setOptimizationError(null);

    try {
      const res = await fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'optimize',
          product
        })
      });

      const data = await res.json();

      if (res.ok && !data.error) {
        setOptimizationModal({
          productId: product.id,
          originalTitle: product.title || product.name || '',
          originalDescription: product.description || '',
          title: data.optimizedTitle || product.title || product.name || '',
          description: data.optimizedDescription || product.description || '',
          materials: Array.isArray(data.optimizedMaterials) ? data.optimizedMaterials.join(', ') : (product.materials?.join(', ') || ''),
          tags: Array.isArray(data.b2bKeywords) ? data.b2bKeywords.join(', ') : (product.tags?.join(', ') || ''),
          moq: data.suggestedMoq !== undefined && data.suggestedMoq !== null ? data.suggestedMoq : 10,
          leadTime: data.suggestedLeadTime || '2-3 weeks for bulk orders',
          packaging: data.suggestedPackaging || 'Individual bubble wrap with protective eco-friendly box',
          wholesaleDiscount: data.suggestedWholesaleDiscount || '10% off on orders above 25 units'
        });
      } else {
        setOptimizationError(data.error || 'Failed to generate B2B optimization suggestions.');
      }
    } catch (err) {
      console.error('AI optimization failed:', err);
      setOptimizationError('Connection error during AI optimization.');
    } finally {
      setOptimizingProductId(null);
    }
  };

  // Seller approves and saves AI suggestions
  const handleApproveB2b = async () => {
    if (!optimizationModal || !updateProduct) return;

    const updatedFields = {
      title: (optimizationModal.title || '').trim(),
      description: (optimizationModal.description || '').trim(),
      materials: (optimizationModal.materials || '').split(',').map(m => m.trim()).filter(Boolean),
      tags: (optimizationModal.tags || '').split(',').map(t => t.trim()).filter(Boolean),
      b2bSpecs: {
        moq: Number(optimizationModal.moq) || 10,
        leadTime: (optimizationModal.leadTime || '').trim(),
        packaging: (optimizationModal.packaging || '').trim(),
        wholesaleDiscount: (optimizationModal.wholesaleDiscount || '').trim(),
        isB2bReady: true
      }
    };

    const success = await updateProduct(optimizationModal.productId, updatedFields);
    if (success) {
      setOptimizationModal(null);
    } else {
      setOptimizationError('Failed to save B2B specs to product store.');
    }
  };

  // Export Catalogue as CSV
  const handleExportCsv = () => {
    if (myProducts.length === 0) return;

    const headers = [
      "ID",
      "Title",
      "Category",
      "Price (INR)",
      "Stock Quantity",
      "Materials",
      "Tags",
      "B2B Status",
      "MOQ",
      "Lead Time",
      "Packaging",
      "Wholesale Discount"
    ];

    const rows = myProducts.map(p => [
      `"${p.id}"`,
      `"${(p.title || p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.price || 0,
      p.quantity || 0,
      `"${(Array.isArray(p.materials) ? p.materials.join(', ') : (p.materials || '')).replace(/"/g, '""')}"`,
      `"${(Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '')).replace(/"/g, '""')}"`,
      p.b2bSpecs?.isB2bReady ? "B2B Ready" : "Standard",
      p.b2bSpecs?.moq || "",
      `"${(p.b2bSpecs?.leadTime || '').replace(/"/g, '""')}"`,
      `"${(p.b2bSpecs?.packaging || '').replace(/"/g, '""')}"`,
      `"${(p.b2bSpecs?.wholesaleDiscount || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `craftnest_b2b_catalogue_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Catalogue as JSON
  const handleExportJson = () => {
    if (myProducts.length === 0) return;

    const jsonContent = JSON.stringify(myProducts, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `craftnest_b2b_catalogue_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="dashboard-page">
      <Navbar />

      <div className="container mt-xl">
        {/* Header Title & Actions */}
        <div className="dashboard-header-row mb-xl">
          <div>
            <span className="badge badge-terracotta mb-xs">{t('artisanPortal')}</span>
            <h1 className="font-heading text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
              {t('sellerDashboardTitle')}
            </h1>
            <p className="text-gray" style={{ margin: '4px 0 0 0' }}>
              {t('dashboardSub')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {myProducts.length > 0 && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e0', color: '#2d3748', fontWeight: '600' }}
                  onClick={handleExportCsv}
                  title="Export catalog as Excel-ready CSV"
                >
                  {t('exportCsv')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e0', color: '#2d3748', fontWeight: '600' }}
                  onClick={handleExportJson}
                  title="Export catalog as JSON"
                >
                  {t('exportJson')}
                </button>
              </>
            )}

            <button 
              type="button"
              className="btn btn-primary add-product-btn"
              onClick={() => router.push('/sell')}
            >
              {t('addNewProduct')}
            </button>
          </div>
        </div>

        {optimizationError && (
          <div className="checkout-error-banner mb-lg" role="alert" style={{ background: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '8px', border: '1px solid #feb2b2', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚠️</span>
            <div>{optimizationError}</div>
          </div>
        )}

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
            <div className="stat-icon">✨</div>
            <div className="stat-details">
              <span className="stat-label">B2B Ready Listings</span>
              <h3 className="stat-value" style={{ color: b2bReadyCount > 0 ? '#16a34a' : '#4a5568' }}>
                {b2bReadyCount} / {totalProductsCount}
              </h3>
              <span className="stat-subtext">Approved B2B Catalogue</span>
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
        <div className="dashboard-card mb-xl">
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
                    const isOptimizing = optimizingProductId === product.id;
                    const isB2b = Boolean(product.b2bSpecs?.isB2bReady);

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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e0',
                                background: '#edf2f7',
                                cursor: qtyVal > 0 ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2d3748',
                                lineHeight: 1
                              }}
                              onClick={() => updateQuantity && updateQuantity(product.id, Math.max(0, qtyVal - 1))}
                              disabled={qtyVal <= 0}
                              aria-label="Decrease stock"
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: isOut ? '#e53e3e' : '#2d3748', minWidth: '24px', textAlign: 'center' }}>
                              {qtyVal}
                            </span>
                            <button
                              type="button"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e0',
                                background: '#edf2f7',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#2d3748',
                                lineHeight: 1
                              }}
                              onClick={() => updateQuantity && updateQuantity(product.id, qtyVal + 1)}
                              aria-label="Increase stock"
                            >
                              +
                            </button>
                          </div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            <Link href="/shop" className="table-action-link">
                              {t('viewInShop')}
                            </Link>

                            {isB2b ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px', border: '1px solid #86efac' }}>
                                  {t('b2bReady')}
                                </span>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => handleOptimizeClick(product)}
                                >
                                  Re-optimize
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '5px 10px',
                                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: isOptimizing ? 'wait' : 'pointer',
                                  fontWeight: '600',
                                  boxShadow: '0 2px 5px rgba(124, 58, 237, 0.2)'
                                }}
                                onClick={() => handleOptimizeClick(product)}
                                disabled={isOptimizing}
                              >
                                {isOptimizing ? t('optimizingListing') : t('aiOptimize')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* B2B & Government Opportunities Guided Section */}
        <div className="dashboard-card mb-xl" style={{ borderLeft: '4px solid #4f46e5' }}>
          <div className="mb-md">
            <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
              Institutional Access
            </span>
            <h2 className="font-heading mt-xs" style={{ fontSize: '1.6rem', color: '#1e1b4b', margin: '6px 0 2px 0' }}>
              {t('b2bOpportunities')}
            </h2>
            <p className="text-gray" style={{ fontSize: '0.9rem', margin: 0 }}>
              {t('b2bOpportunitiesSub')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Opportunity Card 1: GeM */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏛️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>GeM Portal</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Government e-Marketplace</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Public procurement portal for Government Ministries, PSUs & Departments. Artisans get direct procurement access without intermediaries.
                </p>
                <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#1e40af', marginBottom: '16px' }}>
                  💡 <strong>Tip:</strong> Use your exported CSV catalog to upload items under the Artisan/Handicraft seller category.
                </div>
              </div>
              <a
                href="https://gem.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ textAlign: 'center', fontSize: '0.85rem', padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e0', color: '#1e293b' }}
              >
                Visit Official GeM Portal ↗
              </a>
            </div>

            {/* Opportunity Card 2: TRIFED */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🌿</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>TRIFED / Tribes India</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Tribal Cooperative Marketing Federation</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Empanels traditional tribal artisans to showcase authentic heritage crafts in Tribes India retail outlets and national exhibitions.
                </p>
                <div style={{ background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#166534', marginBottom: '16px' }}>
                  💡 <strong>Empanelment:</strong> Provides marketing support and fair-trade pricing to registered artisan clusters.
                </div>
              </div>
              <a
                href="https://trifed.tribal.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ textAlign: 'center', fontSize: '0.85rem', padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e0', color: '#1e293b' }}
              >
                Visit Official TRIFED Portal ↗
              </a>
            </div>

            {/* Opportunity Card 3: IndiaMART */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏭</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>IndiaMART & B2B Wholesale</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Bulk Commercial Buyers</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', marginBottom: '12px' }}>
                  Connect with corporate gift buyers, hotel chains, interior decorators, and international exporters seeking bulk handcrafted orders.
                </p>
                <div style={{ background: '#faf5ff', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#6b21a8', marginBottom: '16px' }}>
                  💡 <strong>Bulk Quotes:</strong> Attach your approved B2B specs (MOQ & lead time) when responding to RFQs.
                </div>
              </div>
              <a
                href="https://www.indiamart.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ textAlign: 'center', fontSize: '0.85rem', padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e0', color: '#1e293b' }}
              >
                Explore Wholesale Opportunities ↗
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* AI OPTIMIZATION & B2B REVIEW MODAL */}
      {optimizationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', color: '#1e1b4b' }}>
                ✨ AI Listing Optimization (B2B Commercial Review)
              </h2>
              <button
                type="button"
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setOptimizationModal(null)}
              >
                ✕
              </button>
            </div>

            {/* MANDATORY PROMINENT DISCLAIMER */}
            <div style={{ background: '#fffbebfb', border: '1px solid #fef08a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#854d0e', fontSize: '0.9rem', display: 'block' }}>
                  {t('aiSuggestedReview')}
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#a16207', lineHeight: '1.4' }}>
                  These commercial values (MOQ, Lead Time, Packaging, Discounts) are AI recommendations. Please review and edit them to match your actual capacity before approving.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Title */}
              <div>
                <label className="field-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155' }}>
                  Optimized Product Title:
                </label>
                <input
                  type="text"
                  className="input"
                  value={optimizationModal.title}
                  onChange={(e) => setOptimizationModal({ ...optimizationModal, title: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              {/* Product Description */}
              <div>
                <label className="field-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155' }}>
                  B2B Product Description:
                </label>
                <textarea
                  className="input"
                  rows={4}
                  value={optimizationModal.description}
                  onChange={(e) => setOptimizationModal({ ...optimizationModal, description: e.target.value })}
                  style={{ width: '100%', marginTop: '4px', resize: 'vertical' }}
                />
              </div>

              {/* Materials & Keywords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155' }}>
                    Materials (comma separated):
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={optimizationModal.materials}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, materials: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#334155' }}>
                    B2B Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={optimizationModal.tags}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, tags: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: '700' }}>
                Commercial B2B Specifications (Suggested)
              </h4>

              {/* MOQ & Lead Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>
                    {t('moqLabel')}:
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={optimizationModal.moq}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, moq: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>
                    {t('leadTimeLabel')}:
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={optimizationModal.leadTime}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, leadTime: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              {/* Packaging & Wholesale Discount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>
                    {t('packagingLabel')}:
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={optimizationModal.packaging}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, packaging: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label className="field-label" style={{ fontWeight: '600', fontSize: '0.8rem', color: '#475569' }}>
                    {t('wholesaleDiscountLabel')}:
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={optimizationModal.wholesaleDiscount}
                    onChange={(e) => setOptimizationModal({ ...optimizationModal, wholesaleDiscount: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ background: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0' }}
                  onClick={() => setOptimizationModal(null)}
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: 'none' }}
                  onClick={handleApproveB2b}
                >
                  {t('approveAndSaveB2b')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
