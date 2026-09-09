import { Trash } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { QtyControl } from "../components/ProductCard";
import { useShop } from "../context/ShopContext";
import { cartTotals, money } from "../lib/money";

export function Cart() {
  const { lines, setQty, removeFromCart } = useShop();
  const totals = cartTotals(lines);

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-5xl">Your bag is empty</h1>
        <p className="mt-4 text-muted">
          The full collection is waiting across Men, Women, and Kids.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent hover:text-ink"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_360px] md:px-6 lg:px-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Review your selection
        </p>
        <h1 className="mt-2 font-heading text-5xl">Your bag</h1>
        <p className="mt-2 text-sm text-muted">
          {lines.reduce((sum, line) => sum + line.qty, 0) === 1
            ? "1 item"
            : `${lines.reduce((sum, line) => sum + line.qty, 0)} items`}
        </p>
        <ul className="mt-8 flex flex-col gap-4">
          {lines.map((line) => (
            <li
              key={`${line.id}-${line.size}-${line.color}`}
              className="flex gap-4 border-b border-line bg-surface p-4 sm:gap-6 sm:p-5"
            >
              <Link
                to={`/product/${line.id}`}
                className="size-28 shrink-0 overflow-hidden sm:size-36"
              >
                <img
                  src={line.image}
                  alt={line.alt}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/product/${line.id}`}
                      className="font-heading text-xl underline-offset-4 hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="text-sm text-muted">
                      {line.color} / Size {line.size}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {money(line.price * line.qty)}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <QtyControl
                    value={line.qty}
                    label={line.name}
                    onChange={(next) =>
                      setQty(line.id, line.size, next, line.color)
                    }
                  />
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-danger"
                    onClick={() =>
                      removeFromCart(line.id, line.size, line.color)
                    }
                  >
                    <Trash size={16} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <aside className="h-fit rounded-3xl border border-line bg-elevated p-6 lg:sticky lg:top-24">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          Order details
        </p>
        <h2 className="mt-2 font-heading text-3xl">Summary</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{totals.shipping === 0 ? "Free" : money(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd>{money(totals.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Use VELORA10 at checkout for 10% off.
        </p>
        <Link
          to="/checkout"
          className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-ink text-sm font-bold uppercase tracking-[0.12em] text-canvas hover:bg-accent hover:text-ink"
        >
          Go to checkout
        </Link>
        <Link
          to="/shop"
          className="mt-3 flex min-h-11 items-center justify-center text-sm text-muted hover:text-ink"
        >
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}
