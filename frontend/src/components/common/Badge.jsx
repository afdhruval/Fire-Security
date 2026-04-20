import { getStatusColor } from '../../utils/helpers';

const Badge = ({ children, status, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-secondary-100 text-secondary-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  const statusClass = status ? getStatusColor(status) : variants[variant];

  return <span className={`inline-flex items-center justify-center h-7 px-3 rounded-lg text-xs font-bold uppercase tracking-wide ${statusClass} ${className}`}>{children}</span>;
};

export default Badge;
