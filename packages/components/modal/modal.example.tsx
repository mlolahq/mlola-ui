"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./modal";

export default function Example() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete project</Button>
      <Modal open={open} onClose={close} size="sm" role="alertdialog" label="Delete project">
        <ModalHeader title="Delete project" onClose={close} />
        <ModalBody>This removes the project and every deployment attached to it.</ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={close}>Keep it</Button>
          <Button variant="danger" onClick={close}>Delete</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
