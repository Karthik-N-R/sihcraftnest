import "./globals.css";

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ProductProvider } from "../context/ProductContext";
import CartDrawer from "../components/CartDrawer";

export const metadata = {
  title: "CraftNest | Artisan Marketplace",
  description: "Discover beautiful handcrafted treasures from artisans around the world.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              {children}
              <CartDrawer />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
