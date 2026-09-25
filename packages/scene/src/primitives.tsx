"use client";

import * as React from "react";
import { useReducedMotion } from "./use-reduced-motion";

export interface MeshGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  blur?: number;
}

export const MeshGradient = React.forwardRef<HTMLDivElement, MeshGradientProps>(
  ({ animated = true, blur = 50, style, ...props }, ref) => {
    const reducedMotion = useReducedMotion();
    const shouldAnimate = animated && !reducedMotion;
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          backgroundImage: `
            radial-gradient(circle at 18% 25%, color-mix(in srgb, var(--ml-primary) 22%, transparent), transparent 55%),
            radial-gradient(circle at 82% 70%, color-mix(in srgb, var(--ml-primary, var(--primary)) 14%, transparent), transparent 60%),
            radial-gradient(circle at 50% 90%, color-mix(in srgb, var(--ml-accent, var(--accent)) 30%, transparent), transparent 70%)
          `,
          filter: `blur(${Math.max(0, Math.min(160, Number.isFinite(blur) ? blur : 50))}px)`,
          animation: shouldAnimate ? "float-3d 14s ease-in-out infinite" : undefined,
          ...style,
        }}
      />
    );
  }
);
MeshGradient.displayName = "MeshGradient";

export interface CardStack3DItem {
  title: string;
  subtitle: string;
  tag: string;
}

export interface CardStack3DProps extends React.HTMLAttributes<HTMLDivElement> {
  cards: CardStack3DItem[];
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function CardStack3D({
  cards,
  className = "",
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: CardStack3DProps) {
  const [active, setActive] = React.useState(false);
  const reducedMotion = useReducedMotion();
  return (
    <div
      {...props}
      tabIndex={props.tabIndex ?? 0}
      aria-label={props["aria-label"] ?? "Card stack"}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType !== "touch") setActive(true);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setActive(false);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setActive(true);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(false);
      }}
      className={joinClasses("ml-scene-card-stack", className)}
    >
      {cards.slice(0, 3).map((card, index) => {
        const layer = 2 - index;
        const fanDown = active ? layer * 18 : layer * 6;
        const fanScale = active ? 1 - layer * 0.03 : 1 - layer * 0.04;
        const rotateZ = active ? (index - 1) * 2.5 : 0;
        return (
          <div
            key={`${card.title}-${index}`}
            className="ml-scene-card-stack-item"
            style={{
              transform: `translate3d(0, ${fanDown}px, ${index * 12}px) rotateZ(${rotateZ}deg) scale(${fanScale})`,
              transformOrigin: "top center",
              zIndex: index + 10,
              boxShadow: active
                ? "0 18px 38px -10px color-mix(in srgb, var(--foreground) 14%, transparent), 0 0 0 1px color-mix(in srgb, var(--border) 90%, transparent)"
                : "0 8px 20px -6px color-mix(in srgb, var(--foreground) 8%, transparent), 0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent)",
              transition: reducedMotion
                ? "none"
                : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="ml-scene-card-stack-header">
              <span className="ml-scene-card-stack-tag">{card.tag}</span>
              <span className="ml-scene-card-stack-index">0{index + 1}</span>
            </div>
            <div>
              <p className="ml-scene-card-stack-title">{card.title}</p>
              <p className="ml-scene-card-stack-subtitle">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface DeviceFrame3DProps extends React.HTMLAttributes<HTMLDivElement> {
  tilt?: boolean;
}

export function DeviceFrame3D({
  children,
  className = "",
  tilt = true,
  style,
  ...props
}: DeviceFrame3DProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      {...props}
      className={joinClasses("ml-scene-device-frame", className)}
      style={{
        background: "linear-gradient(145deg, oklch(35% 0.02 260), oklch(18% 0.015 260))",
        boxShadow: "0 30px 70px -15px oklch(0% 0 0 / 0.5), inset 0 1px 2px oklch(100% 0 0 / 0.2)",
        transform: tilt && !reducedMotion ? "rotateX(1deg) rotateY(-2deg)" : undefined,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div className="ml-scene-device-screen">
        <div className="ml-scene-device-notch">
          <span className="ml-scene-device-notch-dot" aria-hidden="true" />
        </div>
        <div className="ml-scene-device-content">{children}</div>
      </div>
    </div>
  );
}
