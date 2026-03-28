"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonTone =
  | "primary"
  | "success"
  | "danger"
  | "neutral"
  | "outline"
  | "outline-primary"
  | "outline-success"
  | "outline-danger"
  | "ghost";

type AppButtonSize = "sm" | "md";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: AppButtonTone;
  size?: AppButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
}

const toneClasses: Record<AppButtonTone, string> = {
  primary: "app-button-primary",
  success: "app-button-success",
  danger: "app-button-danger",
  neutral: "app-button-neutral",
  outline: "app-button-outline",
  "outline-primary": "app-button-outline-primary",
  "outline-success": "app-button-outline-success",
  "outline-danger": "app-button-outline-danger",
  ghost: "app-button-ghost",
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
};

export default function AppButton({
  tone = "primary",
  size = "md",
  startIcon,
  endIcon,
  className = "",
  fullWidth = false,
  children,
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded font-medium leading-none tracking-normal transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-focus-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${toneClasses[tone]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
      {...props}
    >
      {startIcon}
      <span>{children}</span>
      {endIcon}
    </button>
  );
}
