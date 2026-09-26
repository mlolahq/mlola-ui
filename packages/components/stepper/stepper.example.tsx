import { Stepper } from "./stepper";

export default function Example() {
  return (
    <Stepper
      label="Checkout"
      current={1}
      steps={[{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }, { label: "Review", optional: true }]}
    />
  );
}
