import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/45 bg-white/78 shadow-[0_24px_80px_rgba(12,61,92,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
