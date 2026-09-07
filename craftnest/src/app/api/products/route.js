import { NextResponse } from 'next/server';
import { getProducts } from '../../../lib/productStore.js';

export async function GET() {
  const products = getProducts();
  return NextResponse.json(products);
}
