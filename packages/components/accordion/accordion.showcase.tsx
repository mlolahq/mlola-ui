"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

export default function Showcase() {
  const faq = [
    { value: "what", q: "What is Mlola UI?", a: "A UI system for AI-native products: accessible React components on native CSS tokens, five themes, and no Tailwind or utility runtime." },
    { value: "themes", q: "How do themes work?", a: "Set data-theme and data-mode on any ancestor. Every recipe reads from the same token set." },
    { value: "copy", q: "Do I install a package?", a: "Components install as source through the CLI, so you own and can edit every file." },
  ];
  return (
    <div className="ml-accordion-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Single (collapsible)</h3>
        <Accordion defaultValue="what">
          {faq.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Multiple open at once</h3>
        <Accordion type="multiple" defaultValue={["billing", "seats"]}>
          <AccordionItem value="billing">
            <AccordionTrigger>Billing</AccordionTrigger>
            <AccordionContent>Invoices are issued monthly and prorated on upgrades.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="seats">
            <AccordionTrigger>Seats</AccordionTrigger>
            <AccordionContent>Add or remove seats at any time; changes apply on the next cycle.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="sso">
            <AccordionTrigger>SSO</AccordionTrigger>
            <AccordionContent>SAML and OIDC are available on Team and Enterprise plans.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Not collapsible and disabled item</h3>
        <p className="ml-showcase-note">With collapsible off, one panel always stays open.</p>
        <Accordion defaultValue="first" collapsible={false}>
          <AccordionItem value="first">
            <AccordionTrigger>Always one open</AccordionTrigger>
            <AccordionContent>Clicking the open trigger will not close it.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="second">
            <AccordionTrigger>Second panel</AccordionTrigger>
            <AccordionContent>Opening this one closes the first.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="third" disabled>
            <AccordionTrigger>Unavailable</AccordionTrigger>
            <AccordionContent>This panel cannot be reached.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
