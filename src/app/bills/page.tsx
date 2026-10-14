import Link from "next/link";
import { LinkButton } from "@/components/Button";
import { EmptyState, ErrorBox } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { PageHeader } from "@/components/Layout";
import { buttonClasses } from "@/components/ui";
import { countBills, listBills } from "@/lib/bills";
import { formatDateTime } from "@/lib/dates";
import { formatPaise } from "@/lib/format";
import { getParam, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

const billLink =
  "font-semibold text-emerald-800 underline-offset-2 hover:underline " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

export default async function BillsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = getParam(searchParams.q) ?? "";
  const [bills, total] = await Promise.all([listBills({ q }), countBills()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bills"
        description={`${total} bill${total === 1 ? "" : "s"}`}
        action={<LinkButton href="/billing">New bill</LinkButton>}
      />
      <ErrorBox message={searchParams.error} />

      {total > 0 && (
        <form method="get" className="grid gap-4 sm:grid-cols-4 sm:items-end" role="search">
          <div className="sm:col-span-3">
            <Field
              label="Search by bill number or customer"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="e.g. B-0001 or Ramesh"
            />
          </div>
          <button type="submit" className={buttonClasses("secondary")}>
            Search
          </button>
        </form>
      )}

      {total === 0 ? (
        <EmptyState message="No bills yet. Create your first bill." actionHref="/billing" actionLabel="New bill" />
      ) : bills.length === 0 ? (
        <EmptyState message="No bills match your search." actionHref="/bills" actionLabel="Clear search" />
      ) : (
        <>
          {q !== "" && (
            <p className="text-sm text-gray-600">
              Showing {bills.length} of {total}
            </p>
          )}
          <ul className="space-y-2 sm:hidden">
            {bills.map((bill) => (
              <li key={bill.id} className="space-y-1 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/bills/${bill.id}`} className={billLink}>
                    {bill.billNumber}
                  </Link>
                  <span className="font-semibold">{formatPaise(bill.total)}</span>
                </div>
                <p className="text-sm text-gray-600">{formatDateTime(bill.createdAt)}</p>
                <p className="text-sm text-gray-700">
                  {bill.customerName ?? "Walk-in customer"} · {bill.itemCount} item{bill.itemCount === 1 ? "" : "s"} ·{" "}
                  {bill.paymentMode}
                </p>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th scope="col" className="p-4">Bill</th>
                  <th scope="col" className="p-4">Date</th>
                  <th scope="col" className="p-4">Customer</th>
                  <th scope="col" className="p-4 text-right">Items</th>
                  <th scope="col" className="p-4">Payment</th>
                  <th scope="col" className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="p-4">
                      <Link href={`/bills/${bill.id}`} className={billLink}>
                        {bill.billNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap p-4 text-gray-700">{formatDateTime(bill.createdAt)}</td>
                    <td className="p-4">{bill.customerName ?? <span className="text-gray-500">Walk-in</span>}</td>
                    <td className="p-4 text-right">{bill.itemCount}</td>
                    <td className="p-4">{bill.paymentMode}</td>
                    <td className="whitespace-nowrap p-4 text-right font-semibold">{formatPaise(bill.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
