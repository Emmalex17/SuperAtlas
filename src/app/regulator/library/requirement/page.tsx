"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Chip, Tile, Tag, Kv } from "@/components/ui";
import { SuggestQuestionsDialog } from "@/components/SuggestQuestions";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { PARTS, choiceLabel, findReq, regReqs, orgsCovered, addSuggestedQuestions, SCHEMES } from "@/lib/cases";
import type { IconName } from "@/lib/icons";

const REG_STATUS_TONE: Record<string, "ok" | "warn" | "neu"> = { Published: "ok", Draft: "neu" };

export default function RequirementPage() {
  const router = useRouter();
  const toast = useToast();
  const [ref, setRef] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
    setRef(r);
    setReady(true);
  }, []);

  if (!ready) return null;

  const f = (ref ? findReq(ref) : null) ?? findReq("ISR-4.1");
  if (!f) return null;
  const { reg, sec, q } = f;
  const all = regReqs(reg);
  const i = all.indexOf(q);
  const prev = all[i - 1];
  const next = all[i + 1];
  const applies = reg.applies;
  const defaultScheme = SCHEMES.find((s) => s.def) ?? SCHEMES[0];

  return (
    <AppShell
      workspace="regulator"
      crumbs={[{ label: "Requirements library", href: "/regulator/library" }, { label: reg.ref, href: `/regulator/library/${reg.id}` }, { label: q.ref }]}
    >
      <div className="ph">
        <div className="grow">
          <div className="overline">
            <button type="button" className="link-btn" onClick={() => router.push(`/regulator/library/${reg.id}`)}>{reg.name}</button> · {sec.name}
          </div>
          <h1 className="h1" style={{ marginTop: 4 }}><span className="mono ref-lg">{q.ref}</span> {q.t}</h1>
        </div>
        <div className="row wrap">
          <Button variant="outline" size="sm" icon="caret-left" disabled={!prev} onClick={() => prev && router.push(`/regulator/library/requirement?ref=${encodeURIComponent(prev.ref)}`)}>Previous</Button>
          <Button variant="outline" size="sm" iconRight="caret-right" disabled={!next} onClick={() => next && router.push(`/regulator/library/requirement?ref=${encodeURIComponent(next.ref)}`)}>Next</Button>
          <Button icon="pencil-simple" testId="req-edit" onClick={() => router.push(`/regulator/library/edit?ref=${encodeURIComponent(q.ref)}`)}>Edit requirement</Button>
        </div>
      </div>

      <div className="grid side">
        <div className="col gap16">
          <div className="card col gap8">
            <div className="overline">Requirement</div>
            <p style={{ fontSize: 15, lineHeight: "24px" }}>{q.text}</p>
          </div>
          <div className="card col gap12">
            <div className="row">
              <span className="h4 grow">Questions asked</span>
              <span className="cap muted">{q.questions.length} question{q.questions.length === 1 ? "" : "s"}</span>
            </div>
            {q.questions.length ? (
              q.questions.map((qq, n) => (
                <div className="q-line" key={n}>
                  <span className="q-n">{n + 1}</span>
                  <span className="grow">{qq.q}</span>
                  <span className="qp">
                    {qq.choice ? <span className="qp-c">{choiceLabel(qq.choice)}</span> : null}
                    {PARTS.filter(([k]) => qq[k as keyof typeof qq]).map(([k, l, ic]) => (
                      <span className="qp-p" key={k}><Icon name={ic as IconName} />{l}</span>
                    ))}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted small">No questions yet.</p>
            )}
            <div><Button variant="tertiary" size="sm" icon="sparkle" testId="req-suggest" onClick={() => setSuggestOpen(true)}>Suggest questions with AI</Button></div>
            <p className="cap muted">Organisations answer every question, then the assessor records an outcome using the programme&apos;s scoring scheme.</p>
          </div>
          <div className="card col gap12">
            <div className="h4">Evidence required</div>
            {(q.evidence ?? []).length ? (
              (q.evidence ?? []).map((e) => (
                <div className="ev-line" key={e}>
                  <Tile icon="paperclip" size="sm" />
                  <span className="grow">{e}</span>
                  <Chip tone="info">Required</Chip>
                </div>
              ))
            ) : (
              <p className="muted small">No evidence required.</p>
            )}
          </div>
          <div className="card col gap8">
            <div className="h4">Guidance for organisations</div>
            <p className="muted">{q.guidance || "No guidance added yet."}</p>
          </div>
        </div>
        <aside className="col gap16">
          <div className="card col gap12">
            <div className="h4">Details</div>
            <Kv
              pairs={[
                ["Reference", <span className="mono" key="ref">{q.ref}</span>],
                ["Regulation", <button type="button" key="reg" className="link-btn" onClick={() => router.push(`/regulator/library/${reg.id}`)}>{reg.ref} {reg.version}</button>],
                ["Section", sec.name],
                ["Weight", q.weight || "Normal (2)"],
                ["Scoring scheme", defaultScheme.name],
                ["Status", <Chip tone={REG_STATUS_TONE[reg.status] ?? "neu"} key="st">{reg.status}</Chip>],
              ]}
            />
          </div>
          <div className="card col gap8">
            <div className="h4">Applies to</div>
            <div className="row wrap gap6">{applies.map((a) => <Tag key={a}>{a}</Tag>)}</div>
            <p className="cap muted">{orgsCovered({ applies })} organisations in these categories.</p>
          </div>
        </aside>
      </div>

      <SuggestQuestionsDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        req={q}
        onAdd={(list) => {
          addSuggestedQuestions(q.ref, list);
          bump();
          toast(`${list.length} question${list.length > 1 ? "s" : ""} added to ${q.ref}`, "ok", "sparkle");
        }}
      />
    </AppShell>
  );
}
