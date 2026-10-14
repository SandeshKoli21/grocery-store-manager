import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { inputClasses, labelClasses } from "./ui";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  hint?: string;
};

/** Labelled text input. The label is always visible. */
export function Field({ label, name, hint, id, className = "", ...props }: FieldProps) {
  const inputId = id ?? name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className={labelClasses}>
        {label}
      </label>
      <input id={inputId} name={name} aria-describedby={hintId} className={`${inputClasses} ${className}`} {...props} />
      {hint && (
        <p id={hintId} className="text-sm text-gray-600">
          {hint}
        </p>
      )}
    </div>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  children: ReactNode;
};

/** Labelled select. */
export function SelectField({ label, name, id, className = "", children, ...props }: SelectFieldProps) {
  const selectId = id ?? name;
  return (
    <div className="space-y-1">
      <label htmlFor={selectId} className={labelClasses}>
        {label}
      </label>
      <select id={selectId} name={name} className={`${inputClasses} ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
