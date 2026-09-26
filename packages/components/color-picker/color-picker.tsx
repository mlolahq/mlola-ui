"use client";

import * as React from "react";
import { IconPen } from "@mlola-ui/icons";
import { Field, fieldDescription } from "../input/input";
import { Popover } from "../popover/popover";
import { cx } from "../_internal/react";
import { contrastRatio, formatColor, hsvToRgb, parseColor, rgbToHsv, type ColorFormat, type HSVA, type RGBA } from "./color";

export type { ColorFormat, RGBA };
export { contrastRatio, formatColor, parseColor } from "./color";

export interface ColorPickerProps {
  /** Any color the picker reads: hex, rgb() or oklch(). */
  value?: string;
  defaultValue?: string;
  /** Called with the color in `format`. */
  onValueChange?: (value: string) => void;
  /** The format the value comes back in. */
  format?: ColorFormat;
  /** Offer an opacity slider. */
  alpha?: boolean;
  /** Colors one click away, such as the brand palette. */
  swatches?: string[];
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Follow a pointer across an element from press to release, as fractions of its box. */
function usePointerTrack(onMove: (x: number, y: number) => void) {
  const read = (event: React.PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onMove(clamp((event.clientX - box.left) / box.width), clamp((event.clientY - box.top) / box.height));
  };
  return {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.focus();
      read(event);
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) read(event);
    },
  };
}

/** A horizontal slider for hue or opacity: pointer, arrows (Shift for ten), Home and End. */
function Track({ label, value, max, onChange, background, valueText, className }: { label: string; value: number; max: number; onChange: (value: number) => void; background: string; valueText: string; className: string }) {
  const track = usePointerTrack((x) => onChange(x * max));
  return (
    <div
      className={cx("ml-color-picker-track", className)}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-valuetext={valueText}
      style={{ "--ml-color-track": background, "--ml-color-at": `${(value / max) * 100}%` } as React.CSSProperties}
      onKeyDown={(event) => {
        const step = (event.shiftKey ? 10 : 1) * (max / 100);
        const keys: Record<string, number> = { ArrowRight: value + step, ArrowUp: value + step, ArrowLeft: value - step, ArrowDown: value - step, Home: 0, End: max };
        if (event.key in keys) {
          event.preventDefault();
          onChange(Math.min(max, Math.max(0, keys[event.key])));
        }
      }}
      {...track}
    >
      <span className="ml-color-picker-thumb" aria-hidden="true" />
    </div>
  );
}

/**
 * A color field: a swatch and its value that open a picker with a
 * saturation and brightness area, hue and opacity sliders, a typed value in
 * hex, rgb or oklch, the system eyedropper where the browser has one, preset
 * swatches, and the color's contrast against white and black.
 */
