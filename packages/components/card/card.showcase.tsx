"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import type { CardVariant } from "./card";

export default function Showcase() {
  const variants: CardVariant[] = ["default", "elevated", "glass", "specular"];
  return (
    <div className="ml-card-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Variants</h3>
        <div className="ml-showcase-columns">
          {variants.map((variant) => (
            <Card key={variant} variant={variant}>
              <CardHeader>
                <CardTitle>{variant}</CardTitle>
                <CardDescription>Surface, border, and shadow come from the active theme.</CardDescription>
              </CardHeader>
              <CardContent>Every variant keeps the same padding rhythm.</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With footer</h3>
        <div className="ml-showcase-columns">
          <Card>
            <CardHeader>
              <CardTitle>Pro plan</CardTitle>
              <CardDescription>Everything a shipping team needs.</CardDescription>
            </CardHeader>
            <CardContent>Unlimited projects, 25 seats, and priority support.</CardContent>
            <CardFooter>
              <button type="button" className="ml-button" data-variant="primary" data-size="sm">Upgrade</button>
              <button type="button" className="ml-button" data-variant="subtle" data-size="sm">Compare</button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Current billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="ml-price">$48.2k<span>this month</span></p>
            </CardContent>
            <CardFooter>
              <span className="ml-badge" data-tone="success">+12%</span>
              <span className="ml-fine-print">vs last month</span>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Interactive</h3>
        <p className="ml-showcase-note">Interactive cards lift on hover and take the focus ring color.</p>
        <div className="ml-showcase-columns">
          <Card interactive>
            <CardHeader>
              <CardTitle>Open project</CardTitle>
              <CardDescription>Hover or focus to see the response.</CardDescription>
            </CardHeader>
          </Card>
          <Card interactive variant="elevated">
            <CardHeader>
              <CardTitle>Elevated and interactive</CardTitle>
              <CardDescription>Shadow deepens with the lift.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Content only</h3>
        <div className="ml-showcase-columns">
          <Card><CardContent>A card needs no header to be useful.</CardContent></Card>
        </div>
      </section>
    </div>
  );
}
