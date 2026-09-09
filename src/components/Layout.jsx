import {
  Heart,
  MagnifyingGlass,
  ShoppingBag,
  User,
  ArrowUpRight,
  X,
  List,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
export function Header({ search, onSearch }) {
  const { count, wishlist } = useShop(),
    [menuLocation, setMenuLocation] = useState(null);
  const location = useLocation(),
    navigate = useNavigate();
  const menuOpen = menuLocation === location.key;
  return (
    <>
      <div className="announcement">
        <span>GOOD STYLE. NO COMPLICATIONS.</span>
        <span>
          FREE SHIPPING OVER $200 <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="site-header">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Link to="/" className="wordmark" aria-label="VELORA home">
          VELORA<span>®</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/shop">Shop all</NavLink>
          <Link to="/shop?tab=women">Women</Link>
          <Link to="/shop?tab=men">Men</Link>
          <Link to="/shop?tab=kids">Kids</Link>
          <NavLink to="/projects">
            Our world <ArrowUpRight size={12} />
          </NavLink>
        </nav>
        <div className="header-actions">
          <form
            role="search"
            className="header-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate("/shop");
            }}
          >
            <input
              aria-label="Search products"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Find your thing"
            />
            <button aria-label="Submit search">
              <MagnifyingGlass size={19} />
            </button>
          </form>
          <Link to="/account" aria-label="Your account">
            <User size={21} />
          </Link>
          <Link
            to="/saved"
            aria-label={"Saved items, " + wishlist.length}
            className="saved-link"
          >
            <Heart size={21} />
          </Link>
          <Link to="/cart" aria-label={"Bag, " + count + " items"}>
            <ShoppingBag size={21} />
            <span className="bag-count" aria-live="polite">
              {count}
            </span>
          </Link>
          <button
            className="mobile-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuLocation(menuOpen ? null : location.key)}
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" aria-label="Mobile navigation">
            <Link to="/shop">Shop all</Link>
            <Link to="/shop?tab=women">Women</Link>
            <Link to="/shop?tab=men">Men</Link>
            <Link to="/shop?tab=kids">Kids</Link>
            <Link to="/projects">Our world</Link>
            <Link to="/saved">Saved items</Link>
            <Link to="/account">Your account</Link>
          </nav>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-intro">
        <div>
          <p className="eyebrow">YOUR NEXT FAVORITE IS OUT THERE.</p>
          <h2>
            Make it
            <br />
            <span>your own.</span>
          </h2>
        </div>
        <Link
          to="/shop"
          className="footer-cta"
          aria-label="Shop the collection"
        >
          <ArrowUpRight size={64} weight="thin" />
        </Link>
      </div>
      <div className="footer-links">
        <div>
          <Link to="/" className="wordmark">
            VELORA®
          </Link>
          <p>Independent spirit. Everyday style.</p>
        </div>
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <Link to="/shop?tab=women">Women</Link>
          <Link to="/shop?tab=men">Men</Link>
          <Link to="/shop?tab=kids">Kids</Link>
          <Link to="/shop">All pieces</Link>
        </div>
        <div>
          <p className="eyebrow">YOUR VELORA</p>
          <Link to="/account">My account</Link>
          <Link to="/saved">Saved pieces</Link>
          <Link to="/cart">Shopping bag</Link>
          <Link to="/projects">Projects & lookbooks</Link>
        </div>
        <div>
          <p className="eyebrow">THE DETAILS</p>
          <Link to="/help">Shipping & returns</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/admin">Staff sign in</Link>
          <span>Pay on delivery</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} VELORA</span>
        <span>DESIGNED TO BE YOURSELF.</span>
        <span>USD / ENGLISH</span>
      </div>
    </footer>
  );
}
export function Toast() {
  const { toast } = useShop();
  return toast ? (
    <div
      role="status"
      aria-live="polite"
      className="toast-enter fixed bottom-5 left-1/2 z-50 -translate-x-1/2 bg-ink px-6 py-4 text-sm text-canvas shadow-xl max-w-[90vw]"
    >
      {toast}
    </div>
  ) : null;
}
