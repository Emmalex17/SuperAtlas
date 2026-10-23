import { Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";

/**
 * Skeleton only, per docs/BACKEND_SPEC.md phase 1 scope ("digest skeleton"). The real content —
 * one line per task, sourced from v_tasks — is wired up once that view exists (back-end phase
 * 9, alongside the task panel). `lines` is a plain list of pre-formatted strings for now, not
 * yet typed task records.
 */
export type DailyDigestParams = {
  tenantName: string;
  fullName: string;
  lines: string[];
  dashboardUrl: string;
  replyTo: string;
  isDemo?: boolean;
};

export default function DailyDigest({ tenantName, fullName, lines, dashboardUrl, replyTo, isDemo }: DailyDigestParams) {
  return (
    <EmailLayout
      previewText={`${lines.length} waiting for you on SuperAtlas`}
      tenantName={tenantName}
      heading="Waiting for you today"
      buttonLabel="Open SuperAtlas"
      buttonHref={dashboardUrl}
      replyTo={replyTo}
      isDemo={isDemo}
    >
      <Text style={{ margin: "0 0 12px" }}>Good morning {fullName},</Text>
      {lines.length ? (
        lines.map((line, i) => (
          <Text key={i} style={{ margin: "0 0 8px" }}>
            • {line}
          </Text>
        ))
      ) : (
        <Text style={{ margin: 0 }}>Nothing is waiting for you this morning.</Text>
      )}
    </EmailLayout>
  );
}

export function dailyDigestText(p: DailyDigestParams): string {
  return `Waiting for you today\n\nGood morning ${p.fullName},\n\n${p.lines.length ? p.lines.map((l) => `- ${l}`).join("\n") : "Nothing is waiting for you this morning."}\n\n${p.dashboardUrl}`;
}
