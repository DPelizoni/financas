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
      className={`filter-panel-surface p-6 ${className}`.trim()}
    >
      {children}
    </section>
  );
}
