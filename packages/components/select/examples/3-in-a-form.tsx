"use client";

import * as React from "react";
import { Button } from "../../button/button";
import { Select } from "../select";

export const title = "In a form";
export const description = "name submits the value like a native select; id lets a label elsewhere in the form name it.";

export default function Example() {
  const [sent, setSent] = React.useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(`Saved: ${new FormData(event.currentTarget).get("visibility")}`);
      }}
    >
      <label htmlFor="visibility" className="ml-input-label">
        Who can see this project
      </label>
      <Select
        id="visibility"
        name="visibility"
        required
        defaultValue="team"
        options={[
          { value: "private", label: "Only me" },
          { value: "team", label: "My team" },
          { value: "public", label: "Anyone with the link" },
        ]}
      />
      <Button type="submit">Save</Button>
      <p role="status">{sent}</p>
    </form>
  );
}
