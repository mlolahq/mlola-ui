import { IconDownload, IconPlus, IconSettings } from "@mlola-ui/icons";
import { Button } from "../button";

export const title = "With icons";
export const description = "An icon leads or trails the label. An icon-only button always carries a name.";

export default function Example() {
  return (
    <div className="ml-cluster">
      <Button>
        <IconPlus aria-hidden="true" size="1em" />
        New project
      </Button>
      <Button variant="secondary">
        Export
        <IconDownload aria-hidden="true" size="1em" />
      </Button>
      <Button variant="subtle" size="icon" aria-label="Settings">
        <IconSettings aria-hidden="true" size="1em" />
      </Button>
    </div>
  );
}
