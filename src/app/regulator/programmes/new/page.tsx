"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Chip, Field, Tile, Kv } from "@/components/ui";
import { SuggestQuestionsDialog } from "@/components/SuggestQuestions";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import {
  REGS,
  PROGRAMMES,
  SCHEMES,
  DEADLINES,
  TODAY,
  regOfProg,
  scopeOrgs,
  qsetQs,
  qsetReqs,
  makeQSet,
  createDraftProgramme,
  saveProgramme,
  launchOrSchedule,
  questionFromNorm,
  QSET_HINTS,
  fmtD,
  type Programme,
  type Question,
  type NormQuestion,
} from "@/lib/cases";
import { ORGANISATIONS, allCategoryTypes, catLabel } from "@/lib/mockData";

const STEPS = ["Basics", "Scope", "Question set", "Scoring and deadlines", "Settings", "Review and launch"];

function Choice({ active, onClick, title, desc, testId }: { active: boolean; onClick: () => void; title: ReactNode; desc: string; testId?: string }) {
  return (
    <button type="button" className={`choice ${active ? "on" : ""}`} data-test={testId} onClick={onClick}>
      <span className="radio" />
      <span className="grow"><b>{title}</b><br /><span className="cap muted">{desc}</span></span>
    </button>
  );
}

export default function ProgrammeWizardPage() {
  const router = useRouter();
  const toast = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Programme | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [step, setStep] = useState(0);
  const [nameErr, setNameErr] = useState("");
  const [activeSecId, setActiveSecId] = useState<string | null>(null);
  const [suggestTarget, setSuggestTarget] = useState<{ secId: string; ref: string; t: string } | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
    setEditId(id);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || draft) return;
    if (editId) {
      const p = PROGRAMMES.find((x) => x.id === editId);
      if (p) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load of the programme being edited (or a fresh draft) into local wizard state.
        setDraft(structuredClone(p));
        setIsNew(false);
        setActiveSecId(p.qset.sections[0]?.id ?? null);
        return;
      }
    }
    const fresh = createDraftProgramme();
    setDraft(fresh);
    setIsNew(true);
    setActiveSecId(fresh.qset.sections[0]?.id ?? null);
  }, [ready, editId, draft]);

  if (!ready || !draft) return null;

  const reg = regOfProg(draft);

  function update(patch: Partial<Programme>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function changeReg(regId: string) {
    const r = REGS.find((x) => x.id === regId);
    if (!r) return;
    update({ reg: regId, ver: r.version, qset: makeQSet(r), types: r.applies.filter((a) => allCategoryTypes().some((t) => t.name === a)).slice(0, 2), edited: 0 });
  }

  function toggleType(name: string, checked: boolean) {
    setDraft((prev) => (prev ? { ...prev, types: checked ? [...prev.types, name] : prev.types.filter((t) => t !== name) } : prev));
  }

  function toggleExclude(orgId: string, excluded: boolean) {
    setDraft((prev) => {
      if (!prev) return prev;
      const ex = prev.exclude ?? [];
      return { ...prev, exclude: excluded ? [...ex, orgId] : ex.filter((x) => x !== orgId) };
    });
  }

  function mutateQSet(mutator: (qset: Programme["qset"]) => void, bumpEdited: boolean) {
    setDraft((prev) => {
      if (!prev) return prev;
      const qset = structuredClone(prev.qset);
      mutator(qset);
      return { ...prev, qset, edited: bumpEdited ? (prev.edited ?? 0) + 1 : prev.edited };
    });
  }

  function toggleSection(secId: string, on: boolean) {
    mutateQSet((qset) => { const s = qset.sections.find((x) => x.id === secId); if (s) s.on = on; }, false);
  }
  function updateQuestion(secId: string, ref: string, qid: string, patch: Partial<Question>) {
    mutateQSet((qset) => {
      const r = qset.sections.find((x) => x.id === secId)?.reqs.find((x) => x.ref === ref);
      const q = r?.questions.find((x) => x.id === qid);
      if (q) Object.assign(q, patch);
    }, true);
  }
  function removeQuestion(secId: string, ref: string, qid: string) {
    mutateQSet((qset) => {
      const r = qset.sections.find((x) => x.id === secId)?.reqs.find((x) => x.ref === ref);
      if (r) r.questions = r.questions.filter((x) => x.id !== qid);
    }, true);
  }
  function addQuestion(secId: string, ref: string) {
    mutateQSet((qset) => {
      const r = qset.sections.find((x) => x.id === secId)?.reqs.find((x) => x.ref === ref);
      if (r) r.questions.push({ id: `${ref}#n${Date.now()}`, text: "New question", hint: "Yes / No / Not applicable" });
    }, true);
  }
  function addSuggested(secId: string, ref: string, list: NormQuestion[]) {
    mutateQSet((qset) => {
      const r = qset.sections.find((x) => x.id === secId)?.reqs.find((x) => x.ref === ref);
      if (r) list.forEach((nq, i) => r.questions.push(questionFromNorm(nq, `${ref}#n${Date.now()}${i}`)));
    }, true);
    toast(`${list.length} question${list.length > 1 ? "s" : ""} added to this programme`, "ok", "sparkle");
  }
  function resetQSet() {
    update({ qset: makeQSet(reg), edited: 0 });
    toast("Question set reset to the library");
  }

  function saveDraft() {
    if (!draft) return;
    const toSave: Programme = { ...draft, name: draft.name || "Untitled programme" };
    saveProgramme(toSave);
    toast("Draft saved");
    router.push("/regulator/programmes");
  }

  function cancel() {
    router.push("/regulator/programmes");
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setNameErr("");
    if (step === 0) {
      if (!draft.name) { setNameErr("Name the programme"); return; }
      if (draft.closes <= draft.opens) { toast("The due date must be after the opening date", "bad"); return; }
    }
    if (step === 1 && !scopeOrgs(draft).length) { toast("Choose at least one organisation in scope", "bad"); return; }
    if (step === 2 && !qsetQs(draft.qset).length) { toast("Keep at least one section with questions", "bad"); return; }
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }
    const future = draft.opens > TODAY;
    launchOrSchedule(draft, TODAY, "M. Bello");
    toast(future ? `Scheduled. Opens ${fmtD(draft.opens)}` : `${draft.name} launched`, "ok", "paper-plane-tilt");
    router.push(`/regulator/programmes/${draft.id}`);
  }

  const allCats = allCategoryTypes();
  const matchingOrgs = ORGANISATIONS.filter((o) => o.status === "Verified" && draft.types.includes(o.type));
  const inScope = scopeOrgs(draft);
  const activeSec = draft.qset.sections.find((s) => s.id === activeSecId) ?? draft.qset.sections[0];
  const future = draft.opens > TODAY;
  const sc = SCHEMES.find((s) => s.id === draft.scheme) ?? SCHEMES[0];

  return (
    <AppShell workspace="regulator" crumbs={[{ label: "Programmes", href: "/regulator/programmes" }, { label: (draft.name || "New programme") }]}>
      <div className="ph">
        <div className="grow">
          <h1 className="h1">{isNew ? "New programme" : "Edit programme"}</h1>
          <p className="muted">{isNew ? "Set up an assessment cycle in six steps. You can save a draft at any point." : draft.name}</p>
        </div>
      </div>

      <div className="stepper">
        {STEPS.map((s, i) => (
          <span key={s} className="row" style={{ gap: 8 }}>
            {i > 0 ? <span className="step-line" /> : null}
            <span className={`step ${i < step ? "done" : i === step ? "on" : ""}`}>
              <span className="n">{i < step ? <Icon name="check" /> : i + 1}</span>
              {s}
            </span>
          </span>
        ))}
      </div>

      <form className="card col gap20" onSubmit={submit} noValidate>
        {step === 0 ? (
          <>
            <div className="grid g2" style={{ gap: 16 }}>
              <Field label="Programme name" htmlFor="pw-name" error={nameErr}>
                <input className="inp" id="pw-name" placeholder="e.g. ISR 2027 annual assessment" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Regulation" htmlFor="pw-reg" hint="Only published regulations can be used.">
                <select className="sel" id="pw-reg" value={draft.reg} onChange={(e) => changeReg(e.target.value)}>
                  {REGS.filter((r) => r.status === "Published").map((r) => <option key={r.id} value={r.id}>{r.ref} {r.version} · {r.name}</option>)}
                </select>
              </Field>
              <Field label="Opens" htmlFor="pw-open">
                <input className="inp" id="pw-open" type="date" value={draft.opens} onChange={(e) => update({ opens: e.target.value })} />
              </Field>
              <Field label="Due" htmlFor="pw-close">
                <input className="inp" id="pw-close" type="date" value={draft.closes} onChange={(e) => update({ closes: e.target.value })} />
              </Field>
            </div>
            <Field label="Description" htmlFor="pw-desc" optional>
              <textarea className="ta" id="pw-desc" rows={2} placeholder="Shown to organisations and firms" value={draft.desc} onChange={(e) => update({ desc: e.target.value })} />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="field">
              <label>Categories in scope</label>
              <div className="grid g3" style={{ gap: 6 }}>
                {allCats.map((t) => (
                  <label className="check" key={t.id}>
                    <input type="checkbox" checked={draft.types.includes(t.name)} onChange={(e) => toggleType(t.name, e.target.checked)} />
                    <span>{t.name} {!reg.applies.includes(t.name) ? <span className="cap muted">· not in this regulation</span> : null}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="card flat tight col gap8">
              <div className="row">
                <b className="grow">{inScope.length} organisation{inScope.length === 1 ? "" : "s"} in scope</b>
                <span className="cap muted">Verified organisations only. Untick any to leave them out.</span>
              </div>
              {matchingOrgs.length ? (
                matchingOrgs.map((o) => (
                  <label className="row small" style={{ gap: 10, padding: "6px 0", borderTop: "1px solid var(--border)" }} key={o.id}>
                    <input type="checkbox" checked={!(draft.exclude ?? []).includes(o.id)} onChange={(e) => toggleExclude(o.id, !e.target.checked)} style={{ accentColor: "var(--brand-500)" }} />
                    <span className="logo s24" style={{ background: o.color }}>{o.initials}</span>
                    <span className="grow">{o.name}</span>
                    <span className="cap muted">{catLabel(o.type, o.tier)}</span>
                  </label>
                ))
              ) : (
                <p className="small muted">No verified organisations in these categories yet.</p>
              )}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="alert info">
              <Tile icon="info" tone="solid info" size="sm" />
              <div className="grow">
                <div className="t">This is the programme&apos;s own copy</div>
                <div className="b">Edit, add or remove questions for this programme only. The library is not changed. The set locks when the programme launches.</div>
              </div>
              <div className="row"><Button variant="tertiary" size="sm" onClick={resetQSet}>Reset to library</Button></div>
            </div>
            <div className="q-layout" style={{ padding: 0 }}>
              <div className="q-secs">
                <div className="overline" style={{ padding: "4px 8px 8px" }}>Sections in scope</div>
                {draft.qset.sections.map((s) => (
                  <div key={s.id} className={`q-sec ${s.id === activeSec?.id ? "on" : ""}`} role="button" tabIndex={0} onClick={() => setActiveSecId(s.id)}>
                    <input type="checkbox" checked={s.on} aria-label={`Include ${s.name}`} style={{ accentColor: "var(--brand-500)" }} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleSection(s.id, e.target.checked)} />
                    <span className={`grow ${s.on ? "" : "muted"}`}>{s.name}</span>
                    <span className="count">{s.reqs.reduce((a, r) => a + r.questions.length, 0)}</span>
                  </div>
                ))}
              </div>
              <div className="col gap12">
                {activeSec && !activeSec.on ? (
                  <div className="note"><Icon name="eye-slash" /><span>This section is out of scope. Tick it on the left to include it.</span></div>
                ) : null}
                {activeSec?.reqs.map((r) => (
                  <div className="card flat tight col gap8" key={r.ref}>
                    <div className="row">
                      <span className="mono ref small" style={{ color: "var(--brand-600)", fontWeight: 600 }}>{r.ref}</span>
                      <b className="grow small">{r.t}</b>
                      <Button variant="tertiary" size="sm" icon="sparkle" type="button" testId={`ps-suggest-${r.ref}`} onClick={() => setSuggestTarget({ secId: activeSec.id, ref: r.ref, t: r.t })}>Suggest with AI</Button>
                      <Button variant="tertiary" size="sm" icon="plus" type="button" onClick={() => addQuestion(activeSec.id, r.ref)}>Add question</Button>
                    </div>
                    {r.questions.length ? (
                      r.questions.map((q, qi) => (
                        <div className="q-edit" key={q.id}>
                          <div className="row">
                            <span className="q-n">{qi + 1}</span>
                            <input className="inp grow" value={q.text} placeholder="Question text" onChange={(e) => updateQuestion(activeSec.id, r.ref, q.id, { text: e.target.value })} />
                            <button type="button" className="icon-btn" aria-label="Remove question" title="Remove" onClick={() => removeQuestion(activeSec.id, r.ref, q.id)}><Icon name="trash" /></button>
                          </div>
                          <div className="q-parts">
                            <span className="cap muted">Answer type</span>
                            <select className="sel" style={{ width: 220, height: 32 }} value={q.hint} onChange={(e) => updateQuestion(activeSec.id, r.ref, q.id, { hint: e.target.value })}>
                              {QSET_HINTS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="small muted">No questions.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="field">
              <label>Scoring scheme</label>
              <div className="grid g2" style={{ gap: 8 }}>
                {SCHEMES.map((s) => (
                  <Choice
                    key={s.id}
                    active={draft.scheme === s.id}
                    onClick={() => update({ scheme: s.id })}
                    title={<>{s.name}{s.def ? <> <Chip tone="brand">Default</Chip></> : null}</>}
                    desc={s.levels.map((l) => l[0]).join(" · ")}
                  />
                ))}
              </div>
            </div>
            <div className="grid g2" style={{ gap: 16 }}>
              <Field label="Reminders before the due date (days)" htmlFor="pw-rem" hint={`Default from Settings: ${DEADLINES.reminders}`}>
                <input className="inp" id="pw-rem" value={String(draft.reminders)} onChange={(e) => update({ reminders: e.target.value })} />
              </Field>
              <Field label="Escalate to the supervisor after" htmlFor="pw-esc">
                <div className="row gap8">
                  <input className="inp" id="pw-esc" type="number" style={{ width: 100 }} value={String(draft.escalate)} onChange={(e) => update({ escalate: e.target.value })} />
                  <span className="muted">days overdue</span>
                </div>
              </Field>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <div className="field">
              <label>Who assigns assurance firms?</label>
              <div className="grid g2" style={{ gap: 8 }}>
                <Choice testId="pw-firmMode-regulator" active={draft.firmMode === "regulator"} onClick={() => update({ firmMode: "regulator" })} title="NITDA assigns" desc="You assign firms to organisations, one by one or in bulk. Independence checks block conflicts." />
                <Choice testId="pw-firmMode-organisation" active={draft.firmMode === "organisation"} onClick={() => update({ firmMode: "organisation" })} title="Organisations engage their own" desc="Each organisation picks an accredited firm. A firm that is not accredited needs your approval." />
              </div>
            </div>
            <div className="field">
              <label>Outcome preview</label>
              <div className="grid g2" style={{ gap: 8 }}>
                <Choice testId="pw-preview-on" active={draft.preview} onClick={() => update({ preview: true })} title="On" desc="Organisations see the firm's outcomes before the report is submitted, and can comment. They cannot change outcomes." />
                <Choice testId="pw-preview-off" active={!draft.preview} onClick={() => update({ preview: false })} title="Off" desc="Organisations see results only when the report is published." />
              </div>
            </div>
            <div className="field">
              <label>Who publishes reports?</label>
              <div className="grid g2" style={{ gap: 8 }}>
                <Choice testId="pw-publisher-regulator" active={draft.publisher === "regulator"} onClick={() => update({ publisher: "regulator" })} title="NITDA publishes" desc="You approve, then publish now or on a date." />
                <Choice testId="pw-publisher-firm" active={draft.publisher === "firm"} onClick={() => update({ publisher: "firm" })} title="Delegated to the firm" desc="The firm may publish reports you have approved. Unapproved reports cannot be published." />
              </div>
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div className="grid g4" style={{ gap: 12 }}>
              {([["buildings", "Organisations", inScope.length], ["list-numbers", "Sections", draft.qset.sections.filter((s) => s.on).length], ["book-open-text", "Requirements", qsetReqs(draft.qset).length], ["question", "Questions", qsetQs(draft.qset).length]] as const).map(([i, l, n]) => (
                <div className="card flat tight row" key={l}>
                  <Tile icon={i} size="sm" />
                  <div><div className="cap muted">{l}</div><b className="tnum" style={{ font: "700 22px var(--serif)" }}>{n}</b></div>
                </div>
              ))}
            </div>
            <Kv
              pairs={[
                ["Programme", draft.name || "—"],
                ["Regulation", `${reg.ref} ${draft.ver} · ${reg.name}`],
                ["Window", `${fmtD(draft.opens)} to ${fmtD(draft.closes)}`],
                ["Categories", draft.types.join(", ")],
                ["Scoring scheme", sc.name],
                ["Reminders", `${String(draft.reminders)} days before; escalate after ${String(draft.escalate)} days`],
                ["Firms", draft.firmMode === "organisation" ? "Organisations engage their own" : "NITDA assigns"],
                ["Outcome preview", draft.preview ? "On" : "Off"],
                ["Publishing", draft.publisher === "firm" ? "Delegated to the firm (approved reports only)" : "NITDA publishes"],
                ["Questions changed for this programme", String(draft.edited || 0)],
              ]}
            />
            <div className="note"><Icon name="lock-simple" /><span>Launching locks the question set for this programme. The library stays as it is. Organisations are emailed on the opening date.</span></div>
          </>
        ) : null}

        <div className="row between">
          {step ? <Button variant="outline" icon="arrow-left" type="button" onClick={back}>Back</Button> : <Button variant="outline" type="button" onClick={cancel}>Cancel</Button>}
          <div className="row gap8">
            <Button variant="tertiary" type="button" testId="pw-draft" onClick={saveDraft}>Save draft</Button>
            {step < 5 ? (
              <Button type="submit" iconRight="arrow-right" testId="pw-next">Continue</Button>
            ) : (
              <Button type="submit" icon={future ? "calendar-check" : "paper-plane-tilt"} testId="pw-launch">{future ? "Schedule programme" : "Launch now"}</Button>
            )}
          </div>
        </div>
      </form>

      <SuggestQuestionsDialog
        open={!!suggestTarget}
        onClose={() => setSuggestTarget(null)}
        req={suggestTarget ? { ref: suggestTarget.ref, t: suggestTarget.t } : null}
        onAdd={(list) => { if (suggestTarget) addSuggested(suggestTarget.secId, suggestTarget.ref, list); setSuggestTarget(null); }}
      />
    </AppShell>
  );
}
