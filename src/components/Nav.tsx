import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/billing", label: "New bill" },
  { href: "/bills", label: "Bills" },
];

export function Nav() {
  return (
    <nav aria-label="Main" className="border-b border-gray-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <Link href="/" className="mr-auto text-lg font-bold text-emerald-800">
          Kirana Manager
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
