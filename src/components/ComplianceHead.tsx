"use client";

import { useState } from "react";
import { PageHead, Button, RouteTabs } from "@/components/ui";
import { Scorecard } from "@/components/Scorecard";
import { ORGANISATIONS } from "@/lib/mockData";
import { ENF_CASES, orgExposure, buildOrgScorecard } from "@/lib/enforcement";

const ORG_ID = "zenith";

/** The shared header for org/compliance, org/exposure and org/actions — three separate routes
 * presented as tabs of one "Compliance" screen, the prototype's compHead(). */
export function ComplianceHead({ active }: { active: "/organisation/compliance" | "/organisation/exposure" | "/organisation/actions" }) {
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const org = ORGANISATIONS.find((o) => o.id === ORG_ID);
  const n = ENF_CASES.filter((c) => c.org === ORG_ID && c.issued).length;
  const ex = orgExposure(ORG_ID, "organisation");
  const exHigh = ex.filter((e) => e.lv === "High").length;

  return (
    <>
      <PageHead
        title="Compliance"
        sub="Your status in each programme, what could draw action from NITDA, and any notices you have received."
        actions={<Button variant="secondary" icon="export" onClick={() => setScorecardOpen(true)} testId="my-export">Export scorecard</Button>}
      />
      <RouteTabs
        items={[
          { label: "Programmes", href: "/organisation/compliance" },
          { label: "Exposure", href: "/organisation/exposure", count: exHigh || undefined },
          { label: "Regulatory actions", href: "/organisation/actions", count: n || undefined },
        ]}
        active={active}
      />
      <Scorecard open={scorecardOpen} onClose={() => setScorecardOpen(false)} data={org ? buildOrgScorecard(org) : null} />
    </>
  );
}
