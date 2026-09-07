import { NextResponse } from 'next/server';
import { getProducts, updateProductQuantity, rateProduct, updateProductDetails } from '../../../lib/productStore.js';

export async function GET() {
  const products = getProducts();
  return NextResponse.json(products);
}

export async function PATCH(req) {
  try {
    const { id, quantity, rating, updatedFields } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    if (updatedFields) {
      const result = updateProductDetails(id, updatedFields);
      if (result.success) {
        return NextResponse.json(result);
      }
      return NextResponse.json(result, { status: 400 });
    }

    if (rating !== undefined) {
      const result = rateProduct(id, rating);
      if (result.success) {
        return NextResponse.json(result);
      }
      return NextResponse.json(result, { status: 400 });
    }

    if (quantity !== undefined) {
      const result = updateProductQuantity(id, quantity);
      if (result.success) {
        return NextResponse.json(result);
      }
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Missing field update parameters' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


