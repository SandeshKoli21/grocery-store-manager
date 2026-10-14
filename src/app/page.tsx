import Link from "next/link";
import { LinkButton } from "@/components/Button";
import { LowStockBadge } from "@/components/Feedback";
import { Card, PageHeader } from "@/components/Layout";
import { getDashboardData } from "@/lib/bills";
import { formatLongDate } from "@/lib/dates";
import { formatPaise, formatQty } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <Card className="space-y-1">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${tone === "danger" ? "text-red-700" : "text-gray-900"}`}>{value}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const { todaySalesPaise, todayBillCount, lowStock } = await getDashboardData();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={formatLongDate(new Date())}
        action={<LinkButton href="/billing">New bill</LinkButton>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Today's sales" value={formatPaise(todaySalesPaise)} />
        <Stat label="Bills today" value={String(todayBillCount)} />
        <Stat
          label="Low-stock products"
          value={lowStock.length === 0 ? "None" : `⚠ ${lowStock.length}`}
          tone={lowStock.length > 0 ? "danger" : "default"}
        />
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Low stock</h2>
        {lowStock.length === 0 ? (
          <div className="space-y-2">
            <p className="text-gray-700">All products are above their low-stock level.</p>
            <Link href="/products" className="text-sm font-medium text-emerald-800 hover:underline">
              View products
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200" aria-label="Low-stock products">
            {lowStock.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-red-700">{product.name}</span>
                    <LowStockBadge />
                  </div>
                  <p className="text-sm text-red-700">
                    {formatQty(product.stock, product.unit)} left (alert at{" "}
                    {formatQty(product.lowStockLevel, product.unit)})
                  </p>
                </div>
                <LinkButton href={`/products/${product.id}/stock`} variant="secondary">
                  Add stock<span className="sr-only"> for {product.name}</span>
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
