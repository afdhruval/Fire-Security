const AuditLog = require('../models/AuditLog');

const auditLogger = (req, res, next) => {
    // Only capture modifying actions: POST, PUT, PATCH, DELETE
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        res.on('finish', async () => {
            if (res.statusCode < 400) {
                try {
                    let action = 'UPDATE';
                    if (req.method === 'POST') action = 'CREATE';
                    else if (req.method === 'DELETE') action = 'DELETE';

                    const parts = req.originalUrl.split('?')[0].split('/');
                    const moduleNameRaw = parts[3] || 'System';
                    
                    const moduleMap = {
                        auth: 'Auth',
                        clients: 'Clients',
                        sites: 'Sites',
                        guards: 'Guards',
                        equipment: 'Equipment',
                        attendance: 'Attendance',
                        salaries: 'Salaries',
                        invoices: 'Invoices',
                        reports: 'Reports',
                        patrol: 'Patrol',
                        contracts: 'Contracts',
                    };

                    const moduleParam = moduleNameRaw.toLowerCase();
                    const module = moduleMap[moduleParam] || moduleNameRaw.charAt(0).toUpperCase() + moduleNameRaw.slice(1);

                    // Skip some noisy logs
                    if (['messages', 'location', 'logs', 'alerts', 'analytics', 'audit-logs', 'health'].includes(moduleParam)) {
                        return;
                    }

                    if (module === 'Auth') {
                        if (req.originalUrl.includes('/login')) action = 'LOGIN';
                        if (req.originalUrl.includes('/register') || req.originalUrl.includes('/signup')) action = 'REGISTER';
                    }
                    if (module === 'Attendance' && req.method === 'POST') action = 'MARK_ATTENDANCE';

                    await AuditLog.create({
                        userId: req.user?._id || null,
                        userName: req.user?.name || 'System',
                        action,
                        module,
                        details: `${action} via ${req.method} ${req.originalUrl}`,
                        ipAddress: req.ip || req.connection?.remoteAddress || '',
                    });
                } catch (err) {
                    console.error('AuditLog middleware error:', err.message);
                }
            }
        });
    }
    next();
};

module.exports = auditLogger;
