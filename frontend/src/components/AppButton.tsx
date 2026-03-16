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
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  neutral: "bg-gray-600 text-white hover:bg-gray-700",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  "outline-primary":
    "border border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/20",
  "outline-success":
    "border border-green-500 bg-transparent text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/20",
  "outline-danger":
    "border border-red-500 bg-transparent text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-slate-200",
};

const sizeClasses: Record<AppButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
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
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium leading-none tracking-normal transition disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${toneClasses[tone]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
      {...props}
    >
      {startIcon}
      <span>{children}</span>
      {endIcon}
    </button>
  );
}
