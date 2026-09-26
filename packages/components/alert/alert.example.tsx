import { Alert, AlertDescription, AlertTitle } from "./alert";

export default function Example() {
  return (
    <Alert tone="warning">
      <AlertTitle>Your card expires soon</AlertTitle>
      <AlertDescription>Update it before September 30 to keep your plan.</AlertDescription>
    </Alert>
  );
}
