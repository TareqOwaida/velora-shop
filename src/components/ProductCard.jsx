import { Heart, ShoppingBag, Minus, Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { money } from "../lib/money";

export function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const saved = wishlist.includes(product.id);

  return (
    <article className="group grid-item flex flex-col">
      <div className="shoe-card-stage relative mb-3 block aspect-[4/5] bg-elevated p-3">
        <Link
          to={`/product/${product.id}`}
          className="block h-full"
          aria-label={`View ${product.name}`}
        >
          <img
            src={product.image}
            alt={product.alt}
            className="catalog-shoe h-full w-full object-cover"
            loading="lazy"
          />
        </Link>
        {product.badge ? (
          <span className="absolute -left-1 top-5 z-10 rounded-full border border-ink bg-accent px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-ink">
            {product.badge}
          </span>
        ) : null}
        <button
          type="button"
          aria-pressed={saved}
          aria-label={
            saved ? `Remove ${product.name} from saved` : `Save ${product.name}`
          }
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute right-5 top-5 z-10 grid size-11 place-items-center rounded-full border border-ink bg-surface text-ink hover:bg-ink hover:text-canvas"
        >
          <Heart
            size={20}
            weight={saved ? "fill" : "regular"}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-3xl leading-[0.9]">
              <Link
                to={`/product/${product.id}`}
                className="underline-offset-4 hover:underline"
              >
                {product.name}
              </Link>
            </h3>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              {product.category} · {product.colors.join(" / ")}
            </p>
          </div>
          <p className="text-right">
            <span className="block font-semibold">{money(product.price)}</span>
            {product.compareAt ? (
              <span className="text-sm text-muted line-through">
                {money(product.compareAt)}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-4 text-xs font-bold uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-canvas"
          onClick={() =>
            addToCart({ id: product.id, size: product.sizes[0], qty: 1 })
          }
        >
          <ShoppingBag size={18} aria-hidden="true" />
          Add to bag
        </button>
      </div>
    </article>
  );
}

export function QtyControl({ value, onChange, label }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface">
      <button
        type="button"
        className="grid size-11 place-items-center"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center text-sm" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid size-11 place-items-center"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
