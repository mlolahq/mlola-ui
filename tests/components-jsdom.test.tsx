import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { JSDOM } from "jsdom";

/**
 * Every component renders in jsdom, the environment most React test suites
 * run in. jsdom has no matchMedia, ResizeObserver or IntersectionObserver,
 * no layout and no canvas, so a component that reaches for any of them
 * without asking would crash someone's test suite. Every showcase (each
 * variant and state) and every example mounts, runs its effects, and unmounts
 * without an error; the journeys below check what a test written straight
 * after render expects to be true.
 */

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
Object.assign(globalThis, { window, document: window.document, IS_REACT_ACT_ENVIRONMENT: true });
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue;
  Object.defineProperty(globalThis, key, { configurable: true, get: () => (window as unknown as Record<string, unknown>)[key] });
}

const React = await import("react");
(globalThis as unknown as { React: typeof React }).React = React;
const { act } = React;
const { createRoot } = await import("react-dom/client");

const ROOT = path.resolve(import.meta.dirname, "..");
const COMPONENTS = path.join(ROOT, "packages/components");
const files = fs
  .readdirSync(COMPONENTS)
  .flatMap((name) => ["showcase", "example"].map((kind) => path.join(COMPONENTS, name, `${name}.${kind}.tsx`)))
  .filter((file) => fs.existsSync(file))
  .sort();

const errors: string[] = [];
const original = console.error;
before(() => {
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" ").split("\n")[0]);
});
after(() => {
  console.error = original;
});

async function mount(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return {
    host,
    root,
    unmount: async () => {
      await act(async () => root.unmount());
      host.remove();
    },
  };
}

describe("every component renders in jsdom", () => {
  test("every component has a showcase to render", () => {
    const components = fs.readdirSync(COMPONENTS, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== "_internal");
    assert.equal(files.filter((file) => file.endsWith(".showcase.tsx")).length, components.length);
  });
  for (const file of files) {
    const name = path.basename(file, ".tsx");
    test(name, async () => {
      errors.length = 0;
      const { default: Example } = await import(file);
      const { host, unmount } = await mount(<Example />);
      assert.ok(host.innerHTML.length > 0 || document.body.children.length > 1, `${name} rendered nothing`);
      await unmount();
      assert.deepEqual(errors, [], `${name} logged errors`);
    });
  }
});

