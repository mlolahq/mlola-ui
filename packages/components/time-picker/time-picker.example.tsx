import { TimePicker } from "./time-picker";

export default function Example() {
  return <TimePicker label="Reminder" defaultValue="09:30" step={15} hourCycle={24} />;
}
