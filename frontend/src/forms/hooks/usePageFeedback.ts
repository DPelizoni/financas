"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PageFeedbackMessage {
  type: "success" | "error";
  message: string;
}

export const usePageFeedback = (autoHideMs = 4000) => {
  const [feedback, setFeedback] = useState<PageFeedbackMessage | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearFeedback = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setFeedback(null);
  }, []);

  const showFeedback = useCallback(
    (
      type: PageFeedbackMessage["type"],
      message: string,
      durationMs: number = autoHideMs,
    ) => {
      clearFeedback();
      setFeedback({ type, message });

      if (durationMs > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setFeedback(null);
          timeoutRef.current = null;
        }, durationMs);
      }
    },
    [autoHideMs, clearFeedback],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    feedback,
    setFeedback,
    showFeedback,
    clearFeedback,
  };
};
