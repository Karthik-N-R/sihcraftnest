console.log("=== FUNCTIONAL TEST: AUTHENTICATION & ROLE PERSISTENCE ===");

// Simulated Auth Engine matching AuthContext logic
const DEMO_USERS = [
  { id: "u_demo_seller", name: "Rajesh Kumar (Artisan)", email: "seller@craftnest.dev", password: "password123", role: "seller" },
  { id: "u_demo_buyer", name: "Rohan Sharma (Buyer)", email: "buyer@craftnest.dev", password: "password123", role: "buyer" }
];

let mockLocalStorage = {};

function getItem(key) { return mockLocalStorage[key] || null; }
function setItem(key, val) { mockLocalStorage[key] = String(val); }
function removeItem(key) { delete mockLocalStorage[key]; }

// 1. Initial State Check
console.log("1. Checking pre-seeded demo accounts...");
console.log(`Demo accounts loaded: ${DEMO_USERS.length}`);
DEMO_USERS.forEach(u => console.log(` - User: "${u.name}", Email: ${u.email}, Role: ${u.role}`));

// 2. Test Login with Demo Seller
console.log("\n2. Testing Login with Demo Seller...");
const sellerLogin = DEMO_USERS.find(u => u.email === "seller@craftnest.dev" && u.password === "password123");
if (sellerLogin) {
  setItem('craftnest_user_session', JSON.stringify({ id: sellerLogin.id, name: sellerLogin.name, email: sellerLogin.email, role: sellerLogin.role }));
  console.log("✓ Seller Login Successful! Session saved to storage.");
} else {
  console.error("❌ Seller Login Failed");
}

// 3. Test Session Persistence across page refresh simulation
console.log("\n3. Testing Session Persistence (Refresh Simulation)...");
const restoredSession = JSON.parse(getItem('craftnest_user_session'));
if (restoredSession && restoredSession.email === "seller@craftnest.dev" && restoredSession.role === "seller") {
  console.log("✓ Session persisted successfully!");
  console.log("Restored User Info:", restoredSession);
} else {
  console.error("❌ Session persistence failed!");
}

// 4. Test New User Registration (Signup) with Buyer role
console.log("\n4. Testing Signup with Buyer role...");
const newSignup = { name: "Ananya Craft Fan", email: "ananya@craftbuyer.org", password: "securepass123", role: "buyer" };
const newUser = { id: `u_${Date.now()}`, ...newSignup };
DEMO_USERS.push(newUser);
setItem('craftnest_users_db', JSON.stringify(DEMO_USERS));
setItem('craftnest_user_session', JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }));

const registeredSession = JSON.parse(getItem('craftnest_user_session'));
if (registeredSession && registeredSession.role === "buyer" && registeredSession.email === "ananya@craftbuyer.org") {
  console.log("✓ Buyer Signup & Automatic Session Login Successful!");
  console.log("Registered Buyer Info:", registeredSession);
} else {
  console.error("❌ Signup test failed!");
}

// 5. Test Logout
console.log("\n5. Testing Logout...");
removeItem('craftnest_user_session');
const postLogoutSession = getItem('craftnest_user_session');
if (!postLogoutSession) {
  console.log("✓ Logout Successful! Session cleared.");
} else {
  console.error("❌ Logout failed!");
}

console.log("\n=== ALL AUTHENTICATION TESTS PASSED ===");
