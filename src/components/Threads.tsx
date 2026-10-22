"use client";

import { useState } from "react";
import { Button, Tile, Chip } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { caseQs, type Case } from "@/lib/cases";

/** Information-request threads between the firm and the organisation on a single answer —
 * shared by firm/assess's "Information requests" tab and org/assessment's "Requests from
 * assessor" tab, the prototype's threadsView(). */
export function ThreadsPanel({
  c,
  side,
  onReply,
}: {
  c: Case;
  side: "firm" | "org";
  onReply?: (threadIndex: number, text: string, file?: string) => void;
}) {
  const qs = caseQs(c);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [files, setFiles] = useState<Record<number, string>>({});

  if (!c.threads.length) {
    return (
      <div className="card">
        <div className="col" style={{ alignItems: "center", textAlign: "center", padding: "40px 16px", gap: 10 }}>
          <Tile icon="chat-circle-dots" size="lg" />
          <div className="h4">No information requests</div>
          <p className="muted small">{side === "firm" ? "Use Ask on any answer to request more information." : "Your assessor has not asked for anything."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="col gap12">
      {c.threads.map((t, i) => {
        const q = qs.find((x) => x.id === t.qid) ?? { text: "—", ref: "" };
        return (
          <div className="card col gap12" key={i}>
            <div className="row top">
              <div className="grow">
                <div className="cap mono muted">{q.ref}</div>
                <div className="strong">{q.text}</div>
              </div>
              <Chip tone={t.status === "Open" ? "warn" : "ok"}>{t.status === "Open" ? (side === "org" ? "Reply needed" : "Waiting for reply") : "Answered"}</Chip>
            </div>
            <div className="thread">
              {t.msgs.map((m, mi) => (
                <div className={`msg ${m.side}`} key={mi}>
                  <div className="msg-b">
                    <div className="cap"><b>{m.by}</b> · {m.when}</div>
                    <p className="small">{m.text}</p>
                    {m.file ? <span className="ev-pill"><Icon name="paperclip" />{m.file}</span> : null}
                  </div>
                </div>
              ))}
            </div>
            {t.status === "Open" && side === "org" ? (
              <div className="col gap8">
                <textarea className="ta" rows={2} placeholder="Your reply" value={drafts[i] ?? ""} onChange={(e) => setDrafts((prev) => ({ ...prev, [i]: e.target.value }))} />
                <div className="row between">
                  <Button variant="tertiary" size="sm" icon="paperclip" onClick={() => setFiles((prev) => ({ ...prev, [i]: "MFA exceptions register.xlsx" }))}>Attach a file</Button>
                  <Button
                    size="sm"
                    testId="th-reply"
                    onClick={() => {
                      const text = drafts[i];
                      if (!text) return;
                      onReply?.(i, text, files[i]);
                      setDrafts((prev) => ({ ...prev, [i]: "" }));
                      setFiles((prev) => ({ ...prev, [i]: "" }));
                    }}
                  >
                    Send reply
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
