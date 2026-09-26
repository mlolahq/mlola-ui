import * as React from "react";

export interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  animate?: boolean;
  opticalSize?: "small" | "default" | "large";
  title?: string;
}

export type MlolaGlyph = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

const SHAPES = new Set(["path", "circle", "line", "polyline", "polygon", "rect", "ellipse"]);

/**
 * Give every shape `pathLength="1"`, so one CSS rule can draw any glyph from
 * start to end whatever the true length of its strokes.
 */
function normalizePaths(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; pathLength?: number }>(child)) return child;
    if (typeof child.type === "string" && SHAPES.has(child.type)) return React.cloneElement(child, { pathLength: 1 });
    if (child.type === React.Fragment) return <>{normalizePaths(child.props.children)}</>;
    return child;
  });
}

export function createMlolaGlyph(
  displayName: string,
  renderPaths: (props: { animate?: boolean }) => React.ReactNode
): MlolaGlyph {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    (
      {
        size = "var(--mlola-glyph-size, 1.125rem)",
        // An explicit --mlola-glyph-stroke wins; otherwise the theme's icon channel sets the weight.
        strokeWidth = "var(--mlola-glyph-stroke, var(--ml-icon-stroke, 1.75))",
        className,
        animate = false,
        opticalSize = "default",
        title,
        style,
        ...props
      },
      ref
    ) => {
      const labelled = Boolean(title || props["aria-label"] || props["aria-labelledby"]);
      return (
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
          role={labelled ? "img" : undefined}
          aria-hidden={labelled ? undefined : true}
          data-optical-size={opticalSize}
          data-animated={animate ? "" : undefined}
          className={`mlola-glyph ${animate ? "mlola-glyph-active" : ""} ${className ?? ""}`.trim()}
          style={{
            color: "var(--mlola-glyph-color, currentColor)",
            // The independent `scale` property, so a recipe's `transform`
            // (a chevron's rotation) composes with it instead of losing to it.
            scale: "var(--mlola-glyph-optical-scale, 1)",
            transformOrigin: "center",
            ...style,
          }}
          {...props}
        >
          {title ? <title>{title}</title> : null}
          {normalizePaths(renderPaths({ animate }))}
        </svg>
      );
    }
  );
  Icon.displayName = displayName;
  return Icon;
}

const createIcon = createMlolaGlyph;

/* ── 1. Signature Brand & Theme Glyphs ── */
export const IconSpark = createIcon("IconSpark", () => (
  <>
    <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
    <path d="m5.28 5.28 3.54 3.54M15.18 15.18l3.54 3.54" />
    <path d="m5.28 18.72 3.54-3.54M15.18 8.82l3.54-3.54" />
    <circle cx="12" cy="12" r="2.2" />
  </>
));

export const IconPalette = createIcon("IconPalette", () => (
  <>
    <circle cx="13.5" cy="6.5" r=".75" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".75" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".75" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".75" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.4-.4-.8-.4-1.3 0-.9.7-1.6 1.6-1.6h1.9c4.3 0 7.7-3.4 7.7-7.7C22 5.6 17.5 2 12 2z" />
  </>
));

/* A body in motion: a ball trailing three speed lines, each ending the same
   distance from its edge so the gaps read as one rhythm. */
export const IconMotion = createIcon("IconMotion", () => (
  <>
    <circle cx="15.5" cy="12" r="5" />
    <path d="M2.5 12h5.5M5 8.25h4.25M5 15.75h4.25" />
  </>
));

export const IconBox3D = createIcon("IconBox3D", () => (
  <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </>
));

export const IconLayers = createIcon("IconLayers", () => (
  <>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </>
));

export const IconBlocks = createIcon("IconBlocks", () => (
  <>
    <rect width="7.5" height="7.5" x="3" y="3" rx="1.5" />
    <rect width="7.5" height="7.5" x="13.5" y="3" rx="1.5" />
    <rect width="7.5" height="7.5" x="13.5" y="13.5" rx="1.5" />
    <rect width="7.5" height="7.5" x="3" y="13.5" rx="1.5" />
  </>
));

export const IconTemplate = createIcon("IconTemplate", () => (
  <>
    <rect width="18" height="18" x="3" y="3" rx="2.5" />
    <path d="M3 9h18M9 21V9" />
  </>
));

/* ── 2. Living Workspace & Action Glyphs ── */
export const IconFilePlus = createIcon("IconFilePlus", () => (
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </>
));

