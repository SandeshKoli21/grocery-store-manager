import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Grocery Store Manager",
  description: "Manage products, stock and bills for a kirana shop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl space-y-4 p-4">{children}</main>
      </body>
    </html>
  );
}
