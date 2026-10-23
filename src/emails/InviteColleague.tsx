import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

export type InviteColleagueParams = {
  tenantName: string;
  entityName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  replyTo: string;
  isDemo?: boolean;
  expiresInDays: number;
};

export default function InviteColleague({ tenantName, entityName, inviterName, role, acceptUrl, replyTo, isDemo, expiresInDays }: InviteColleagueParams) {
  return (
    <EmailLayout
      previewText={`You are invited to ${entityName} on SuperAtlas`}
      tenantName={tenantName}
      heading={`You are invited to ${entityName} on SuperAtlas`}
      buttonLabel="Accept invitation"
      buttonHref={acceptUrl}
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: "0 0 12px" }}>Hello,</Text>
      <Text style={{ margin: "0 0 12px" }}>
        {inviterName} has invited you to join {entityName} on SuperAtlas as <strong>{role}</strong>. Accept this invitation to set a password and
        get started.
      </Text>
      <Text style={{ margin: 0, fontSize: 12, color: "#6b6f81" }}>The link expires in {expiresInDays} days.</Text>
    </EmailLayout>
  );
}

export function inviteColleagueText(p: InviteColleagueParams): string {
  return `You are invited to ${p.entityName} on SuperAtlas\n\n${p.inviterName} has invited you to join ${p.entityName} as ${p.role}. Accept this invitation: ${p.acceptUrl}\n\nThe link expires in ${p.expiresInDays} days.`;
}
