"use client";

import * as React from "react";
import { Dropzone, type DropzoneFile } from "./dropzone";

export default function DropzoneShowcase() {
  const [files, setFiles] = React.useState<DropzoneFile[]>([
    { id: "a", name: "brand-guidelines.pdf", size: 2_400_000, status: "done" },
    { id: "b", name: "palette-export.png", size: 380_000, status: "uploading", progress: 64 },
  ]);
  React.useEffect(() => {
    const timer = window.setInterval(
      () =>
        setFiles((all) =>
          all.map((file) =>
            file.status === "uploading" ? { ...file, progress: Math.min(100, (file.progress ?? 0) + 9), status: (file.progress ?? 0) + 9 >= 100 ? "done" : "uploading" } : file,
          ),
        ),
      500,
    );
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="ml-dropzone-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Drop, choose or paste; checked before upload</h3>
        <Dropzone
          label="Attachments"
          hint="Images and PDFs, up to 5 files."
          accept="image/*,.pdf"
          maxSize={10 * 1024 * 1024}
          maxFiles={5}
          files={files}
          onRemove={(file) => setFiles((all) => all.filter((item) => item.id !== file.id))}
          onFiles={(added) =>
            setFiles((all) => [...all, ...added.map((file, index) => ({ id: `${Date.now()}-${index}`, name: file.name, size: file.size, status: "uploading" as const, progress: 0 }))])
          }
        />
      </section>
    </div>
  );
}
