"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Icon, type IconName } from "@/lib/icons";
import { useOpenTasks } from "@/components/AppShell";
import { fmtD, TODAY } from "@/lib/cases";
import { dueText } from "@/lib/tasks";

type HeroEntity = { name: string; initials: string; color: string };
type HeroItem = { icon: string; title: string; due?: string; href: string };

const plural = (n: number, one: string) => (n === 1 ? one : `${one}s`);

/** The greeting hero at the top of every "My dashboard" — what needs attention today, then quick
 * actions — the prototype's myHero(). `top` is the caller's pre-picked "needs your attention" list
 * (at most 3): orgTodo() for the organisation workspace, or the first 3 non-empty myTasks() groups
 * (by their own .say(count) wording) for the regulator and firm workspaces. */
export function MyHero({ entity, firstName, line, top, totalTasks, actions }: { entity?: HeroEntity; firstName: string; line: string; top: HeroItem[]; totalTasks: number; actions?: React.ReactNode }) {
  const router = useRouter();
  const openTasks = useOpenTasks();
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <section className="my-hero" data-test="my-hero">
      {entity ? (
        <div className="mh-logo">
          <span className="logo s48" style={{ background: entity.color }}>{entity.initials}</span>
        </div>
      ) : null}
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="overline" style={{ color: "var(--brand-200)" }}>{entity ? `${entity.name} · ${fmtD(TODAY)}` : fmtD(TODAY)}</div>
        <h1 className="serif">{greeting}, {firstName}</h1>
        {line ? <p className="mh-line">{line}</p> : null}
        {top.length ? (
          <>
            <div className="mh-h">Needs your attention</div>
            <ul className="mh-list">
              {top.map((x, i) => {
                const due = dueText(x.due);
                return (
                  <li key={i}>
                    <button type="button" data-test={`ht-${i}`} onClick={() => router.push(x.href)}>
                      <Icon name={x.icon as IconName} />
                      <span className="grow">{x.title}</span>
                      {due ? <span className="mh-due">{due.text}</span> : null}
                      <Icon name="arrow-right" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="mh-line">Nothing is waiting for you right now.</p>
        )}
        <div className="mh-acts">
          {totalTasks ? (
            <Button variant="ghost-light" size="sm" icon="check-square-offset" onClick={openTasks} testId="hero-tasks">
              See all {totalTasks} {plural(totalTasks, "task")}
            </Button>
          ) : null}
          {actions}
        </div>
      </div>
    </section>
  );
}

export function HeroButton({ label, icon, href, onClick, testId }: { label: string; icon: IconName; href?: string; onClick?: () => void; testId?: string }) {
  if (href) {
    return (
      <Link href={href} className="btn btn-ghost-light btn-sm" data-test={testId}>
        <Icon name={icon} />
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <Button variant="ghost-light" size="sm" icon={icon} onClick={onClick} testId={testId}>
      {label}
    </Button>
  );
}
