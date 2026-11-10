import { useId, type InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, id, ...inputProps }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs uppercase tracking-label text-ash">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? hintId : undefined}
        className="h-12 rounded-field border border-sand bg-paper px-4 text-base font-normal text-ink outline-none transition placeholder:text-ash focus:border-ink focus:ring-2 focus:ring-blush"
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-ash">
          {hint}
        </p>
      )}
    </div>
  );
}
