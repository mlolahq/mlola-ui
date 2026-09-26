"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { IconCircleCheck, IconCircleX, IconInfo, IconTriangleAlert, IconX } from "@mlola-ui/icons";

/** The meaning of the message, from the theme's color roles. */
export type AlertTone = "neutral" | "info" | "success" | "warning" | "danger";
/** "card" is a neutral card with a solid icon mark; "soft" tints the whole alert, for banners across a page. */
export type AlertVariant = "card" | "soft";
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  variant?: AlertVariant;
  onDismiss?: () => void;
  action?: React.ReactNode;
  /** Replaces the tone's icon. `null` shows none. */
  icon?: React.ReactNode;
}

const TONE_ICONS: Record<AlertTone, React.ReactNode> = {
  neutral: <IconInfo size="1em" />,
  info: <IconInfo size="1em" />,
  success: <IconCircleCheck size="1em" />,
  warning: <IconTriangleAlert size="1em" />,
  danger: <IconCircleX size="1em" />,
};

/**
 * A message in the page. Only warnings and errors interrupt a screen reader
 * (role="alert"); calmer notices are announced politely when they appear.
 * It eases in when it appears and, when dismissed, eases out before
 * `onDismiss` runs, so the layout closes smoothly around it.
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ tone = "neutral", variant = "card", onDismiss, action, icon, className, children, ...props }, ref) => {
    const [leaving, setLeaving] = React.useState(false);
    const timer = React.useRef<number | undefined>(undefined);
    React.useEffect(() => () => window.clearTimeout(timer.current), []);
    const dismiss = () => {
      if (!onDismiss || leaving) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onDismiss();
      setLeaving(true);
      timer.current = window.setTimeout(onDismiss, 200);
    };
    return (
      <div
        ref={ref}
        role={tone === "danger" || tone === "warning" ? "alert" : "status"}
        data-tone={tone}
        data-variant={variant}
        data-state={leaving ? "closing" : "open"}
        className={cx("ml-alert", className)}
        {...props}
      >
        {icon === null ? <span aria-hidden="true" /> : <span aria-hidden="true" className="ml-alert-icon">{icon ?? TONE_ICONS[tone]}</span>}
        <div className="ml-alert-content">{children}</div>
        {action || onDismiss ? (
          <div className="ml-alert-actions">
            {action}
            {onDismiss ? (
              <button type="button" onClick={dismiss} aria-label="Dismiss alert" className="ml-alert-dismiss">
                <IconX aria-hidden="true" size="1em" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);
Alert.displayName = "Alert";
// Not a heading: an alert sits inside whatever outline the page already has,
// so it must not claim a level. Wrap it in a heading yourself when it needs one.
const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cx("ml-alert-title", className)} {...props} />
);
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cx("ml-alert-description", className)} {...props} />
);
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertTitle, AlertDescription };
export type { AlertProps };
