import React from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart() || { addToCart: () => {} };

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
            OUT OF STOCK
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
          by {artisanName}
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
              <span className="text-out-of-stock">0 items available</span>
            ) : (
              <span className="text-in-stock">{product.quantity} available</span>
            )}
          </p>
        )}

        <button
          className={`btn-add-cart ${isOutOfStock ? 'disabled' : ''}`}
          onClick={() => !isOutOfStock && addToCart(product)}
          disabled={isOutOfStock}
          aria-label={`Add ${productName} to cart`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;