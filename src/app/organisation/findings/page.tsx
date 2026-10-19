"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead } from "@/components/ui";
import { ComingSoon } from "@/components/ComingSoon";

export default function FindingsPage() {
  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Findings" />
      <ComingSoon icon="warning-circle" title="Findings — coming soon" body="Open findings and remediation deadlines will be built in a following phase." />
    </AppShell>
  );
}
