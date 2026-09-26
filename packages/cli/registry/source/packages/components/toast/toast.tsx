"use client";

import * as React from "react";
import { IconCircleCheck, IconCircleX, IconInfo, IconTriangleAlert, IconX } from "@mlola-ui/icons";
import { cx } from "../_internal/react";

/** The meaning of the message, from the theme's color roles. */
export type ToastTone = "neutral" | "info" | "success" | "warning" | "danger";
export type ToastPosition = "top-right" | "top-center" | "bottom-right" | "bottom-center";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  /** A second line under the message. */
  description?: string;
  /** Milliseconds on screen. 0 or Infinity keeps it until dismissed. Loading toasts never time out. */
  duration?: number;
  position?: ToastPosition;
  tone?: ToastTone;
  action?: ToastAction;
  /** Replaces the tone's icon. `null` shows none. */
  icon?: React.ReactNode;
}

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  tone: ToastTone;
  /** Waiting on work: a spinner, no timeout, until updated. */
  loading: boolean;
  duration: number;
  position: ToastPosition;
  action?: ToastAction;
  icon?: React.ReactNode;
  /** Bumped on every update, so a changed toast restarts its timer. */
  revision: number;
  closing: boolean;
}

type ToastListener = (toasts: ToastItem[]) => void;

const DEFAULT_DURATION = 5000;
/** Problems stay longer: they are the toasts people most need to read. */
const URGENT_DURATION = 8000;

function durationFor(tone: ToastTone, loading: boolean, requested?: number) {
  if (loading) return Infinity;
  if (requested !== undefined) return requested;
  return tone === "danger" || tone === "warning" ? URGENT_DURATION : DEFAULT_DURATION;
}

/** How long a dismissed toast takes to fold away: the theme's normal duration, which the exit transition uses. */
function exitMs() {
  const value = typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue("--ml-duration-normal");
  const ms = parseFloat(value);
  return Number.isFinite(ms) ? ms : 240;
}

type Options = ToastOptions & { loading?: boolean };

let nextId = 1;
let store: ToastItem[] = [];
const listeners = new Set<ToastListener>();
const emit = () => listeners.forEach((listener) => listener(store));

function pushToast(message: string, options: Options = {}) {
  const id = nextId++;
  store = [
    ...store,
    {
      id,
      message,
      description: options.description,
      tone: options.tone ?? "neutral",
      loading: Boolean(options.loading),
      duration: durationFor(options.tone ?? "neutral", Boolean(options.loading), options.duration),
      position: options.position ?? "top-right",
      action: options.action,
      icon: options.icon,
      revision: 0,
      closing: false,
    },
  ];
  emit();
  return id;
}

/** Change a toast in place: a loading toast becoming a success, for example. */
function updateToast(id: number, message: string, options: Options = {}) {
  store = store.map((item) =>
    item.id === id
      ? {
          ...item,
          message,
          description: options.description,
          tone: options.tone ?? item.tone,
          loading: Boolean(options.loading),
          duration: durationFor(options.tone ?? item.tone, Boolean(options.loading), options.duration),
          action: options.action,
          icon: options.icon,
          revision: item.revision + 1,
        }
      : item,
  );
  emit();
}

/** Fold a toast away, or every toast when no id is given. */
function dismissToast(id?: number) {
  const targets = store.filter((item) => (id === undefined || item.id === id) && !item.closing).map((item) => item.id);
  if (!targets.length) return;
  store = store.map((item) => (targets.includes(item.id) ? { ...item, closing: true } : item));
  emit();
  setTimeout(() => {
    store = store.filter((item) => !targets.includes(item.id));
    emit();
  }, exitMs());
}

type ToastFn = (message: string, options?: Omit<ToastOptions, "tone">) => number;

interface PromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
}

interface ToastApi extends ToastFn {
  info: ToastFn;
  success: ToastFn;
  warning: ToastFn;
  danger: ToastFn;
  loading: ToastFn;
  /** Show a loading toast that becomes a success or a danger toast when the promise settles. */
  promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>, options?: Omit<ToastOptions, "tone">) => Promise<T>;
  update: (id: number, message: string, options?: ToastOptions) => void;
  dismiss: (id?: number) => void;
}

const toneFn = (tone: ToastTone): ToastFn => (message, options) => pushToast(message, { ...options, tone });

const toast: ToastApi = Object.assign((message: string, options?: Omit<ToastOptions, "tone">) => pushToast(message, options), {
  info: toneFn("info"),
  success: toneFn("success"),
  warning: toneFn("warning"),
  danger: toneFn("danger"),
  loading: ((message, options) => pushToast(message, { ...options, loading: true })) as ToastFn,
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>, options?: Omit<ToastOptions, "tone">) {
    const id = pushToast(messages.loading, { ...options, loading: true });
    promise.then(
      (value) => updateToast(id, typeof messages.success === "function" ? messages.success(value) : messages.success, { ...options, tone: "success" }),
      (error) => updateToast(id, typeof messages.error === "function" ? messages.error(error) : messages.error, { ...options, tone: "danger" }),
    );
    return promise;
  },
  update: updateToast,
  dismiss: dismissToast,
});

