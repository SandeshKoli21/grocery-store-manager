# Grocery Store Manager

A web app for a small kirana shop owner to manage products and stock, make customer
bills, and see what's running low. It runs on one machine in the shop and keeps its
data in a local SQLite file.

`spec.md` is the source of truth for features and rules.

## Features

- **Products:** add, edit, delete, search by name and filter by category.
- **Stock:** an "Add stock" button for each product. Stock is set when you add a
  product, and after that it changes only through Add stock and bills.
- **Billing:** pick products and quantities, see the total update as you go, add an
  optional discount and payment mode (Cash, UPI or Card), then save the bill.
- **Bills:** a list of past bills. Each bill opens as a page that prints cleanly.
- **Dashboard:** today's sales total, today's bill count and a low-stock list.
- **Low stock:** a product is low when `stock <= lowStockLevel`. It shows in red,
  with a text marker, everywhere it appears.

## Tech stack

- Next.js 14 (App Router) with TypeScript in strict mode
- Tailwind CSS
- SQLite through Prisma
- zod for validation
- No login in v1. The server only listens on `127.0.0.1`, so other devices on the
  shop's network can't reach it.

## Setup

You need Node.js 18.17 or newer.

```bash
cp .env.example .env        # PowerShell: copy .env.example .env
npm install
npx prisma migrate dev      # creates prisma/dev.db and the Prisma client
npm run seed -- --force     # optional: sample data (see the warning below)
npm run dev                 # http://localhost:3003
```

> **Warning:** `npm run seed -- --force` **deletes every product and bill** before it
> adds about 40 sample products and 3 sample bills. Without `--force` it refuses to
> run. Never run it on a database with real shop data.

Other commands:

```bash
npm run build && npm start  # production build and server (port 3003)
npm run lint                # ESLint
npx tsc --noEmit            # type-check
npx prisma studio           # browse the database
```

On a machine with real data, apply new migrations with `npx prisma migrate deploy`
instead of `migrate dev`, which may offer to reset the database.

## Key design decisions

### Money is stored as whole paise

Every amount (`price`, `unitPrice`, `lineTotal`, `subtotal`, `discount`, `total`) is
an integer number of paise (₹1 = 100 paise). Floating-point rupees cause rounding
errors, such as `0.1 + 0.2 !== 0.3`, and those add up on a bill.

- Rupees typed into a form are converted to paise once, when the form is submitted
  (`rupeesToPaise` in `src/lib/format.ts`).
- Rounding happens in exactly one place: the line total,
  `round(unitPrice × quantity ÷ base units per display unit)`. Subtotal, discount and
  total are plain whole-number sums and differences.
- Paise are turned into ₹ only for display (`formatPaise`).

### Quantities are whole numbers in base units

Stock and quantities are stored as integers in the smallest unit: kg → grams,
L → ml, g → g, pcs/pack → count. So 1.25 kg is stored as 1250. Forms accept kg and L
with up to 3 decimals and require whole numbers for g, pcs and pack.

### Every stock change runs in a transaction

Saving a bill creates the bill, creates its items and reduces stock for every item in
one `prisma.$transaction`, so either all of it is saved or none of it is. Stock is
checked again inside the transaction, so two bills saved at the same moment can't
together sell more than is on the shelf. Add stock also runs in a transaction.

### Bills keep a copy of product details

Each bill item copies the product's name, unit and price at the time of sale. Editing
a product later never changes an old bill. To keep history consistent, a product that
appears on any bill can't be deleted, and its unit can't be changed.

### Every input is checked on the server

All writes go through Server Actions. Each one validates its input with a zod schema
from `src/lib/validation.ts` before touching the database. Totals are always worked
out from prices in the database, never from prices sent by the browser. Limits keep
every number inside Prisma's 32-bit `Int`:

- price up to ₹1,00,000
- bill total up to ₹1,00,00,000
- at most 100 items per bill

## Project layout

```
prisma/            schema.prisma, migrations, seed.ts
src/app/           pages; actions/ holds the Server Actions (all writes)
src/components/    shared UI: forms, tables, ErrorBox, empty states
src/lib/           business rules (billing.ts), transactions (billing-server.ts),
                   validation.ts, format.ts, constants.ts
```

## v2 backlog

Known issues from the v1 code review, deferred on purpose:

- **Error and success messages come straight from the URL.** `?error=` and
  `?success=` text is shown exactly as written in the address. React escapes it, so
  it isn't an XSS hole, but a crafted link can show any message inside the app's own
  red or green box. Fix: pass a message code and look the text up in a fixed list.
- **Per-gram prices can't show some real prices.** A `g` product's price is whole
  paise per gram, so ₹425/kg (42.5 paise per gram) can't be entered. Fix: store
  prices for `g` products per kg or per 100 g, or allow fractions of a paisa in the
  unit price.

Also out of scope for v1: login, GST, suppliers, barcodes, returns and thermal
printing.
