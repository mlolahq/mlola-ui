import { Kbd, Shortcut } from "./kbd";

export default function Example() {
  return (
    <p>
      Press <Shortcut keys="mod+k" /> to search, or <Kbd>Esc</Kbd> to close.
    </p>
  );
}
