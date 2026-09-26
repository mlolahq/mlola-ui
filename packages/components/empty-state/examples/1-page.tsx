import { IconFolder, IconPlus } from "@mlola-ui/icons";
import { Button } from "../../button/button";
import { EmptyState } from "../empty-state";

export const title = "A whole page";
export const description = "The page size explains what will live here and gives the first step.";

export default function Example() {
  return (
    <EmptyState
      size="page"
      icon={<IconFolder size="1.5em" />}
      title="No projects yet"
      description="Projects hold your pages, your team and your billing. Start one, or import from a file."
      actions={
        <>
          <Button>
            <IconPlus aria-hidden="true" size="1em" />
            New project
          </Button>
          <Button variant="secondary">Import</Button>
        </>
      }
    />
  );
}
