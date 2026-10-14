// Shared Tailwind class strings so every page looks the same.

export type ButtonVariant = "primary" | "secondary" | "danger";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600",
  secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 focus-visible:ring-gray-500",
  danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
};

export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`.trim();
}

export const inputClasses =
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 " +
  "aria-[invalid=true]:border-red-600";

export const labelClasses = "block text-sm font-medium text-gray-800";
