import { initialProducts } from '../data/products.js';

// In-memory store for the lifetime of the server process
let products = [...initialProducts];

export function normalizeProduct(input = {}) {
  const name = (input.name || input.title || 'Handcrafted Artisan Craft').trim();

  const rawPrice = input.price !== undefined && input.price !== null 
    ? input.price 
    : (input.suggestedPrice !== undefined && input.suggestedPrice !== null ? input.suggestedPrice : 1500);
  const price = Number(rawPrice) || 0;

  let materials = [];
  if (Array.isArray(input.materials)) {
    materials = input.materials.map(m => String(m).trim()).filter(Boolean);
  } else if (typeof input.materials === 'string' && input.materials.trim()) {
    materials = input.materials.split(',').map(m => m.trim()).filter(Boolean);
  }

  let tags = [];
  const rawTags = input.tags || input.seoTags || [];
  if (Array.isArray(rawTags)) {
    tags = rawTags.map(t => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string' && rawTags.trim()) {
    tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
  }

  return {
    id: input.id || `p${Date.now()}`,
    name,
    price,
    currency: 'INR',
    category: input.category || 'Handcrafted',
    description: input.description || 'Authentic handcrafted piece crafted by traditional artisans.',
    image: input.image || '/images/products/pottery-1.jpg',
    artisanId: input.artisanId || "a_self",
    artisanName: input.artisanName || (input.location ? `Artisan (${input.location})` : "You (Artisan)"),
    rating: input.rating !== undefined ? input.rating : 5.0,
    reviews: input.reviews !== undefined ? input.reviews : 1,
    materials,
    dimensions: input.dimensions || null,
    quantity: input.quantity !== undefined && input.quantity !== null ? input.quantity : 1,
    location: input.location || null,
    careInstructions: input.careInstructions || null,
    tags,
    createdAt: input.createdAt || new Date().toISOString()
  };
}

export function getProducts() {
  return products;
}

export function getProductById(id) {
  return products.find(p => p.id === id);
}

export function addProduct(productData) {
  const newProduct = normalizeProduct(productData);
  
  // Prepend so the newly published product appears first in the marketplace feed
  products = [newProduct, ...products];
  return newProduct;
}

