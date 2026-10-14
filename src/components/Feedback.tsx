import { LinkButton } from "./Button";
import { getParam } from "@/lib/urls";

/** The one shared red error box. Pass searchParams.error straight in. */
export function ErrorBox({ message }: { message: string | string[] | undefined }) {
  const text = getParam(message);
  if (!text) return null;
  return (
    <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
      <p className="font-semibold">⚠ Something went wrong</p>
      <p>{text}</p>
    </div>
  );
}

export function SuccessBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
      ✓ {children}
    </div>
  );
}

type EmptyStateProps = { message: string; actionHref?: string; actionLabel?: string };

export function EmptyState({ message, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="space-y-4 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
      <p className="text-gray-700">{message}</p>
      {actionHref && actionLabel && <LinkButton href={actionHref}>{actionLabel}</LinkButton>}
    </div>
  );
}

/** Red + text marker, so low stock never relies on color alone. */
export function LowStockBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
      <span aria-hidden="true">⚠</span> Low stock
    </span>
  );
}

/** Grey placeholder blocks for loading.tsx files. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-1/3 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}
