import { notFound } from "next/navigation";
import { ClearBillDraft, PrintButton } from "@/components/BillActions";
import { LinkButton } from "@/components/Button";
import { SuccessBox } from "@/components/Feedback";
import { getBill } from "@/lib/bills";
import { formatDateTime } from "@/lib/dates";
import { formatPaise, formatQty } from "@/lib/format";
import { getParam, parseId, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: SearchParams };

export default async function BillPage({ params, searchParams }: Props) {
  const id = parseId(params.id);
  const bill = id ? await getBill(id) : null;
  if (!bill) notFound();
  const justSaved = getParam(searchParams.saved) === "1";

  return (
    <div className="space-y-4">
      {justSaved && (
        <div className="print:hidden">
          <ClearBillDraft />
          <SuccessBox>Bill {bill.billNumber} saved and stock updated.</SuccessBox>
        </div>
      )}

      <div className="flex flex-wrap gap-2 print:hidden">
        <PrintButton />
        <LinkButton href="/billing" variant="secondary">
          New bill
        </LinkButton>
        <LinkButton href="/bills" variant="secondary">
          All bills
        </LinkButton>
      </div>

      <article className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 print:border-0 print:p-0 sm:p-8">
        <header className="space-y-1 border-b border-gray-200 pb-4 text-center">
          <h1 className="text-xl font-bold">Kirana Store</h1>
          <p className="text-sm text-gray-600">Customer bill</p>
        </header>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-gray-600">Bill no.</dt>
            <dd className="font-semibold">{bill.billNumber}</dd>
          </div>
          <div className="text-right">
            <dt className="text-gray-600">Date</dt>
            <dd>{formatDateTime(bill.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Customer</dt>
            <dd>{bill.customerName ?? "Walk-in customer"}</dd>
          </div>
          <div className="text-right">
            <dt className="text-gray-600">Payment</dt>
            <dd>{bill.paymentMode}</dd>
          </div>
        </dl>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-300 text-gray-700">
              <tr>
                <th scope="col" className="py-2 pr-2">Item</th>
                <th scope="col" className="px-2 py-2 text-right">Qty</th>
                <th scope="col" className="px-2 py-2 text-right">Rate</th>
                <th scope="col" className="py-2 pl-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bill.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-2">{item.productName}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">{formatQty(item.quantity, item.unit)}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    {formatPaise(item.unitPrice)}/{item.unit}
                  </td>
                  <td className="whitespace-nowrap py-2 pl-2 text-right">{formatPaise(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto max-w-xs space-y-1 border-t border-gray-300 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-700">Subtotal</dt>
            <dd>{formatPaise(bill.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-700">Discount</dt>
            <dd>− {formatPaise(bill.discount)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPaise(bill.total)}</dd>
          </div>
        </dl>

        <p className="text-center text-sm text-gray-600">Thank you! Visit again.</p>
      </article>
    </div>
  );
}