export const IconFolderOpen = createIcon("IconFolderOpen", () => (
  <>
    <path d="m4 20 2-10h14.5l-2.4 10H4z" />
    <path d="M4 20V6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2" />
  </>
));

export const IconShare = createIcon("IconShare", () => (
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
));

export const IconEdit = createIcon("IconEdit", () => (
  <>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </>
));

export const IconTrash = createIcon("IconTrash", () => (
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>
));

export const IconCheck = createIcon("IconCheck", () => (
  <polyline points="20 6 9 17 4 12" />
));

export const IconArrowRight = createIcon("IconArrowRight", () => (
  <>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </>
));

export const IconArrowUpRight = createIcon("IconArrowUpRight", () => (
  <>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </>
));

export const IconCopy = createIcon("IconCopy", () => (
  <>
    <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </>
));

export const IconMoon = createIcon("IconMoon", () => (
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
));

export const IconSun = createIcon("IconSun", () => (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
));

export const IconSearch = createIcon("IconSearch", () => (
  <>
    <circle cx="11" cy="11" r="7.5" />
    <path d="m21 21-4.35-4.35" />
  </>
));

export const IconChevronDown = createIcon("IconChevronDown", () => (
  <polyline points="6 9 12 15 18 9" />
));

export const IconMonitor = createIcon("IconMonitor", () => (
  <>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
));

export const IconSmartphone = createIcon("IconSmartphone", () => (
  <>
    <rect width="14" height="20" x="5" y="2" rx="2.5" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </>
));

export const IconCommand = createIcon("IconCommand", () => (
  <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
));

export const IconSliders = createIcon("IconSliders", () => (
  <>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </>
));

export const IconTerminal = createIcon("IconTerminal", () => (
  <>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </>
));

export const IconShield = createIcon("IconShield", () => (
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
));

export const IconLock = createIcon("IconLock", () => (
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
));

export const IconUnlock = createIcon("IconUnlock", () => (
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.75-1.4" />
  </>
));

export const IconZap = createIcon("IconZap", () => (
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
));

export const IconEye = createIcon("IconEye", () => (
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const IconEyeOff = createIcon("IconEyeOff", () => (
  <>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.15 18.15 0 0 0 1 12s4 8 11 8a9.12 9.12 0 0 0 5.39-1.61" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="m2 2 20 20" />
  </>
));

/* ── 3. Interface & status glyphs ── */
export const IconCode = createIcon("IconCode", () => (
  <>
    <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 4l-4 16" />
  </>
));

export const IconCircleDashed = createIcon("IconCircleDashed", () => (
  <>
    <path d="M8.6 3.2a9.5 9.5 0 0 1 6.8 0M20.8 8.6a9.5 9.5 0 0 1 0 6.8M15.4 20.8a9.5 9.5 0 0 1-6.8 0M3.2 15.4a9.5 9.5 0 0 1 0-6.8" />
  </>
));

export const IconLoader = createIcon("IconLoader", () => (
  <>
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M12 22A10 10 0 0 1 2 12" opacity=".35" />
  </>
));

export const IconX = createIcon("IconX", () => (
  <>
    <path d="M18 6 6 18M6 6l12 12" />
  </>
));

export const IconMenu = createIcon("IconMenu", () => (
  <path d="M4 7h16M4 12h16M4 17h16" />
));

export const IconMinus = createIcon("IconMinus", () => <path d="M5 12h14" />);
export const IconPlus = createIcon("IconPlus", () => <path d="M12 5v14M5 12h14" />);

export const IconChevronUp = createIcon("IconChevronUp", () => (
  <path d="m6 15 6-6 6 6" />
));
export const IconChevronLeft = createIcon("IconChevronLeft", () => (
  <path d="m15 18-6-6 6-6" />
));
export const IconChevronRight = createIcon("IconChevronRight", () => (
  <path d="m9 18 6-6-6-6" />
));

export const IconArrowLeft = createIcon("IconArrowLeft", () => (
  <path d="m12 19-7-7 7-7M5 12h14" />
));
export const IconArrowUp = createIcon("IconArrowUp", () => (
  <path d="m5 12 7-7 7 7M12 5v14" />
));
export const IconArrowDown = createIcon("IconArrowDown", () => (
  <path d="M12 5v14m-7-7 7 7 7-7" />
));
export const IconChevronsUpDown = createIcon("IconChevronsUpDown", () => (
  <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
));

export const IconMoreHorizontal = createIcon("IconMoreHorizontal", () => (
  <>
    <circle cx="5" cy="12" r="1.25" fill="currentColor" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    <circle cx="19" cy="12" r="1.25" fill="currentColor" />
  </>
));

export const IconMail = createIcon("IconMail", () => (
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>
));

export const IconStar = createIcon("IconStar", () => (
  <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z" />
));

export const IconCircleCheck = createIcon("IconCircleCheck", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m7.5 12 3 3 6-6" />
  </>
));
export const IconCircleAlert = createIcon("IconCircleAlert", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7v6M12 17h.01" />
  </>
));
export const IconTriangleAlert = createIcon("IconTriangleAlert", () => (
  <>
    <path d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </>
));
export const IconCircleX = createIcon("IconCircleX", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>
));
export const IconInfo = createIcon("IconInfo", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6M12 7h.01" />
  </>
));
export const IconBan = createIcon("IconBan", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m5.3 5.3 13.4 13.4" />
  </>
));

