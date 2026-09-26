import { TagInput } from "./tag-input";

export default function Example() {
  return <TagInput label="Labels" defaultValue={["design", "billing"]} placeholder="Add a label" max={5} />;
}
