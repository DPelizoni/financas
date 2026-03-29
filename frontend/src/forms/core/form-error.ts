import { RefObject } from "react";

export type FormFieldErrors<TField extends string> = Partial<
  Record<TField, string>
>;

interface ApiErrorItem {
  field?: string;
  message?: string;
}

interface ApiErrorPayload {
  message?: string;
  errors?: ApiErrorItem[];
}

interface ApiLikeError {
  response?: {
    data?: ApiErrorPayload;
  };
}

export interface NormalizedApiFormError<TField extends string> {
  fieldErrors: FormFieldErrors<TField>;
  generalMessage: string;
}

export const hasFormFieldErrors = <TField extends string>(
  fieldErrors: FormFieldErrors<TField>,
): boolean => {
  return Object.values(fieldErrors).some(
    (message) => typeof message === "string" && message.trim().length > 0,
  );
};

const sanitizeMessage = (message: unknown): string | null => {
  if (typeof message !== "string") return null;
  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeApiFormError = <TField extends string>(
  error: unknown,
  fallbackMessage: string,
): NormalizedApiFormError<TField> => {
  const apiError = error as ApiLikeError;
  const payload = apiError?.response?.data;

  const fieldErrors: FormFieldErrors<TField> = {};
  const rawErrors = Array.isArray(payload?.errors) ? payload.errors : [];

  rawErrors.forEach((item) => {
    const field = sanitizeMessage(item?.field);
    const message = sanitizeMessage(item?.message);
    if (!field || !message) return;
    fieldErrors[field as TField] = message;
  });

  const generalMessage =
    sanitizeMessage(payload?.message) ?? sanitizeMessage((error as any)?.message) ?? fallbackMessage;

  return {
    fieldErrors,
    generalMessage,
  };
};

export const focusFirstInvalidField = <TField extends string>(
  formRef: RefObject<HTMLFormElement | null>,
  fieldErrors: FormFieldErrors<TField>,
  fieldOrder?: readonly TField[],
): void => {
  const formElement = formRef.current;
  if (!formElement) return;

  const errorFieldNames = (
    fieldOrder ??
    (Object.keys(fieldErrors) as TField[])
  ).filter((field) => {
    const message = fieldErrors[field];
    return typeof message === "string" && message.trim().length > 0;
  });

  for (const fieldName of errorFieldNames) {
    const selector = `[name="${fieldName}"], #${fieldName}`;
    const fieldElement = formElement.querySelector<HTMLElement>(selector);

    if (!fieldElement) continue;
    if ("disabled" in fieldElement && (fieldElement as any).disabled) continue;

    fieldElement.focus();
    return;
  }
};
