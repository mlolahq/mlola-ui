"use client";

import * as React from "react";
import { OtpInput } from "./otp-input";

export default function OtpInputShowcase() {
  const [done, setDone] = React.useState<string | null>(null);
  return (
    <div className="ml-otp-input-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Type, paste, or let the phone fill it</h3>
        <OtpInput label="Verification code" hint="We sent a 6-digit code to sara@northloop.com." groupSize={3} onComplete={setDone} />
        <p className="ml-showcase-note" role="status">{done ? `Verifying ${done}…` : "Paste 123456 to try."}</p>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Alphanumeric, with an error</h3>
        <OtpInput label="Recovery code" length={4} mode="alphanumeric" defaultValue="7K2" error="That code has expired." />
      </section>
    </div>
  );
}
