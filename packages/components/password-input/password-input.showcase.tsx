"use client";

import { PasswordInput } from "./password-input";

export default function PasswordInputShowcase() {
  return (
    <div className="ml-stack">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Signing in, and choosing a new password</h3>
        <div className="ml-showcase-columns">
          <PasswordInput label="Password" defaultValue="correct-horse" />
          <PasswordInput label="New password" strength defaultValue="orbit7" />
        </div>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">A strong password, and a wrong one</h3>
        <div className="ml-showcase-columns">
          <PasswordInput label="New password" strength defaultValue="violet-anchor-92!" />
          <PasswordInput label="Password" error="That password is not right." defaultValue="orbit" />
        </div>
      </section>
    </div>
  );
}
