import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

export type InviteFirmParams = {
  tenantName: string;
  firmName: string;
  acceptUrl: string;
  replyTo: string;
  isDemo?: boolean;
  expiresInDays: number;
};

export default function InviteFirm({ tenantName, firmName, acceptUrl, replyTo, isDemo, expiresInDays }: InviteFirmParams) {
  return (
    <EmailLayout
      previewText={`${tenantName} invites ${firmName} to SuperAtlas`}
      tenantName={tenantName}
      heading={`${tenantName} invites ${firmName} to SuperAtlas`}
      buttonLabel="Accept invitation"
      buttonHref={acceptUrl}
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: "0 0 12px" }}>Hello,</Text>
      <Text style={{ margin: "0 0 12px" }}>
        {tenantName} has invited {firmName} to join SuperAtlas as an accredited assurance firm. Accept this invitation to set up your firm&apos;s
        account, add your lead auditor and assessors, and apply for accreditation.
      </Text>
      <Text style={{ margin: 0, fontSize: 12, color: "#6b6f81" }}>The link expires in {expiresInDays} days.</Text>
    </EmailLayout>
  );
}

export function inviteFirmText(p: InviteFirmParams): string {
  return `${p.tenantName} invites ${p.firmName} to SuperAtlas\n\n${p.tenantName} has invited ${p.firmName} to join as an accredited assurance firm. Accept this invitation: ${p.acceptUrl}\n\nThe link expires in ${p.expiresInDays} days.`;
}
