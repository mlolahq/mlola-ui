import { Button } from "./button";

export default function Example() {
  return (
    <div className="ml-cluster">
      <Button>Save changes</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger" size="sm">Delete</Button>
    </div>
  );
}
