"use client";

import { Button } from "../../button/button";
import { Toaster, toast } from "../toast";

export const title = "With an undo";
export const description = "An action in the toast gives a quick way back from something easy to regret.";

export default function Example() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast("Conversation archived", { action: { label: "Undo", onClick: () => toast.success("Restored") } })}>
        Archive
      </Button>
      <Toaster />
    </>
  );
}
