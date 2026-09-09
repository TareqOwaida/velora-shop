import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer, Header, Toast } from "./components/Layout";
import { ShopProvider } from "./context/ShopContext";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { Admin } from "./pages/Admin";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderSuccess } from "./pages/OrderSuccess";
import { Product } from "./pages/Product";
import { Shop } from "./pages/Shop";
import { Home } from "./pages/Home";
import { Projects } from "./pages/Projects";
import { Account } from "./pages/Account";
import { Info } from "./pages/Info";
import { AuthProvider } from "./context/AuthContext";

function PageFrame({ children }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    const titles = {
      "/": "Everyday. Anything but ordinary.",
      "/shop": "Shop the collection",
      "/projects": "Our world",
      "/cart": "Your bag",
      "/checkout": "Checkout",
      "/account": "Your account",
      "/register": "Create account",
      "/admin": "Store administration",
      "/saved": "Saved pieces",
    };
    document.title = `VELORA — ${titles[location.pathname] || "Independent clothing"}`;
  }, [location.pathname, location.hash]);

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );
    },
    { dependencies: [location.pathname, reduced] },
  );

  return (
    <main id="main" ref={ref} className="flex-1">
      {children}
    </main>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <ShopProvider>
        <div className="flex min-h-svh flex-col bg-canvas text-ink">
          {isAdmin ? null : <Header search={search} onSearch={setSearch} />}
          <PageFrame>
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="/" element={<Home />} />
              <Route
                path="/shop"
                element={<Shop search={search} onSearch={setSearch} />}
              />
              <Route
                path="/saved"
                element={<Shop search={search} onSearch={setSearch} saved />}
              />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<Projects />} />
              <Route path="/account" element={<Account key="login" />} />
              <Route
                path="/register"
                element={<Account key="register" register />}
              />
              <Route path="/help" element={<Info />} />
              <Route path="/privacy" element={<Info privacy />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:id" element={<OrderSuccess />} />
              <Route path="*" element={<Info missing />} />
            </Routes>
          </PageFrame>
          {isAdmin ? null : <Footer />}
          <Toast />
        </div>
      </ShopProvider>
    </AuthProvider>
  );
}
