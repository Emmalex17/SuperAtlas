import { InviteFlow } from "@/components/InviteFlow";
import { INVITES } from "@/lib/invites";

export default function InvitationPage() {
  return <InviteFlow invite={INVITES.invitation} />;
}
