import Link from "next/link";
import type { CategoryCount } from "@/lib/products";

const chipBase =
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";
const chipIdle = "border-gray-300 bg-white text-gray-800 hover:bg-gray-100";
const chipActive = "border-emerald-700 bg-emerald-700 text-white";

function productsHref(q: string, category: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

function plural(n: number): string {
  return `${n} product${n === 1 ? "" : "s"}`;
}

type SearchSummaryProps = {
  q: string;
  category: string;
  /** Products shown after both filters. */
  shown: number;
  /** Matches for `q` in each category, ignoring the category filter. */
  byCategory: CategoryCount[];
};

/** "174 products match “rice”" plus a per-category breakdown that filters on click. */
export function SearchSummary({ q, category, shown, byCategory }: SearchSummaryProps) {
  if (!q) {
    return (
      <p className="text-sm text-gray-700">
        <span className="font-semibold">{plural(shown)}</span> in {category}
      </p>
    );
  }

  const matches = byCategory.reduce((sum, c) => sum + c.count, 0);
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700" aria-live="polite">
        <span className="font-semibold">{plural(matches)}</span> match “{q}”
        {category && matches > 0 && (
          <>
            {" "}
            · showing {shown} in {category}
          </>
        )}
      </p>
      {byCategory.length > 0 && (
        <nav aria-label="Matches by category">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={productsHref(q, "")}
                className={`${chipBase} ${category ? chipIdle : chipActive}`}
                aria-current={category ? undefined : "page"}
              >
                All <span aria-hidden="true">·</span> {matches}
              </Link>
            </li>
            {byCategory.map((c) => (
              <li key={c.category}>
                <Link
                  href={productsHref(q, c.category)}
                  className={`${chipBase} ${c.category === category ? chipActive : chipIdle}`}
                  aria-current={c.category === category ? "page" : undefined}
                >
                  {c.category} <span aria-hidden="true">·</span> {c.count}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
