"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Chip, Tile } from "@/components/ui";
import { ComplianceHead } from "@/components/ComplianceHead";
import { Icon } from "@/lib/icons";
import { orgExposure, LV_TONE, type ExposureLevel } from "@/lib/enforcement";

const ORG_ID = "zenith";
const LEVELS: ExposureLevel[] = ["High", "Medium", "Low"];

export default function OrgExposurePage() {
  const router = useRouter();
  const [lv, setLv] = useState<"all" | ExposureLevel>("all");
  const ex = orgExposure(ORG_ID, "organisation");
  const rows = ex.filter((e) => lv === "all" || e.lv === lv);

  return (
    <AppShell workspace="organisation">
      <ComplianceHead active="/organisation/exposure" />
      <div className="card p0">
        <div className="tbl-sub">
          <div className="pills">
            <button className={`pill ${lv === "all" ? "on" : ""}`} onClick={() => setLv("all")} data-test="ex-all">All<span className="count">{ex.length}</span></button>
            {LEVELS.map((l) => (
              <button key={l} className={`pill ${lv === l ? "on" : ""}`} onClick={() => setLv(l)} data-test={`ex-${l}`}>{l}<span className="count">{ex.filter((e) => e.lv === l).length}</span></button>
            ))}
          </div>
        </div>
        <div className="list">
          {rows.length ? (
            rows.map((e, i) => (
              <button key={i} className="list-row" onClick={() => router.push(e.go)}>
                <Chip tone={LV_TONE[e.lv]}>{e.lv}</Chip>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="strong small" style={{ display: "block" }}>{e.t}</span>
                  <span className="cap muted">{e.why}</span>
                </span>
                <Icon name="caret-right" />
              </button>
            ))
          ) : (
            <div className="col" style={{ alignItems: "center", padding: "16px 20px" }}>
              <Tile icon="shield-check" size="lg" />
              <div className="h4">Nothing here</div>
            </div>
          )}
        </div>
        <div className="tbl-foot">High: likely to draw action now. Medium: will if left. Low: worth watching.</div>
      </div>
    </AppShell>
  );
}
