export const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export function pwRules(pw: string) {
  const r: [boolean, string][] = [
    [pw.length >= 12, "At least 12 characters"],
    [/[A-Z]/.test(pw) && /[a-z]/.test(pw), "Upper and lower case"],
    [/\d/.test(pw), "A number"],
    [/[^A-Za-z0-9]/.test(pw), "A symbol"],
  ];
  const n = r.filter((x) => x[0]).length;
  return { ok: n === 4, n, rules: r };
}

/** Deterministic pseudo-random QR-code-shaped SVG, matching the prototype's placeholder generator. */
export function qrSvgPaths(): string {
  let s = "";
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < 25; y++) {
    for (let x = 0; x < 25; x++) {
      const finder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
      if (finder) continue;
      if (rnd() > 0.52) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const f = (x: number, y: number) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return s + f(0, 0) + f(18, 0) + f(0, 18);
}

export const RECOVERY_CODES = ["7KQ2-M9XD", "P4TR-8WNA", "H3VB-2LCE", "Q9ZF-6YKS", "D8MJ-4RPU", "N2XW-7GHT", "B6CL-3QVE", "W5KA-9DMR", "T7YP-1FSN", "J4EG-8BUL"];
