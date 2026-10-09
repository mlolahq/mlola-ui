"use client";

import * as React from "react";
import {
  createRenderHost,
  isBinding,
  type RenderActionMessage,
  type RenderErrorMessage,
  type RenderHost,
  type RenderInstance,
  type RenderRules,
} from "@mlola-ui/behavior/render/core";
import catalogRules from "@mlola-ui/behavior/render/rules";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion/accordion";
import { Alert, AlertDescription, AlertTitle } from "../alert/alert";
import { Avatar } from "../avatar/avatar";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Card, CardContent } from "../card/card";
import { Checkbox } from "../checkbox/checkbox";
import { DatePicker } from "../date-picker/date-picker";
import { EmptyState } from "../empty-state/empty-state";
import { Input } from "../input/input";
import { Progress } from "../progress/progress";
import { RadioGroup, RadioGroupItem } from "../radio-group/radio-group";
import { Select } from "../select/select";
import { Slider } from "../slider/slider";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../table/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs/tabs";
import { Textarea } from "../textarea/textarea";
import { Switch } from "../toggle/toggle";
import { cx, Heading, type HeadingLevel } from "../_internal/react";

/** The words the surface itself says. Pass your own to translate them. */
export interface RenderSurfaceLabels {
  /** Under a required field that kept an action back. */
  required: string;
  /** Announced when required fields kept an action back, with their labels. */
  missing: (fields: string[]) => string;
  /** A table cell that holds true or false. */
  yes: string;
  no: string;
}

const LABELS: RenderSurfaceLabels = {
  required: "Fill in this field.",
  missing: (fields) => `Fill in ${fields.join(", ")} first.`,
  yes: "Yes",
  no: "No",
};

export interface RenderSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onError"> {
  /**
   * A2UI messages for the Mlola Render catalog. Pass the same array with more
   * messages at its end as they arrive; a different conversation is a new
   * array, which starts the surface again.
   */
  messages?: readonly unknown[];
  /** More messages are on their way: a tree that arrives in pieces is drawn when they stop. */
  streaming?: boolean;
  /** A host you keep yourself (`createRenderHost`), in place of `messages`. */
  host?: RenderHost;
  /** The surface to draw. Every surface the messages open, oldest first, when left out. */
  surfaceId?: string;
  /** A Button was pressed: send the message to the agent. `extra.dataModel` comes with surfaces created with sendDataModel. */
  onAction?: (message: RenderActionMessage, extra: { dataModel?: unknown }) => void;
  /** Messages were refused: send these to the agent so it can correct itself. Nothing refused is drawn. */
  onError?: (messages: RenderErrorMessage[]) => void;
  /** "surface" draws in the theme the agent named; "inherit" keeps the theme of the page around it. */
  theme?: "surface" | "inherit";
  /** Shown while there is nothing to draw yet. */
  fallback?: React.ReactNode;
  labels?: Partial<RenderSurfaceLabels>;
  /** The catalog to draw from. The Mlola Render catalog when left out. */
  rules?: RenderRules;
  /** Today's date for date fields, for server rendering. */
  today?: string;
}

interface Drawing {
  host: RenderHost;
  surfaceId: string;
  /** Unique on the page, so two surfaces never share an id. */
  base: string;
  labels: RenderSurfaceLabels;
  today?: string;
  press: (componentId: string, scope: string) => void;
}

