import Link from "next/link";
import { isLowStock } from "@/lib/billing";
import { formatPaise, formatQty } from "@/lib/format";
import type { ProductRow } from "@/lib/products";
import { LowStockBadge } from "./Feedback";

const actionLink =
  "rounded px-2 py-1 text-sm font-medium text-emerald-800 underline-offset-2 hover:underline " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

function Actions({ product }: { product: ProductRow }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/products/${product.id}/stock`} className={actionLink}>
        Add stock<span className="sr-only"> for {product.name}</span>
      </Link>
      <Link href={`/products/${product.id}/edit`} className={actionLink}>
        Edit<span className="sr-only"> {product.name}</span>
      </Link>
    </div>
  );
}

function StockCell({ product }: { product: ProductRow }) {
  const low = isLowStock(product);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={low ? "font-semibold text-red-700" : ""}>{formatQty(product.stock, product.unit)}</span>
      {low && <LowStockBadge />}
    </div>
  );
}

/** Stacked cards on phones, a table from `sm` up. */
export function ProductTable({ products }: { products: ProductRow[] }) {
  return (
    <>
      <ul className="space-y-2 sm:hidden">
        {products.map((product) => (
          <li
            key={product.id}
            className={`space-y-2 rounded-lg border bg-white p-4 ${isLowStock(product) ? "border-red-300" : "border-gray-200"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">{product.category}</p>
              </div>
              <p className="font-medium">
                {formatPaise(product.price)}/{product.unit}
              </p>
            </div>
            <StockCell product={product} />
            <Actions product={product} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th scope="col" className="p-4">Name</th>
              <th scope="col" className="p-4">Category</th>
              <th scope="col" className="p-4 text-right">Price</th>
              <th scope="col" className="p-4">Stock</th>
              <th scope="col" className="p-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className={isLowStock(product) ? "bg-red-50" : ""}>
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-gray-700">{product.category}</td>
                <td className="whitespace-nowrap p-4 text-right">
                  {formatPaise(product.price)}/{product.unit}
                </td>
                <td className="p-4">
                  <StockCell product={product} />
                </td>
                <td className="p-4">
                  <Actions product={product} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
