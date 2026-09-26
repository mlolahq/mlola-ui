"use client";

import { Button } from "../button/button";
import { Toaster, toast } from "./toast";

export default function Example() {
  return (
    <>
      <Button onClick={() => toast.success("Draft saved to your workspace.")}>Save draft</Button>
      <Toaster />
    </>
  );
}
