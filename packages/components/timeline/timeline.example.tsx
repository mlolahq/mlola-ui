import { Timeline, TimelineItem } from "./timeline";

export default function Example() {
  return (
    <Timeline>
      <TimelineItem status="complete" title="Order placed" time="Sep 12" dateTime="2026-09-12" />
      <TimelineItem status="current" title="Shipped" time="Sep 14" dateTime="2026-09-14" description="In transit to the local hub." />
      <TimelineItem status="upcoming" title="Delivered" />
    </Timeline>
  );
}
