import { HoverCard } from "./hover-card";

export default function Example() {
  return (
    <HoverCard content={<p>Lena Park, design lead. Owns the pricing page.</p>}>
      <a href="/people/lena">@lena</a>
    </HoverCard>
  );
}
