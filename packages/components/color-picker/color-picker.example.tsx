import { ColorPicker } from "./color-picker";

export default function Example() {
  // audit-allow: color.literal — a color value is the data this control edits
  return <ColorPicker label="Brand color" defaultValue="oklch(0.62 0.19 255)" format="oklch" />;
}
