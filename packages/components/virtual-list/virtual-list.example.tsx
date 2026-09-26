import { VirtualList } from "./virtual-list";

export default function Example() {
  return (
    <VirtualList
      label="Events"
      count={10000}
      height={240}
      estimateSize={36}
      renderItem={(index) => <div>Event {index + 1}</div>}
    />
  );
}
