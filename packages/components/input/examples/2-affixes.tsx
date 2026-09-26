import { IconSearch } from "@mlola-ui/icons";
import { Input } from "../input";

export const title = "With an icon or a prefix";
export const description = "The text starts after whatever sits beside it, however wide it is.";

export default function Example() {
  return (
    <div className="ml-stack">
      <Input label="Search" type="search" placeholder="Search projects" leading={<IconSearch size="1em" />} />
      <Input label="Website" leading="https://" placeholder="company.com" />
    </div>
  );
}
