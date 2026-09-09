import { ArrowLeft, Heart } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard, QtyControl } from "../components/ProductCard";
import { useShop } from "../context/ShopContext";
import { getProduct, getRelated } from "../data/products";
import { money } from "../lib/money";

export function Product() {
  const { id } = useParams();
  return <ProductDetails key={id} id={id} />;
}

function ProductDetails({ id }) {
  const product = getProduct(id);
  const related = product ? getRelated(product) : [];
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const navigate = useNavigate();
  const [size, setSize] = useState(product?.sizes[0] ?? "");
  const [color, setColor] = useState(product?.colors[0] ?? "");
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-heading text-5xl">Product not found</h1>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center border-b border-ink text-sm font-semibold uppercase tracking-[0.12em]"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  const saved = wishlist.includes(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-16 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </button>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="product-shoe-stage flex min-h-[65svh] items-center justify-center bg-elevated p-6 md:p-12">
          <img
            src={product.image}
            alt={product.alt}
            className="product-shoe-image aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          {product.badge ? (
            <p className="inline-block bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
              {product.badge}
            </p>
          ) : null}
          <h1 className="mt-4 max-w-xl font-heading text-7xl tracking-[-0.06em] sm:text-9xl">
            {product.name}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {product.category} / Vol. 01
          </p>
          <p className="mt-4 text-2xl font-semibold">{money(product.price)}</p>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            {product.description}
          </p>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold">Color</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={color === option}
                  onClick={() => setColor(option)}
                  className={`min-h-11 rounded-full border px-4 text-sm ${
                    color === option
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-surface hover:border-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Size</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={size === option}
                  onClick={() => setSize(option)}
                  className={`min-h-11 min-w-11 rounded-full border px-3 text-sm ${
                    size === option
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-surface hover:border-ink"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QtyControl
              value={qty}
              onChange={(next) => setQty(Math.min(10, Math.max(1, next)))}
              label="quantity"
            />
            <button
              type="button"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold uppercase tracking-[0.1em] text-canvas hover:bg-accent hover:text-accent-ink sm:flex-none"
              onClick={() => addToCart({ id: product.id, size, color, qty })}
            >
              Add to bag · {money(product.price * qty)}
            </button>
            <button
              type="button"
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save for later"}
              className="grid size-12 place-items-center rounded-full border border-line bg-surface hover:bg-ink hover:text-canvas"
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart
                size={20}
                weight={saved ? "fill" : "regular"}
                aria-hidden="true"
              />
            </button>
          </div>

          <ul className="mt-10 flex flex-col divide-y divide-line border-y border-line text-sm text-muted">
            {product.details.map((detail) => (
              <li key={detail} className="py-3">
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {related.length ? (
        <section className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">
            Keep exploring
          </p>
          <h2 className="mt-3 font-heading text-6xl tracking-[-0.05em]">
            More from this department
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
