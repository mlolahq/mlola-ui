"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Tour } from "./tour";

export default function Example() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div className="ml-cluster">
        <Button id="tour-search" variant="secondary">Search</Button>
        <Button id="tour-new">New project</Button>
        <Button variant="subtle" onClick={() => setOpen(true)}>Take the tour</Button>
      </div>
      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          { target: "#tour-search", title: "Find anything", body: "Search projects, people and settings." },
          { target: "#tour-new", title: "Start here", body: "A project holds pages, members and billing." },
        ]}
      />
    </>
  );
}
