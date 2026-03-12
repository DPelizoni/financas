import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <section
      className={`rounded-lg bg-white p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  );
}
