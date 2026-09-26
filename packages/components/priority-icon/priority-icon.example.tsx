import { PriorityIcon } from "./priority-icon";

export default function Example() {
  return (
    <div className="ml-cluster">
      <PriorityIcon priority="urgent" />
      <PriorityIcon priority="high" />
      <PriorityIcon priority="low" />
    </div>
  );
}
