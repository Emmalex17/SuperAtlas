import icons from "./icons.json";

export type IconName = keyof typeof icons;

export function Icon({ name, className = "" }: { name: IconName | string; className?: string }) {
  const path = (icons as Record<string, string>)[name] ?? icons["question"];
  return (
    <span className={`ic ${className}`} aria-hidden="true">
      <svg viewBox="0 0 256 256" fill="currentColor" dangerouslySetInnerHTML={{ __html: path }} />
    </span>
  );
}
