import React from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart() || { addToCart: () => {} };

  if (!product) return null;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={product.image || 'https://via.placeholder.com/300'} alt={product.name} className="product-image" />
        <span className="product-category">{product.category}</span>
      </div>
      <div className="product-info">
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          <span className="product-price">₹{Math.round(Number(product.price) || 0).toLocaleString('en-IN')}</span>
        </div>
        <p className="product-artisan">by {product.artisanName}</p>
        <div className="product-rating">
          {'★'.repeat(Math.floor(product.rating || 5))}
          {'☆'.repeat(5 - Math.floor(product.rating || 5))}
          <span className="rating-count">({product.reviews || 0})</span>
        </div>
        <button 
          className="btn-add-cart"
          onClick={() => addToCart(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
