import { RadioGroup, RadioGroupItem } from "./radio-group";

export default function Example() {
  return (
    <RadioGroup label="Billing" defaultValue="yearly" name="billing">
      <RadioGroupItem value="monthly" label="Monthly" />
      <RadioGroupItem value="yearly" label="Yearly" description="Two months free." />
    </RadioGroup>
  );
}
