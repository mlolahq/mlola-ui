import { Button } from "../button/button";
import { Popover } from "./popover";

export default function Example() {
  return (
    <Popover label="Share" trigger={<Button variant="secondary">Share</Button>}>
      <p>Anyone with the link can view this page.</p>
    </Popover>
  );
}
