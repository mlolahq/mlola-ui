"use client";

import * as React from "react";
import { createRafBatcher } from "./raf.ts";
import { useReducedMotion } from "./reduced-motion.ts";

export interface Tilt3DProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  perspective?: number;
  glare?: boolean;
  scale?: number;
}

interface TiltFrame {
  x: number;
  y: number;
  glareX: number;
  glareY: number;
  active: boolean;
}

export const Tilt3D = React.forwardRef<HTMLDivElement, Tilt3DProps>(
  (
    {
      maxTilt = 12,
      perspective = 900,
      glare = true,
      scale = 1.02,
      className,
      style,
      children,
      onPointerMove,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    forwardedRef
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        cardRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    const batcher = React.useMemo(
      () =>
        createRafBatcher<TiltFrame>((frame) => {
          const node = cardRef.current;
          if (!node) return;
          node.style.transform = frame.active
            ? `perspective(${perspective}px) rotateX(${frame.x.toFixed(2)}deg) rotateY(${frame.y.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
            : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
          node.style.transition = frame.active
            ? "transform 80ms linear"
            : "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
          node.style.setProperty("--mlola-glare-x", `${frame.glareX}%`);
          node.style.setProperty("--mlola-glare-y", `${frame.glareY}%`);
          node.style.setProperty("--mlola-glare-opacity", frame.active && glare ? "1" : "0");
        }),
      [glare, perspective, scale]
    );

    React.useEffect(() => () => batcher.cancel(), [batcher]);

    const reset = () => {
      batcher.schedule({ x: 0, y: 0, glareX: 50, glareY: 50, active: false });
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);
      const node = cardRef.current;
      if (
        event.defaultPrevented ||
        reducedMotion ||
        event.pointerType === "touch" ||
        !node
      ) return;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      batcher.schedule({
        x: (y - 0.5) * -maxTilt,
        y: (x - 0.5) * maxTilt,
        glareX: x * 100,
        glareY: y * 100,
        active: true,
      });
    };

    const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      reset();
    };

    const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerCancel?.(event);
      reset();
    };

    React.useEffect(() => {
      if (reducedMotion) reset();
    }, [reducedMotion]);

    return (
      <div
        {...props}
        ref={setRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
        className={className}
        style={{
          transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
          transformStyle: "preserve-3d",
          transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: reducedMotion ? undefined : "transform",
          position: "relative",
          ...style,
        }}
      >
        {children}
        {glare && (
          <span
            aria-hidden="true"
            className="ml-motion-tilt-glare"
            style={reducedMotion ? { transition: "none" } : undefined}
          />
        )}
      </div>
    );
  }
);
Tilt3D.displayName = "Tilt3D";
