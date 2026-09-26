import { Badge } from "../../badge/badge";
import { Button } from "../../button/button";
import { Progress } from "../../progress/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../card";

export const title = "A summary with an action";
export const description = "A card groups one subject: its state, a measure of it, and the next step.";

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team plan</CardTitle>
        <CardDescription>Renews on October 1</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="ml-stack">
          <Badge tone="success" dot>Active</Badge>
          <Progress value={7} max={10} label="Seats used, 7 of 10" showLabel />
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="secondary">Manage seats</Button>
      </CardFooter>
    </Card>
  );
}
