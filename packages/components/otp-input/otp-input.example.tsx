import { OtpInput } from "./otp-input";

export default function Example() {
  return <OtpInput label="Verification code" hint="Sent to your email." length={6} />;
}
