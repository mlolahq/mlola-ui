"use client";

import { Carousel } from "./carousel";

const THEMES = [
  { name: "Graphite", line: "Neutral ink, crisp hairlines, nothing in the way.", tone: "graphite" },
  { name: "Atelier", line: "Warm paper, serif display and an amber signal.", tone: "atelier" },
  { name: "Machined", line: "Hard corners, monospace and damped motion.", tone: "machined" },
  { name: "Aerogel", line: "Translucent layers and fluid, kinetic springs.", tone: "aerogel" },
  { name: "Nordic", line: "Cool light, calm contrast and soft geometry.", tone: "nordic" },
];

const PRODUCTS = [
  { name: "Desk lamp", price: "$89", tone: "atelier" },
  { name: "Wool throw", price: "$120", tone: "nordic" },
  { name: "Ceramic mug", price: "$24", tone: "machined" },
  { name: "Notebook set", price: "$32", tone: "graphite" },
  { name: "Glass vase", price: "$58", tone: "aerogel" },
  { name: "Linen apron", price: "$44", tone: "atelier" },
];

export default function Showcase() {
  return (
    <div className="ml-carousel-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Hero with autoplay — the active dot fills; hover or focus pauses it</h3>
        <Carousel
          label="Themes"
          autoplay={4500}
          itemLabels={THEMES.map((theme) => theme.name)}
          items={THEMES.map((theme) => (
            <article key={theme.name} className="ml-carousel-showcase-hero" data-tone={theme.tone}>
              <p className="ml-carousel-showcase-kicker">Theme</p>
              <h4>{theme.name}</h4>
              <p>{theme.line}</p>
            </article>
          ))}
        />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Three at a time with the next one peeking — swipe, scroll or use the arrows</h3>
        <Carousel
          label="Products"
          perView={3}
          peek="3rem"
          minSlideWidth="10rem"
          loop={false}
          itemLabels={PRODUCTS.map((product) => product.name)}
          items={PRODUCTS.map((product) => (
            <article key={product.name} className="ml-carousel-showcase-product">
              <div className="ml-carousel-showcase-art" data-tone={product.tone} aria-hidden="true" />
              <p>
                <strong>{product.name}</strong>
                <span>{product.price}</span>
              </p>
            </article>
          ))}
        />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">A counter instead of dots</h3>
        <Carousel
          label="Quotes"
          indicators="counter"
          items={[
            "“The first library where dark mode was a non-event.”",
            "“We swapped themes the night before launch. Nothing broke.”",
            "“Our agents write correct markup because the contract says what exists.”",
          ].map((quote) => (
            <blockquote key={quote} className="ml-carousel-showcase-quote">
              {quote}
            </blockquote>
          ))}
        />
      </section>
    </div>
  );
}
