"use client";

import { PRIORITY_LABELS, PriorityIcon, WORK_PRIORITIES } from "./priority-icon";

export default function PriorityIconShowcase() {
  return (
    <div className="ml-priority-icon-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Signal bars, most pressing first</h3>
        <ul className="ml-status-icon-showcase-list">
          {WORK_PRIORITIES.map((priority) => (
            <li key={priority}>
              <PriorityIcon priority={priority} label="" />
              {PRIORITY_LABELS[priority]}
            </li>
          ))}
        </ul>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">They scale with the text around them</h3>
        <p className="ml-priority-icon-showcase-sizes">
          <PriorityIcon priority="urgent" size="1em" /> <PriorityIcon priority="high" size="1.25em" /> <PriorityIcon priority="medium" size="1.5em" /> <PriorityIcon priority="low" size="2em" />
        </p>
      </section>
    </div>
  );
}
