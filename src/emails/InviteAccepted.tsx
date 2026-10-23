import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

export type InviteAcceptedParams = {
  tenantName: string;
  acceptedByName: string;
  entityName: string;
  recordUrl: string;
  replyTo: string;
  isDemo?: boolean;
};

export default function InviteAccepted({ tenantName, acceptedByName, entityName, recordUrl, replyTo, isDemo }: InviteAcceptedParams) {
  return (
    <EmailLayout
      previewText={`${acceptedByName} accepted your invitation`}
      tenantName={tenantName}
      heading={`${acceptedByName} accepted your invitation`}
      buttonLabel="Open the record"
      buttonHref={recordUrl}
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: 0 }}>
        {acceptedByName} has accepted your invitation and joined {entityName} on SuperAtlas.
      </Text>
    </EmailLayout>
  );
}

export function inviteAcceptedText(p: InviteAcceptedParams): string {
  return `${p.acceptedByName} accepted your invitation\n\n${p.acceptedByName} has accepted your invitation and joined ${p.entityName} on SuperAtlas: ${p.recordUrl}`;
}
