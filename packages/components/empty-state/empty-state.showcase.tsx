"use client";

import { IconFolderOpen, IconPlus, IconSearch } from "@mlola-ui/icons";
import { Button } from "../button/button";
import { EmptyState } from "./empty-state";

export default function EmptyStateShowcase() {
  return (
    <div className="ml-empty-state-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">First run: why it is empty and what to do</h3>
        <EmptyState
          icon={<IconFolderOpen size="1em" />}
          title="No themes yet"
          description="Describe a look in a sentence and the Studio turns it into a theme you can use anywhere."
          actions={
            <>
              <Button size="sm">
                <IconPlus aria-hidden="true" size="1em" />
                New theme
              </Button>
              <Button size="sm" variant="subtle">
                Browse examples
              </Button>
            </>
          }
        />
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">No results</h3>
        <EmptyState icon={<IconSearch size="1em" />} title="Nothing matches “terracota”" description="Check the spelling, or search by color instead." />
      </section>
    </div>
  );
}
