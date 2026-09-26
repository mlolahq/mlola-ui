import { DropdownMenu } from "./dropdown-menu";

export default function Example() {
  return (
    <DropdownMenu
      trigger="File"
      label="File"
      items={[
        { label: "New", shortcut: "⌘N" },
        { label: "Duplicate" },
        { label: "Delete", danger: true, separatorBefore: true },
      ]}
    />
  );
}
