"use client";

import * as React from "react";
import { IconUpload, IconX } from "@mlola-ui/icons";
import { Field } from "../input/input";

export interface DropzoneFile {
  id: string;
  name: string;
  size: number;
  /** 0..100 while uploading. */
  progress?: number;
  status?: "uploading" | "done" | "error";
  error?: string;
}

export interface DropzoneProps {
  /** Called with the files that passed validation. */
  onFiles: (files: File[]) => void;
  /** Files to list under the zone, e.g. uploads in progress. */
  files?: DropzoneFile[];
  onRemove?: (file: DropzoneFile) => void;
  /** As the input's accept attribute: "image/*,.pdf". */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  label?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** "image/*,.pdf" → "Images, PDF": what a person would call the types. */
function describeAccept(accept: string) {
  const words: Record<string, string> = { "image/*": "Images", "video/*": "Videos", "audio/*": "Audio", "text/*": "Text files" };
  return accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .map((rule) => words[rule] ?? (rule.startsWith(".") ? rule.slice(1).toUpperCase() : rule.split("/").pop()?.toUpperCase() ?? rule))
    .join(", ");
}

function accepts(file: File, accept: string | undefined) {
  if (!accept) return true;
  return accept.split(",").map((rule) => rule.trim().toLowerCase()).some((rule) => {
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
    return file.type === rule;
  });
}

/**
 * Drop files, choose them, or paste them. Files are checked for type, size
 * and count before they are handed over, and every rejection is explained.
 */
export function Dropzone({ onFiles, files = [], onRemove, accept, maxSize, maxFiles, multiple = true, label, hint, disabled, id, className }: DropzoneProps) {
  const input = React.useRef<HTMLInputElement>(null);
  const generated = React.useId();
  const fieldId = id ?? `dropzone-${generated}`;
  const [dragging, setDragging] = React.useState(false);
  const [rejected, setRejected] = React.useState<string[]>([]);
  const depth = React.useRef(0);

  const take = (list: FileList | File[] | null) => {
    if (!list || disabled) return;
    const incoming = Array.from(list);
    const problems: string[] = [];
    const room = maxFiles !== undefined ? Math.max(0, maxFiles - files.length) : Infinity;
    const kept = incoming.filter((file) => {
      if (!accepts(file, accept)) problems.push(`${file.name} is not an accepted file type.`);
      else if (maxSize !== undefined && file.size > maxSize) problems.push(`${file.name} is larger than ${formatBytes(maxSize)}.`);
      else return true;
      return false;
    });
    if (kept.length > room) problems.push(`Only ${maxFiles} ${maxFiles === 1 ? "file" : "files"} can be added.`);
    setRejected(problems);
    const accepted = kept.slice(0, room === Infinity ? undefined : room);
    if (accepted.length) onFiles(multiple ? accepted : accepted.slice(0, 1));
  };

  const rules = [accept && describeAccept(accept), maxSize && `up to ${formatBytes(maxSize)}`].filter(Boolean).join(" · ");

  return (
    <div className={["ml-dropzone-root", className].filter(Boolean).join(" ")}>
      <Field id={fieldId} label={label} hint={hint} disabled={disabled}>
        <div
          id={fieldId}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={`${label ? `${label}: ` : ""}drop files here, or press Enter to choose`}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          className="ml-dropzone"
          data-dragging={dragging || undefined}
          onClick={() => input.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              input.current?.click();
            }
          }}
          onPaste={(event) => take(event.clipboardData.files)}
          onDragEnter={(event) => {
            event.preventDefault();
            depth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => {
            depth.current = Math.max(0, depth.current - 1);
            if (depth.current === 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            depth.current = 0;
            setDragging(false);
            take(event.dataTransfer.files);
          }}
        >
          <span className="ml-dropzone-icon" aria-hidden="true">
            <IconUpload size="1em" />
          </span>
          <span className="ml-dropzone-title">{dragging ? "Drop to upload" : "Drop files here, or choose"}</span>
          {rules ? <span className="ml-dropzone-rules">{rules}</span> : null}
          <input
            ref={input}
            type="file"
            hidden
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(event) => {
              take(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        {rejected.length ? (
          <ul className="ml-dropzone-rejected" role="alert">
            {rejected.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        ) : null}
      </Field>
      {files.length ? (
        <ul className="ml-dropzone-files" aria-label="Files">
          {files.map((file) => (
            <li key={file.id} className="ml-dropzone-file" data-status={file.status ?? "done"}>
              <span className="ml-dropzone-file-name">{file.name}</span>
              <span className="ml-dropzone-file-meta">
                {file.status === "error" ? file.error ?? "Upload failed" : file.status === "uploading" ? `${Math.round(file.progress ?? 0)}%` : formatBytes(file.size)}
              </span>
              {onRemove ? (
                <button type="button" className="ml-dropzone-remove" data-hit="expand" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file)}>
                  <IconX aria-hidden="true" size="0.875em" />
                </button>
              ) : null}
              {file.status === "uploading" ? (
                <span
                  className="ml-dropzone-progress"
                  role="progressbar"
                  aria-label={`Uploading ${file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(file.progress ?? 0)}
                  style={{ ["--ml-dropzone-progress" as string]: `${file.progress ?? 0}%` }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
