"use client";

import * as React from "react";
import { IconCheck } from "@mlola-ui/icons";
import { cx } from "../_internal/react";

export interface StepperStep {
  label: string;
  description?: string;
  optional?: boolean;
  /** Mark a step that needs attention. */
  error?: boolean;
}

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface StepperProps {
  steps: StepperStep[];
  /** Index of the step in progress. */
  current: number;
  /** Makes steps clickable. */
  onStepChange?: (index: number) => void;
  /** Linear flows only go back, or one step forward; free ones go anywhere. */
  linear?: boolean;
  orientation?: "horizontal" | "vertical";
  /** The accessible name, such as "Checkout". */
  label?: string;
  className?: string;
}

export function stepStatus(step: StepperStep, index: number, current: number): StepStatus {
  if (step.error) return "error";
  if (index < current) return "complete";
  return index === current ? "current" : "upcoming";
}

/**
 * Where someone is in a flow of steps: done steps check off, the current one
 * is marked, and the line between them fills as they go. Steps can be
 * clickable, and in a narrow container the row condenses to "Step 2 of 4".
 */
export function Stepper({ steps, current, onStepChange, linear = true, orientation = "horizontal", label = "Progress", className }: StepperProps) {
  const reachable = (index: number) => Boolean(onStepChange) && index !== current && (!linear || index <= current + 1);
  const progress = steps.length > 1 ? current / (steps.length - 1) : 1;
  const now = steps[current];
  return (
    <nav className={cx("ml-stepper", className)} aria-label={label} data-orientation={orientation}>
      <p className="ml-stepper-summary" aria-hidden="true">
        <span>
          Step {Math.min(current + 1, steps.length)} of {steps.length}
        </span>
        <strong>{now?.label}</strong>
        <span className="ml-stepper-meter" style={{ "--ml-stepper-progress": progress } as React.CSSProperties} />
      </p>
      <ol className="ml-stepper-list">
        {steps.map((step, index) => {
          const status = stepStatus(step, index, current);
          const content = (
            <>
              <span className="ml-stepper-marker" aria-hidden="true">
                {status === "complete" ? <IconCheck size="0.8em" /> : status === "error" ? "!" : index + 1}
              </span>
              <span className="ml-stepper-text">
                <span className="ml-stepper-label">{step.label}</span>
                {step.description || step.optional ? (
                  <span className="ml-stepper-description">{step.optional ? (step.description ? `${step.description} · Optional` : "Optional") : step.description}</span>
                ) : null}
              </span>
              <span className="ml-visually-hidden">{status === "complete" ? ", completed" : status === "error" ? ", needs attention" : status === "upcoming" ? ", not started" : ""}</span>
            </>
          );
          return (
            <li key={`${step.label}-${index}`} className="ml-stepper-step" data-status={status} aria-current={status === "current" ? "step" : undefined}>
              {reachable(index) ? (
                <button type="button" className="ml-stepper-target" onClick={() => onStepChange?.(index)}>
                  {content}
                </button>
              ) : (
                <span className="ml-stepper-target">{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
