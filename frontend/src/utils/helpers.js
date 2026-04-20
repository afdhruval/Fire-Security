// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format time
export const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Check if maintenance is overdue
export const isMaintenanceOverdue = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

// Get initials from names
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
    pending:  'bg-yellow-100 text-yellow-700',
    paid:     'bg-green-100 text-green-700',
    unpaid:   'bg-yellow-100 text-yellow-700',
    present:  'bg-green-100 text-green-700',
    absent:   'bg-red-100 text-red-700',
    good:     'bg-green-100 text-green-700',
    overdue:  'bg-red-100 text-red-700',
  };
  return colors[status?.toLowerCase()] || 'bg-secondary-100 text-secondary-700';
};

// Generate unique ID
export const generateId = () => Date.now().toString();

// Check user permission
export const hasPermission = (userRole, permission) => {
  const permissions = {
    'Admin':    ['create', 'read', 'update', 'delete', 'all'],
    'HR':       ['create', 'read', 'update'],
    'Employee': ['read'],
  };
  return permissions[userRole]?.includes(permission) || permissions[userRole]?.includes('all') || false;
};

// Get accessible routes by role
export const getAccessibleRoutes = (role) => {
  const routes = {
    // Admin/CEO: all pages
    'Admin': [
      'dashboard', 'analytics', 'clients', 'guards', 'patrol',
      'equipment', 'attendance', 'salary', 'billing', 'chat',
      'reports', 'audit-logs', 'feedback', 'guard-tracker',
    ],

    // HR: workforce & payroll focused
    'HR': [
      'dashboard', 'guards', 'attendance', 'salary', 'reports',
      'chat', 'feedback', 'guard-tracker',
    ],

    // Employee: personal data + guard tracker for live GPS
    'Employee': [
      'dashboard', 'attendance', 'salary', 'patrol', 'equipment',
      'reports', 'chat', 'feedback', 'guard-tracker',
    ],
  };

  return routes[role] || ['dashboard'];
};