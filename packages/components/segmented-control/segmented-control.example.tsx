import { SegmentedControl } from "./segmented-control";

export default function Example() {
  return (
    <SegmentedControl
      label="View"
      defaultValue="board"
      options={[
        { value: "list", label: "List" },
        { value: "board", label: "Board" },
        { value: "calendar", label: "Calendar" },
      ]}
    />
  );
}
