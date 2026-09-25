"use client";

import { STATUS_LABELS, StatusIcon, WORK_STATUSES } from "./status-icon";

export default function StatusIconShowcase() {
  return (
    <div className="ml-status-icon-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Every status, readable without colour</h3>
        <ul className="ml-status-icon-showcase-list">
          {WORK_STATUSES.map((status) => (
            <li key={status}>
              <StatusIcon status={status} label="" />
              {STATUS_LABELS[status]}
            </li>
          ))}
        </ul>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Progress fills the ring</h3>
        <ul className="ml-status-icon-showcase-list">
          {[0.1, 0.25, 0.5, 0.75, 0.9].map((progress) => (
            <li key={progress}>
              <StatusIcon status="in-progress" progress={progress} label="" size="1.25em" />
              {Math.round(progress * 100)}%
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
