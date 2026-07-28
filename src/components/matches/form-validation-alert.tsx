import { AlertCircle } from "lucide-react";

type FormValidationAlertProps = {
  id?: string;
  /** Callers should pass a translated title (e.g. from matches.form / scoreSegments). */
  title: string;
  messages: string[];
};

export function FormValidationAlert({
  id,
  title,
  messages,
}: FormValidationAlertProps) {
  if (messages.length === 0) return null;

  const unique = [...new Set(messages)];

  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive"
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {unique.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