export const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>(function ColorPicker({ value, defaultValue = "#0a84ff", onValueChange, format = "hex", alpha = false, swatches, label, hint, error, disabled, id, className }: ColorPickerProps, ref) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const rgba = parseColor(current) ?? parseColor(defaultValue) ?? BLACK;
  // HSV is kept locally so hue survives grays and black, where RGB forgets it.
  const [hsv, setHsv] = React.useState<HSVA>(() => rgbToHsv(rgba));
  const [view, setView] = React.useState<ColorFormat>(format);
  const [draft, setDraft] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const shownHex = formatColor(rgba, "hex");

  // Follow a value set from outside, unless it is the color already shown.
  React.useEffect(() => {
    if (formatColor(hsvToRgb(hsv), "hex") !== shownHex) setHsv(rgbToHsv(rgba));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownHex]);

  const emit = (next: HSVA) => {
    setHsv(next);
    const text = formatColor(hsvToRgb(next), format);
    if (value === undefined) setInner(text);
    onValueChange?.(text);
  };

  const emitRgb = (next: RGBA) => {
    const converted = rgbToHsv(next);
    emit(converted.s === 0 || converted.v === 0 ? { ...converted, h: hsv.h } : converted);
  };

  const area = usePointerTrack((x, y) => emit({ ...hsv, s: x, v: 1 - y }));
  const solid = formatColor({ ...rgba, a: 1 }, "hex");
  const onWhite = contrastRatio(rgba, WHITE);
  const onBlack = contrastRatio(rgba, BLACK);
  const EyeDropper = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper : undefined;

  const trigger = (
    <button
      ref={ref}
      id={fieldId}
      type="button"
      className="ml-input ml-color-picker-trigger"
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={fieldDescription(fieldId, { hint, error })}
      aria-label={`${typeof label === "string" ? label : "Color"}: ${formatColor(rgba, format)}`}
    >
      <span className="ml-color-picker-swatch" style={{ "--ml-color": formatColor(rgba, "rgb") } as React.CSSProperties} aria-hidden="true" />
      <span className="ml-color-picker-value">{formatColor(rgba, format)}</span>
    </button>
  );

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} disabled={disabled} className={cx("ml-color-picker", className)}>
      <Popover trigger={trigger} label={typeof label === "string" ? `Choose ${label.toLowerCase()}` : "Choose a color"} open={open} onOpenChange={setOpen} className="ml-color-picker-popover">
        <div className="ml-color-picker-panel">
          <div
            className="ml-color-picker-area"
            role="slider"
            tabIndex={0}
            aria-label="Saturation and brightness"
            aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
            style={{ "--ml-color-hue": `hsl(${hsv.h} 100% 50%)`, "--ml-color-x": `${hsv.s * 100}%`, "--ml-color-y": `${(1 - hsv.v) * 100}%` } as React.CSSProperties}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.1 : 0.01;
              const moves: Record<string, Partial<HSVA>> = { ArrowRight: { s: clamp(hsv.s + step) }, ArrowLeft: { s: clamp(hsv.s - step) }, ArrowUp: { v: clamp(hsv.v + step) }, ArrowDown: { v: clamp(hsv.v - step) } };
              if (moves[event.key]) {
                event.preventDefault();
                emit({ ...hsv, ...moves[event.key] });
              }
            }}
            {...area}
          >
            <span className="ml-color-picker-thumb" aria-hidden="true" style={{ background: solid }} />
          </div>
          <div className="ml-color-picker-sliders">
            <Track
              className="ml-color-picker-hue"
              label="Hue"
              value={hsv.h}
              max={360}
              valueText={`${Math.round(hsv.h)} degrees`}
              background="linear-gradient(90deg, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)"
              onChange={(h) => emit({ ...hsv, h })}
            />
            {alpha ? (
              <Track
                className="ml-color-picker-alpha"
                label="Opacity"
                value={hsv.a * 100}
                max={100}
                valueText={`${Math.round(hsv.a * 100)}%`}
                background={`linear-gradient(90deg, transparent, ${solid})`}
                onChange={(a) => emit({ ...hsv, a: a / 100 })}
              />
            ) : null}
          </div>
          <div className="ml-color-picker-row">
            <button type="button" className="ml-color-picker-format" aria-label={`Format: ${view}. Switch`} onClick={() => setView(view === "hex" ? "rgb" : view === "rgb" ? "oklch" : "hex")}>
              {view.toUpperCase()}
            </button>
            <input
              className="ml-color-picker-text"
              aria-label={`Color as ${view}`}
              value={draft ?? formatColor(rgba, view)}
              spellCheck={false}
              onChange={(event) => {
                setDraft(event.target.value);
                const parsed = parseColor(event.target.value);
                if (parsed) emitRgb(alpha ? parsed : { ...parsed, a: 1 });
              }}
              onBlur={() => setDraft(null)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setDraft(null);
              }}
            />
            {EyeDropper ? (
              <button
                type="button"
                className="ml-color-picker-eyedropper"
                aria-label="Pick a color from the screen"
                onClick={async () => {
                  try {
                    const result = await new EyeDropper().open();
                    const parsed = parseColor(result.sRGBHex);
                    if (parsed) emitRgb(parsed);
                  } catch {
                    // The reader pressed Escape.
                  }
                }}
              >
                <IconPen aria-hidden="true" size="1em" />
              </button>
            ) : null}
          </div>
          {swatches?.length ? (
            <div className="ml-color-picker-swatches" role="group" aria-label="Presets">
              {swatches.map((swatch) => {
                const parsed = parseColor(swatch);
                if (!parsed) return null;
                const hex = formatColor(parsed, "hex");
                return (
                  <button
                    key={swatch}
                    type="button"
                    className="ml-color-picker-preset"
                    aria-label={hex}
                    aria-pressed={hex === shownHex}
                    style={{ "--ml-color": hex } as React.CSSProperties}
                    onClick={() => emitRgb(parsed)}
                  />
                );
              })}
            </div>
          ) : null}
          <p className="ml-color-picker-contrast">
            <span className="ml-color-picker-sample" style={{ "--ml-color": solid, color: onWhite >= onBlack ? "#fff" : "#000" } as React.CSSProperties} aria-hidden="true">
              Aa
            </span>
            <span>
              {onWhite.toFixed(1)}:1 on white <b data-pass={onWhite >= 4.5 || undefined}>{onWhite >= 4.5 ? "AA" : onWhite >= 3 ? "AA large" : "Fails"}</b>
            </span>
            <span>
              {onBlack.toFixed(1)}:1 on black <b data-pass={onBlack >= 4.5 || undefined}>{onBlack >= 4.5 ? "AA" : onBlack >= 3 ? "AA large" : "Fails"}</b>
            </span>
          </p>
        </div>
      </Popover>
    </Field>
  );
});
ColorPicker.displayName = "ColorPicker";
