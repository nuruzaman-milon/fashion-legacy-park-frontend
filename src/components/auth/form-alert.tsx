import { cn } from "@/lib/utils";

const tones = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700",
  info: "border-[oklch(0.75_0.09_75/0.4)] bg-[oklch(0.88_0.06_80/0.25)] text-foreground",
} as const;

export function FormAlert({
  tone = "error",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
