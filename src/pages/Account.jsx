import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpRight, LockKey, SignOut, Package } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { money } from "../lib/money";

export function Account({ register = false, adminLogin = false }) {
  const { user, loading, signIn, logout } = useAuth();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [orders, setOrders] = useState(null);
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const next = params.get("next") === "/checkout" ? "/checkout" : "/account";
  useEffect(() => {
    if (!user) return;
    let active = true;
    api("/orders")
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const account = await signIn(register ? "register" : "login", body);
      navigate(adminLogin && account.role === "admin" ? "/admin" : next, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="page-shell" role="status">
        Loading your account…
      </div>
    );
  if (user && !adminLogin)
    return (
      <div className="page-shell">
        <p className="eyebrow">Your personal space</p>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <h1 className="page-title">Hello, {user.name.split(" ")[0]}.</h1>
          <button
            className="outline-button"
            onClick={async () => {
              try {
                await logout();
                setOrders(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <SignOut size={18} /> Sign out
          </button>
        </div>
        <p className="mt-5 text-muted">{user.email}</p>
        {user.role === "admin" && (
          <Link className="solid-button mt-6" to="/admin">
            Open admin dashboard <ArrowUpRight />
          </Link>
        )}
        <div className="mt-12 border-t border-ink pt-8">
          <h2 className="text-4xl">Your orders</h2>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {orders === null ? (
            <p className="mt-6" role="status">
              Loading orders…
            </p>
          ) : orders.length ? (
            <div className="mt-6 grid gap-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className="order-row"
                >
                  <Package size={24} />
                  <div className="flex-1">
                    <strong>Order {order.id.slice(0, 8).toUpperCase()}</strong>
                    <p className="text-sm text-muted">
                      {new Date(order.created).toLocaleDateString()} ·{" "}
                      {order.status}
                    </p>
                  </div>
                  <strong>{money(order.totals.total)}</strong>
                  <ArrowUpRight />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Package size={40} />
              <p>You haven’t placed an order yet.</p>
              <Link className="solid-button" to="/shop">
                Find your first favorite <ArrowUpRight />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  return (
    <div className="auth-layout">
      <div className="auth-editorial">
        <p className="eyebrow">VELORA / MEMBERS</p>
        <h1>
          GOOD STYLE.
          <br />
          GREAT TO
          <br />
          <span>SEE YOU.</span>
        </h1>
        <p>Your wardrobe, your favorites, your next chapter.</p>
        <Link to="/shop" className="outline-button">
          Explore the collection <ArrowUpRight />
        </Link>
      </div>
      <div className="auth-form">
        <LockKey size={28} />
        <p className="eyebrow mt-6">
          {adminLogin ? "Store administration" : "Make yourself at home"}
        </p>
        <h2 className="mt-3 text-5xl">
          {register
            ? "Join the club."
            : adminLogin
              ? "Admin sign in."
              : "Welcome back."}
        </h2>
        <p className="mt-4 text-sm text-muted">
          {register
            ? "Create an account to place orders and keep track of your pieces."
            : adminLogin
              ? "Use your administrator credentials and authenticator code."
              : "Sign in to see your orders and finish your next look."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {register && (
            <label className="field">
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}
          <label className="field">
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <div>
            <label className="field" htmlFor="account-password">
              Password
              <input
                id="account-password"
                name="password"
                type="password"
                aria-describedby={register ? "password-hint" : undefined}
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={12}
                maxLength={128}
              />
            </label>
            {register && (
              <p id="password-hint" className="mt-2 text-xs text-muted">
                At least 12 characters. A unique passphrase works well.
              </p>
            )}
          </div>
          {adminLogin && (
            <label className="field">
              Authenticator code
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy} className="solid-button w-full">
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}{" "}
            <ArrowUpRight size={18} />
          </button>
        </form>
        {!adminLogin && (
          <p className="mt-6 text-sm">
            {register ? "Already part of the club?" : "New here?"}{" "}
            <Link
              className="underline font-bold"
              to={`${register ? "/account" : "/register"}?next=${next}`}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}
        {adminLogin && (
          <Link to="/" className="mt-6 inline-block underline text-sm">
            Back to the store
          </Link>
        )}
      </div>
    </div>
  );
}
