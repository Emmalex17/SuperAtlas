"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead } from "@/components/ui";
import { ComingSoon } from "@/components/ComingSoon";

export default function LibraryPage() {
  return (
    <AppShell workspace="regulator">
      <PageHead over="NITDA" title="Requirements library" />
      <ComingSoon icon="scroll" title="Requirements library — coming soon" body="Regulations, requirement sets and individual requirements will be built in a following phase." />
    </AppShell>
  );
}
