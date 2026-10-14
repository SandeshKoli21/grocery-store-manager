import { LinkButton } from "@/components/Button";
import { EmptyState, ErrorBox, SuccessBox } from "@/components/Feedback";
import { Field, SelectField } from "@/components/Field";
import { PageHeader } from "@/components/Layout";
import { ProductTable } from "@/components/ProductTable";
import { SearchSummary } from "@/components/SearchSummary";
import { buttonClasses } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { countMatchesByCategory, countProducts, isCategory, listProducts } from "@/lib/products";
import { getParam, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = getParam(searchParams.q) ?? "";
  const rawCategory = getParam(searchParams.category);
  const category = isCategory(rawCategory) ? rawCategory : "";
  const success = getParam(searchParams.success);
  const [products, total, byCategory] = await Promise.all([
    listProducts({ q, category }),
    countProducts(),
    q.trim() ? countMatchesByCategory(q) : Promise.resolve([]),
  ]);
  const filtering = q.trim() !== "" || category !== "";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        action={<LinkButton href="/products/new">Add product</LinkButton>}
      />
      <ErrorBox message={searchParams.error} />
      {success && <SuccessBox>{success}</SuccessBox>}

      {total > 0 && (
        <form method="get" className="grid gap-4 sm:grid-cols-4 sm:items-end" role="search">
          <div className="sm:col-span-2">
            <Field label="Search by name" name="q" type="search" defaultValue={q} placeholder="e.g. rice" />
          </div>
          <SelectField label="Category" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <button type="submit" className={buttonClasses("secondary")}>
            Search
          </button>
        </form>
      )}

      {total > 0 && filtering && (
        <SearchSummary q={q.trim()} category={category} shown={products.length} byCategory={byCategory} />
      )}

      {total === 0 ? (
        <EmptyState message="No products yet. Add your first product to start billing." actionHref="/products/new" actionLabel="Add product" />
      ) : products.length === 0 ? (
        <EmptyState message="No products match your search." actionHref="/products" actionLabel="Clear search" />
      ) : (
        <ProductTable products={products} />
      )}
    </div>
  );
}
