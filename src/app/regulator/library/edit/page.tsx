"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button, Field } from "@/components/ui";
import { SuggestQuestionsDialog } from "@/components/SuggestQuestions";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { allCategoryTypes } from "@/lib/mockData";
import {
  REGS,
  CHOICES,
  PARTS,
  findReq,
  regReqs,
  nextRequirementRef,
  createRequirement,
  updateRequirement,
  SCHEMES,
  type NormQuestion,
  type Regulation,
  type RegSection,
} from "@/lib/cases";

const WEIGHTS = ["Low (1)", "Normal (2)", "High (3)"];

function blankQuestion(): NormQuestion {
  return { q: "", choice: "yn", comment: true, evidence: true, interview: false };
}

export default function EditRequirementPage() {
  const router = useRouter();
  const toast = useToast();
  const [params, setParams] = useState<{ ref: string | null; reg: string | null; sec: string | null } | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const [ref, setRef] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [guidance, setGuidance] = useState("");
  const [weight, setWeight] = useState("Normal (2)");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [questions, setQuestions] = useState<NormQuestion[]>([]);
  const [applies, setApplies] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser-only URL query string, which cannot be observed during SSR.
    setParams({ ref: sp.get("ref"), reg: sp.get("reg"), sec: sp.get("sec") });
  }, []);

  const isNew = !!params && (!params.ref || !findReq(params.ref));
  const found = params?.ref ? findReq(params.ref) : null;
  const newReg: Regulation = (params?.reg && REGS.find((x) => x.id === params.reg)) || REGS[0];
  const newSec: RegSection = (params?.sec && newReg.sections.find((s) => s.id === params.sec)) || newReg.sections[newReg.sections.length - 1];
  const reg = found?.reg ?? newReg;
  const sec = found?.sec ?? newSec;
  const key = isNew ? "__new" : (found?.q.ref ?? "");

  useEffect(() => {
    if (!params || loaded) return;
    if (found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load of the requirement being edited into local draft state.
      setRef(found.q.ref);
      setTitle(found.q.t);
      setText(found.q.text);
      setGuidance(found.q.guidance ?? "");
      setWeight(found.q.weight || "Normal (2)");
      setEvidence(found.q.evidence?.length ? found.q.evidence.slice() : [""]);
      setQuestions(found.q.questions.length ? found.q.questions.map((q) => ({ ...q })) : [blankQuestion()]);
      setApplies(found.reg.applies.slice());
    } else {
      const r = newReg;
      const s = newSec;
      setRef(nextRequirementRef(r, s));
      setTitle("");
      setText("");
      setGuidance("");
      setWeight("Normal (2)");
      setEvidence([""]);
      setQuestions([blankQuestion()]);
      setApplies(r.applies.slice());
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, loaded]);

  if (!params || !loaded) return null;

  function updateQuestion(i: number, patch: Partial<NormQuestion>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateEvidence(i: number, v: string) {
    setEvidence((prev) => prev.map((e, idx) => (idx === i ? v : e)));
  }
  function removeEvidence(i: number) {
    setEvidence((prev) => prev.filter((_, idx) => idx !== i));
  }

  function cancel() {
    if (!isNew && found) router.push(`/regulator/library/requirement?ref=${encodeURIComponent(found.q.ref)}`);
    else router.push(`/regulator/library/${reg.id}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !text) {
      toast("Add a title and the requirement text", "bad");
      return;
    }
    const data = {
      ref,
      t: title,
      text,
      guidance,
      weight,
      evidence: evidence.filter(Boolean),
      questions: questions.filter((q) => q.q),
      applies,
    };
    if (isNew) createRequirement(reg.id, sec.id, data);
    else updateRequirement(key, data);
    toast(`${ref} saved`);
    router.push(`/regulator/library/requirement?ref=${encodeURIComponent(ref)}`);
  }

  const defaultScheme = SCHEMES.find((s) => s.def) ?? SCHEMES[0];
  const all = regReqs(reg);

  return (
    <AppShell
      workspace="regulator"
      crumbs={[
        { label: "Requirements library", href: "/regulator/library" },
        { label: reg.ref, href: `/regulator/library/${reg.id}` },
        { label: isNew ? "New requirement" : ref },
      ]}
    >
      <div className="ph">
        <div className="grow">
          <div className="overline">{reg.name} · {sec.name}</div>
          <h1 className="h1" style={{ marginTop: 4 }}>
            {isNew ? "New requirement" : <><span className="mono ref-lg">{ref}</span> {title}</>}
          </h1>
        </div>
      </div>

      <form className="grid side" onSubmit={submit} noValidate>
        <div className="col gap16">
          <div className="card col gap16">
            <div className="grid g2" style={{ gap: 16, gridTemplateColumns: "160px minmax(0,1fr)" }}>
              <Field label="Reference" htmlFor="rq-ref">
                <input className="inp" id="rq-ref" value={ref} onChange={(e) => setRef(e.target.value)} />
              </Field>
              <Field label="Title" htmlFor="rq-t">
                <input className="inp" id="rq-t" placeholder="Short, plain title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
            </div>
            <Field label="Requirement text" htmlFor="rq-text">
              <textarea className="ta" id="rq-text" rows={3} placeholder="What the organisation must do" value={text} onChange={(e) => setText(e.target.value)} />
            </Field>
            <Field label="Guidance for organisations" htmlFor="rq-g" hint="Shown beside the requirement when organisations answer.">
              <textarea className="ta" id="rq-g" rows={2} placeholder="How to answer and what good evidence looks like" value={guidance} onChange={(e) => setGuidance(e.target.value)} />
            </Field>
          </div>

          <div className="card col gap12">
            <div className="row between wrap">
              <div className="h4">Questions asked</div>
              <div className="row gap4 wrap">
                <Button variant="tertiary" size="sm" icon="sparkle" testId="ed-suggest" type="button" onClick={() => setSuggestOpen(true)}>Suggest with AI</Button>
                <Button variant="tertiary" size="sm" icon="plus" type="button" onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}>Add question</Button>
              </div>
            </div>
            {questions.length ? (
              questions.map((q, i) => (
                <div className="q-edit" key={i}>
                  <div className="row">
                    <span className="q-n">{i + 1}</span>
                    <input className="inp grow" value={q.q} placeholder="Question text" onChange={(e) => updateQuestion(i, { q: e.target.value })} />
                    <button type="button" className="icon-btn" aria-label="Remove question" title="Remove" onClick={() => removeQuestion(i)}><Icon name="trash" /></button>
                  </div>
                  <div className="q-parts">
                    <span className="cap muted">Answer parts</span>
                    <select className="sel" style={{ width: 220, height: 32 }} value={q.choice} onChange={(e) => updateQuestion(i, { choice: e.target.value as NormQuestion["choice"] })}>
                      {CHOICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    {PARTS.map(([k, l, ico]) => (
                      <label className="part-tog" key={k}>
                        <input type="checkbox" checked={!!q[k as keyof NormQuestion]} onChange={(e) => updateQuestion(i, { [k]: e.target.checked } as Partial<NormQuestion>)} />
                        <Icon name={ico} />{l}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="small muted">No questions yet.</p>
            )}
          </div>

          <div className="card col gap12">
            <div className="row between">
              <div className="h4">Evidence required</div>
              <Button variant="tertiary" size="sm" icon="plus" type="button" onClick={() => setEvidence((prev) => [...prev, ""])}>Add item</Button>
            </div>
            {evidence.map((e, i) => (
              <div className="row" key={i}>
                <Icon name="paperclip" />
                <input className="inp" value={e} placeholder="e.g. Signed policy document" onChange={(ev) => updateEvidence(i, ev.target.value)} />
                <button type="button" className="icon-btn" aria-label="Remove" title="Remove" onClick={() => removeEvidence(i)}><Icon name="trash" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="col gap16">
          <div className="card col gap12">
            <div className="h4">Applies to</div>
            <div className="col gap8" style={{ maxHeight: 260, overflow: "auto" }}>
              {allCategoryTypes().map((t) => (
                <label className="check" key={t.id}>
                  <input
                    type="checkbox"
                    checked={applies.includes(t.name)}
                    onChange={(e) => setApplies((prev) => (e.target.checked ? [...prev, t.name] : prev.filter((x) => x !== t.name)))}
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="card col gap16">
            <Field label="Weight" htmlFor="rq-w">
              <select className="sel" id="rq-w" value={weight} onChange={(e) => setWeight(e.target.value)}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Scoring scheme" hint="Set by each programme. Default shown.">
              <input className="inp" value={defaultScheme.name} readOnly />
            </Field>
          </div>
          <div className="row end">
            <Button variant="outline" type="button" onClick={cancel}>Cancel</Button>
            <Button type="submit" testId="req-save">{isNew ? "Add requirement" : "Save changes"}</Button>
          </div>
        </div>
      </form>

      <SuggestQuestionsDialog
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        req={{ ref: ref || (all[0]?.ref ?? ""), t: title || "this requirement" }}
        onAdd={(list) => {
          setQuestions((prev) => prev.filter((x) => x.q).concat(list));
          toast(`${list.length} question${list.length > 1 ? "s" : ""} added. Edit them before saving.`, "ok", "sparkle");
        }}
      />
    </AppShell>
  );
}
