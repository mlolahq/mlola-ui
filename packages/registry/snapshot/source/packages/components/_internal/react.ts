import * as React from "react";

export type ClassNameValue = string | false | null | undefined;

export function cx(...values: ClassNameValue[]): string {
  return values.filter(Boolean).join(" ");
}

export function composeRefs<T>(
  ...refs: Array<React.ForwardedRef<T> | undefined>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (value: T) => void] {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const setValue = React.useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );
  return [current, setValue];
}

/**
 * The latest value in a ref, for handlers and effects that must not re-run
 * when it changes. Written after render, never during it.
 */
export function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  React.useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

const noSubscription = () => () => undefined;

/** False on the server and while hydrating, true in the browser after that: when it is safe to render into <body>. */
export function useIsClient() {
  return React.useSyncExternalStore(noSubscription, () => true, () => false);
}

type AriaAttributes = { [key: `aria-${string}`]: unknown };

/**
 * Split `aria-*` attributes from the rest, for a component whose root is not
 * the element that carries its role: ARIA goes to the element with the role,
 * everything else (id, data-*, style, handlers) to the root.
 */
export function splitAria<T extends object>(props: T): [AriaAttributes, Omit<T, `aria-${string}`>] {
  const aria: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) (key.startsWith("aria-") ? aria : rest)[key] = value;
  return [aria as AriaAttributes, rest as Omit<T, `aria-${string}`>];
}

/** The level of a heading a component renders, so it fits the outline of the page around it. */
export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

/** A heading at the level the caller asks for; `h3` unless told otherwise. */
export const Heading = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement> & { level?: HeadingLevel }>(
  function Heading({ level = 3, ...props }, ref) {
    return React.createElement(`h${level}`, { ...props, ref });
  },
);
