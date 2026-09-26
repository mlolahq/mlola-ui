import { Textarea } from "./textarea";

export default function Example() {
  return <Textarea label="Feedback" hint="What would make this better?" maxLength={280} showCount rows={3} />;
}
