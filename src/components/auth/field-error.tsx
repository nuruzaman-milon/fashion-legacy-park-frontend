import { cn } from "@/lib/utils";

export function FieldError({
  messages,
  className,
}: {
  messages?: string[];
  className?: string;
}) {
  if (!messages?.length) return null;
  if (messages.length === 1) {
    return (
      <p className={cn("text-xs text-destructive", className)}>{messages[0]}</p>
    );
  }
  return (
    <ul
      className={cn(
        "list-inside list-disc space-y-0.5 text-xs text-destructive",
        className,
      )}
    >
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}
