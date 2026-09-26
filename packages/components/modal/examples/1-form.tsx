"use client";

import * as React from "react";
import { Button } from "../../button/button";
import { Input } from "../../input/input";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../modal";

export const title = "A form in a dialog";
export const description = "Focus moves to the first field, stays inside, and returns to the button that opened it.";

export default function Example() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite teammate</Button>
      <Modal open={open} onClose={close} label="Invite teammate">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <ModalHeader title="Invite teammate" onClose={close} />
          <ModalBody>
            <Input label="Email" type="email" name="email" placeholder="teammate@company.com" required />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit">Send invite</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