const TONE_ICONS: Partial<Record<ToastTone, React.ReactNode>> = {
  success: <IconCircleCheck size="1.125em" />,
  danger: <IconCircleX size="1.125em" />,
  warning: <IconTriangleAlert size="1.125em" />,
  info: <IconInfo size="1.125em" />,
};

/** Horizontal distance a swipe must travel to dismiss. */
const SWIPE_DISMISS_PX = 72;

function ToastCard({ item, paused }: { item: ToastItem; paused: boolean }) {
  const remaining = React.useRef(item.duration);
  const [drag, setDrag] = React.useState<{ start: number; offset: number } | null>(null);

  // A changed toast (loading → success) gets its full time again.
  React.useEffect(() => {
    remaining.current = item.duration;
  }, [item.revision, item.duration]);

  // The timer counts only while the toast can actually be read: not while
  // hovered, focused, or in a hidden tab. It resumes where it paused.
  React.useEffect(() => {
    if (paused || item.closing || !Number.isFinite(item.duration) || item.duration <= 0) return;
    const started = Date.now();
    const timer = window.setTimeout(() => dismissToast(item.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [paused, item.closing, item.duration, item.id, item.revision]);

  const urgent = item.tone === "danger" || item.tone === "warning";
  const icon = item.loading ? <span className="ml-toast-spinner" /> : item.icon === undefined ? TONE_ICONS[item.tone] : item.icon;

  return (
    <div className="ml-toast-slot" data-state={item.closing ? "closed" : "open"}>
      <div
        role={urgent ? "alert" : "status"}
        aria-live={urgent ? "assertive" : "polite"}
        aria-atomic="true"
        aria-busy={item.loading || undefined}
        data-tone={item.tone}
        data-has-description={item.description ? "" : undefined}
        data-swiping={drag ? "" : undefined}
        className="ml-toast"
        style={drag ? { transform: `translateX(${drag.offset}px)`, opacity: Math.max(0.2, 1 - Math.abs(drag.offset) / 200) } : undefined}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" || (event.target as HTMLElement).closest("button")) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({ start: event.clientX, offset: 0 });
        }}
        onPointerMove={(event) => {
          if (drag) setDrag({ ...drag, offset: event.clientX - drag.start });
        }}
        onPointerUp={() => {
          if (drag && Math.abs(drag.offset) > SWIPE_DISMISS_PX) dismissToast(item.id);
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        {icon ? (
          <span aria-hidden="true" className="ml-toast-icon">
            {icon}
          </span>
        ) : null}
        <div className="ml-toast-content">
          <p className="ml-toast-message">{item.message}</p>
          {item.description ? <p className="ml-toast-description">{item.description}</p> : null}
        </div>
        {item.action ? (
          <button
            type="button"
            className="ml-toast-action"
            onClick={() => {
              item.action?.onClick();
              dismissToast(item.id);
            }}
          >
            {item.action.label}
          </button>
        ) : null}
        <button type="button" aria-label="Dismiss notification" className="ml-toast-close" onClick={() => dismissToast(item.id)}>
          <IconX aria-hidden="true" size="0.875em" />
        </button>
      </div>
    </div>
  );
}

function useDocumentHidden() {
  return React.useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);
      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => document.hidden,
    () => false,
  );
}

interface ToasterProps {
  position?: ToastPosition;
  /** Overrides the region name. Distinct names keep several Toasters navigable. */
  label?: string;
  /** Toasts shown at once; the rest wait their turn. */
  max?: number;
  className?: string;
}

/**
 * Where toasts appear. The newest sits nearest the screen edge; older ones
 * step away from it. Hovering or focusing the stack pauses every timer, so
 * nothing disappears while it is being read.
 */
function Toaster({ position = "top-right", label, max = 3, className }: ToasterProps) {
  const [toasts, setToasts] = React.useState(() => store.filter((item) => item.position === position));
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const hidden = useDocumentHidden();

  React.useEffect(() => {
    const listener: ToastListener = (all) => setToasts(all.filter((item) => item.position === position));
    listeners.add(listener);
    listener(store);
    return () => {
      listeners.delete(listener);
    };
  }, [position]);

  const shown = toasts.slice(-Math.max(1, max));
  const ordered = position.startsWith("top") ? [...shown].reverse() : shown;

  return (
    <div
      role="region"
      aria-label={label ?? `Notifications (${position.replace("-", " ")})`}
      data-position={position}
      className={cx("ml-toaster", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {ordered.map((item) => (
        <ToastCard key={item.id} item={item} paused={hovered || focused || hidden} />
      ))}
    </div>
  );
}

export { toast, dismissToast, Toaster };
export type { ToastOptions, ToastAction, ToastApi };