export const IconBell = createIcon("IconBell", () => (
  <>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </>
));
export const IconShoppingCart = createIcon("IconShoppingCart", () => (
  <>
    <path d="M3 3h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L20 7H6" />
    <circle cx="10" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
  </>
));
export const IconHeart = createIcon("IconHeart", () => (
  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
));
export const IconUser = createIcon("IconUser", () => (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 22a8 8 0 0 1 16 0" />
  </>
));
export const IconSettings = createIcon("IconSettings", () => (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
  </>
));
export const IconDownload = createIcon("IconDownload", () => (
  <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
));
export const IconUpload = createIcon("IconUpload", () => (
  <path d="M12 15V3m-5 5 5-5 5 5M5 21h14" />
));
export const IconCalendar = createIcon("IconCalendar", () => (
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>
));
export const IconClock = createIcon("IconClock", () => (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 7v5l3 2" />
  </>
));
export const IconHome = createIcon("IconHome", () => (
  <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3Z" />
));
export const IconExternalLink = createIcon("IconExternalLink", () => (
  <path d="M14 3h7v7M10 14 21 3M18 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7" />
));

/* ── 4. AI & voice glyphs ── */
export const IconMic = createIcon("IconMic", () => (
  <>
    <rect x="9" y="2.5" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
  </>
));
export const IconMicOff = createIcon("IconMicOff", () => (
  <>
    <path d="M15 9.4V5.5a3 3 0 0 0-5.7-1.3M9 9v2.5a3 3 0 0 0 5 2.2" />
    <path d="M19 11a7 7 0 0 1-.7 3M5 11a7 7 0 0 0 11.2 5.6M12 18v3.5M3 3l18 18" />
  </>
));
export const IconStop = createIcon("IconStop", () => (
  <rect x="6" y="6" width="12" height="12" rx="2.5" />
));
export const IconPaperclip = createIcon("IconPaperclip", () => (
  <path d="m20.5 11.2-8.3 8.3a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.4 8.4a1.7 1.7 0 0 1-2.5-2.5l7.8-7.8" />
));
export const IconRefresh = createIcon("IconRefresh", () => (
  <>
    <path d="M20.5 11A8.5 8.5 0 0 0 5.6 6.2L3.5 8.5M3.5 13a8.5 8.5 0 0 0 14.9 4.8l2.1-2.3" />
    <path d="M3.5 3.5v5h5M20.5 20.5v-5h-5" />
  </>
));
export const IconThumbUp = createIcon("IconThumbUp", () => (
  <>
    <path d="M7 10.5v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
    <path d="M7 10.5 11 3a2.5 2.5 0 0 1 2.6 2.9L13 9.5h5.6a2 2 0 0 1 2 2.4l-1.4 7a2 2 0 0 1-2 1.6H7" />
  </>
));
export const IconThumbDown = createIcon("IconThumbDown", () => (
  <>
    <path d="M7 13.5v-10H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1Z" />
    <path d="M7 13.5 11 21a2.5 2.5 0 0 0 2.6-2.9L13 14.5h5.6a2 2 0 0 0 2-2.4l-1.4-7a2 2 0 0 0-2-1.6H7" />
  </>
));
export const IconVolume = createIcon("IconVolume", () => (
  <>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </>
));
export const IconTool = createIcon("IconTool", () => (
  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.4-3.4a6 6 0 0 1-7.9 7.9L6.9 20.1a2.1 2.1 0 0 1-3-3l6.3-6.3a6 6 0 0 1 7.9-7.9Z" />
));
export const IconLink = createIcon("IconLink", () => (
  <>
    <path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6" />
    <path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
  </>
));
export const IconBrain = createIcon("IconBrain", () => (
  <>
    <path d="M12 5a3 3 0 0 0-5.8-1A3.5 3.5 0 0 0 4 10a3.5 3.5 0 0 0 1 6.5A3.5 3.5 0 0 0 12 19Z" />
    <path d="M12 5a3 3 0 0 1 5.8-1A3.5 3.5 0 0 1 20 10a3.5 3.5 0 0 1-1 6.5A3.5 3.5 0 0 1 12 19Z" />
    <path d="M12 5v14M8 9.5a2.5 2.5 0 0 0 0 4M16 9.5a2.5 2.5 0 0 1 0 4" />
  </>
));

