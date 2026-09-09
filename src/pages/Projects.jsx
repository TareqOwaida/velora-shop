import { Link, useParams } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";
const projects = [
  {
    id: "everyday",
    title: "The Everyday Edit",
    subtitle: "A wardrobe for wherever the day takes you.",
    photo: "photo-1483985988355-763728e1935b",
    tags: ["Tops", "Denim", "Shoes"],
    story:
      "An early coffee. The long way home. A last-minute plan that turns into the best part of your week. This edit starts with the pieces that make getting dressed feel effortless: clean tees, easy denim, and your favorite pair of sneakers.",
  },
  {
    id: "after-hours",
    title: "After Hours",
    subtitle: "Clock out. Show up as yourself.",
    photo: "photo-1441986300917-64674bd600d8",
    tags: ["Dresses", "Tailoring", "Accessories"],
    story:
      "When the sun goes down, switch up the proportions. A relaxed blazer over a simple base. A dress that moves with you. One unexpected accessory. An edit built around the pleasure of dressing for yourself.",
  },
  {
    id: "slow-sunday",
    title: "Slow Sunday",
    subtitle: "Less on your calendar. More room to breathe.",
    photo: "photo-1434389677669-e08b4cac3105",
    tags: ["Knitwear", "Loungewear"],
    story:
      "A softer pace deserves a softer wardrobe. Think easy layers, generous silhouettes, and the kind of comfort that follows you from the sofa to your neighborhood coffee shop. No rush. No dress code.",
  },
  {
    id: "small-adventures",
    title: "Small Adventures",
    subtitle: "For the little moments that become big memories.",
    photo: "photo-1519457431-44ccd64a579b",
    tags: ["kids"],
    story:
      "The world is bigger when you are small. Our kids edit brings playful layers and easy shapes together for school mornings, park afternoons, and every adventure in between.",
  },
];
export function Projects() {
  const { slug } = useParams(),
    project = projects.find((item) => item.id === slug);
  if (slug && !project)
    return (
      <div className="page-shell empty-state">
        <h1 className="text-5xl">Project not found.</h1>
        <Link to="/projects" className="solid-button">
          All projects
        </Link>
      </div>
    );
  if (project)
    return (
      <div className="page-shell">
        <Link to="/projects" className="text-sm underline">
          All projects
        </Link>
        <p className="eyebrow mt-10">VELORA / FIELD NOTES</p>
        <h1 className="page-title">{project.title}</h1>
        <p className="mt-5 text-lg text-muted">{project.subtitle}</p>
        <img
          className="project-cover"
          src={`/images/${project.photo}.jpg`}
          alt={project.title + " fashion editorial"}
        />
        <p className="max-w-3xl text-xl leading-relaxed my-12">
          {project.story}
        </p>
        <div className="section-heading">
          <h2>Shop the story.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products
            .filter(
              (p) =>
                project.tags.includes(p.category) ||
                project.tags.includes(p.tab),
            )
            .slice(0, 4)
            .map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
        </div>
      </div>
    );
  return (
    <div className="page-shell">
      <p className="eyebrow">
        COLLECTIONS, COLLABORATIONS & EVERYDAY INSPIRATION
      </p>
      <h1 className="page-title">
        Our world.
        <br />
        Your next chapter.
      </h1>
      <div className="projects-grid">
        {projects.map((item, i) => (
          <Link
            className="project-card"
            to={`/projects/${item.id}`}
            key={item.id}
          >
            <div>
              <img
                src={`/images/${item.photo}.jpg`}
                alt={item.title + " editorial"}
                loading="lazy"
              />
              <span className="circle-arrow">
                <ArrowUpRight size={24} />
              </span>
            </div>
            <p className="eyebrow mt-5">PROJECT 0{i + 1} / VOL. 01</p>
            <h2 className="mt-3 text-4xl">{item.title}</h2>
            <p className="text-muted mt-3">{item.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
