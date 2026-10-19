import { Tile } from "@/components/ui";
import type { IconName } from "@/lib/icons";

export function ComingSoon({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div className="placeholder-page">
      <Tile icon={icon} tone="neu" size="lg" />
      <div className="h3">{title}</div>
      <p className="muted small" style={{ maxWidth: "44ch" }}>{body}</p>
    </div>
  );
}
