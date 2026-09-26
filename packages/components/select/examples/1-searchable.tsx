import { Select } from "../select";

export const title = "Searchable, in groups";
export const description = "Long lists get a search field; options can be grouped and disabled.";

export default function Example() {
  return (
    <Select
      label="Time zone"
      placeholder="Choose a time zone"
      searchable
      options={[
        { value: "america/new_york", label: "New York", group: "Americas" },
        { value: "america/sao_paulo", label: "São Paulo", group: "Americas" },
        { value: "europe/lisbon", label: "Lisbon", group: "Europe" },
        { value: "europe/berlin", label: "Berlin", group: "Europe" },
        { value: "asia/jakarta", label: "Jakarta", group: "Asia" },
        { value: "asia/tokyo", label: "Tokyo", group: "Asia", disabled: true },
      ]}
    />
  );
}
