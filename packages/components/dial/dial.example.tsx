import { Dial } from "./dial";

export default function Example() {
  return <Dial label="Temperature" min={10} max={30} step={0.5} defaultValue={21} format={(value) => `${value} °C`} />;
}
