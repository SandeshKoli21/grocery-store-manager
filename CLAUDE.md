# CLAUDE.md

Grocery Store Manager (v1): a web app for a small kirana shop owner to manage products and stock, create customer bills, and see low-stock items. `spec.md` is the source of truth for features and rules. Read it before starting non-trivial work.

## Stack

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- SQLite via Prisma
- zod for validation
- No auth in v1

## Commands

```bash
npm install                 # install dependencies
npx prisma migrate dev      # create/apply migrations + generate client
npx prisma generate         # regenerate Prisma client after schema edits
npm run seed -- --force     # DELETES all data, then seeds ~40 products + 3 sample bills
npm run dev                 # dev server at http://localhost:3003
npm run build               # production build
npm run lint                # ESLint
npx tsc --noEmit            # type-check (run after EVERY change)
npx prisma studio           # browse the database
```

Full setup check (the definition of done):
`npm install && npx prisma migrate dev && npm run seed -- --force && npm run dev`

## Folder structure

```
prisma/
  schema.prisma           # Product, Bill, BillItem
  seed.ts                 # seed data (prices in paise, e.g. 5500 = ₹55.00)
src/
  app/                    # routes (App Router pages, layouts, loading.tsx)
    page.tsx              # dashboard: today's sales, bill count, low-stock list
    products/             # list/search/filter, add, edit, add stock
    billing/              # new bill: pick products + quantities, live total
    bills/                # past bills list; [id]/ printable bill
    actions/              # server actions (all writes), grouped by domain
  components/             # shared UI (forms, tables, ErrorBox, EmptyState, etc.)
  lib/
    db.ts                 # Prisma client singleton
    constants.ts          # CATEGORIES, UNITS, PAYMENT_MODES, unit decimals
    billing.ts            # pure business rules: stock checks, totals (in paise), discounts (client-safe)
    billing-server.ts     # transactional writes: createBill, addStock (imports Prisma)
    validation.ts         # zod schemas shared by forms and actions
    format.ts             # paise ↔ ₹ and base units ↔ display quantity conversion/formatting
```

## Coding rules

- **TypeScript strict.** No `any`, not even in tests or quick fixes. Use `unknown` and narrow it, or write a proper type. Avoid `as` casts unless there's no alternative, and explain why in a comment.
- **zod validation.** Validate every input to a server action with a zod schema from `src/lib/validation.ts` before it touches the database. Derive types with `z.infer`. Don't duplicate them by hand.
- **Server Actions for all writes.** No API routes for mutations. Each action validates, calls into `src/lib`, then calls `revalidatePath`/`redirect`. On failure, redirect with `?error=<message>` so the page can show it in a red error box.
- **Business logic lives in `src/lib`.** Stock checks, totals, discount checks and rounding go in `src/lib/billing.ts` (pure, no Prisma, so client components can import it). Transactions that change stock go in `src/lib/billing-server.ts`. Pages, components and actions should stay thin and call into lib.
- **Transactions for stock changes.** Any write that changes `stock` goes through `prisma.$transaction`. Saving a bill has to create the bill, create its items and decrement stock for every item in ONE transaction, so either all of it succeeds or none of it does. Re-check stock inside the transaction, not only before it.
- **Domain rules (from spec):**
  - You can't bill more than the current stock.
  - Price and billed/added quantity must be > 0; stock and lowStockLevel may be 0 when adding a product. `pcs`/`pack` quantities must be whole numbers.
  - Discount can't exceed the subtotal.
  - A product can't be deleted if it appears on any bill.
  - `BillItem` copies `productName`, `unit` and `unitPrice` when the bill is created, so old bills never change.
  - Low stock means `stock <= lowStockLevel`. Show it in red everywhere.
- **Money is integer paise.** `price`, `unitPrice`, `lineTotal`, `subtotal`, `discount` and `total` are stored as `Int` paise in Prisma (₹1 = 100 paise). Never store or calculate money as floating-point rupees.
  - All money math in `src/lib/billing.ts` works in paise. `lineTotal = Math.round(unitPrice * quantity / unitFactor)` (in `computeLineTotalPaise`) is the only place rounding happens; subtotal, discount and total are plain integer sums and differences.
  - Convert to ₹ **only for display**, through `src/lib/format.ts` (e.g. `formatPaise(12550)` → `₹125.50`). Don't divide by 100 inline in components.
  - Form input arrives in ₹. Convert it to paise once at the boundary (e.g. `rupeesToPaise` in `format.ts`, used by the zod schema) before validation and storage. Validate the paise value with `z.number().int().positive()` (discount: `.nonnegative()`).
  - Name variables and props holding paise with a `Paise` suffix (`pricePaise`, `totalPaise`) wherever it isn't obvious from the model field.
- **Quantities are integer base units.** `stock`, `lowStockLevel` and `BillItem.quantity` are `Int` in the smallest unit: kg → grams, L → ml, g → g, pcs/pack → count. `price` is paise per display unit (per kg, per L, per piece).
  - Convert form input once at the boundary with `toBaseQty` (kg/L allow up to 3 decimals; g/pcs/pack must be whole). Display with `formatQty` / `baseQtyToInput` from `format.ts`. Never use floating-point quantities.
- Bill numbers are unique and sequential: `B-0001`, `B-0002`, …
- Prefer Server Components. Add `"use client"` only where you need interactivity (e.g. the live bill total).
- Keep v1 scope. Don't add auth, GST, suppliers, barcodes, returns or thermal printing.

## UI rules

- **Mobile-first.** Write base styles for small screens, then add `sm:`/`md:`/`lg:` breakpoints. Tables have to stay usable on a phone: scroll them horizontally or stack them as cards.
- **Accessible labels.** Every input has a visible `<label>` (or `aria-label` for icon-only controls). Use semantic elements (`button`, `table`, `nav`, `main`), keep focus states visible, and never use color as the only signal. Pair low-stock red with a text or icon marker.
- **Loading and empty states.** Every list/data route has a `loading.tsx` or skeleton. Every list has an empty state with a helpful message and a next action (e.g. "No products yet. Add one"). Submit buttons are disabled and show a pending state while an action runs (`useFormStatus`).
- **Consistent spacing.** Stick to the Tailwind spacing scale (`p-4`, `gap-4`, `space-y-4`, etc.), with no arbitrary pixel values. Reuse shared components so pages look the same: page header, card, button, input, error box.
- Errors from `?error=` show in one shared red `ErrorBox` component.
- Bill detail pages print cleanly (`print:` utilities hide nav and buttons).

## Workflow

- **Always run `npx tsc --noEmit` after making changes**, and fix every error before you call the task done.
- After editing `prisma/schema.prisma`, run `npx prisma migrate dev` (it regenerates the client).
- Check changes against the definition of done in `spec.md`: billing over stock is blocked with a clear error, stock drops by exactly the billed quantity, and low-stock products show red on the dashboard.
