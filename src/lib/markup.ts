import icons from "./icons.json";

const ICONS = icons as Record<string, string>;

export function ic(name: string, cls = ""): string {
  const path = ICONS[name] ?? ICONS["question"];
  return `<span class="ic ${cls}" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor">${path}</svg></span>`;
}

export function tile(icon: string, tone = "", size = ""): string {
  return `<span class="tile ${tone} ${size}">${ic(icon)}</span>`;
}

export function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

type BtnOpts = {
  v?: "primary" | "secondary" | "outline" | "tertiary" | "danger" | "authority" | "gold" | "ghost-light" | "white";
  size?: "sm" | "lg";
  href?: string;
  i?: string;
  ir?: string;
  testId?: string;
  block?: boolean;
};

export function btnA(label: string, o: BtnOpts = {}): string {
  const v = o.v || "primary";
  const cls = ["btn", "btn-" + v, o.size ? "btn-" + o.size : "", o.block ? "btn-block" : ""].join(" ");
  const testAttr = o.testId ? ` data-test="${o.testId}"` : "";
  return `<a href="${o.href || "#"}" class="${cls}"${testAttr}>${o.i ? ic(o.i) : ""}${label ? `<span>${esc(label)}</span>` : ""}${o.ir ? ic(o.ir) : ""}</a>`;
}
