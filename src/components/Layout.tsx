import type { ReactNode } from "react";

type PageHeaderProps = { title: string; description?: string; action?: ReactNode };

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2 print:hidden">{action}</div>}
    </div>
  );
}

type CardProps = { children: ReactNode; className?: string };

export function Card({ children, className = "" }: CardProps) {
  return <section className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}
