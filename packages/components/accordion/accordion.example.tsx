import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

export default function Example() {
  return (
    <Accordion type="single" defaultValue="plans" collapsible>
      <AccordionItem value="plans">
        <AccordionTrigger>Is there a free plan?</AccordionTrigger>
        <AccordionContent>Yes. The open-source components are free forever.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="themes">
        <AccordionTrigger>Can I change themes later?</AccordionTrigger>
        <AccordionContent>Change data-theme on any ancestor. Nothing else moves.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
