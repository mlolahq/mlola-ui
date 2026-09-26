import { Select } from "../select";

export const title = "Several values";
export const description = "multiple collects values as chips; clearable empties them at once.";

export default function Example() {
  return (
    <Select
      label="Notify"
      multiple
      clearable
      defaultValue={["design", "billing"]}
      options={[
        { value: "design", label: "Design" },
        { value: "engineering", label: "Engineering" },
        { value: "billing", label: "Billing" },
        { value: "support", label: "Support" },
      ]}
    />
  );
}
