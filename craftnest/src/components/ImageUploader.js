import React, { useState, useRef, useEffect } from 'react';
import './ImageUploader.css';

export default function ImageUploader({ onImageSelect, onUpload, currentPreview }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentPreview || null);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (currentPreview !== undefined) {
      setPreview(currentPreview);
    }
  }, [currentPreview]);

  const notifyParent = (file, dataUrl) => {
    if (onImageSelect) {
      onImageSelect(file, dataUrl);
    }
    if (onUpload) {
      onUpload(file, dataUrl);
    }
  };

  const handleDrag = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      notifyParent(file, dataUrl);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setPreview(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = '';
    notifyParent(null, null);
  };

  return (
    <div className="image-uploader-wrapper" id="image-uploader-wrapper">
      <form 
        id="image-upload-form" 
        className={`image-uploader-container ${dragActive ? "drag-active" : ""} ${preview ? "has-preview" : ""}`}
        onDragEnter={handleDrag} 
        onSubmit={(e) => e.preventDefault()}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef} 
          type="file" 
          id="image-upload-input" 
          multiple={false} 
          accept="image/*" 
          onChange={handleChange} 
        />
        
        {preview ? (
          <div className="image-preview-container" id="image-preview-container">
            <img src={preview} alt="Upload preview" className="image-preview" id="image-preview" />
            <button className="clear-image-btn" id="clear-image-btn" type="button" onClick={clearImage}>
              ✕
            </button>
          </div>
        ) : (
          <div className="upload-prompt" id="upload-prompt">
            <div className="upload-icon" id="upload-icon">📸</div>
            <p className="upload-text" id="upload-text">Drag & drop your craft image here</p>
            <span className="upload-subtext" id="upload-subtext">or click to browse files</span>
            {errorMessage && (
              <p className="upload-error" style={{ color: 'var(--terracotta)', marginTop: '8px', fontSize: '0.9rem' }}>
                {errorMessage}
              </p>
            )}
          </div>
        )}

        {dragActive && !preview && (
          <div 
            id="drag-file-element" 
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
          ></div>
        )}
      </form>
    </div>
  );
}
