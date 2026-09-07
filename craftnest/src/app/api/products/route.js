import { NextResponse } from 'next/server';
import { getProducts, updateProductQuantity } from '../../../lib/productStore.js';

export async function GET() {
  const products = getProducts();
  return NextResponse.json(products);
}

export async function PATCH(req) {
  try {
    const { id, quantity } = await req.json();
    if (!id || quantity === undefined) {
      return NextResponse.json({ success: false, error: 'Missing id or quantity' }, { status: 400 });
    }
    const result = updateProductQuantity(id, quantity);
    if (result.success) {
      return NextResponse.json(result);
    }
    return NextResponse.json(result, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
