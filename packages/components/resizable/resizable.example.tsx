import { Resizable } from "./resizable";

export default function Example() {
  return (
    <div style={{ height: 200 }}>
      <Resizable
        label="Resize sidebar"
        defaultSize={30}
        min={20}
        max={50}
        first={<nav>Files</nav>}
        second={<main>Editor</main>}
      />
    </div>
  );
}
