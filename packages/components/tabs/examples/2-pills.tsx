import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

export const title = "Pills";
export const description = "A lighter strip for switching views inside a card or a panel.";

export default function Example() {
  return (
    <Tabs defaultValue="week" variant="pills">
      <TabsList aria-label="Range">
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
      <TabsContent value="day">1,284 visits today.</TabsContent>
      <TabsContent value="week">8,902 visits this week.</TabsContent>
      <TabsContent value="month">36,410 visits this month.</TabsContent>
    </Tabs>
  );
}
