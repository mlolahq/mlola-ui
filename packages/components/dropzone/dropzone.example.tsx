"use client";

import * as React from "react";
import { Dropzone } from "./dropzone";

export default function Example() {
  const [files, setFiles] = React.useState<File[]>([]);
  return (
    <Dropzone
      label="Attachments"
      hint={files.length ? `${files.length} selected` : "PNG or PDF, up to 10 MB"}
      accept="image/png,application/pdf"
      maxSize={10 * 1024 * 1024}
      multiple
      onFiles={setFiles}
    />
  );
}
