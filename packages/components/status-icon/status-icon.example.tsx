import { StatusIcon } from "./status-icon";

export default function Example() {
  return (
    <div className="ml-cluster">
      <StatusIcon status="todo" />
      <StatusIcon status="in-progress" progress={0.5} />
      <StatusIcon status="done" />
    </div>
  );
}
