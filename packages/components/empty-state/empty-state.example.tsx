import { IconMail } from "@mlola-ui/icons";
import { Button } from "../button/button";
import { EmptyState } from "./empty-state";

export default function Example() {
  return (
    <EmptyState
      icon={<IconMail size="1.5em" />}
      title="No messages yet"
      description="New conversations appear here."
      actions={<Button size="sm">Start one</Button>}
    />
  );
}
