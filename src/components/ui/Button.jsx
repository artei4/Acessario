import { Icon } from './Icon.jsx';

const cx = (...classes) => classes.filter(Boolean).join(' ');

export function Button({
  variant = 'primary',
  size,
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
      className={cx('btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', selected && 'btn--selected', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
