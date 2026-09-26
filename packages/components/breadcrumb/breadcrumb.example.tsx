import { Breadcrumb } from "./breadcrumb";

export default function Example() {
  return (
    <Breadcrumb
      items={[
        { label: "Projects", href: "/projects" },
        { label: "Atlas", href: "/projects/atlas" },
        { label: "Settings" },
      ]}
    />
  );
}
