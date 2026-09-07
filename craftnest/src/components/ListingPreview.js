import React, { useState } from 'react';
import './ListingPreview.css';

export default function ListingPreview({ 
  listingData = {}, 
  onChange, 
  imagePreview 
}) {
  const [isEditing, setIsEditing] = useState(false);

  const data = listingData || {};

  const handleFieldChange = (field, value) => {
    if (onChange) {
      onChange({
        ...data,
        [field]: value
      });
    }
  };

  const handleMaterialsChange = (value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange('materials', arr);
  };

  const handleTagsChange = (value) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    handleFieldChange('seoTags', arr);
  };

  const materialsArray = Array.isArray(data.materials) 
    ? data.materials 
    : (data.materials ? [data.materials] : []);

  const tagsArray = Array.isArray(data.seoTags) 
    ? data.seoTags 
    : (Array.isArray(data.tags) ? data.tags : (typeof data.seoTags === 'string' ? data.seoTags.split(',').map(s => s.trim()).filter(Boolean) : []));

  const sellerPrice = data.price !== undefined && data.price !== null ? data.price : '';
  const displaySellerPrice = sellerPrice !== '' && !isNaN(sellerPrice) 
    ? `₹${Number(sellerPrice).toLocaleString('en-IN')}` 
    : null;

  const suggestedPrice = data.suggestedPrice !== undefined && data.suggestedPrice !== null ? data.suggestedPrice : '';
  const displaySuggestedPrice = suggestedPrice !== '' && !isNaN(suggestedPrice) 
    ? `₹${Number(suggestedPrice).toLocaleString('en-IN')}` 
    : null;

  const sizeVal = data.size || data.dimensions || '';

  return (
    <div className="listing-preview-container" id="listing-preview-container">
      <div className="preview-header" id="preview-header">
        <div className="preview-header-left">
          <h2 className="preview-title" id="preview-title">Generated Catalog</h2>
          <span className="ai-badge">✨ Gemini AI Generated</span>
        </div>
        <button 
          className="toggle-edit-btn" 
          onClick={() => setIsEditing(!isEditing)} 
          type="button"
          id="toggle-edit-btn"
        >
          {isEditing ? 'Done Editing' : '✎ Edit Listing'}
        </button>
      </div>

      {imagePreview && (
        <div className="preview-image-banner">
          <img src={imagePreview} alt="Craft thumbnail" className="preview-thumbnail" />
          <div>
            <strong style={{ fontSize: '0.9rem' }}>Product Photo</strong>
            <p className="text-gray" style={{ margin: 0, fontSize: '0.8rem' }}>Uploaded artisan photo attached to this listing</p>
          </div>
        </div>
      )}

      <div className="preview-content" id="preview-content">
        {/* Title */}
        <div className="field-group" id="field-group-title">
          <label className="field-label" htmlFor="title">Product Title</label>
          {isEditing ? (
            <input 
              type="text" 
              id="title" 
              name="title" 
              className="field-input" 
              value={data.title || ''} 
              placeholder="e.g. Handcrafted Madhubani Folk Art Painting"
              onChange={(e) => handleFieldChange('title', e.target.value)} 
            />
          ) : (
            <div className="field-value main-title" id="val-title">
              {data.title || <span className="field-value not-provided">Not provided</span>}
            </div>
          )}
        </div>

        {/* Pricing Row: Seller Price vs AI Suggested Price vs Category */}
        <div className="price-category-row" id="price-category-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {/* Seller Price */}
          <div className="field-group" id="field-group-seller-price">
            <label className="field-label" htmlFor="price">Selling Price (₹ INR)</label>
            {isEditing ? (
              <input 
                type="number" 
                id="price" 
                name="price" 
                className="field-input" 
                value={sellerPrice} 
                placeholder="e.g. 1200"
                onChange={(e) => handleFieldChange('price', e.target.value === '' ? null : Number(e.target.value))} 
              />
            ) : (
              <div className="field-value price-val" id="val-seller-price" style={{ color: 'var(--terracotta)', fontWeight: 'bold' }}>
                {displaySellerPrice || <span className="field-value not-provided">Not specified</span>}
              </div>
            )}
          </div>

          {/* AI Suggested Price */}
          <div className="field-group" id="field-group-suggested-price">
            <label className="field-label" htmlFor="suggestedPrice">AI Suggested Price (₹)</label>
            {isEditing ? (
              <input 
                type="number" 
                id="suggestedPrice" 
                name="suggestedPrice" 
                className="field-input" 
                value={suggestedPrice} 
                placeholder="e.g. 2500"
                onChange={(e) => handleFieldChange('suggestedPrice', e.target.value === '' ? null : Number(e.target.value))} 
              />
            ) : (
              <div className="field-value" id="val-suggested-price" style={{ fontSize: '1rem' }}>
                {displaySuggestedPrice || <span className="field-value not-provided">Not generated</span>}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="field-group" id="field-group-category">
            <label className="field-label" htmlFor="category">Category</label>
            {isEditing ? (
              <input 
                type="text" 
                id="category" 
                name="category" 
                className="field-input" 
                value={data.category || ''} 
                placeholder="e.g. Folk Art"
                onChange={(e) => handleFieldChange('category', e.target.value)} 
              />
            ) : (
              <div className="field-value" id="val-category">
                <span className="category-badge">{data.category || 'Handcrafted'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mandatory Details Grid: Quantity & Size */}
        <div className="details-grid" id="mandatory-details-grid">
          {/* Quantity */}
          <div className="field-group" id="field-group-quantity">
            <label className="field-label" htmlFor="quantity">Available Quantity</label>
            {isEditing ? (
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                className="field-input" 
                value={data.quantity !== undefined && data.quantity !== null ? data.quantity : ''} 
                placeholder="e.g. 40"
                onChange={(e) => handleFieldChange('quantity', e.target.value === '' ? null : Number(e.target.value))} 
              />
            ) : (
              <div className="field-value" id="val-quantity">
                {data.quantity !== undefined && data.quantity !== null ? `${data.quantity} units` : <span className="field-value not-provided">Not provided</span>}
              </div>
            )}
          </div>

          {/* Size / Dimensions */}
          <div className="field-group" id="field-group-size">
            <label className="field-label" htmlFor="size">Size / Dimensions</label>
            {isEditing ? (
              <input 
                type="text" 
                id="size" 
                name="size" 
                className="field-input" 
                value={sizeVal} 
                onChange={(e) => {
                  handleFieldChange('size', e.target.value);
                  handleFieldChange('dimensions', e.target.value);
                }} 
                placeholder="e.g. 12 x 18 inches"
              />
            ) : (
              <div className="field-value" id="val-size">
                {sizeVal ? (
                  <span>
                    {sizeVal} {data.sizeStatus === 'estimated' && <span className="badge badge-terracotta ml-xs" style={{ fontSize: '0.7rem' }}>AI Estimated</span>}
                  </span>
                ) : <span className="field-value not-provided">Not provided</span>}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="field-group" id="field-group-description">
          <label className="field-label" htmlFor="description">Product Description</label>
          {isEditing ? (
            <textarea 
              id="description" 
              name="description" 
              className="field-textarea" 
              value={data.description || ''} 
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={4}
              placeholder="Describe your craft..."
            />
          ) : (
            <div className="field-value description-val" id="val-description">
              {data.description || <span className="field-value not-provided">Not provided</span>}
            </div>
          )}
        </div>

        <div className="details-grid" id="details-grid">
          {/* Materials */}
          <div className="field-group" id="field-group-materials">
            <label className="field-label" htmlFor="materials">Materials</label>
            {isEditing ? (
              <input 
                type="text" 
                id="materials" 
                name="materials" 
                className="field-input" 
                value={materialsArray.join(', ')} 
                onChange={(e) => handleMaterialsChange(e.target.value)} 
                placeholder="e.g. Handmade paper, Natural dyes (comma-separated)"
              />
            ) : (
              <div className="field-value" id="val-materials">
                {materialsArray.length > 0 ? materialsArray.join(', ') : <span className="field-value not-provided">Not provided</span>}
              </div>
            )}
          </div>

          {/* Colour */}
          <div className="field-group" id="field-group-colour">
            <label className="field-label" htmlFor="colour">Colour</label>
            {isEditing ? (
              <input 
                type="text" 
                id="colour" 
                name="colour" 
                className="field-input" 
                value={data.colour || ''} 
                onChange={(e) => handleFieldChange('colour', e.target.value)} 
                placeholder="e.g. Multicolour, Terracotta, Indigo"
              />
            ) : (
              <div className="field-value" id="val-colour">
                {data.colour || <span className="field-value not-provided">Not provided</span>}
              </div>
            )}
          </div>
        </div>

        <div className="details-grid" id="details-grid-secondary">
          {/* Care Instructions */}
          <div className="field-group" id="field-group-care">
            <label className="field-label" htmlFor="careInstructions">Care Instructions</label>
            {isEditing ? (
              <input 
                type="text" 
                id="careInstructions" 
                name="careInstructions" 
                className="field-input" 
                value={data.careInstructions || ''} 
                onChange={(e) => handleFieldChange('careInstructions', e.target.value)} 
                placeholder="e.g. Frame under glass. Keep dry."
              />
            ) : (
              <div className="field-value" id="val-care">
                {data.careInstructions || <span className="field-value not-provided">Not provided</span>}
              </div>
            )}
          </div>
        </div>

        {/* SEO Tags */}
        <div className="field-group" id="field-group-seo">
          <label className="field-label" htmlFor="seoTags">Marketplace Tags</label>
          {isEditing ? (
            <input 
              type="text" 
              id="seoTags" 
              name="seoTags" 
              className="field-input" 
              value={tagsArray.join(', ')} 
              onChange={(e) => handleTagsChange(e.target.value)} 
              placeholder="Comma separated tags (e.g. madhubani, folk art, painting)"
            />
          ) : (
            <div className="field-value" id="val-seo">
              {tagsArray.length > 0 ? (
                <div className="seo-tags-list">
                  {tagsArray.map((tag, idx) => (
                    <span key={idx} className="seo-tag">{tag}</span>
                  ))}
                </div>
              ) : (
                <span className="field-value not-provided">No tags generated</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
