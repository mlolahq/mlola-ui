import { CopyButton } from "./copy-button";

export default function Example() {
  return (
    <div className="ml-cluster">
      <code>ml_live_4f9a2c</code>
      <CopyButton value="ml_live_4f9a2c" label="Copy API key" variant="subtle" />
      <CopyButton value="https://ui.mlola.com/invite/3fa9" size="sm">
        Copy invite link
      </CopyButton>
    </div>
  );
}
