import { Select } from "./select";

export default function Example() {
  return (
    <Select
      label="Region"
      placeholder="Choose a region"
      defaultValue="eu"
      options={[
        { value: "us", label: "United States" },
        { value: "eu", label: "Europe" },
        { value: "ap", label: "Asia Pacific" },
      ]}
    />
  );
}
