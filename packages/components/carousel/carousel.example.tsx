import { Carousel } from "./carousel";

const slides = ["Plan", "Build", "Ship"].map((title) => (
  <div key={title} className="ml-card" data-variant="elevated">
    <div className="ml-card-content">{title}</div>
  </div>
));

export default function Example() {
  return <Carousel label="Release stages" items={slides} itemLabels={["Plan", "Build", "Ship"]} />;
}
