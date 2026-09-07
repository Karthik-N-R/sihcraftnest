import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart() || { addToCart: () => {} };
  const { t } = useLanguage() || {};

  if (!product) return null;

  const productName = product.title || product.name || 'CraftNest Product';
  const artisanName = product.artisanName || product.sellerName || 'CraftNest Artisan';

  // Seller's actual selling price ONLY. NEVER use suggestedPrice.
  const price = product.price !== undefined && product.price !== null
    ? Number(product.price)
    : 0;

  const isOutOfStock = product.quantity !== undefined && product.quantity !== null && Number(product.quantity) <= 0;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock-card' : ''}`}>
      <div className="product-image-wrapper">
        <img
          src={product.image || '/images/products/pottery-1.jpg'}
          alt={productName}
          className="product-image"
        />

        {isOutOfStock ? (
          <span className="product-badge out-of-stock-badge">
            {t('outOfStock')}
          </span>
        ) : (
          <span className="product-category">
            {product.category || 'Handcrafted'}
          </span>
        )}
      </div>

      <div className="product-info">
        <div className="product-header">
          <h3 className="product-name">
            {productName}
          </h3>

          <span className="product-price">
            ₹{Math.round(price).toLocaleString('en-IN')}
          </span>
        </div>

        <p className="product-artisan">
          {t('byArtisan')} {artisanName}
        </p>

        <div className="product-rating">
          {'★'.repeat(Math.floor(product.rating || 5))}
          {'☆'.repeat(5 - Math.floor(product.rating || 5))}

          <span className="rating-count">
            ({product.reviews || 0})
          </span>
        </div>

        {product.quantity !== undefined && product.quantity !== null && (
          <p className="stock-count-text">
            {isOutOfStock ? (
              <span className="text-out-of-stock">{t('zeroAvailable')}</span>
            ) : (
              <span className="text-in-stock">{product.quantity} {t('itemsAvailable')}</span>
            )}
          </p>
        )}

        <button
          className={`btn-add-cart ${isOutOfStock ? 'disabled' : ''}`}
          onClick={() => !isOutOfStock && addToCart(product)}
          disabled={isOutOfStock}
          aria-label={`Add ${productName} to cart`}
        >
          {isOutOfStock ? t('outOfStock') : t('addToCart')}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;