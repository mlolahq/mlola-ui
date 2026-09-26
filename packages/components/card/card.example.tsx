import { Button } from "../button/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Four members, two pending invitations.</CardDescription>
      </CardHeader>
      <CardContent>Everyone can edit projects; only owners can change billing.</CardContent>
      <CardFooter>
        <Button size="sm">Invite</Button>
      </CardFooter>
    </Card>
  );
}
