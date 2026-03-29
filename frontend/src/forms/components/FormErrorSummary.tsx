"use client";

interface FormErrorSummaryProps {
  generalMessage?: string | null;
  fieldMessages?: string[];
  className?: string;
}

export default function FormErrorSummary({
  generalMessage,
  fieldMessages = [],
  className = "",
}: FormErrorSummaryProps) {
  const uniqueFieldMessages = Array.from(
    new Set(fieldMessages.map((message) => message.trim()).filter(Boolean)),
  );

  if (!generalMessage && uniqueFieldMessages.length === 0) {
    return null;
  }

  return (
    <div
      className={`app-inline-error ${className}`.trim()}
      role="alert"
      aria-live="assertive"
    >
      {generalMessage ? <p>{generalMessage}</p> : null}
      {uniqueFieldMessages.length > 0 ? (
        <ul className="mt-1 list-disc pl-5">
          {uniqueFieldMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
