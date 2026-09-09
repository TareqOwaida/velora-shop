import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  Asterisk,
  Pause,
  Play,
} from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";
gsap.registerPlugin(ScrollTrigger);
const photo = (id) => `/images/${id}.jpg`;
export function Home() {
  const root = useRef(null),
    reduced = usePrefersReducedMotion(),
    [paused, setPaused] = useState(false);
  useGSAP(
    () => {
      if (reduced) return;
      gsap.from(".hero-reveal", {
        y: 70,
        opacity: 0,
        stagger: 0.12,
        duration: 1,
        ease: "power4.out",
      });
      gsap.from(".hero-photo", {
        clipPath: "inset(100% 0% 0% 0%)",
        scale: 1.06,
        duration: 1.35,
        ease: "power4.inOut",
      });
      gsap.to(".hero-photo img", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".fashion-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.utils.toArray("[data-reveal]").forEach((el) =>
        gsap.from(el, {
          y: 45,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 93%", once: true },
        }),
      );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <div ref={root}>
      <section className="fashion-hero">
        <div className="hero-copy">
          <p className="eyebrow hero-reveal">
            <span className="live-dot" /> A NEW SEASON OF YOU · VOL. 01
          </p>
          <h1 className="hero-reveal">
            EVERYDAY.
            <br />
            <span>ANYTHING</span>
            <br />
            BUT ORDINARY.
          </h1>
          <div className="hero-description hero-reveal">
            <p>
              For the days that become stories.
              <br />
              Clothing that feels like you.
            </p>
            <Link to="/shop" className="solid-button">
              Find your next favorite <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="hero-bottom hero-reveal">
            <span>GOOD PIECES. GREAT POSSIBILITIES.</span>
            <a href="#discover" aria-label="Discover the collections">
              <ArrowDown size={20} />
            </a>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src={photo("photo-1483985988355-763728e1935b")}
            alt="Woman in a burgundy coat and sunglasses on a city shopping trip"
            fetchPriority="high"
          />
          <div className="photo-caption">
            <span>THE EVERYDAY EDIT</span>
            <Link
              to="/projects/everyday"
              aria-label="Explore the Everyday Edit"
            >
              <ArrowUpRight size={24} />
            </Link>
          </div>
          <span className="photo-number">01 / 04</span>
        </div>
      </section>
      <div className="ticker">
        <div
          className={"ticker-track " + (paused ? "is-paused" : "")}
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>
              WEAR IT YOUR WAY <Asterisk weight="bold" /> MADE FOR THE EVERYDAY{" "}
              <Asterisk weight="bold" />
            </span>
          ))}
        </div>
        <button
          onClick={() => setPaused((value) => !value)}
          aria-label={
            paused
              ? "Play announcement animation"
              : "Pause announcement animation"
          }
        >
          {paused ? <Play /> : <Pause />}
        </button>
      </div>
      <section className="page-shell" id="discover">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">ONE LABEL. EVERY SIDE OF YOU.</p>
            <h2>
              Meet your
              <br />
              next chapter.
            </h2>
          </div>
          <p>
            Different styles. Same feeling.
            <br />
            Find the pieces you’ll reach for again.
          </p>
        </div>
        <div className="department-grid">
          {[
            [
              "women",
              "For her.",
              "photo-1483985988355-763728e1935b",
              "The art of doing you",
            ],
            [
              "men",
              "For him.",
              "photo-1516257984-b1b4d707412e",
              "Make everyday your own",
            ],
            [
              "kids",
              "For the little ones.",
              "photo-1519457431-44ccd64a579b",
              "Big days. Small sizes.",
            ],
          ].map(([tab, label, image, caption], i) => (
            <Link
              data-reveal
              to={`/shop?tab=${tab}`}
              key={tab}
              className="department-card"
            >
              <img
                src={photo(image)}
                alt={`${tab} collection editorial`}
                loading="lazy"
              />
              <div>
                <span className="eyebrow">
                  0{i + 1} / {caption}
                </span>
                <h3>{label}</h3>
                <span className="circle-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="page-shell arrivals">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">FRESH IN THE ROTATION</p>
            <h2>The good stuff.</h2>
          </div>
          <Link to="/shop" className="text-link">
            Shop all 54 pieces <ArrowUpRight />
          </Link>
        </div>
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10"
          data-reveal
        >
          {[products[10], products[2], products[19], products[6]].map(
            (product) => (
              <ProductCard key={product.id} product={product} />
            ),
          )}
        </div>
      </section>
      <section className="manifesto" data-reveal>
        <div>
          <p className="eyebrow">MORE YOU. LESS EVERYTHING ELSE.</p>
          <h2>
            STYLE IS
            <br />
            PERSONAL.
            <br />
            <span>KEEP IT THAT WAY.</span>
          </h2>
          <Link to="/projects" className="solid-button">
            Inside our world <ArrowUpRight />
          </Link>
        </div>
        <div className="manifesto-note">
          <Asterisk size={84} weight="light" />
          <p>
            There’s no right way to wear it.
            <br />
            Only your way.
          </p>
          <span>VELORA / INDEPENDENT SPIRIT</span>
        </div>
      </section>
      <section className="page-shell">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">NOT JUST CLOTHES. A POINT OF VIEW.</p>
            <h2>Field notes.</h2>
          </div>
          <Link to="/projects" className="text-link">
            All projects <ArrowRight />
          </Link>
        </div>
        <Link to="/projects/after-hours" className="journal-banner" data-reveal>
          <img
            src={photo("photo-1441986300917-64674bd600d8")}
            alt="A carefully curated clothing studio"
            loading="lazy"
          />
          <div>
            <p className="eyebrow">PROJECT 02 / THE LOOKBOOK</p>
            <h3>
              Off the clock.
              <br />
              Into your element.
            </h3>
            <span className="outline-button">
              Explore After Hours <ArrowUpRight />
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
