import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

export const title = "Vertical";
export const description = "For settings with many sections: arrow keys follow the orientation.";

export default function Example() {
  return (
    <Tabs defaultValue="profile" orientation="vertical">
      <TabsList aria-label="Settings">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Your name, photo and time zone.</TabsContent>
      <TabsContent value="security">Password, sessions and two-step sign-in.</TabsContent>
      <TabsContent value="billing">Plan, invoices and payment method.</TabsContent>
    </Tabs>
  );
}