/* ── 5. Code & source control glyphs ── */
export const IconFolder = createIcon("IconFolder", () => (
  <path d="M3 7.5A2 2 0 0 1 5 5.5h4.2l2 2.2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
));
export const IconFile = createIcon("IconFile", () => (
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
  </>
));
export const IconGitBranch = createIcon("IconGitBranch", () => (
  <>
    <circle cx="6" cy="5.5" r="2.5" />
    <circle cx="6" cy="18.5" r="2.5" />
    <circle cx="18" cy="7.5" r="2.5" />
    <path d="M6 8v8M18 10c0 4-4 5-9.8 6.4" />
  </>
));
export const IconGitCommit = createIcon("IconGitCommit", () => (
  <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M2.5 12h6M15.5 12h6" />
  </>
));
export const IconGitPullRequest = createIcon("IconGitPullRequest", () => (
  <>
    <circle cx="6" cy="5.5" r="2.5" />
    <circle cx="6" cy="18.5" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="M6 8v8M18 16V9a3 3 0 0 0-3-3h-4M13 3.5 10.5 6 13 8.5" />
  </>
));

/* ── 6. Canvas & workflow glyphs ── */
export const IconPointer = createIcon("IconPointer", () => (
  <path d="M5 3.5 18.5 10l-6 1.8-2.2 6.2Z" />
));
export const IconHand = createIcon("IconHand", () => (
  <path d="M8 12.5V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v6.5M8 12.5 6.6 11a1.6 1.6 0 0 0-2.4 2.1l3.4 4.6A6 6 0 0 0 12.4 20H13a4 4 0 0 0 4-4v-3.5" />
));
export const IconSquare = createIcon("IconSquare", () => (
  <rect x="4" y="4" width="16" height="16" rx="2.5" />
));
export const IconCircle = createIcon("IconCircle", () => (
  <circle cx="12" cy="12" r="8.5" />
));
export const IconDiamond = createIcon("IconDiamond", () => (
  <path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" />
));
export const IconPen = createIcon("IconPen", () => (
  <>
    <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    <path d="M13.5 6.5l3 3" />
  </>
));
export const IconType = createIcon("IconType", () => (
  <path d="M5 7V5h14v2M12 5v14M9 19h6" />
));
export const IconStickyNote = createIcon("IconStickyNote", () => (
  <>
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8l-6 6H6a2 2 0 0 1-2-2Z" />
    <path d="M20 14h-4a2 2 0 0 0-2 2v4" />
  </>
));
export const IconEraser = createIcon("IconEraser", () => (
  <>
    <path d="M8.5 20 3.8 15.3a1.8 1.8 0 0 1 0-2.6l8.9-8.9a1.8 1.8 0 0 1 2.6 0l4.4 4.4a1.8 1.8 0 0 1 0 2.6L11 20Z" />
    <path d="M8 9.5 14.5 16M8.5 20H20" />
  </>
));
export const IconMaximize = createIcon("IconMaximize", () => (
  <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
));
export const IconWorkflow = createIcon("IconWorkflow", () => (
  <>
    <rect x="3" y="4" width="7" height="5" rx="1.5" />
    <rect x="14" y="15" width="7" height="5" rx="1.5" />
    <path d="M6.5 9v3.5a2 2 0 0 0 2 2h6" />
  </>
));
export const IconPlay = createIcon("IconPlay", () => (
  <path d="M7 4.8v14.4a1 1 0 0 0 1.5.9l11.2-7.2a1 1 0 0 0 0-1.7L8.5 3.9A1 1 0 0 0 7 4.8Z" />
));
export const IconUndo = createIcon("IconUndo", () => (
  <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
));
export const IconRedo = createIcon("IconRedo", () => (
  <path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
));

