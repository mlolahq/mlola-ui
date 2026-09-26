import { NumberInput } from "./number-input";

export default function Example() {
  return <NumberInput label="Seats" defaultValue={5} min={1} max={50} hint="Up to 50 on this plan." locale="en-US" />;
}
