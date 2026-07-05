import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-full border border-[var(--sand-300)] bg-white/85 px-4 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)] focus:border-[var(--sea-500)]",
        className,
      )}
      {...props}
    />
  );
}
