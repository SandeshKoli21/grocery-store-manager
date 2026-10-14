"use client";

import type { MouseEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses, type ButtonVariant } from "./ui";

type SubmitButtonProps = {
  children: ReactNode;
  pendingText: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  /** If set, asks the user to confirm before submitting. */
  confirmMessage?: string;
};

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  disabled = false,
  className = "",
  confirmMessage,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
  }

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      onClick={handleClick}
      className={buttonClasses(variant, `print:hidden ${className}`)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
