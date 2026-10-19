"use client";

import { AppShell } from "@/components/AppShell";
import { PageHead } from "@/components/ui";
import { ComingSoon } from "@/components/ComingSoon";

export default function AssessmentsPage() {
  return (
    <AppShell workspace="firm">
      <PageHead over="Deloitte & Touche (Nigeria)" title="Assessments" />
      <ComingSoon icon="list-checks" title="Assessment workspace — coming soon" body="Evidence review and drafting findings will be built in a following phase." />
    </AppShell>
  );
}
