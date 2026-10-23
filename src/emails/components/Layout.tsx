import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Link, Button } from "@react-email/components";
import type { ReactNode } from "react";

/**
 * The shared shell every SuperAtlas email uses — tenant name, one clear button, a footer with
 * the reply-to address. Per docs/BACKEND_SPEC.md section 8: "Each has the tenant name and
 * logo, one clear button, and a footer with EMAIL_REPLY_TO." (Logo is a future enhancement —
 * tenant branding.logo_path isn't wired to an emailable asset URL yet; the name alone carries
 * the identity for the pilot.)
 */
export function EmailLayout({
  previewText,
  tenantName,
  heading,
  children,
  buttonLabel,
  buttonHref,
  replyTo,
  isDemo,
}: {
  previewText: string;
  tenantName: string;
  heading: string;
  children: ReactNode;
  buttonLabel?: string;
  buttonHref?: string;
  replyTo: string;
  isDemo?: boolean;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#f4f5fb", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 12, padding: 32, maxWidth: 480 }}>
          <Text style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6b6f81", margin: "0 0 8px" }}>
            {tenantName}
            {isDemo ? " · Demo" : ""}
          </Text>
          <Heading style={{ fontSize: 20, fontWeight: 700, color: "#101115", margin: "0 0 16px" }}>{heading}</Heading>
          <Section style={{ fontSize: 14, lineHeight: "22px", color: "#101115" }}>{children}</Section>
          {buttonLabel && buttonHref ? (
            <Section style={{ margin: "24px 0" }}>
              <Button
                href={buttonHref}
                style={{ backgroundColor: "#4f46e5", color: "#ffffff", fontSize: 14, fontWeight: 600, borderRadius: 10, padding: "12px 20px", textDecoration: "none" }}
              >
                {buttonLabel}
              </Button>
            </Section>
          ) : null}
          <Hr style={{ borderColor: "#e1e2e6", margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#9094a3", margin: 0 }}>
            Powered by SuperAtlas. Questions? Reply or write to <Link href={`mailto:${replyTo}`} style={{ color: "#1a52a2" }}>{replyTo}</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
