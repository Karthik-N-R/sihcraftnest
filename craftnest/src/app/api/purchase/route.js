import { NextResponse } from 'next/server';
import { purchaseProducts } from '../../../lib/productStore.js';

export async function POST(req) {
  try {
    const { cartItems, buyerInfo } = await req.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty.' }, { status: 400 });
    }

    const result = purchaseProducts(cartItems);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const orderDetails = {
      success: true,
      orderId,
      orderDate: new Date().toISOString(),
      purchasedItems: result.purchasedItems,
      buyerInfo: buyerInfo || { name: 'Artisan Customer', phone: '', address: '' }
    };

    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error('Purchase API exception:', error);
    return NextResponse.json({ success: false, error: 'Internal server error processing purchase.' }, { status: 500 });
  }
}
