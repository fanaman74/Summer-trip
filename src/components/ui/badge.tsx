import { cn } from "@/lib/utils";

const tones = {
  sea: "bg-[var(--sea-100)] text-[var(--sea-800)]",
  sand: "bg-[var(--sand-200)] text-[var(--sand-900)]",
  coral: "bg-[var(--coral-100)] text-[var(--coral-800)]",
  leaf: "bg-[var(--leaf-100)] text-[var(--leaf-800)]",
} as const;

export function Badge({
  tone = "sand",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
