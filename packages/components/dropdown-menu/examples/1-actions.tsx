import { IconArchive, IconCopy, IconEdit, IconMoreHorizontal, IconTrash } from "@mlola-ui/icons";
import { DropdownMenu } from "../dropdown-menu";

export const title = "Row actions";
export const description = "Icons and shortcuts help recognition; a destructive item sits last, apart from the rest.";

export default function Example() {
  return (
    <DropdownMenu
      label="Project actions"
      align="end"
      trigger={<IconMoreHorizontal aria-label="Project actions" size="1em" />}
      items={[
        { label: "Rename", icon: <IconEdit size="1em" />, shortcut: "F2" },
        { label: "Duplicate", icon: <IconCopy size="1em" />, shortcut: "⌘D" },
        { label: "Archive", icon: <IconArchive size="1em" /> },
        { label: "Delete", icon: <IconTrash size="1em" />, danger: true, separatorBefore: true },
      ]}
    />
  );
}
