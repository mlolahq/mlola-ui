"use client";

import * as React from "react";
import { useReducedMotion } from "./reduced-motion";
import { createSpringAnimation, springPresets } from "./spring";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export interface AnimatedCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  stagger?: number;
}

export function AnimatedCounter({
  value,
  className,
  stagger = 35,
  ...props
}: AnimatedCounterProps) {
  const reducedMotion = useReducedMotion();
  const text = String(value);
  return (
    <span
      {...props}
      className={joinClasses("ml-motion-counter", className)}
      aria-label={props["aria-label"] ?? text}
    >
      {Array.from(text).map((character, index) => (
        <span
          aria-hidden="true"
          key={`${index}-${character}`}
          className="ml-motion-counter-digit"
          style={
            reducedMotion
              ? undefined
              : {
                  animation: "counter-flip 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
                  animationDelay: `${index * stagger}ms`,
                }
          }
        >
          {character}
        </span>
      ))}
    </span>
  );
}

export interface TextSwapProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
}

export function TextSwap({ text, className, style, ...props }: TextSwapProps) {
  const reducedMotion = useReducedMotion();
  return (
    <span
      {...props}
      key={text}
      className={joinClasses("ml-motion-text", className)}
      style={{
        animation: reducedMotion
          ? undefined
          : "text-swap 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        ...style,
      }}
    >
      {text}
    </span>
  );
}

export function ShimmerText({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const reducedMotion = useReducedMotion();
  return (
    <span
      {...props}
      className={joinClasses(!reducedMotion && "ml-motion-shimmer", className)}
    >
      {children}
    </span>
  );
}

export interface MagneticProps extends React.HTMLAttributes<HTMLDivElement> {
  pull?: number;
}

export const Magnetic = React.forwardRef<HTMLDivElement, MagneticProps>(
  (
    {
      children,
      pull = 0.25,
      className,
      style,
      onPointerMove,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    forwardedRef
  ) => {
    const reducedMotion = useReducedMotion();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    const offset = React.useRef({ x: 0, y: 0 });
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    // The pull is a real spring, not a CSS transition: it can be interrupted
    // mid-flight, and the loop stops the moment it comes to rest.
    const paint = React.useCallback(() => {
      const node = nodeRef.current;
      if (!node) return;
      node.style.transform = `translate3d(${offset.current.x.toFixed(2)}px, ${offset.current.y.toFixed(2)}px, 0)`;
    }, []);
    const springX = React.useMemo(
      () =>
        createSpringAnimation({
          options: springPresets.snappy,
          onUpdate: (value) => {
            offset.current.x = value;
            paint();
          },
        }),
      [paint]
    );
    const springY = React.useMemo(
      () =>
        createSpringAnimation({
          options: springPresets.snappy,
          onUpdate: (value) => {
            offset.current.y = value;
            paint();
          },
        }),
      [paint]
    );

    React.useEffect(
      () => () => {
        springX.stop();
        springY.stop();
      },
      [springX, springY]
    );

    const moveTo = (x: number, y: number) => {
      springX.setTarget(x);
      springY.setTarget(y);
    };
    const reset = () => moveTo(0, 0);

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      const node = nodeRef.current;
      if (event.defaultPrevented || reducedMotion || event.pointerType === "touch" || !node) return;
      const rect = node.getBoundingClientRect();
      moveTo(
        (event.clientX - (rect.left + rect.width / 2)) * pull,
        (event.clientY - (rect.top + rect.height / 2)) * pull
      );
    };

    React.useEffect(() => {
      if (!reducedMotion) return;
      springX.set(0);
      springY.set(0);
    }, [reducedMotion, springX, springY]);

    return (
      <div
        {...props}
        ref={setRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          reset();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          reset();
        }}
        className={joinClasses("ml-motion-magnetic", className)}
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: reducedMotion ? undefined : "transform",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
Magnetic.displayName = "Magnetic";

export interface OriginMorphProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
}

export function OriginMorph({
  isOpen,
  children,
  className,
  style,
  ...props
}: OriginMorphProps) {
  const reducedMotion = useReducedMotion();
  if (!isOpen) return null;
  return (
    <div
      {...props}
      className={joinClasses("ml-motion-origin-morph", !reducedMotion && "ml-animate-pop", className)}
      style={style}
    >
      {children}
    </div>
  );
}
