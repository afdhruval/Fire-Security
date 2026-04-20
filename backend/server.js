const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// ── Start shift scheduler after DB connects ──────────────────────────────────
const { startScheduler } = require('./utils/scheduler');
startScheduler();
// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// ✅ CREATE SERVER FOR SOCKET
const server = http.createServer(app);

// ✅ SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ✅ MAKE IO GLOBAL (IMPORTANT)
app.set("io", io);

// SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

const auditLogger = require('./middleware/auditLogger');
app.use(auditLogger);

// Routes
app.use('/api/v1/auth',       require('./routes/authRoutes'));
app.use('/api/v1/dashboard',  require('./routes/dashboardRoutes'));  // ✅ Dashboard summary + on-duty-force (all roles)
app.use('/api/v1/clients',    require('./routes/clientRoutes'));
app.use('/api/v1/sites',      require('./routes/siteRoutes'));
app.use('/api/v1/guards',     require('./routes/guardRoutes'));
app.use('/api/v1/equipment',  require('./routes/equipmentRoutes'));
app.use('/api/v1/attendance', require('./routes/attendanceRoutes'));
app.use('/api/v1/salaries',   require('./routes/salaryRoutes'));
app.use('/api/v1/invoices',   require('./routes/invoiceRoutes'));
app.use('/api/v1/messages',   require('./routes/messageRoutes'));
app.use('/api/v1/location',   require('./routes/locationRoutes'));
app.use('/api/v1/reports',    require('./routes/reportRoutes'));

// New Modules
app.use('/api/v1/alerts',     require('./routes/alertRoutes'));
app.use('/api/v1/patrol',     require('./routes/patrolRoutes'));
app.use('/api/v1/analytics',  require('./routes/analyticsRoutes'));
app.use('/api/v1/audit-logs', require('./routes/auditLogRoutes'));
app.use('/api/v1/contracts',  require('./routes/contractRoutes'));

// ✅ ACTIVITY ROUTE
app.use('/api/v1/activities', require('./routes/activityRoutes'));

// ✅ GUARD LOCATION TRACKING (spec: POST /guard/location, GET /guard/location)
app.use('/api/v1/guard', require('./routes/locationRoutes'));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Krisha Fire API is running' });
});

// Error handler
app.use(errorHandler);

// ── Auto-reactivation cron job (runs every hour) ──────────────────────────────
// Finds all inactive guards whose reactivateAt has passed and sets them active.
// Uses only Node's built-in setInterval — no extra package needed.
const Guard = require('./models/Guard');
const Alert = require('./models/Alert');

const runReactivationJob = async () => {
  try {
    const now = new Date();

    // Find inactive guards whose scheduled reactivation time has passed
    const dueGuards = await Guard.find({
      status:       'inactive',
      reactivateAt: { $lte: now, $ne: null },
    });

    if (dueGuards.length === 0) return;

    for (const guard of dueGuards) {
      guard.status       = 'active';
      guard.reactivateAt = null;
      await guard.save();

      // Alert
      await Alert.create({
        type:    'guard',
        message: `Guard ${guard.name} has been automatically reactivated as scheduled.`,
        guardId: guard._id,
        status:  'unread',
      });

      // Emit socket so frontend updates live without refresh
      io.emit('guardStatusChanged', {
        guardId:      guard._id,
        status:       'active',
        reactivateAt: null,
      });

      console.log(`[Reactivation] Guard "${guard.name}" auto-reactivated at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error('[Reactivation cron error]', err.message);
  }
};

// Run once on startup, then every hour (3,600,000 ms)
runReactivationJob();
setInterval(runReactivationJob, 60 * 60 * 1000);
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5001;

// ✅ USE server.listen (NOT app.listen)
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});