describe("what a test expects straight after render", () => {
  test("a modal has focus inside it and is named by its header", async () => {
    const { Modal, ModalHeader, ModalBody } = await import("../packages/components/modal/modal");
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();
    const view = await mount(
      <Modal open onClose={() => undefined}>
        <ModalHeader title={<>Invite <strong>teammate</strong></>} />
        <ModalBody>
          <button type="button">Send invite</button>
        </ModalBody>
      </Modal>,
    );
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    assert.ok(dialog, "the dialog is in the document");
    assert.equal(document.activeElement?.textContent, "Send invite");
    const title = document.getElementById(dialog.getAttribute("aria-labelledby") ?? "");
    assert.equal(title?.textContent, "Invite teammate");
    assert.equal(dialog.hasAttribute("aria-label"), false);
    await act(async () => view.root.render(<Modal open={false} onClose={() => undefined}>{null}</Modal>));
    assert.equal(document.activeElement, opener, "focus returns to the opener");
    await view.unmount();
    opener.remove();
  });

  test("a sheet has focus inside it and passes its attributes on", async () => {
    const { Sheet, SheetHeader } = await import("../packages/components/sheet/sheet");
    const view = await mount(
      <Sheet open onClose={() => undefined} data-testid="filters">
        <SheetHeader title="Filters" onClose={() => undefined} />
      </Sheet>,
    );
    const panel = document.querySelector<HTMLElement>('[data-testid="filters"]');
    assert.equal(panel?.getAttribute("role"), "dialog");
    assert.ok(panel?.contains(document.activeElement), "focus is inside the sheet");
    assert.equal(document.getElementById(panel?.getAttribute("aria-labelledby") ?? "")?.textContent, "Filters");
    await view.unmount();
  });

  test("a select takes part in a form and an outside label", async () => {
    const { Select } = await import("../packages/components/select/select");
    const options = [
      { value: "draft", label: "Draft" },
      { value: "live", label: "Live" },
    ];
    const view = await mount(
      <form>
        <label htmlFor="status">Status</label>
        <Select id="status" name="status" defaultValue="live" options={options} aria-describedby="status-note" required />
        <Select name="tags" multiple defaultValue={["draft", "live"]} options={options} aria-label="Tags" />
        <p id="status-note">Only live posts are public.</p>
      </form>,
    );
    const trigger = document.getElementById("status");
    assert.equal(trigger?.getAttribute("role"), "combobox");
    assert.equal((trigger as HTMLButtonElement).labels?.[0]?.textContent, "Status");
    assert.equal(trigger?.getAttribute("aria-describedby"), "status-note");
    assert.equal(trigger?.getAttribute("aria-required"), "true");
    assert.equal(document.querySelector('[aria-label="Tags"]')?.getAttribute("role"), "combobox");
    const data = new window.FormData(view.host.querySelector("form")!);
    assert.equal(data.get("status"), "live");
    assert.deepEqual(data.getAll("tags"), ["draft", "live"]);
    await view.unmount();
  });

  test("every custom control submits its value with a form", async () => {
    const { Combobox } = await import("../packages/components/combobox/combobox");
    const { DatePicker } = await import("../packages/components/date-picker/date-picker");
    const { TimePicker } = await import("../packages/components/time-picker/time-picker");
    const { NumberInput } = await import("../packages/components/number-input/number-input");
    const { OtpInput } = await import("../packages/components/otp-input/otp-input");
    const { Slider } = await import("../packages/components/slider/slider");
    const { TagInput } = await import("../packages/components/tag-input/tag-input");
    const { ColorPicker } = await import("../packages/components/color-picker/color-picker");
    const view = await mount(
      <form>
        <Combobox name="region" defaultValue="eu" options={[{ value: "eu", label: "Europe" }]} label="Region" />
        <DatePicker name="due" defaultValue="2026-09-14" label="Due" today="2026-09-14" />
        <DatePicker name="stay" mode="range" defaultValue={{ from: "2026-09-01", to: "2026-09-07" }} label="Stay" today="2026-09-14" />
        <TimePicker name="start" defaultValue="09:30" label="Start" />
        <NumberInput name="seats" defaultValue={12} label="Seats" />
        <OtpInput name="code" defaultValue="123456" label="Code" />
        <Slider name="volume" defaultValue={40} label="Volume" />
        <TagInput name="labels" defaultValue={["design", "docs"]} label="Labels" />
        <ColorPicker name="brand" defaultValue="#0a84ff" label="Brand" />
        <Slider name="off" defaultValue={10} disabled aria-label="Unused" />
      </form>,
    );
    const data = new window.FormData(view.host.querySelector("form")!);
    assert.deepEqual(Object.fromEntries([...data.keys()].map((key) => [key, data.getAll(key)])), {
      region: ["eu"],
      due: ["2026-09-14"],
      stay: ["2026-09-01/2026-09-07"],
      start: ["09:30"],
      seats: ["12"],
      code: ["123456"],
      volume: ["40"],
      labels: ["design", "docs"],
      brand: ["#0a84ff"],
    });
    await view.unmount();
  });

  test("a progress bar passes aria attributes to the bar and the rest to its root", async () => {
    const { Progress } = await import("../packages/components/progress/progress");
    const view = await mount(<Progress value={40} aria-describedby="upload-note" data-testid="upload" />);
    const root = view.host.querySelector('[data-testid="upload"]');
    assert.ok(root, "data attributes reach the root");
    assert.equal(root.querySelector('[role="progressbar"]')?.getAttribute("aria-describedby"), "upload-note");
    await view.unmount();
  });
});

