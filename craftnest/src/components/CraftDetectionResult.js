import React, { useState, useEffect } from 'react';
import './CraftDetectionResult.css';

export default function CraftDetectionResult({ 
  result,
  imagePreview,
  detectedType = "Handcrafted Item",
  confidence = 88,
  tags = [],
  onCategoryChange,
  onOverride,
  isProcessing = false
}) {
  const currentLabel = result?.craft || result?.label || detectedType;
  const rawConfidence = result?.confidence !== undefined ? result.confidence : (confidence <= 1 ? confidence : confidence / 100);
  const displayConfidence = (rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence).toFixed(1);

  const category = result?.category || "Folk Art";
  const region = result?.region || null;
  const currentTags = result?.tags || tags || [];

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedType, setSelectedType] = useState(currentLabel);

  useEffect(() => {
    if (currentLabel) {
      setSelectedType(currentLabel);
    }
  }, [currentLabel]);

  const commonCategories = [
    "Madhubani Painting",
    "Gond Painting",
    "Warli Painting",
    "Kalighat Painting",
    "Kerala Mural",
    "Pichwai Painting",
    "Kangra Painting",
    "Mandana Art Drawing",
    "Pottery & Ceramics",
    "Woven Textiles",
    "Handmade Jewelry",
    "Woodcraft",
    "Block Print Art",
    "Leather Goods",
    "Metal Work",
    "Embroidery",
    "Other"
  ];

  const handleCategorySelect = (e) => {
    const newCategory = e.target.value;
    setSelectedType(newCategory);
    setIsEditingCategory(false);
    if (onOverride) {
      onOverride(newCategory);
    }
    if (onCategoryChange) {
      onCategoryChange(newCategory);
    }
  };

  if (isProcessing) {
    return (
      <div className="detection-result-container text-center" id="detection-result-container">
        {imagePreview && (
          <div className="detection-image-wrapper mb-md">
            <img src={imagePreview} alt="Craft being classified" className="detection-preview-img" />
          </div>
        )}
        <h4 className="mb-md">Analyzing craft image...</h4>
        <div className="craft-loader mt-lg mb-lg" style={{ justifyContent: 'center' }}>
          <span></span><span></span><span></span><span></span>
        </div>
        <p className="text-gray" style={{ fontSize: '0.9rem' }}>Detecting artisan craft patterns, style, and region using trained EfficientNet AI...</p>
      </div>
    );
  }

  return (
    <div className="detection-result-container" id="detection-result-container">
      {imagePreview && (
        <div className="detection-image-wrapper mb-md">
          <img src={imagePreview} alt="Uploaded craft" className="detection-preview-img" />
        </div>
      )}

      <div className="detection-header" id="detection-header">
        <h3 className="detection-title" id="detection-title">AI Craft Classification</h3>
        <span className="confidence-badge" id="confidence-badge">
          {displayConfidence}% confidence
        </span>
      </div>

      <div className="detection-body" id="detection-body">
        <div className="detected-type-group" id="detected-type-group">
          <span className="label" id="type-label">Detected Craft</span>
          
          {isEditingCategory ? (
            <select 
              className="category-select" 
              id="category-select"
              value={selectedType}
              onChange={handleCategorySelect}
              autoFocus
              onBlur={() => setIsEditingCategory(false)}
            >
              {commonCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : (
            <div className="type-display" id="type-display">
              <h2 className="type-name" id="type-name">{selectedType}</h2>
              <button 
                className="edit-category-btn" 
                id="edit-category-btn"
                type="button"
                onClick={() => setIsEditingCategory(true)}
                title="Change craft type"
              >
                ✎ Override
              </button>
            </div>
          )}

          {category && (
            <p className="text-gray mt-xs" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
              {category}{region ? ` • ${region}` : ''}
            </p>
          )}
        </div>

        <div className="confidence-bar-container" id="confidence-bar-container">
          <div 
            className="confidence-fill" 
            id="confidence-fill"
            style={{ 
              width: `${Math.min(100, Math.max(10, Number(displayConfidence)))}%`, 
              backgroundColor: Number(displayConfidence) > 70 ? 'var(--emerald)' : 'var(--saffron)' 
            }}
          ></div>
        </div>

        {currentTags.length > 0 && (
          <div className="tags-container" id="tags-container">
            <span className="label" id="tags-label">Detected Attributes</span>
            <div className="tags-list" id="tags-list">
              {currentTags.map((tag, i) => (
                <span key={i} className="tag-pill" id={`tag-pill-${i}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
