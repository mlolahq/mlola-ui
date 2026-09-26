import { Combobox } from "./combobox";

export default function Example() {
  return (
    <Combobox
      label="Framework"
      placeholder="Search frameworks"
      clearable
      options={[
        { value: "next", label: "Next.js" },
        { value: "remix", label: "Remix" },
        { value: "astro", label: "Astro" },
      ]}
    />
  );
}
