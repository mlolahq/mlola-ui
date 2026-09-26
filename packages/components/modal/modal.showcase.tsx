"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./modal";
import type { ModalSize } from "./modal";

export default function ModalShowcase() {
  const [size, setSize] = React.useState<ModalSize | null>(null);
  const [kind, setKind] = React.useState<"form" | "confirm" | "sticky" | "scroll" | null>(null);
  const sizes: ModalSize[] = ["sm", "md", "lg", "xl", "full"];
  const close = () => {
    setSize(null);
    setKind(null);
  };
  return (
    <div className="ml-modal-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row">
          {sizes.map((value) => (
            <button key={value} type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setSize(value)}>
              {value}
            </button>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Patterns</h3>
        <div className="ml-showcase-row">
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setKind("form")}>Form dialog</button>
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setKind("confirm")}>Destructive confirm</button>
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setKind("scroll")}>Long content</button>
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setKind("sticky")}>No backdrop close</button>
        </div>
        <p className="ml-showcase-note">Focus is trapped while open and returns to the trigger on close. Escape closes unless disabled.</p>
      </section>

      <Modal open={size !== null} onClose={close} size={size ?? "md"} label={`${size ?? "md"} dialog`}>
        <ModalHeader title={`Size: ${size ?? "md"}`} onClose={close} />
        <ModalBody>The dialog width follows the size token while the height stays content driven.</ModalBody>
        <ModalFooter>
          <button type="button" className="ml-button" data-variant="secondary" onClick={close}>Cancel</button>
          <button type="button" className="ml-button" data-variant="primary" onClick={close}>Done</button>
        </ModalFooter>
      </Modal>

      <Modal open={kind === "form"} onClose={close} label="Invite teammate">
        <ModalHeader title="Invite teammate" onClose={close} />
        <ModalBody>
          <form className="ml-form" onSubmit={(event) => { event.preventDefault(); close(); }}>
            <Input label="Email" type="email" placeholder="teammate@company.com" />
            <Textarea label="Note" rows={3} placeholder="Optional message" />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={close}>Send invite</Button>
        </ModalFooter>
      </Modal>

      <Modal open={kind === "confirm"} onClose={close} size="sm" role="alertdialog" label="Delete project">
        <ModalHeader title="Delete project" onClose={close} />
        <ModalBody>This permanently removes the project and every deployment attached to it.</ModalBody>
        <ModalFooter>
          <button type="button" className="ml-button" data-variant="secondary" onClick={close}>Keep it</button>
          <button type="button" className="ml-button" data-variant="danger" onClick={close}>Delete</button>
        </ModalFooter>
      </Modal>

      <Modal open={kind === "scroll"} onClose={close} label="Release notes">
        <ModalHeader title="Release notes" onClose={close} />
        <ModalBody>
          <div className="ml-showcase-stack">
            {Array.from({ length: 12 }, (_, index) => (
              <p key={index}>Entry {index + 1}: the body scrolls on its own while the header and footer stay put.</p>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" className="ml-button" data-variant="primary" onClick={close}>Close</button>
        </ModalFooter>
      </Modal>

      <Modal open={kind === "sticky"} onClose={close} size="sm" closeOnBackdrop={false} closeOnEscape={false} label="Finish setup">
        <ModalHeader title="Finish setup" onClose={close} />
        <ModalBody>Backdrop and Escape are disabled, so the dialog closes only through an explicit control.</ModalBody>
        <ModalFooter>
          <button type="button" className="ml-button" data-variant="primary" onClick={close}>Got it</button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
