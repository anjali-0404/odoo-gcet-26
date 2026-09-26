import Icon from './Icon.jsx';

const VARIANTS = {
  primary: 'bg-accent text-bg hover:bg-accent-hover font-semibold',
  outline: 'border border-accent text-accent hover:bg-accent-muted',
  secondary: 'border border-border bg-surface-2 text-text hover:border-muted hover:text-text-strong',
  ghost: 'text-text hover:bg-surface-2 hover:text-text-strong',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

/**
 * <Button variant="primary|outline|secondary|ghost|danger" size="sm|md|lg" icon="plus" loading />
 * Pass `as={Link} to="..."` to render a router link styled as a button.
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isButton = Component === 'button';
  return (
    <Component
      {...(isButton && { type: props.type ?? 'button', disabled: disabled || loading })}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon && <Icon name={icon} className="h-4 w-4" />
      )}
      {children}
    </Component>
  );
}
