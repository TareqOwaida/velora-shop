import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChartLineUp,
  Package,
  ShoppingBag,
  UsersThree,
  ShieldCheck,
  SignOut,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { money } from "../lib/money";
import { Account } from "./Account";
const sections = [
  ["overview", "Overview", ChartLineUp],
  ["products", "Inventory", Package],
  ["orders", "Orders", ShoppingBag],
  ["customers", "Customers", UsersThree],
];
const transitions = {
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
export function Admin() {
  const { user, loading, logout } = useAuth(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState("");
  const section = sections.some((s) => s[0] === params.get("view"))
    ? params.get("view")
    : "overview";
  const refresh = useCallback(async () => {
    const result = await api("/admin/dashboard");
    setData(result);
  }, []);
  useEffect(() => {
    if (user?.role !== "admin") return;
    const controller = new AbortController();
    api("/admin/dashboard", { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [user]);
  async function mutate(path, body) {
    setBusy(true);
    setError("");
    try {
      await api(path, { method: "PATCH", body });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="page-shell" role="status">
        Checking access…
      </div>
    );
  if (!user) return <Account adminLogin />;
  if (user.role !== "admin")
    return (
      <div className="page-shell empty-state">
        <ShieldCheck size={48} />
        <h1 className="text-5xl">Staff only.</h1>
        <p>Your customer account does not have administrator access.</p>
        <Link className="solid-button" to="/account">
          Back to your account
        </Link>
      </div>
    );
  if (!data)
    return (
      <div className="page-shell" role={error ? "alert" : "status"}>
        {error || "Loading store dashboard…"}
        <button
          className="outline-button ml-5"
          onClick={() => refresh().catch((err) => setError(err.message))}
        >
          Retry
        </button>
      </div>
    );
  const activeOrders = data.orders.filter(
    (order) => order.status !== "Cancelled",
  );
  const orderValue = activeOrders.reduce(
    (sum, order) => sum + order.totals.total,
    0,
  );
  const lowStock = data.products.filter((p) => p.stock <= 10);
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/" className="flex items-center gap-4">
          <ArrowLeft />
          <strong className="text-2xl">VELORA</strong>
          <span className="eyebrow">STUDIO</span>
        </Link>
        <button
          className="flex items-center gap-2 text-sm"
          onClick={async () => {
            try {
              await logout();
              navigate("/admin");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <SignOut size={20} /> Sign out
        </button>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="eyebrow mb-6">STORE MANAGEMENT</p>
          <nav aria-label="Admin sections">
            {sections.map(([id, label, Icon]) => (
              <button
                key={id}
                aria-current={id === section ? "page" : undefined}
                className={id === section ? "selected" : ""}
                onClick={() => setParams({ view: id })}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>
          <div className="admin-security">
            <ShieldCheck size={26} />
            <strong>Protected session</strong>
            <span>
              Two-factor sign-in
              <br />
              30-minute session
            </span>
          </div>
        </aside>
        <section className="admin-content">
          <p className="eyebrow">YOUR STORE, AT A GLANCE</p>
          <div className="section-heading">
            <h1 className="page-title">
              {sections.find((s) => s[0] === section)[1]}.
            </h1>
            <button
              disabled={busy}
              className="outline-button"
              onClick={() => refresh().catch((err) => setError(err.message))}
            >
              Refresh data
            </button>
          </div>
          {error && (
            <p role="alert" className="form-error mb-5">
              {error}
            </p>
          )}
          {section === "overview" && (
            <>
              <div className="metric-grid">
                {[
                  [
                    "Order value",
                    money(orderValue),
                    "Non-cancelled orders · payment due on delivery",
                  ],
                  [
                    "Orders",
                    data.orders.length,
                    activeOrders.filter((o) => o.status === "Processing")
                      .length + " awaiting fulfillment",
                  ],
                  [
                    "Customers",
                    data.customers.length,
                    "Registered customer accounts",
                  ],
                  [
                    "Stock alerts",
                    lowStock.length,
                    "Products with 10 units or fewer",
                  ],
                ].map(([label, value, note]) => (
                  <article key={label}>
                    <p className="eyebrow">{label}</p>
                    <strong>{value}</strong>
                    <p className="text-xs text-muted">{note}</p>
                  </article>
                ))}
              </div>
              <div className="admin-two-col">
                <section className="admin-panel">
                  <h2 className="text-3xl">Order pipeline</h2>
                  <div className="mt-8 space-y-6">
                    {["Processing", "Shipped", "Delivered", "Cancelled"].map(
                      (status) => {
                        const count = data.orders.filter(
                          (o) => o.status === status,
                        ).length;
                        return (
                          <div key={status}>
                            <div className="flex justify-between text-sm mb-2">
                              <span>{status}</span>
                              <strong>{count}</strong>
                            </div>
                            <div className="h-3 bg-elevated">
                              <div
                                className="h-full bg-ink"
                                style={{
                                  width:
                                    (data.orders.length
                                      ? (count / data.orders.length) * 100
                                      : 0) + "%",
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </section>
                <section className="admin-panel">
                  <h2 className="text-3xl">Activity log</h2>
                  <p className="text-sm text-muted mt-3">
                    Inventory and fulfillment changes.
                  </p>
                  <div className="mt-5 space-y-4">
                    {data.audit.length ? (
                      data.audit.slice(0, 6).map((event, i) => (
                        <div
                          key={i}
                          className="text-sm border-b border-elevated pb-3"
                        >
                          <strong>{event.action}</strong>
                          <p className="text-muted break-all">
                            {event.target} ·{" "}
                            {new Date(event.created).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted text-sm">
                        No changes yet. Your team’s activity will appear here.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {section === "products" && (
            <section className="admin-panel">
              <label className="field mb-6">
                Search inventory
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or category"
                />
              </label>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Department</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products
                      .filter((p) =>
                        (p.name + p.category)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt=""
                                className="w-10 h-14 object-cover"
                              />
                              <div>
                                <strong>{p.name}</strong>
                                <p className="text-xs text-muted">
                                  {p.category}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="capitalize">{p.tab}</td>
                          <td>{money(p.price)}</td>
                          <td>
                            <form
                              className="flex gap-2"
                              onSubmit={(event) => {
                                event.preventDefault();
                                mutate("/admin/inventory/" + p.id, {
                                  stock: Number(
                                    new FormData(event.currentTarget).get(
                                      "stock",
                                    ),
                                  ),
                                });
                              }}
                            >
                              <input
                                key={p.stock}
                                aria-label={"Stock for " + p.name}
                                name="stock"
                                type="number"
                                min="0"
                                max="100000"
                                defaultValue={p.stock}
                                required
                                className="w-20 border border-ink p-2"
                              />
                              <button
                                disabled={busy}
                                className="outline-button"
                              >
                                Save
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {section === "orders" && (
            <section className="admin-panel">
              <h2 className="text-3xl mb-7">Fulfillment</h2>
              {data.orders.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Order / Customer</th>
                        <th>Delivery / Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>
                              {order.id.slice(0, 8).toUpperCase()}
                            </strong>
                            <p>{order.shipping.name}</p>
                            <p className="text-xs text-muted">{order.email}</p>
                          </td>
                          <td>
                            <details>
                              <summary className="cursor-pointer">
                                {order.lines.reduce((n, l) => n + l.qty, 0)}{" "}
                                pieces · View delivery
                              </summary>
                              <p className="mt-2">
                                {order.shipping.address}, {order.shipping.city},{" "}
                                {order.shipping.postal},{" "}
                                {order.shipping.country}
                              </p>
                              <p>{order.shipping.phone}</p>
                              {order.lines.map((line, i) => (
                                <p className="text-xs mt-1" key={i}>
                                  {line.name} / {line.color} / {line.size} ×{" "}
                                  {line.qty}
                                </p>
                              ))}
                            </details>
                          </td>
                          <td>
                            {money(order.totals.total)}
                            <p className="text-xs text-muted">
                              Cash on delivery
                            </p>
                          </td>
                          <td>
                            <strong>{order.status}</strong>
                            <div className="flex gap-2 mt-2">
                              {transitions[order.status].map((status) => (
                                <button
                                  disabled={busy}
                                  key={status}
                                  className="outline-button"
                                  onClick={() =>
                                    mutate("/admin/orders/" + order.id, {
                                      status,
                                    })
                                  }
                                >
                                  {status === "Cancelled"
                                    ? "Cancel & restock"
                                    : "Mark " + status.toLowerCase()}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">
                  No orders yet. New orders will appear here as they are placed.
                </p>
              )}
            </section>
          )}
          {section === "customers" && (
            <section className="admin-panel">
              <h2 className="text-3xl mb-7">Your community</h2>
              {data.customers.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.name}</td>
                          <td>{customer.email}</td>
                          <td>
                            {new Date(customer.created).toLocaleDateString()}
                          </td>
                          <td>
                            {
                              data.orders.filter(
                                (o) => o.email === customer.email,
                              ).length
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">
                  Customer accounts will appear here after registration.
                </p>
              )}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
