import { Avatar, AvatarGroup } from "./avatar";

export default function Example() {
  return (
    <AvatarGroup max={3}>
      <Avatar name="Lena Park" status="online" />
      <Avatar name="Kai Tanaka" />
      <Avatar name="Rin Sato" />
      <Avatar name="Omar Haddad" />
    </AvatarGroup>
  );
}