describe("Escape closes one layer at a time", () => {
  // A modal with a menu, a listbox, a popover or a tip open above it: the first
  // Escape closes what is on top, and the modal stays until the next one.
  const escape = (target: Element) =>
    act(async () => {
      target.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    });
  const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
  const focused = () => (document.activeElement ?? document.body) as Element;
  const button = (text: string) => [...document.querySelectorAll("button")].find((element) => element.textContent === text)!;

  // The modal is always unmounted, even when an assertion fails: a modal left
  // behind would answer the next test's Escape and make it pass.
  async function inModal(content: React.ReactNode, body: (closes: () => number) => Promise<void>) {
    const { Modal } = await import("../packages/components/modal/modal");
    let closes = 0;
    const view = await mount(
      <Modal open onClose={() => { closes += 1; }} aria-label="Settings">
        {content}
      </Modal>,
    );
    try {
      await settle();
      await body(() => closes);
    } finally {
      await view.unmount();
    }
  }

  test("a dropdown menu", async () => {
    const { DropdownMenu } = await import("../packages/components/dropdown-menu/dropdown-menu");
    await inModal(<DropdownMenu trigger="Sort by" items={[{ label: "Newest first" }, { label: "Oldest first" }]} />, async (closes) => {
      await act(async () => document.querySelector<HTMLElement>(".ml-dropdown-trigger")!.click());
      await settle();
      assert.ok(document.querySelector('[role="menu"]'), "the menu opened");
      await escape(focused());
      assert.equal(document.querySelector('[role="menu"]'), null, "the menu closed");
      assert.equal(closes(), 0, "the modal stayed open");
      await escape(focused());
      assert.equal(closes(), 1, "the next Escape closes the modal");
    });
  });

  test("a select", async () => {
    const { Select } = await import("../packages/components/select/select");
    await inModal(<Select aria-label="Status" options={[{ value: "draft", label: "Draft" }, { value: "live", label: "Live" }]} />, async (closes) => {
      const trigger = document.querySelector<HTMLElement>(".ml-select")!;
      await act(async () => trigger.click());
      await settle();
      assert.equal(trigger.getAttribute("aria-expanded"), "true", "the listbox opened");
      await escape(trigger);
      assert.equal(trigger.getAttribute("aria-expanded"), "false", "the listbox closed");
      assert.equal(closes(), 0, "the modal stayed open");
      await escape(trigger);
      assert.equal(closes(), 1, "Escape on a closed select closes the modal");
    });
  });

  test("a popover", async () => {
    const { Popover } = await import("../packages/components/popover/popover");
    let open = false;
    const content = (
      <Popover label="Share" onOpenChange={(next) => { open = next; }} trigger={<button type="button">Share</button>}>
        <p>Anyone with the link can view this page.</p>
      </Popover>
    );
    await inModal(content, async (closes) => {
      await act(async () => button("Share").click());
      await settle();
      assert.equal(open, true, "the popover opened");
      await escape(focused());
      await settle();
      assert.equal(open, false, "the popover closed");
      assert.equal(closes(), 0, "the modal stayed open");
    });
  });

  test("a tooltip", async () => {
    const { Tooltip } = await import("../packages/components/tooltip/tooltip");
    const content = (
      <Tooltip content="Copy a link" delay={0}>
        <button type="button">Copy</button>
      </Tooltip>
    );
    await inModal(content, async (closes) => {
      await act(async () => button("Copy").focus());
      await settle();
      assert.ok(document.querySelector('[role="tooltip"]'), "the tip showed");
      await escape(button("Copy"));
      assert.equal(document.querySelector('[role="tooltip"]'), null, "the tip hid");
      assert.equal(closes(), 0, "the modal stayed open");
    });
  });

  test("a hover card", async () => {
    const { HoverCard } = await import("../packages/components/hover-card/hover-card");
    const content = (
      <HoverCard content={<p>Owner of the project</p>} openDelay={0}>
        <a href="#owner">Maya</a>
      </HoverCard>
    );
    await inModal(content, async (closes) => {
      const link = document.querySelector<HTMLElement>('a[href="#owner"]')!;
      await act(async () => link.focus());
      await settle();
      assert.ok(document.body.textContent?.includes("Owner of the project"), "the card opened");
      await escape(link);
      await settle();
      assert.equal(document.body.textContent?.includes("Owner of the project"), false, "the card closed");
      assert.equal(closes(), 0, "the modal stayed open");
    });
  });
});
