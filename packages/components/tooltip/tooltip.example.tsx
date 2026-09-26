import { Button } from "../button/button";
import { Tooltip } from "./tooltip";

export default function Example() {
  return (
    <Tooltip content="Copy a link to this page">
      <Button variant="secondary" size="sm">Share</Button>
    </Tooltip>
  );
}
