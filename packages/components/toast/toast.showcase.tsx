"use client";

import { Toaster, dismissToast, toast } from "./toast";
import type { ToastPosition, ToastTone } from "./toast";

export default function Showcase() {
  const tones: Array<{ tone: ToastTone; label: string; message: string }> = [
    { tone: "neutral", label: "Neutral", message: "Draft saved to your workspace." },
    { tone: "success", label: "Success", message: "Changes published successfully." },
    { tone: "info", label: "Info", message: "A new version is available." },
    { tone: "warning", label: "Warning", message: "Your trial ends in three days." },
    { tone: "danger", label: "Danger", message: "Upload failed. Check your connection." },
  ];
  const positions: ToastPosition[] = ["top-right", "top-center", "bottom-right", "bottom-center"];
  return (
    <div className="ml-toast-showcase">
      {positions.map((position) => (
        <Toaster key={position} position={position} />
      ))}

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Tones</h3>
        <div className="ml-showcase-row">
          {tones.map(({ tone, label, message }) => (
            <button
              key={tone}
              type="button"
              className="ml-button" data-variant="secondary"
              data-size="sm"
              onClick={() => (tone === "neutral" ? toast(message) : toast[tone](message))}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Position</h3>
        <div className="ml-showcase-row">
          {positions.map((position) => (
            <button
              key={position}
              type="button"
              className="ml-button" data-variant="secondary"
              data-size="sm"
              onClick={() => toast(`Anchored ${position}.`, { position })}
            >
              {position}
            </button>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With action</h3>
        <div className="ml-showcase-row">
          <button
            type="button"
            className="ml-button" data-variant="secondary"
            data-size="sm"
            onClick={() =>
              toast("Message moved to Archive.", {
                action: { label: "Undo", onClick: () => toast.success("Move undone.") },
              })
            }
          >
            Undo action
          </button>
          <button
            type="button"
            className="ml-button" data-variant="secondary"
            data-size="sm"
            onClick={() =>
              toast.danger("Deploy failed on step 3.", {
                action: { label: "Retry", onClick: () => toast.info("Retrying deploy…") },
              })
            }
          >
            Retry action
          </button>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Description, promise and queue</h3>
        <div className="ml-showcase-row">
          <button
            type="button"
            className="ml-button" data-variant="secondary"
            data-size="sm"
            onClick={() => toast.success("Theme saved", { description: "Terracotta Pages is now v4 and live at its hosted URL." })}
          >
            With description
          </button>
          <button
            type="button"
            className="ml-button" data-variant="secondary"
            data-size="sm"
            onClick={() =>
              toast.promise(new Promise((resolve) => setTimeout(resolve, 2200)), {
                loading: "Generating theme…",
                success: "Theme ready",
                error: "Generation failed",
              })
            }
          >
            Promise
          </button>
          <button
            type="button"
            className="ml-button" data-variant="secondary"
            data-size="sm"
            onClick={() => ["Build 1 queued.", "Build 2 queued.", "Build 3 queued.", "Build 4 queued.", "Build 5 queued."].forEach((message) => toast(message))}
          >
            Five at once
          </button>
        </div>
        <p className="ml-showcase-note">Three show at a time; the rest wait. Hovering the stack pauses every timer, and so does leaving the tab.</p>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Duration</h3>
        <p className="ml-showcase-note">Errors and warnings hold longer so they are not missed.</p>
        <div className="ml-showcase-row">
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => toast("Gone in 1.5s.", { duration: 1500 })}>
            Short
          </button>
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => toast("Stays until dismissed.", { duration: 0 })}>
            Persistent
          </button>
          <button type="button" className="ml-button" data-variant="subtle" data-size="sm" onClick={() => dismissToast()}>
            Dismiss all
          </button>
        </div>
      </section>
    </div>
  );
}
