import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, LockKey, Truck } from "@phosphor-icons/react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { money } from "../lib/money";

export function Checkout() {
  const { cart, lines, clearCart } = useShop(),
    { user, loading } = useAuth(),
    navigate = useNavigate();
  const [quoteResult, setQuoteResult] = useState(null),
    [promo, setPromo] = useState(""),
    [promoInput, setPromoInput] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [requestKey] = useState(() => crypto.randomUUID());
  const quoteKey = JSON.stringify({ cart, promo, user: user?.id });
  const quote = quoteResult?.key === quoteKey ? quoteResult.value : null;
  useEffect(() => {
    if (!user || !cart.length) return;
    const controller = new AbortController();
    api("/checkout/quote", {
      method: "POST",
      body: { lines: cart, promo },
      signal: controller.signal,
    })
      .then((value) => {
        setQuoteResult({ key: quoteKey, value });
        setError("");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [cart, promo, user, quoteKey]);
  async function submit(event) {
    event.preventDefault();
    if (busy || !quote) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/orders", {
        method: "POST",
        body: {
          lines: cart,
          promo,
          shipping: Object.fromEntries(new FormData(event.currentTarget)),
          payment: "cod",
          requestKey,
        },
      });
      clearCart();
      navigate("/order/" + result.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <div className="page-shell">Loading checkout…</div>;
  if (!lines.length)
    return (
      <div className="page-shell empty-state">
        <h1 className="text-5xl">Your bag is empty.</h1>
        <Link className="solid-button" to="/shop">
          Explore the collection <ArrowUpRight />
        </Link>
      </div>
    );
  if (!user)
    return (
      <div className="page-shell empty-state">
        <LockKey size={40} />
        <h1 className="text-5xl">One step closer.</h1>
        <p>
          Sign in or create an account to securely place and track your order.
        </p>
        <Link className="solid-button" to="/account?next=/checkout">
          Sign in to checkout <ArrowUpRight />
        </Link>
        <Link className="underline" to="/register?next=/checkout">
          Create an account
        </Link>
      </div>
    );
  return (
    <div className="page-shell">
      <p className="eyebrow">Bag / Delivery / Confirmation</p>
      <h1 className="page-title">The final details.</h1>
      <div className="checkout-grid mt-12">
        <section>
          <h2 className="text-3xl">Delivery address</h2>
          <p className="mt-3 text-muted text-sm">Ordering as {user.email}</p>
          <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
            {[
              ["name", "Full name", "name", 2, 80],
              ["phone", "Phone number", "tel", 7, 25],
              ["address", "Street address", "street-address", 5, 200],
              ["city", "City", "address-level2", 2, 80],
              ["postal", "Postal code", "postal-code", 2, 20],
              ["country", "Country", "country-name", 2, 80],
            ].map(([name, label, autocomplete, min, max]) => (
              <label
                key={name}
                className={
                  "field " + (name === "address" ? "sm:col-span-2" : "")
                }
              >
                {label}
                <input
                  name={name}
                  type={name === "phone" ? "tel" : "text"}
                  autoComplete={autocomplete}
                  defaultValue={name === "name" ? user.name : ""}
                  minLength={min}
                  maxLength={max}
                  required
                />
              </label>
            ))}
            <div className="sm:col-span-2 border border-ink p-5">
              <div className="flex items-center gap-3">
                <Truck size={24} />
                <strong>Pay on delivery</strong>
              </div>
              <p className="mt-3 text-sm text-muted">
                Pay when your order arrives. No payment is taken now.
              </p>
            </div>
            {error && (
              <p role="alert" className="form-error sm:col-span-2">
                {error}
              </p>
            )}
            <button
              disabled={busy || !quote}
              className="solid-button sm:col-span-2"
            >
              {busy
                ? "Placing your order…"
                : "Place order" +
                  (quote ? " · " + money(quote.totals.total) : "")}
              <ArrowUpRight />
            </button>
          </form>
        </section>
        <aside className="checkout-summary">
          <h2 className="text-3xl">In your bag</h2>
          <div className="mt-6 space-y-5">
            {lines.map((line) => (
              <div
                key={line.id + line.size + line.color}
                className="flex gap-4"
              >
                <img
                  src={line.image}
                  alt={line.alt}
                  className="w-16 h-20 object-cover"
                />
                <div className="flex-1 text-sm">
                  <strong>{line.name}</strong>
                  <p className="text-muted mt-1">
                    {line.color} / {line.size} × {line.qty}
                  </p>
                </div>
                <strong className="text-sm">
                  {money(line.price * line.qty)}
                </strong>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 my-7"
            onSubmit={(event) => {
              event.preventDefault();
              const code = promoInput.trim().toUpperCase();
              if (code && code !== "VELORA10") {
                setError("That promo code is not valid.");
                return;
              }
              setPromo(code);
              setError("");
            }}
          >
            <label className="sr-only" htmlFor="promo">
              Promo code
            </label>
            <input
              id="promo"
              className="min-w-0 flex-1 border border-ink px-3"
              placeholder="VELORA10 for 10% off"
              value={promoInput}
              onChange={(event) => setPromoInput(event.target.value)}
            />
            <button className="outline-button">Apply</button>
          </form>
          {quote ? (
            <dl className="space-y-3">
              {Object.entries(quote.totals).map(([key, value]) => (
                <div
                  key={key}
                  className={
                    "flex justify-between capitalize " +
                    (key === "total"
                      ? "border-t border-ink pt-4 font-bold text-xl"
                      : "text-sm")
                  }
                >
                  <dt>{key}</dt>
                  <dd>
                    {key === "discount" && value > 0 ? "−" : ""}
                    {money(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p role="status">Checking current prices and availability…</p>
          )}
          <p className="text-xs text-muted mt-5">
            Prices in USD. Free shipping on orders of $200 or more after
            discount.
          </p>
          <Link to="/cart" className="inline-block mt-5 text-sm underline">
            Edit your bag
          </Link>
        </aside>
      </div>
    </div>
  );
}
