"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead } from "@/components/ui";
import { ComingSoon } from "@/components/ComingSoon";

export default function EvidencePage() {
  return (
    <AppShell workspace="organisation">
      <PageHead over="Zenith Bank Plc" title="Evidence" />
      <ComingSoon icon="files" title="Evidence library — coming soon" body="Uploaded evidence, reuse across requirements and periods will be built in a following phase." />
    </AppShell>
  );
}
