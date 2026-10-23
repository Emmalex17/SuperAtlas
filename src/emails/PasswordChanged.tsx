import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

export type PasswordChangedParams = {
  tenantName: string;
  fullName: string;
  replyTo: string;
  isDemo?: boolean;
};

export default function PasswordChanged({ tenantName, fullName, replyTo, isDemo }: PasswordChangedParams) {
  return (
    <EmailLayout
      previewText="Your SuperAtlas password was changed"
      tenantName={tenantName}
      heading="Your password was changed"
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: "0 0 12px" }}>Hello {fullName},</Text>
      <Text style={{ margin: "0 0 12px" }}>Your SuperAtlas password was just changed. You have been signed out of every other device.</Text>
      <Text style={{ margin: 0 }}>If this wasn&apos;t you, write to us straight away using the address below.</Text>
    </EmailLayout>
  );
}

export function passwordChangedText(p: PasswordChangedParams): string {
  return `Your password was changed\n\nHello ${p.fullName},\n\nYour SuperAtlas password was just changed. You have been signed out of every other device.\n\nIf this wasn't you, write to us straight away at ${p.replyTo}.`;
}
