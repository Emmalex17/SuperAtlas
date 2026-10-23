import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

export type InviteOrgParams = {
  tenantName: string;
  orgName: string;
  categoryLabel: string;
  acceptUrl: string;
  replyTo: string;
  isDemo?: boolean;
  expiresInDays: number;
};

export default function InviteOrg({ tenantName, orgName, categoryLabel, acceptUrl, replyTo, isDemo, expiresInDays }: InviteOrgParams) {
  return (
    <EmailLayout
      previewText={`${tenantName} invites ${orgName} to SuperAtlas`}
      tenantName={tenantName}
      heading={`${tenantName} invites ${orgName} to SuperAtlas`}
      buttonLabel="Accept invitation"
      buttonHref={acceptUrl}
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: "0 0 12px" }}>Hello,</Text>
      <Text style={{ margin: "0 0 12px" }}>
        {tenantName} supervises {orgName} as a <strong>{categoryLabel}</strong>. Accept this invitation to set up your organisation&apos;s account.
        You will answer requirements and file returns here.
      </Text>
      <Text style={{ margin: 0, fontSize: 12, color: "#6b6f81" }}>The link expires in {expiresInDays} days.</Text>
    </EmailLayout>
  );
}

export function inviteOrgText(p: InviteOrgParams): string {
  return `${p.tenantName} invites ${p.orgName} to SuperAtlas\n\n${p.tenantName} supervises ${p.orgName} as a ${p.categoryLabel}. Accept this invitation to set up your organisation's account: ${p.acceptUrl}\n\nThe link expires in ${p.expiresInDays} days.`;
}
