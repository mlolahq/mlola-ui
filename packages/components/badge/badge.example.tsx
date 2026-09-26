import { Badge } from "./badge";

export default function Example() {
  return (
    <div className="ml-cluster">
      <Badge>Draft</Badge>
      <Badge tone="success" dot>Live</Badge>
      <Badge tone="warning" variant="outline">Review</Badge>
      <Badge tone="danger" variant="solid">Failed</Badge>
    </div>
  );
}
