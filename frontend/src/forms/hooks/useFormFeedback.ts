"use client";

import { useMemo, useState } from "react";
import { FormFieldErrors, hasFormFieldErrors } from "@/forms/core/form-error";

const buildInitialBooleanRecord = <TField extends string>(
  fields: readonly TField[],
): Record<TField, boolean> => {
  return fields.reduce(
    (acc, field) => {
      acc[field] = false;
      return acc;
    },
    {} as Record<TField, boolean>,
  );
};

const buildInitialErrorRecord = <TField extends string>(
  fields: readonly TField[],
): Record<TField, string> => {
  return fields.reduce(
    (acc, field) => {
      acc[field] = "";
      return acc;
    },
    {} as Record<TField, string>,
  );
};

export const useFormFeedback = <TField extends string>(
  fields: readonly TField[],
) => {
  const initialTouched = useMemo(() => buildInitialBooleanRecord(fields), [fields]);
  const initialFieldErrors = useMemo(() => buildInitialErrorRecord(fields), [fields]);

  const [touched, setTouched] = useState<Record<TField, boolean>>(initialTouched);
  const [fieldErrors, setFieldErrorsState] =
    useState<Record<TField, string>>(initialFieldErrors);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldErrors = (nextErrors: FormFieldErrors<TField>) => {
    const normalized = { ...initialFieldErrors };
    fields.forEach((field) => {
      const rawMessage = nextErrors[field];
      normalized[field] =
        typeof rawMessage === "string" ? rawMessage.trim() : "";
    });
    setFieldErrorsState(normalized);
  };

  const setFieldError = (field: TField, message: string) => {
    setFieldErrorsState((prev) => ({
      ...prev,
      [field]: message.trim(),
    }));
  };

  const clearFieldError = (field: TField) => {
    setFieldErrorsState((prev) => {
      if (!prev[field]) return prev;
      return {
        ...prev,
        [field]: "",
      };
    });
  };

  const markFieldTouched = (field: TField) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const markAllTouched = () => {
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = true;
      });
      return next;
    });
  };

  const resetTouched = () => {
    setTouched(initialTouched);
  };

  const clearGeneralError = () => {
    setGeneralError(null);
  };

  const clearAllErrors = () => {
    setFieldErrorsState(initialFieldErrors);
    setGeneralError(null);
  };

  const shouldShowError = (field: TField): boolean => {
    return touched[field] && Boolean(fieldErrors[field]);
  };

  const fieldErrorMessages = useMemo(() => {
    return fields
      .map((field) => fieldErrors[field])
      .filter((message): message is string => Boolean(message));
  }, [fields, fieldErrors]);

  const hasFieldErrors = hasFormFieldErrors(fieldErrors);

  return {
    touched,
    fieldErrors,
    generalError,
    isSubmitting,
    fieldErrorMessages,
    hasFieldErrors,
    setGeneralError,
    clearGeneralError,
    setIsSubmitting,
    setFieldErrors,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    markFieldTouched,
    markAllTouched,
    resetTouched,
    shouldShowError,
  };
};
