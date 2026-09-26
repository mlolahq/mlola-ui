"use client";

import { Button } from "../../button/button";
import { Toaster, toast } from "../toast";

export const title = "Following work to its end";
export const description = "One toast says it is working, then reports how it went, without a second message.";

const publish = () => new Promise<string>((resolve) => window.setTimeout(() => resolve("v2.4"), 1400));

export default function Example() {
  return (
    <>
      <Button onClick={() => toast.promise(publish(), { loading: "Publishing…", success: (version) => `Published ${version}`, error: "Could not publish" })}>
        Publish
      </Button>
      <Toaster />
    </>
  );
}