type Props<Component extends React.ElementType> = React.ComponentProps<Component>;
/** A value the check already held to the catalog, as the prop it is passed to. */
const as = <Value,>(value: unknown) => value as Value;
const text = (value: unknown) => (value === undefined || value === null ? "" : String(value));
const maybe = (value: unknown) => (value === undefined || value === null || value === "" ? undefined : String(value));
/** A DOM id for one instance: letters, digits, - and _ only, whatever the agent called it. */
const domId = (base: string, key: string) => `${base}-${Array.from(key, (character) => (/[A-Za-z0-9_-]/.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}`)).join("")}`;

/**
 * Draws the interface an agent composed. The agent describes a surface as
 * A2UI messages from the Mlola Render catalog; every message is checked
 * before anything shows, and what is drawn is made of Mlola components in
 * the surface's theme. Fields write to the surface's data model, and a
 * pressed Button answers with A2UI's action through `onAction`.
 */
export function RenderSurface({ messages, streaming = false, host: givenHost, surfaceId, onAction, onError, theme = "surface", fallback = null, labels, rules = catalogRules, today, className, ...props }: RenderSurfaceProps) {
  // The first messages are drawn in the first render, so a surface rendered on the server arrives whole.
  const [ownHost] = React.useState(() => {
    const made = createRenderHost(rules);
    if (!givenHost && messages?.length) made.receive(messages, { streaming });
    return made;
  });
  const host = givenHost ?? ownHost;
  // The host this component made answers to this component's props; one you passed keeps its own.
  React.useEffect(() => {
    ownHost.configure({ onAction, onError });
  }, [ownHost, onAction, onError]);

  // Messages are fed once each: what the array held last time is not read again.
  const fed = React.useRef<{ first: unknown; count: number }>({ first: messages?.[0], count: givenHost ? 0 : (messages?.length ?? 0) });
  React.useEffect(() => {
    if (givenHost || !messages) return;
    const last = fed.current;
    if (messages.length < last.count || (last.count > 0 && messages[0] !== last.first)) {
      host.reset();
      last.count = 0;
    }
    const fresh = messages.slice(last.count);
    fed.current = { first: messages[0], count: messages.length };
    // An empty call still closes a stream: what waited for its pause is checked and drawn.
    if (fresh.length || !streaming) host.receive(fresh, { streaming });
  }, [givenHost, host, messages, streaming]);

  React.useSyncExternalStore(host.subscribe, host.revision, host.revision);

  const base = React.useId();
  const words = React.useMemo(() => ({ ...LABELS, ...labels }), [labels]);
  const [notice, setNotice] = React.useState("");
  const press = (shown: string) => (componentId: string, scope: string) => {
    const { missing } = host.press(shown, componentId, scope);
    setNotice(missing.length ? words.missing(missing.map((field) => text(field.label))) : "");
    if (!missing.length) return;
    // The first field still to fill in takes focus: the control itself, or the first one in its group.
    const first = document.getElementById(domId(`${base}-${shown}`, missing[0].key));
    (first?.matches("input, textarea, button") ? first : first?.querySelector<HTMLElement>("input, textarea, button"))?.focus();
  };

  const shown = surfaceId ? (host.surface(surfaceId) ? [surfaceId] : []) : host.surfaces();
  return (
    <div className={cx("ml-render", className)} aria-busy={streaming || undefined} {...props}>
      {shown.length
        ? shown.map((id) => {
            const surface = host.surface(id);
            if (!surface) return null;
            const drawing: Drawing = { host, surfaceId: id, base: `${base}-${id}`, labels: words, today, press: press(id) };
            const themed = theme === "surface" ? surface.theme : null;
            return (
              // audit-allow: attr.reserved — the engine's own meaning: the surface is a region in the theme and mode its agent named
              <div key={id} className="ml-render-surface" data-surface={id} data-theme={themed?.name} data-mode={themed?.mode} data-themed={themed ? "" : undefined}>
                <Node drawing={drawing} instance={{ id: "root", scope: "", key: "root@" }} />
              </div>
            );
          })
        : fallback}
      <p role="status" className="ml-visually-hidden">
        {notice}
      </p>
    </div>
  );
}

function Children({ drawing, id, scope }: { drawing: Drawing; id: string; scope: string }) {
  return drawing.host.children(drawing.surfaceId, id, scope).map((child) => <Node key={child.key} drawing={drawing} instance={child} />);
}

/** One instance of a component: a template's component is drawn once for each item, each in its own scope. */
function Node({ drawing, instance }: { drawing: Drawing; instance: RenderInstance }) {
  const { host, surfaceId, labels } = drawing;
  const { id, scope, key } = instance;
  const node = host.component(surfaceId, id);
  if (!node) return null;
  const props = node.props;
  const read = (value: unknown) => host.read(surfaceId, value, scope);
  const fieldId = domId(drawing.base, key);
  const inside = <Children drawing={drawing} id={id} scope={scope} />;
  const accessible = as<{ label?: unknown; description?: unknown }>(props.accessibility ?? {});
  const named = { "aria-label": maybe(read(accessible.label)), "aria-description": maybe(read(accessible.description)) };
  // A container with a name of its own is a group; without one it is only layout.
  const group = named["aria-label"] ? { role: "group", ...named } : {};
  const error = host.missing(surfaceId, id, scope) ? labels.required : undefined;
  const required = read(props.required) === true;
  const disabled = read(props.disabled) === true;
  /** A bound field shows the data model and writes to it; a literal one starts from its value and keeps its own state. */
  const field = <Value, Literal = Value>(prop: unknown, fallback: Value, cast: (value: unknown) => Value) =>
    isBinding(prop)
      ? { bound: true as const, value: cast(read(prop) ?? fallback), write: (value: Value | Literal) => void host.write(surfaceId, prop, value, scope) }
      : { bound: false as const, value: cast(prop ?? fallback), write: () => {} };

  switch (node.type) {
    case "Stack":
      return (
        <div className="ml-stack" {...group}>
          {inside}
        </div>
      );
    case "Row":
      return (
        <div className="ml-cluster" {...group}>
          {inside}
        </div>
      );
    case "Grid":
      return (
        <div className="ml-grid" data-columns={as<string | undefined>(props.columns)} {...group}>
          {inside}
        </div>
      );
    case "Heading":
      return <Heading level={as<HeadingLevel>(props.level ?? 2)}>{text(read(props.text))}</Heading>;
    case "Text":
      return <p className="ml-render-text">{text(read(props.text))}</p>;
    case "Card":
      return (
        <Card variant={as<Props<typeof Card>["variant"]>(props.variant)} {...group}>
          <CardContent className="ml-stack">{inside}</CardContent>
        </Card>
      );
    case "Alert":
      return (
        <Alert tone={as<Props<typeof Alert>["tone"]>(props.tone)} variant={as<Props<typeof Alert>["variant"]>(props.variant)}>
          {props.title !== undefined ? <AlertTitle>{text(read(props.title))}</AlertTitle> : null}
          <AlertDescription>{text(read(props.text))}</AlertDescription>
        </Alert>
      );
    case "EmptyState":
      return (
        <EmptyState
          title={text(read(props.title))}
          description={maybe(read(props.description))}
          size={as<Props<typeof EmptyState>["size"]>(props.size)}
          headingLevel={host.headingLevel(surfaceId, id)}
          actions={props.children !== undefined ? inside : undefined}
        />
      );
    case "Tabs": {
      const tabs = host.children(surfaceId, id, scope);
      if (!tabs.length) return null;
      return (
        <Tabs defaultValue={tabs[0].key} variant={as<Props<typeof Tabs>["variant"]>(props.variant)}>
          <TabsList aria-label={text(read(props.label))}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {text(host.read(surfaceId, host.component(surfaceId, tab.id)?.props.label, tab.scope))}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="ml-stack">
              <Children drawing={drawing} id={tab.id} scope={tab.scope} />
            </TabsContent>
          ))}
        </Tabs>
      );
    }
    case "Accordion": {
      const sections = host.children(surfaceId, id, scope);
      return (
        <Accordion type={as<Props<typeof Accordion>["type"]>(props.type)} headingLevel={host.headingLevel(surfaceId, id)}>
          {sections.map((section) => (
            <AccordionItem key={section.key} value={section.key}>
              <AccordionTrigger>{text(host.read(surfaceId, host.component(surfaceId, section.id)?.props.title, section.scope))}</AccordionTrigger>
              <AccordionContent>
                <div className="ml-stack">
                  <Children drawing={drawing} id={section.id} scope={section.scope} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }
    // A Tab or an AccordionItem is drawn by its container, which the check holds it to.
    case "Tab":
    case "AccordionItem":
      return null;
    case "Input": {
      const value = field(props.value, "", text);
      return (
        <Input
          key={value.bound ? undefined : value.value}
          id={fieldId}
          label={text(read(props.label))}
          type={as<string | undefined>(props.type)}
          placeholder={maybe(read(props.placeholder))}
          hint={maybe(read(props.hint))}
          error={error}
          required={required}
          disabled={disabled}
          size={as<Props<typeof Input>["size"]>(props.size)}
          variant={as<Props<typeof Input>["variant"]>(props.variant)}
          maxLength={host.rules.limits.textLength}
          {...(value.bound ? { value: value.value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => value.write(event.target.value) } : { defaultValue: value.value })}
        />
      );
    }
    case "Textarea": {
      const value = field(props.value, "", text);
      return (
        <Textarea
          key={value.bound ? undefined : value.value}
          id={fieldId}
          label={text(read(props.label))}
          placeholder={maybe(read(props.placeholder))}
          hint={maybe(read(props.hint))}
          error={error}
          rows={as<number>(props.rows ?? 4)}
          required={required}
          disabled={disabled}
          maxLength={host.rules.limits.textLength}
          {...(value.bound ? { value: value.value, onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => value.write(event.target.value) } : { defaultValue: value.value })}
        />
      );
    }
    case "Select": {
      const value = field(props.value, "", text);
      return (
        <Select
          key={value.bound ? undefined : value.value}
          id={fieldId}
          label={text(read(props.label))}
          options={options(read(props.options))}
          placeholder={maybe(read(props.placeholder))}
          error={error}
          required={required}
          disabled={disabled}
          size={as<Props<typeof Select>["size"]>(props.size)}
          {...(value.bound ? { value: value.value, onValueChange: value.write } : { defaultValue: value.value })}
        />
      );
    }
    case "RadioGroup": {
      const value = field(props.value, "", text);
      return (
        <RadioGroup
          key={value.bound ? undefined : value.value}
          id={fieldId}
          label={text(read(props.label))}
          orientation={as<Props<typeof RadioGroup>["orientation"]>(props.orientation)}
          error={error}
          disabled={disabled}
          aria-required={required || undefined}
          {...(value.bound ? { value: value.value, onValueChange: value.write } : { defaultValue: value.value })}
        >
          {options(read(props.options)).map((option) => (
            <RadioGroupItem key={option.value} value={option.value} label={option.label} />
          ))}
        </RadioGroup>
      );
    }
    case "Checkbox": {
      const checked = field(props.checked, false, (value) => value === true);
      return (
        <Checkbox
          key={checked.bound ? undefined : String(checked.value)}
          id={fieldId}
          label={text(read(props.label))}
          description={maybe(read(props.description))}
          error={error}
          required={required}
          disabled={disabled}
          {...(checked.bound ? { checked: checked.value, onCheckedChange: checked.write } : { defaultChecked: checked.value })}
        />
      );
    }
    case "Switch": {
      const checked = field(props.checked, false, (value) => value === true);
      return (
        <Switch
          key={checked.bound ? undefined : String(checked.value)}
          id={fieldId}
          label={text(read(props.label))}
          disabled={disabled}
          size={as<Props<typeof Switch>["size"]>(props.size)}
          {...(checked.bound ? { checked: checked.value, onCheckedChange: checked.write } : { defaultChecked: checked.value })}
        />
      );
    }
    case "Slider": {
      const min = as<number>(props.min ?? 0);
      const value = field(props.value, min, (entry) => (typeof entry === "number" && Number.isFinite(entry) ? entry : min));
      return (
        <Slider
          key={value.bound ? undefined : value.value}
          id={fieldId}
          label={text(read(props.label))}
          min={min}
          max={as<number>(props.max ?? 100)}
          step={as<number>(props.step ?? 1)}
          disabled={disabled}
          size={as<Props<typeof Slider>["size"]>(props.size)}
          showValue
          {...(value.bound ? { value: value.value, onValueChange: value.write } : { defaultValue: value.value })}
        />
      );
    }
    case "DatePicker": {
      const value = field<string | null>(props.value, null, (entry) => (typeof entry === "string" && entry ? entry : null));
      return (
        <DatePicker
          key={value.bound ? undefined : text(value.value)}
          id={fieldId}
          label={text(read(props.label))}
          hint={maybe(read(props.hint))}
          error={error}
          min={as<string | undefined>(props.min)}
          max={as<string | undefined>(props.max)}
          required={required}
          disabled={disabled}
          today={drawing.today}
          {...(value.bound ? { value: value.value, onValueChange: value.write } : { defaultValue: value.value })}
        />
      );
    }
    case "Button":
      return (
        <Button id={fieldId} variant={as<Props<typeof Button>["variant"]>(props.variant)} size={as<Props<typeof Button>["size"]>(props.size)} width={as<Props<typeof Button>["width"]>(props.width)} disabled={disabled} onClick={() => drawing.press(id, scope)} {...named}>
          {text(read(props.text))}
        </Button>
      );
    case "Badge":
      return (
        <Badge tone={as<Props<typeof Badge>["tone"]>(props.tone)} variant={as<Props<typeof Badge>["variant"]>(props.variant)} size={as<Props<typeof Badge>["size"]>(props.size)}>
          {text(read(props.text))}
        </Badge>
      );
    case "Progress": {
      const value = read(props.value);
      return <Progress label={text(read(props.label))} value={typeof value === "number" ? value : 0} max={as<number>(props.max ?? 100)} showLabel={read(props.showLabel) === true} tone={as<Props<typeof Progress>["tone"]>(props.tone)} size={as<Props<typeof Progress>["size"]>(props.size)} />;
    }
    case "Avatar":
      return <Avatar name={text(read(props.name))} size={as<Props<typeof Avatar>["size"]>(props.size)} status={as<Props<typeof Avatar>["status"]>(props.status)} />;
    case "Table": {
      const columns = (Array.isArray(props.columns) ? props.columns : []) as Array<{ key: string; label: unknown; align?: "left" | "center" | "right" }>;
      const rows = read(props.rows);
      const caption = text(read(props.caption));
      return (
        <Table size={as<Props<typeof Table>["size"]>(props.size)} aria-label={caption}>
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} align={column.align}>
                  {text(read(column.label))}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(rows) ? rows.slice(0, host.rules.limits.rows) : []).map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    {cell(row, column.key, labels)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    default:
      return null;
  }
}

/** Options as the data model holds them: only the well-formed ones are offered. */
function options(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((option): option is { label: string; value: string } => typeof option?.label === "string" && typeof option?.value === "string" && option.value !== "");
}

/** A cell's words: text and numbers as they are, true and false in words, nothing as a dash. */
function cell(row: unknown, key: string, labels: RenderSurfaceLabels) {
  const value = row !== null && typeof row === "object" && Object.hasOwn(row, key) ? (row as Record<string, unknown>)[key] : undefined;
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "—";
}