/* ── 7. Editor glyphs ── */
export const IconBold = createIcon("IconBold", () => (
  <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7ZM7 12h7a3.5 3.5 0 0 1 0 7H7Z" />
));
export const IconItalic = createIcon("IconItalic", () => (
  <path d="M10 5h8M6 19h8M14 5l-4 14" />
));
export const IconUnderline = createIcon("IconUnderline", () => (
  <path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" />
));
export const IconStrikethrough = createIcon("IconStrikethrough", () => (
  <path d="M16.5 7.5A4 4 0 0 0 12.6 5h-1.4a3.7 3.7 0 0 0-1 7.2M4 12h16M8 16.5A4 4 0 0 0 11.8 19h1a3.7 3.7 0 0 0 3.6-3" />
));
export const IconList = createIcon("IconList", () => (
  <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
));
export const IconListOrdered = createIcon("IconListOrdered", () => (
  <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M4 14.5a1.5 1.5 0 1 1 2.6 1L4 19h3" />
));
export const IconQuote = createIcon("IconQuote", () => (
  <path d="M7 7c-2 1.3-3 3-3 5.5V17h5v-5H5.5M17 7c-2 1.3-3 3-3 5.5V17h5v-5h-3.5" />
));
export const IconHeading = createIcon("IconHeading", () => (
  <path d="M6 4v16M18 4v16M6 12h12" />
));
export const IconCodeBlock = createIcon("IconCodeBlock", () => (
  <>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="m9.5 10-2 2 2 2M14.5 10l2 2-2 2" />
  </>
));
export const IconCheckSquare = createIcon("IconCheckSquare", () => (
  <>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </>
));
export const IconGrip = createIcon("IconGrip", () => (
  <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
));
export const IconClearFormat = createIcon("IconClearFormat", () => (
  <path d="M5 5h11M10 5l-3 14M15 13l5 5M20 13l-5 5" />
));

/* Drop-in names for replacing Lucide imports without adapter components. */
export const Sparkles = IconSpark;
export const Palette = IconPalette;
export const Box = IconBox3D;
export const Layers = IconLayers;
export const Blocks = IconBlocks;
export const LayoutTemplate = IconTemplate;
export const Code2 = IconCode;
export const Check = IconCheck;
export const Copy = IconCopy;
export const ArrowRight = IconArrowRight;
export const ArrowUpRight = IconArrowUpRight;
export const ArrowLeft = IconArrowLeft;
export const ArrowUp = IconArrowUp;
export const ArrowDown = IconArrowDown;
export const ChevronDown = IconChevronDown;
export const ChevronUp = IconChevronUp;
export const ChevronLeft = IconChevronLeft;
export const ChevronRight = IconChevronRight;
export const ChevronsUpDown = IconChevronsUpDown;
export const CircleDashed = IconCircleDashed;
export const Loader2 = IconLoader;
export const Monitor = IconMonitor;
export const Moon = IconMoon;
export const Search = IconSearch;
export const Smartphone = IconSmartphone;
export const Sun = IconSun;
export const Eye = IconEye;
export const EyeOff = IconEyeOff;
export const Zap = IconZap;
export const X = IconX;
export const Menu = IconMenu;
export const Minus = IconMinus;
export const Plus = IconPlus;
export const MoreHorizontal = IconMoreHorizontal;
export const Mail = IconMail;
export const Star = IconStar;
export const CircleCheck = IconCircleCheck;
export const CircleAlert = IconCircleAlert;
export const TriangleAlert = IconTriangleAlert;
export const CircleX = IconCircleX;
export const Info = IconInfo;
export const Ban = IconBan;
export const Bell = IconBell;
export const ShoppingCart = IconShoppingCart;
export const Heart = IconHeart;
export const User = IconUser;
export const Settings = IconSettings;
export const Download = IconDownload;
export const Upload = IconUpload;
export const Calendar = IconCalendar;
export const Clock = IconClock;
export const Home = IconHome;
export const ExternalLink = IconExternalLink;
