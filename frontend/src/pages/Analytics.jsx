import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, UserCheck, UserX, Calendar, AlertTriangle, TrendingUp,
  DollarSign, CheckCircle2, XCircle, Activity
} from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const StatCard = ({ label, value, sub, icon: Icon, color, gradient }) => (
  <div className={`rounded-2xl p-5 text-white ${gradient} shadow-lg flex items-center gap-4`}>
    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold mt-0.5">{value}</p>
      {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [guardStatus, setGuardStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [s, i, a, g] = await Promise.all([
          axios.get(`${API}/analytics/summary`, getHeaders()),
          axios.get(`${API}/analytics/incidents-per-month`, getHeaders()),
          axios.get(`${API}/analytics/attendance-trend`, getHeaders()),
          axios.get(`${API}/analytics/guard-status`, getHeaders()),
        ]);
        setSummary(s.data.data);
        setIncidents(i.data.data);
        setAttendance(a.data.data);
        setGuardStatus(g.data.data.map(d => ({ name: d._id, value: d.count })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-extrabold text-secondary-900">Analytics Dashboard</h1>
        <p className="text-secondary-500 text-sm mt-1">Live overview of guards, attendance & incidents</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Guards" value={summary?.guards?.total ?? '–'}
          sub={`${summary?.guards?.active ?? 0} active`}
          icon={Users} gradient="bg-gradient-to-br from-primary-500 to-primary-700"
        />
        <StatCard
          label="Attendance Rate" value={`${summary?.attendance?.rate ?? 0}%`}
          sub={`${summary?.attendance?.present ?? 0} / ${summary?.attendance?.total ?? 0} days`}
          icon={Calendar} gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <StatCard
          label="Total Incidents" value={summary?.incidents?.total ?? '–'}
          sub={`${summary?.incidents?.open ?? 0} open`}
          icon={AlertTriangle} gradient="bg-gradient-to-br from-red-500 to-red-700"
        />
        <StatCard
          label="Invoices" value={summary?.invoices?.total ?? '–'}
          sub={`${summary?.invoices?.paid ?? 0} paid · ${summary?.invoices?.unpaid ?? 0} unpaid`}
          icon={DollarSign} gradient="bg-gradient-to-br from-amber-500 to-amber-700"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents per Month */}
        <div className="bg-white rounded-2xl border border-secondary-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-primary-600" />
            <h2 className="text-sm font-bold text-secondary-900">Incidents Per Month</h2>
          </div>
          {incidents.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-secondary-400 text-sm">No incident data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incidents}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Guard Status Pie */}
        <div className="bg-white rounded-2xl border border-secondary-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users size={18} className="text-primary-600" />
            <h2 className="text-sm font-bold text-secondary-900">Guard Status Breakdown</h2>
          </div>
          {guardStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-secondary-400 text-sm">No guard data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={guardStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {guardStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-2xl border border-secondary-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-primary-600" />
          <h2 className="text-sm font-bold text-secondary-900">Attendance Trend (Last 7 Days)</h2>
        </div>
        {attendance.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-secondary-400 text-sm">No attendance data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendance}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#presentGrad)" strokeWidth={2} name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#absentGrad)" strokeWidth={2} name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Analytics;
