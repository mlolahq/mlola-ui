"use client";

import * as React from "react";
import { useReducedMotion } from "./use-reduced-motion.ts";

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export interface Stage3DProps extends React.HTMLAttributes<HTMLDivElement> {
  perspective?: number;
  interactive?: boolean;
  maxRotationX?: number;
  maxRotationY?: number;
}

export const Stage3D = React.forwardRef<HTMLDivElement, Stage3DProps>(
  (
    {
      perspective = 1200,
      interactive = true,
      maxRotationX = 12,
      maxRotationY = 14,
      children,
      style,
      onPointerMove,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    forwardedRef
  ) => {
    const reducedMotion = useReducedMotion();
    const stageRef = React.useRef<HTMLDivElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const frameRef = React.useRef<number | null>(null);
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        stageRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    const renderRotation = React.useCallback((x: number, y: number, active: boolean) => {
      const content = contentRef.current;
      if (!content) return;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (typeof requestAnimationFrame === "undefined") return;
      frameRef.current = requestAnimationFrame(() => {
        content.style.transform = `rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg)`;
        content.style.transition = active
          ? "transform 80ms linear"
          : "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)";
        frameRef.current = null;
      });
    }, []);

    React.useEffect(
      () => () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      },
      []
    );

    React.useEffect(() => {
      if (reducedMotion || !interactive) renderRotation(0, 0, false);
    }, [interactive, reducedMotion, renderRotation]);

    const reset = () => renderRotation(0, 0, false);

    return (
      <div
        {...props}
        ref={setRef}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          const stage = stageRef.current;
          if (
            event.defaultPrevented ||
            !interactive ||
            reducedMotion ||
            event.pointerType === "touch" ||
            !stage
          ) return;
          const rect = stage.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          renderRotation(
            -py * finite(maxRotationX, 12),
            px * finite(maxRotationY, 14),
            true
          );
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          reset();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          reset();
        }}
        style={{
          perspective: `${Math.max(1, finite(perspective, 1200))}px`,
          transformStyle: "preserve-3d",
          ...style,
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: "100%",
            height: "100%",
            transform: "rotateX(0deg) rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: reducedMotion
              ? "none"
              : "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: interactive && !reducedMotion ? "transform" : undefined,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);
Stage3D.displayName = "Stage3D";

export interface FloatingLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  depth?: number;
}

export const FloatingLayer = React.forwardRef<HTMLDivElement, FloatingLayerProps>(
  ({ depth = 30, children, style, ...props }, ref) => {
    const safeDepth = Math.max(-1000, Math.min(1000, finite(depth, 30)));
    return (
      <div
        {...props}
        ref={ref}
        style={{
          transform: `translateZ(${safeDepth}px)`,
          transformStyle: "preserve-3d",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
FloatingLayer.displayName = "FloatingLayer";
