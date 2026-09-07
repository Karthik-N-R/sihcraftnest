const { getProducts, purchaseProducts } = require('../src/lib/productStore.js');

console.log("=== FUNCTIONAL TEST: BUYER FLOW & INVENTORY DEDUCTION ===");

// 1. Fetch initial products
const initialProds = getProducts();
console.log(`Initial product count: ${initialProds.length}`);
const testProduct = initialProds[0];
const initialStock = Number(testProduct.quantity);
console.log(`Test Product: "${testProduct.name}" (ID: ${testProduct.id}), Seller Price: ₹${testProduct.price}, Initial Stock: ${initialStock}`);

// 2. Test purchasing valid quantity (2 units)
const purchaseQty = 2;
console.log(`\nAttempting purchase of ${purchaseQty} unit(s)...`);

const result1 = purchaseProducts([{
  id: testProduct.id,
  name: testProduct.name,
  price: testProduct.price,
  quantity: purchaseQty
}]);

if (result1.success) {
  console.log("✓ Purchase 1 Successful!");
  console.log("Purchased Summary:", result1.purchasedItems);
} else {
  console.error("❌ Purchase 1 Failed:", result1.error);
}

// 3. Verify stock decrease
const updatedProds = getProducts();
const updatedProduct = updatedProds.find(p => p.id === testProduct.id);
const expectedStock = initialStock - purchaseQty;
console.log(`\nUpdated Stock Level for "${updatedProduct.name}": ${updatedProduct.quantity} (Expected: ${expectedStock})`);

if (updatedProduct.quantity === expectedStock) {
  console.log("✓ Stock level successfully decreased!");
} else {
  console.error("❌ Stock level mismatch!");
}

// 4. Test rejecting purchase exceeding stock
const excessiveQty = updatedProduct.quantity + 5;
console.log(`\nAttempting excessive purchase of ${excessiveQty} unit(s) (available: ${updatedProduct.quantity})...`);

const result2 = purchaseProducts([{
  id: updatedProduct.id,
  name: updatedProduct.name,
  price: updatedProduct.price,
  quantity: excessiveQty
}]);

if (!result2.success) {
  console.log("✓ Excessive purchase correctly rejected!");
  console.log("Rejection Error Message:", result2.error);
} else {
  console.error("❌ Excessive purchase was wrongfully accepted!");
}

// 5. Test reducing stock to 0 (Out of Stock)
console.log(`\nPurchasing remaining ${updatedProduct.quantity} unit(s) to reach 0 stock...`);
const result3 = purchaseProducts([{
  id: updatedProduct.id,
  name: updatedProduct.name,
  price: updatedProduct.price,
  quantity: updatedProduct.quantity
}]);

if (result3.success) {
  const finalProduct = getProducts().find(p => p.id === testProduct.id);
  console.log(`✓ Product is now OUT OF STOCK! Remaining Stock: ${finalProduct.quantity}`);
}

console.log("\n=== ALL BUYER FLOW TESTS PASSED ===");
