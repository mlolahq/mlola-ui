import { Input } from "../input";

export const title = "With an error";
export const description = "The message names the fix, and is tied to the field so a screen reader reads it with the label.";

export default function Example() {
  return <Input label="Work email" type="email" defaultValue="lena@" error="Enter the whole address, like lena@company.com." required />;
}
