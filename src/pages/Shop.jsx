import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ProductCard } from "../components/ProductCard";
import { products, TABS } from "../data/products";
import { useShop } from "../context/ShopContext";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

export function Shop({ search = "", onSearch, saved = false }) {
  const [params, setParams] = useSearchParams(),
    [sort, setSort] = useState("featured");
  const { wishlist } = useShop(),
    root = useRef(null),
    reduced = usePrefersReducedMotion();
  const tab = params.get("tab") || "all",
    category = params.get("category") || "All";
  const categories = [
    "All",
    ...new Set(
      products
        .filter((p) => tab === "all" || p.tab === tab)
        .map((p) => p.category),
    ),
  ];
  const savedFilter = saved ? wishlist : null;
  const items = useMemo(() => {
    let result = products.filter(
      (p) =>
        (!savedFilter || savedFilter.includes(p.id)) &&
        (tab === "all" || p.tab === tab) &&
        (category === "All" || p.category === category) &&
        (!search ||
          [p.name, p.category, p.tab, ...p.colors]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())),
    );
    if (sort === "low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "high") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [tab, category, search, sort, savedFilter]);
  useGSAP(
    () => {
      if (!reduced)
        gsap.from(".grid-item", {
          y: 22,
          opacity: 0,
          stagger: 0.035,
          duration: 0.45,
          ease: "power3.out",
        });
    },
    {
      scope: root,
      // Replay the entrance only when browsing criteria change, not when saving.
      dependencies: [tab, category, search, sort, saved, reduced],
      revertOnUpdate: true,
    },
  );
  return (
    <div className="page-shell" id="drop">
      <p className="eyebrow">THE COMPLETE WARDROBE / VOL. 01</p>
      <h1 className="page-title">
        {saved
          ? "Your good finds."
          : tab === "all"
            ? "Find your fit."
            : tab + " collection."}
      </h1>
      <p className="mt-5 text-muted">
        54 considered pieces. Endless ways to make them yours.
      </p>
      <div className="catalog-toolbar">
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "Everyone" }, ...TABS].map((item) => (
            <button
              key={item.id}
              className={"filter-pill " + (item.id === tab ? "active" : "")}
              aria-pressed={item.id === tab}
              onClick={() =>
                setParams(item.id === "all" ? {} : { tab: item.id })
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-sm">
          Sort by
          <select
            className="border border-ink bg-transparent p-3"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <aside>
          <label className="catalog-search">
            <MagnifyingGlass size={20} />
            <input
              aria-label="Search collection"
              placeholder="Find a piece…"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
            />
          </label>
          <p className="eyebrow mt-8 mb-4">CATEGORIES</p>
          <nav aria-label="Product categories" className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                aria-pressed={category === item}
                className={category === item ? "selected" : ""}
                onClick={() => {
                  onSearch("");
                  setParams({
                    ...(tab === "all" ? {} : { tab }),
                    ...(item === "All" ? {} : { category: item }),
                  });
                }}
              >
                {item}
                <span>
                  {
                    products.filter(
                      (p) =>
                        (tab === "all" || p.tab === tab) &&
                        (item === "All" || p.category === item),
                    ).length
                  }
                </span>
              </button>
            ))}
          </nav>
          <Link to="/projects" className="catalog-note">
            A little inspiration?
            <br />
            <strong>Shop the stories.</strong>
            <ArrowUpRight size={24} />
          </Link>
        </aside>
        <section ref={root} aria-label="Products">
          <p className="eyebrow mb-6" role="status">
            {items.length} {items.length === 1 ? "PIECE" : "PIECES"}
            {saved ? " SAVED" : " TO MAKE YOUR OWN"}
          </p>
          {items.length ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-10">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2 className="text-4xl">
                {saved ? "Save a little inspiration." : "No pieces found."}
              </h2>
              <p>
                {saved
                  ? "Tap the heart on any product to keep it here."
                  : "Try another category or a different search."}
              </p>
              <Link
                className="solid-button"
                to="/shop"
                onClick={() => onSearch("")}
              >
                Explore all pieces <ArrowUpRight />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
