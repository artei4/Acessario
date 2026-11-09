import { cn } from '../../utils/cn.js';
import { Icon } from './Icon.jsx';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] font-bold no-underline transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer';

const VARIANTS = {
  primary: 'border-transparent bg-brand text-on-brand hover:enabled:bg-brand-strong',
  secondary: 'bg-surface border-brand text-brand hover:enabled:bg-brand-soft',
  success: 'bg-ok-soft border-ok text-ok',
  danger: 'bg-surface border-bad text-bad hover:enabled:bg-bad-soft',
  ghost: 'border-transparent bg-transparent text-brand',
  'ghost-danger': 'border-transparent bg-transparent text-bad hover:enabled:bg-bad-soft',
  'on-navy': 'bg-transparent border-white/60 text-on-navy hover:enabled:bg-white/10',
};

const SIZES = {
  sm: 'min-h-9 px-2.5 py-1.5 text-[13px]',
  md: 'min-h-11 px-4 py-2.5',
  lg: 'min-h-13 px-4 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  icon,
  selected = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', selected && 'shadow-[inset_0_0_0_2px_currentColor]', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />;
}
