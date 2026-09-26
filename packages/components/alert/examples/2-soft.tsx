import { Alert, AlertDescription } from "../alert";

export const title = "Soft, inside a form";
export const description = "The soft variant sits quietly among fields without a heading.";

export default function Example() {
  return (
    <Alert tone="warning" variant="soft">
      <AlertDescription>Changing the slug breaks links people have already shared.</AlertDescription>
    </Alert>
  );
}
