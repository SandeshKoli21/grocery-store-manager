import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses, type ButtonVariant } from "./ui";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

type LinkButtonProps = { href: string; variant?: ButtonVariant; className?: string; children: ReactNode };

export function LinkButton({ href, variant = "primary", className = "", children }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}
