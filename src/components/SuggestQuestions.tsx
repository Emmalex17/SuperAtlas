"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/Overlay";
import { Button } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { suggestQs, type NormQuestion } from "@/lib/cases";

/** The "Suggested questions" dialog — AI drafts questions for a requirement, never answers; the
 * user keeps, edits (by unchecking and retyping isn't supported here, matching the prototype's
 * own keep/drop-only review) or drops each one before anything is added. The prototype's
 * openSuggest() (qmodel.js), shared by library/requirement's "Suggest questions with AI" and
 * library/edit's "Suggest with AI". */
export function SuggestQuestionsDialog({
  open,
  onClose,
  req,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  req: { ref: string; t: string } | null;
  onAdd: (list: NormQuestion[]) => void;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const list = req ? suggestQs(req) : [];

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the checklist to "all checked" each time the dialog opens for a (possibly different) requirement.
      setChecked(Object.fromEntries(list.map((_, i) => [i, true])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `list` is derived from `req` each render; keying on `req` alone avoids re-running every render.
  }, [open, req]);

  function submit() {
    const picked = list.filter((_, i) => checked[i]);
    onClose();
    setChecked({});
    if (picked.length) onAdd(picked);
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); setChecked({}); }} wide>
      <div className="row"><Icon name="sparkle" /><h2 className="h3">Suggested questions</h2></div>
      <p className="muted small">Drafted from {req?.ref}. Keep, edit or drop each one; nothing is added until you choose.</p>
      <div className="col gap8">
        {list.map((q, i) => (
          <label className="sug-row" key={i}>
            <input type="checkbox" checked={!!checked[i]} onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))} />
            <span className="grow">
              <span className="strong" style={{ display: "block" }}>{q.q}</span>
              <span className="qp">
                {q.choice ? <span className="qp-c">{q.choice === "yn" ? "Yes / No / Not applicable" : q.choice === "text" ? "Text" : q.choice === "number" ? "Number" : "Date"}</span> : null}
                {q.comment ? <span className="qp-p"><Icon name="chat-text" />Comment</span> : null}
                {q.evidence ? <span className="qp-p"><Icon name="paperclip" />Evidence</span> : null}
                {q.interview ? <span className="qp-p"><Icon name="video-camera" />Interview</span> : null}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="cap muted"><Icon name="info" /> AI drafts questions only. It never suggests answers for organisations.</p>
      <div className="row end">
        <Button variant="outline" onClick={() => { onClose(); setChecked({}); }}>Cancel</Button>
        <Button icon="plus" onClick={submit}>Add selected</Button>
      </div>
    </Dialog>
  );
}
