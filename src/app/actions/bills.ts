"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toUserMessage } from "@/lib/billing";
import { createBill, type CreatedBill } from "@/lib/billing-server";
import { firstIssueMessage, saveBillSchema } from "@/lib/validation";
import { withError } from "@/lib/urls";

export async function saveBillAction(formData: FormData) {
  const parsed = saveBillSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withError("/billing", firstIssueMessage(parsed.error)));

  let bill: CreatedBill;
  try {
    bill = await createBill(parsed.data);
  } catch (error: unknown) {
    redirect(withError("/billing", toUserMessage(error)));
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/billing");
  revalidatePath("/bills");
  redirect(`/bills/${bill.id}?saved=1`);
}
