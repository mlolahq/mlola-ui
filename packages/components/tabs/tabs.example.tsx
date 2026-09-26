import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export default function Example() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Everything at a glance.</TabsContent>
      <TabsContent value="activity">Who changed what, and when.</TabsContent>
      <TabsContent value="settings">Names, members and billing.</TabsContent>
    </Tabs>
  );
}
