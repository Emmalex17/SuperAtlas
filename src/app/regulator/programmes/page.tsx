"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead } from "@/components/ui";
import { ComingSoon } from "@/components/ComingSoon";

export default function ProgrammesPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Programmes" />
      <ComingSoon icon="list-checks" title="Programmes — coming soon" body="Compliance programmes, cycles and publishing will be built in a following phase." />
    </AppShell>
  );
}
