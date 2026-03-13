"use client";

import { Alert, Snackbar } from "@mui/material";
import { SyntheticEvent } from "react";

interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

interface FeedbackAlertProps {
  feedback: FeedbackMessage | null;
  onClose: () => void;
  className?: string;
}

export default function FeedbackAlert({
  feedback,
  onClose,
  className = "mb-6",
}: FeedbackAlertProps) {
  if (!feedback) return null;

  const handleClose = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    onClose();
  };

  return (
    <Snackbar
      className={className}
      open
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={feedback.type === "success" ? "success" : "error"}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {feedback.message}
      </Alert>
    </Snackbar>
  );
}
