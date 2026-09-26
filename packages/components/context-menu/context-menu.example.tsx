import { ContextMenu } from "./context-menu";

export default function Example() {
  return (
    <ContextMenu
      label="File actions"
      items={[
        { label: "Rename", shortcut: "F2" },
        { label: "Duplicate" },
        { label: "Delete", danger: true, separatorBefore: true },
      ]}
    >
      <div className="ml-card" data-variant="outline">
        <div className="ml-card-content">Right-click, or press Shift+F10, on this file.</div>
      </div>
    </ContextMenu>
  );
}
