import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProduct } from "../data/products";
const ShopContext = createContext(null);
function load(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function validLines() {
  return load("velora-cart")
    .filter((line) => {
      const p = getProduct(line?.id);
      return (
        p &&
        p.sizes.includes(line.size) &&
        Number.isInteger(line.qty) &&
        line.qty > 0 &&
        line.qty <= 10
      );
    })
    .slice(0, 50)
    .map((line) => ({
      ...line,
      color: getProduct(line.id).colors.includes(line.color)
        ? line.color
        : getProduct(line.id).colors[0],
    }));
}
export function ShopProvider({ children }) {
  const [cart, setCart] = useState(validLines),
    [wishlist, setWishlist] = useState(() =>
      load("velora-wishlist").filter((id) => getProduct(id)),
    ),
    [toast, setToast] = useState(null);
  useEffect(() => {
    try {
      localStorage.setItem("velora-cart", JSON.stringify(cart));
    } catch {
      /* Bag still works in memory. */
    }
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem("velora-wishlist", JSON.stringify(wishlist));
    } catch {
      /* Saved items still work in memory. */
    }
  }, [wishlist]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = useCallback((message) => setToast(message), []);
  const addToCart = useCallback(
    ({ id, size, color, qty = 1 }) => {
      const product = getProduct(id);
      if (!product || !product.sizes.includes(size)) return;
      color = product.colors.includes(color) ? color : product.colors[0];
      qty = Math.min(10, Math.max(1, Number.isInteger(qty) ? qty : 1));
      setCart((current) => {
        const match = current.some(
          (line) =>
            line.id === id && line.size === size && line.color === color,
        );
        return match
          ? current.map((line) =>
              line.id === id && line.size === size && line.color === color
                ? { ...line, qty: Math.min(10, line.qty + qty) }
                : line,
            )
          : [...current, { id, size, color, qty }].slice(0, 50);
      });
      notify(product.name + " added to bag");
    },
    [notify],
  );
  const setQty = useCallback(
    (id, size, qty, color) =>
      setCart((current) =>
        current.flatMap((line) =>
          line.id === id && line.size === size && line.color === color
            ? qty < 1
              ? []
              : [{ ...line, qty: Math.min(10, qty) }]
            : [line],
        ),
      ),
    [],
  );
  const removeFromCart = useCallback(
    (id, size, color) =>
      setCart((current) =>
        current.filter(
          (line) =>
            !(line.id === id && line.size === size && line.color === color),
        ),
      ),
    [],
  );
  const clearCart = useCallback(() => setCart([]), []);
  const toggleWishlist = useCallback((id) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }, []);
  const lines = useMemo(
    () => cart.map((line) => ({ ...getProduct(line.id), ...line })),
    [cart],
  );
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  return (
    <ShopContext.Provider
      value={{
        cart,
        lines,
        count,
        wishlist,
        toast,
        addToCart,
        setQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        notify,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
// Context and its hook intentionally share a module.
// oxlint-disable-next-line react/only-export-components
export function useShop() {
  return useContext(ShopContext);
}
