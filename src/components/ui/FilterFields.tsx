import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import styles from "./FilterFields.module.css";

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  hint?: string;
}

export function SearchField({ label, hint, id, ...props }: SearchFieldProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        aria-describedby={hintId}
        className={styles.control}
        id={id}
        type="search"
        {...props}
      />
      {hint && hintId ? <p className={styles.hint} id={hintId}>{hint}</p> : null}
    </div>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  hint?: string;
}

export function FilterSelect({ label, options, hint, id, ...props }: FilterSelectProps) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <select aria-describedby={hintId} className={styles.control} id={id} {...props}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hint && hintId ? <p className={styles.hint} id={hintId}>{hint}</p> : null}
    </div>
  );
}
