import { Spinner } from "./spinner";

export default function Example() {
  return (
    <p className="ml-cluster">
      <Spinner label="Loading results" />
      Searching 12,480 records
    </p>
  );
}
