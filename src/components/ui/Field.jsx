import { cn } from '../../utils/cn.js';

/** Classes de campos de texto, compartilhadas por input e textarea. */
export const inputClass =
  'w-full min-h-[46px] rounded-lg border-[1.5px] border-line bg-surface px-3 py-2.5 text-ink placeholder:text-ink-soft/80 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand-ring';

export function TextInput({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function TextArea({ className, ...props }) {
  return <textarea className={cn(inputClass, 'min-h-[72px] resize-y', className)} {...props} />;
}

export function FieldLabel({ className, children, ...props }) {
  return (
    <span className={cn('text-sm font-bold', className)} {...props}>
      {children}
    </span>
  );
}

export function FieldError({ children, ...props }) {
  return (
    <span className="text-[13px] text-bad" {...props}>
      {children}
    </span>
  );
}
