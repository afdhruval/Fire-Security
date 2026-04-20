/**
 * RBAC Middleware — FireSentrix
 * Roles: CEO (was Admin), HR, Employee
 *
 * NOTE: The User model stores role as 'Admin' | 'HR' | 'Employee'.
 *       We treat 'Admin' as CEO (full access) throughout this middleware.
 */

// ─── Module Access Matrix ────────────────────────────────────────────────────

const MODULE_ACCESS = {
  // CEO / Admin — all modules
  Admin: [
    'dashboard', 'analytics', 'guardPatrol', 'auditLogs',
    'billing', 'contracts', 'activities', 'attendance',
    'equipment', 'onDutyForce', 'guards', 'clients', 'sites',
    'salary', 'reports', 'alerts', 'messages',
  ],

  // HR — workforce & payroll focused
  HR: [
    'dashboard', 'activities', 'attendance', 'guards', 'equipment', 'guardPatrol',
    'salary', 'invoices', 'billing', 'clients', 'sites', 'reports', 'alerts', 'messages',
  ],

  // Employee — personal data only
  Employee: [
    'dashboard', 'activities', 'attendance', 'equipment', 'guards',
    'onDutyForce', 'guardPatrol', 'salary', 'invoices', 'billing', 'clients', 'sites',
    'reports', 'alerts', 'messages',
  ],
};

// ─── Permission Matrix ────────────────────────────────────────────────────────

const PERMISSION_MATRIX = {
  Admin:    ['view', 'create', 'edit', 'delete'], // CEO: full access
  HR:       ['view', 'create', 'edit'],           // HR: view + create + edit (NO delete)
  Employee: ['view', 'create'],                   // Employee: view + submit own records
};

// ─── checkRole([...roles]) ───────────────────────────────────────────────────
/**
 * Restrict a route to specific roles.
 * Usage: router.get('/admin-only', protect, checkRole(['Admin']), handler)
 */
exports.checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// ─── checkPermission(action) ─────────────────────────────────────────────────
/**
 * Restrict a route to a specific action permission.
 * Usage: router.delete('/:id', protect, checkPermission('delete'), handler)
 *
 * Actions: 'view' | 'create' | 'edit' | 'delete'
 */
exports.checkPermission = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const allowed = PERMISSION_MATRIX[req.user.role] || [];

    if (!allowed.includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Action '${action}' is not allowed for role '${req.user.role}'.`,
      });
    }

    next();
  };
};

// ─── checkModuleAccess(moduleName) ───────────────────────────────────────────
/**
 * Restrict a router group to users who have access to that module.
 * Usage: router.use(protect, checkModuleAccess('analytics'))
 */
exports.checkModuleAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const accessibleModules = MODULE_ACCESS[req.user.role] || [];

    if (!accessibleModules.includes(moduleName)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Module '${moduleName}' is not accessible for role '${req.user.role}'.`,
      });
    }

    next();
  };
};

// ─── Convenience exports ─────────────────────────────────────────────────────
exports.MODULE_ACCESS = MODULE_ACCESS;
exports.PERMISSION_MATRIX = PERMISSION_MATRIX;