// src/components/common/Button.jsx
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon,
  fullWidth = false,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-br from-primary-600 to-primary-700 text-white hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-white text-secondary-900 border border-secondary-200 hover:bg-secondary-50',
    danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white',
    success: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-600 hover:text-white',
  };

  const sizes = {
    sm: 'h-8 text-sm',
    md: 'h-11 text-sm',
    lg: 'h-12 text-base',
  };

  const paddings = {
    sm: Icon && !children ? 'w-8' : 'px-3',
    md: Icon && !children ? 'w-11' : 'px-5',
    lg: Icon && !children ? 'w-12' : 'px-6',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${paddings[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} className={children ? 'mr-2' : ''} />}
      {children}
    </button>
  );
};

export default Button;