import { initialProducts } from '../data/products.js';

// In-memory store for the lifetime of the server process
let products = [...initialProducts];

export function normalizeProduct(input = {}) {
  const name = (input.name || input.title || 'Handcrafted Artisan Craft').trim();

  // Price MUST be seller's actual price. NEVER use suggestedPrice as selling price!
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

  const rawQty = input.quantity !== undefined && input.quantity !== null ? Number(input.quantity) : 1;

  return {
    id: input.id || `p${Date.now()}`,
    name,
    title: name,
    price,
    suggestedPrice: input.suggestedPrice !== undefined ? Number(input.suggestedPrice) : null,
    currency: 'INR',
    category: input.category || 'Handcrafted',
    description: input.description || 'Authentic handcrafted piece crafted by traditional artisans.',
    image: input.image || '/images/products/pottery-1.jpg',
    artisanId: input.artisanId || "a_self",
    artisanName: input.artisanName || input.sellerName || (input.location ? `Artisan (${input.location})` : "You (Artisan)"),
    rating: input.rating !== undefined ? input.rating : 5.0,
    reviews: input.reviews !== undefined ? input.reviews : 1,
    materials,
    dimensions: input.dimensions || input.size || null,
    size: input.size || input.dimensions || null,
    quantity: isNaN(rawQty) ? 1 : Math.max(0, rawQty),
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

export function purchaseProducts(cartItems = []) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { success: false, error: 'Cart is empty.' };
  }

  // 1. Verify availability for all items
  for (const item of cartItems) {
    const targetProduct = products.find(p => p.id === item.id);
    if (!targetProduct) {
      return { success: false, error: `Product "${item.name || item.id}" not found in inventory.` };
    }
    const currentStock = targetProduct.quantity !== undefined && targetProduct.quantity !== null ? Number(targetProduct.quantity) : 0;
    const requestedQty = Number(item.quantity) || 1;

    if (requestedQty > currentStock) {
      return { 
        success: false, 
        error: `Requested quantity (${requestedQty}) for "${targetProduct.name || targetProduct.title}" exceeds available stock (${currentStock}).` 
      };
    }
  }

  // 2. Perform stock reduction
  const purchasedSummary = [];
  for (const item of cartItems) {
    const targetProduct = products.find(p => p.id === item.id);
    if (targetProduct) {
      const currentStock = targetProduct.quantity !== undefined && targetProduct.quantity !== null ? Number(targetProduct.quantity) : 0;
      const requestedQty = Number(item.quantity) || 1;
      targetProduct.quantity = Math.max(0, currentStock - requestedQty);
      
      purchasedSummary.push({
        id: targetProduct.id,
        name: targetProduct.name || targetProduct.title,
        price: targetProduct.price,
        purchasedQuantity: requestedQty,
        remainingStock: targetProduct.quantity,
        image: targetProduct.image
      });
    }
  }

  return { success: true, purchasedItems: purchasedSummary };
}
