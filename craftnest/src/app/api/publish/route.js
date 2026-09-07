import { NextResponse } from 'next/server';
import { addProduct } from '../../../lib/productStore.js';

export async function POST(req) {
  try {
    const productData = await req.json();
    
    // Add to in-memory store
    const newProduct = addProduct(productData);
    
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Failed to publish product' }, { status: 500 });
  }
}
