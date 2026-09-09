import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, ArrowUpRight } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { money } from "../lib/money";
export function OrderSuccess() {
  const { id } = useParams(),
    [order, setOrder] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api("/orders/" + id, { signal: controller.signal })
      .then(setOrder)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [id]);
  if (error)
    return (
      <div className="page-shell empty-state">
        <p role="alert">{error}</p>
        <Link to="/account" className="solid-button">
          Your account
        </Link>
      </div>
    );
  if (!order)
    return (
      <div className="page-shell" role="status">
        Loading order…
      </div>
    );
  return (
    <div className="page-shell max-w-3xl">
      <CheckCircle size={64} weight="thin" />
      <p className="eyebrow mt-8">Order {id.slice(0, 8).toUpperCase()}</p>
      <h1 className="page-title">Good choice.</h1>
      <p className="mt-5 text-lg">
        Your order is saved. You can track it from your account.
      </p>
      <div className="mt-8 bg-accent p-5 flex justify-between">
        <strong>{order.status}</strong>
        <span>Pay {money(order.totals.total)} on delivery</span>
      </div>
      <div className="mt-8 space-y-5">
        {order.lines.map((line, i) => (
          <div className="order-row" key={i}>
            <img
              className="w-16 h-20 object-cover"
              src={line.image}
              alt={line.name}
            />
            <div className="flex-1">
              <strong>{line.name}</strong>
              <p className="text-sm text-muted">
                {line.color} / {line.size} × {line.qty}
              </p>
            </div>
            <strong>{money(line.price * line.qty)}</strong>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        Delivery to {order.shipping.name}, {order.shipping.address},{" "}
        {order.shipping.city}, {order.shipping.country}.
      </p>
      <div className="flex flex-wrap gap-4 mt-8">
        <Link className="solid-button" to="/shop">
          Keep exploring <ArrowUpRight />
        </Link>
        <Link className="outline-button" to="/account">
          Your orders
        </Link>
      </div>
    </div>
  );
}
