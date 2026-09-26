import { Checkbox } from "../../checkbox/checkbox";
import { RadioGroup, RadioGroupItem } from "../../radio-group/radio-group";
import { Switch } from "../toggle";

export const title = "In a settings form";
export const description = "A switch takes effect at once; a checkbox and a choice wait for the form to be saved.";

export default function Example() {
  return (
    <form className="ml-form">
      <Switch label="Email me when someone mentions me" defaultChecked />
      <Checkbox label="Include a weekly summary" description="Every Monday morning." />
      <RadioGroup label="Summary format" name="format" defaultValue="short">
        <RadioGroupItem value="short" label="Short" />
        <RadioGroupItem value="detailed" label="Detailed" />
      </RadioGroup>
    </form>
  );
}
