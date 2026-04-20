import { useEffect, useState } from 'react';
import {
  Shield, UserCheck, DollarSign, Flame,
  Clock, AlertCircle, CheckCircle2, FileText,
  Plus, Pencil, Trash2, Eye, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  guardsApi, equipmentApi, attendanceApi,
  salariesApi, reportsApi, activitiesApi, dashboardApi
} from '../services/api';
import Modal from '../components/common/Modal';
import CardDetail from '../components/common/CardDetail';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isOverdue = (a) => a.status === 'upcoming' && a.time && new Date(a.time) < new Date();

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const map = {
    low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-600' },
    medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    high: { label: 'High', bg: 'bg-red-100', text: 'text-red-700' },
  };
  const p = map[priority] || map.medium;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>{p.label}</span>;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, overdue }) => {
  if (overdue) return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 inline-flex items-center gap-1">
      <AlertTriangle size={10} /> Overdue
    </span>
  );
  const map = {
    today: { label: 'Today', bg: 'bg-red-100', text: 'text-red-600' },
    upcoming: { label: 'Upcoming', bg: 'bg-blue-100', text: 'text-blue-600' },
    completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-600' },
  };
  const s = map[status] || map.today;
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subValue, subLabel, color, bgColor, onClick }) => (
  <div
    className={`bg-white border border-secondary-200 rounded-2xl p-6 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-secondary-300 select-none' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start gap-4 mb-5">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bgColor, color }}>
        <Icon size={28} strokeWidth={2} />
      </div>
      <p className="flex-1 text-xs font-bold text-secondary-500 uppercase tracking-wider">{label}</p>
      {onClick && <span className="text-[10px] font-bold text-secondary-300 uppercase tracking-wider self-start mt-1">Details →</span>}
    </div>
    {subValue !== undefined ? (
      <div className="flex gap-8">
        <div>
          <p className="text-4xl font-extrabold">{value}</p>
          <p className="text-xs font-semibold text-secondary-500 mt-1">{subLabel}</p>
        </div>
        <div>
          <p className="text-4xl font-extrabold">{subValue}</p>
          <p className="text-xs font-semibold text-secondary-500 mt-1">ABSENT</p>
        </div>
      </div>
    ) : (
      <p className="text-5xl font-extrabold">{value}</p>
    )}
  </div>
);

// ─── Activity Count Card ──────────────────────────────────────────────────────
const ActivityCard = ({ icon: Icon, count, label, color, onClick, overdueCount }) => (
  <div
    className="h-[200px] bg-white border border-secondary-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-secondary-300 transition-all duration-200 select-none relative"
    onClick={onClick}
  >
    {overdueCount > 0 && (
      <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <AlertTriangle size={10} /> {overdueCount} Overdue
      </span>
    )}
    <div className="w-16 h-16 flex items-center justify-center" style={{ color }}>
      <Icon size={64} strokeWidth={1.5} />
    </div>
    <p className="text-6xl font-extrabold">{count}</p>
    <p className="text-xs font-bold text-secondary-500 uppercase text-center">{label}</p>
  </div>
);

// ─── Completion Note Modal ────────────────────────────────────────────────────
const CompletionNoteModal = ({ onConfirm, onCancel, loading }) => {
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-secondary-600">Add an optional note about how this activity was completed.</p>
      <textarea
        className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"
        rows={4}
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="e.g. Completed successfully, all equipment checked..."
        autoFocus
      />
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 border border-secondary-200 rounded-xl py-2.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-50 transition-colors">Cancel</button>
        <button onClick={() => onConfirm(note)} disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : 'Mark as Completed'}
        </button>
      </div>
    </div>
  );
};

// ─── Add / Edit Activity Form ─────────────────────────────────────────────────
const ActivityForm = ({ initial, onSubmit, onClose, loading, guards }) => {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    time: initial?.time ? initial.time.slice(0, 16) : '',
    location: initial?.location || '',
    priority: initial?.priority || 'medium',
    assignedGuardId: initial?.assignedGuard?.guardId || '',
    status: initial?.status || 'today',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.time.trim()) return;
    const selectedGuard = guards.find(g => g._id === form.assignedGuardId);
    const assignedGuard = selectedGuard
      ? { name: selectedGuard.name, guardId: selectedGuard._id }
      : { name: '', guardId: null };
    onSubmit({ title: form.title, description: form.description, time: form.time, location: form.location, priority: form.priority, assignedGuard, status: form.status });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Title *</label>
        <input className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Fire drill inspection" required />
      </div>
      <div>
        <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Description</label>
        <textarea className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Date & Time *</label>
          <input type="datetime-local" className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" value={form.time} onChange={e => set('time', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Priority</label>
          <select className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Status</label>
          <select className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Location / Site</label>
          <input className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Site A" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Assigned Guard</label>
        <select className="w-full border border-secondary-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white" value={form.assignedGuardId} onChange={e => set('assignedGuardId', e.target.value)}>
          <option value="">— Select Guard —</option>
          {guards.filter(g => g.status === 'active').map(g => (
            <option key={g._id} value={g._id}>{g.name}{g.assignedSite?.siteName ? ` — ${g.assignedSite.siteName}` : ''}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border border-secondary-200 rounded-xl py-2.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-50 transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Activity'}
        </button>
      </div>
    </form>
  );
};

// ─── View Activity Detail ─────────────────────────────────────────────────────
const ActivityDetail = ({ activity }) => {
  const overdue = isOverdue(activity);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={activity.status} overdue={overdue} />
        <PriorityBadge priority={activity.priority} />
      </div>
      <div>
        <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Title</p>
        <p className="text-sm font-semibold">{activity.title}</p>
      </div>
      {activity.description && (
        <div>
          <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Description</p>
          <p className="text-sm text-secondary-600">{activity.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Date & Time</p>
          <p className={`text-sm ${overdue ? 'text-orange-600 font-semibold' : ''}`}>
            {activity.time ? new Date(activity.time).toLocaleString() : '—'}{overdue && ' ⚠'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Location</p>
          <p className="text-sm">{activity.location || '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Assigned To</p>
          <p className="text-sm font-medium">{activity.assignedGuard?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Assigned By</p>
          <p className="text-sm font-medium">
            {activity.addedBy?.name || '—'}
            {activity.addedBy?.role ? <span className="text-secondary-400 font-normal"> ({activity.addedBy.role})</span> : ''}
          </p>
        </div>
      </div>
      {activity.completionNote && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-xs font-bold text-green-600 uppercase mb-1">Completion Note</p>
          <p className="text-sm text-green-700">{activity.completionNote}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-secondary-400 uppercase mb-1">Created At</p>
        <p className="text-sm">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '—'}</p>
      </div>
    </div>
  );
};

// ─── Activity List Modal Content ──────────────────────────────────────────────
const ActivityListDetail = ({ label, color, bgColor, activities, onView, onEdit, onDelete, onMarkComplete }) => (
  <div className="flex flex-col gap-4">
    <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: bgColor }}>
      <p className="text-5xl font-extrabold" style={{ color }}>{activities.length}</p>
      <p className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color }}>TOTAL {label}</p>
    </div>
    <div className="bg-blue-50 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <span className="text-xs font-bold" style={{ color }}>✦</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>ACTIVITY SUMMARY</p>
      </div>
      {activities.length === 0
        ? <p className="text-sm text-secondary-400 py-4 text-center">No activities</p>
        : activities.map(a => (
          <div key={a._id} className="bg-white rounded-xl px-3 mb-2 last:mb-0">
            <ActivityRow activity={a} onView={onView} onEdit={onEdit} onDelete={onDelete} onMarkComplete={onMarkComplete} />
          </div>
        ))
      }
    </div>
  </div>
);

// ─── Activity Row — shows Assigned To / By / Priority / Overdue ──────────────
const ActivityRow = ({ activity, onView, onEdit, onDelete, onMarkComplete }) => {
  const overdue = isOverdue(activity);
  return (
    <div className={`flex items-start justify-between gap-4 py-3 border-b border-secondary-100 last:border-0 ${overdue ? 'bg-orange-50 rounded-xl px-2 -mx-2' : ''}`}>
      <div className="flex flex-col gap-1 flex-1 min-w-0">

        {/* Row 1: Title + Status + Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{activity.title}</p>
          <StatusBadge status={activity.status} overdue={overdue} />
          <PriorityBadge priority={activity.priority} />
        </div>

        {/* Row 2: Time + Location */}
        <div className="flex items-center gap-3 flex-wrap">
          {activity.time && (
            <p className={`text-xs ${overdue ? 'text-orange-500 font-semibold' : 'text-secondary-400'}`}>
              🕐 {new Date(activity.time).toLocaleString()}
            </p>
          )}
          {activity.location && (
            <p className="text-xs text-secondary-400">📍 {activity.location}</p>
          )}
        </div>

        {/* Row 3: Assigned To + Assigned By */}
        <div className="flex items-center gap-4 flex-wrap">
          {activity.assignedGuard?.name && (
            <p className="text-xs text-secondary-500">
              <span className="font-bold text-secondary-400">Assigned to:</span>{' '}
              <span className="font-semibold text-secondary-700">👤 {activity.assignedGuard.name}</span>
            </p>
          )}
          {activity.addedBy?.name && (
            <p className="text-xs text-secondary-500">
              <span className="font-bold text-secondary-400">By:</span>{' '}
              <span className="font-semibold text-secondary-700">➕ {activity.addedBy.name}</span>
              {activity.addedBy.role && <span className="text-secondary-400"> ({activity.addedBy.role})</span>}
            </p>
          )}
        </div>

        {/* Row 4: Completion note */}
        {activity.completionNote && (
          <p className="text-xs text-green-600 bg-green-50 rounded-lg px-2 py-1 mt-0.5">
            📝 {activity.completionNote}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {activity.status !== 'completed' && (
          <button onClick={() => onMarkComplete(activity._id)} title="Mark as Completed" className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors">
            <CheckCircle2 size={16} />
          </button>
        )}
        <button onClick={() => onView(activity)} title="View Details" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Eye size={16} /></button>
        <button onClick={() => onEdit(activity)} title="Edit" className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 transition-colors"><Pencil size={16} /></button>
        <button onClick={() => onDelete(activity._id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, token } = useAuth();

  const [stats, setStats] = useState({ onDuty: 0, present: 0, absent: 0, billing: 0, equipment: 0 });
  const [reportStats, setReportStats] = useState({ total: 0, pending: 0, completed: 0, fire: 0 });
  const [rawGuards, setRawGuards] = useState([]);
  const [onDutyGuards, setOnDutyGuards] = useState([]);  // TASK 2: active guard list for On Duty modal
  const [rawEquipment, setRawEquipment] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [rawSalaries, setRawSalaries] = useState([]);

  const [modal, setModal] = useState({ open: false, type: null, title: '' });
  const openModal = (type, title) => setModal({ open: true, type, title });
  const closeModal = () => setModal({ open: false, type: null, title: '' });

  const [activities, setActivities] = useState([]);
  const [actModal, setActModal] = useState({ open: false, mode: null, activity: null });
  const [actLoading, setActLoading] = useState(false);
  const openActModal = (mode, activity = null) => setActModal({ open: true, mode, activity });
  const closeActModal = () => setActModal({ open: false, mode: null, activity: null });

  const [listModal, setListModal] = useState({ open: false, type: null });
  const openListModal = (type) => setListModal({ open: true, type });
  const closeListModal = () => setListModal({ open: false, type: null });

  const [noteModal, setNoteModal] = useState({ open: false, id: null });
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        // ── Always fetch on-duty count from the dedicated safe endpoint ──────
        // This works for ALL roles (CEO, HR, Employee) without needing guard module access.
        const [onDutyRes, onDutyGuardsRes, equipRes, attRes, salRes, repRes, actRes] = await Promise.all([
          dashboardApi.onDutyForce(token).catch(() => ({ onDutyForce: 0 })),
          dashboardApi.onDutyGuards(token).catch(() => ({ guards: [] })),  // TASK 2: fetch guard list
          equipmentApi.list(token).catch(() => ({ equipment: [] })),
          attendanceApi.getByDate(token, new Date().toISOString().split('T')[0]).catch(() => ({ records: [] })),
          salariesApi.list(token).catch(() => ({ salaries: [] })),
          reportsApi.analytics(token).catch(() => ({ analytics: { total: 0, pending: 0, completed: 0, fire: 0 } })),
          activitiesApi.list(token).catch(() => ({ activities: [] })),
        ]);

        const equipment = equipRes.equipment || [];
        const attendance = attRes.records || [];
        const salaries = salRes.salaries || [];

        // TASK 2: store on-duty guards list (works for all roles via dedicated endpoint)
        setOnDutyGuards(onDutyGuardsRes.guards || []);

        // Guards list — only available for CEO + HR; Employee uses onDutyRes count
        let guards = [];
        try {
          const guardsRes = await guardsApi.list(token);
          guards = guardsRes.guards || [];
        } catch {
          // Employee role will get 403 here — that's fine, we use onDutyRes instead
          guards = [];
        }

        setRawGuards(guards);
        setRawEquipment(equipment);
        setRawAttendance(attendance);
        setRawSalaries(salaries);

        setStats({
          // Use dedicated endpoint count as primary — guaranteed to be a number
          onDuty: typeof onDutyRes.onDutyForce === 'number'
            ? onDutyRes.onDutyForce
            : guards.filter(g => g.status === 'active').length,
          present: attendance.filter(a => a.status === 'present').length,
          absent: attendance.filter(a => a.status === 'absent').length,
          billing: salaries.reduce((sum, s) => sum + (Number(s.totalSalary) || 0), 0),
          equipment: equipment.length,
        });

        if (repRes.analytics) {
          setReportStats({
            total: repRes.analytics.total || 0,
            pending: repRes.analytics.pending || 0,
            completed: repRes.analytics.completed || 0,
            fire: repRes.analytics.fire || 0,
          });
        }
        // TASK 5: normalize activities — handle both { activities: [] } and bare []
        const actList = Array.isArray(actRes) ? actRes : (actRes.activities || []);
        setActivities(actList);
      } catch (err) { console.error('Dashboard load error:', err); }
    };
    load();
  }, [token]);

  const todayActivities = activities.filter(a => a.status === 'today');
  const upcomingActivities = activities.filter(a => a.status === 'upcoming');
  const completedActivities = activities.filter(a => a.status === 'completed');
  const overdueCount = upcomingActivities.filter(isOverdue).length;

  const listModalConfig = {
    today: { label: 'TODAY ACTIVITIES', color: '#DC2626', bgColor: '#FEE2E2', list: todayActivities },
    upcoming: { label: 'UPCOMING ACTIVITIES', color: '#3B82F6', bgColor: '#DBEAFE', list: upcomingActivities },
    completed: { label: 'COMPLETED ACTIVITIES', color: '#10B981', bgColor: '#D1FAE5', list: completedActivities },
  };
  const currentList = listModal.type ? listModalConfig[listModal.type] : null;

  const handleAddActivity = async (form) => {
    setActLoading(true);
    try {
      const res = await activitiesApi.create(token, form);
      // TASK 5: ensure we always get a proper activity object
      const newActivity = res?.activity || res;
      if (newActivity && newActivity._id) {
        setActivities(prev => [newActivity, ...prev]);
      }
      closeActModal();
    } catch (err) { console.error(err); }
    setActLoading(false);
  };

  const handleEditActivity = async (form) => {
    setActLoading(true);
    try {
      const res = await activitiesApi.update(token, actModal.activity._id, form);
      const updated = res.activity || res;
      setActivities(prev => prev.map(a => a._id === updated._id ? updated : a));
      closeActModal();
    } catch (err) { console.error(err); }
    setActLoading(false);
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try {
      await activitiesApi.delete(token, id);
      setActivities(prev => prev.filter(a => a._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleMarkComplete = (id) => setNoteModal({ open: true, id });

  const handleConfirmComplete = async (note) => {
    setNoteLoading(true);
    try {
      const res = await activitiesApi.update(token, noteModal.id, { status: 'completed', completionNote: note });
      const updated = res.activity || res;
      setActivities(prev => prev.map(a => a._id === updated._id ? updated : a));
      setNoteModal({ open: false, id: null });
    } catch (err) { console.error(err); }
    setNoteLoading(false);
  };

  const getModalData = () => {
    switch (modal.type) {
      case 'attendance': return { present: stats.present, absent: stats.absent, guards: rawAttendance.map(a => ({ name: a.guardName || a.guard?.name || `Guard #${a.guard}`, status: a.status })) };
      case 'reports': return { ...reportStats };
      case 'billing': return { total: stats.billing, invoices: rawSalaries.map(s => ({ label: s.guardName || s.guard?.name || `Salary #${String(s._id).slice(-4)}`, amount: Number(s.totalSalary) || 0, status: s.status || 'paid' })) };
      case 'equipment': return { total: stats.equipment, items: rawEquipment.map(e => ({ name: e.name || e.type || 'Unknown', condition: e.condition || e.status || 'Good', status: e.status })) };
      // TASK 2: use onDutyGuards fetched from dedicated all-role endpoint
      case 'on-duty': return { total: stats.onDuty, guards: onDutyGuards };
      default: return {};
    }
  };

  const actModalTitle = actModal.mode === 'add' ? 'Add Activity' : actModal.mode === 'edit' ? 'Edit Activity' : 'Activity Details';

  // ─── PREVIEW LIMIT: show only 1 activity per column in the overview box ───
  const PREVIEW_LIMIT = 1;

  return (
    <div className="w-full min-h-full p-6 lg:p-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Shield} label="ON-DUTY FORCE" value={stats.onDuty} color="#DC2626" bgColor="#FEE2E2" onClick={() => openModal('on-duty', 'On-Duty Force')} />
        <StatCard icon={UserCheck} label="TODAY ATTENDANCE" value={stats.present} subValue={stats.absent} subLabel="PRESENT" color="#10B981" bgColor="#D1FAE5" onClick={() => openModal('attendance', 'Today Attendance')} />
        <StatCard icon={DollarSign} label="BILLING" value={`₹ ${stats.billing}`} color="#3B82F6" bgColor="#DBEAFE" onClick={() => openModal('billing', 'Billing')} />
        <StatCard icon={Flame} label="EQUIPMENT" value={stats.equipment} color="#F59E0B" bgColor="#FEF3C7" onClick={() => openModal('equipment', 'Fire Equipment')} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Activities</h2>
        <button onClick={() => openActModal('add')} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors duration-200">
          <Plus size={16} /> Add Activity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ActivityCard icon={Clock} count={todayActivities.length} label="TODAY ACTIVITY" color="#DC2626" onClick={() => openListModal('today')} />
        <ActivityCard icon={AlertCircle} count={upcomingActivities.length} label="UPCOMING ACTIVITY" color="#3B82F6" onClick={() => openListModal('upcoming')} overdueCount={overdueCount} />
        <ActivityCard icon={CheckCircle2} count={completedActivities.length} label="COMPLETED ACTIVITY" color="#10B981" onClick={() => openListModal('completed')} />
      </div>

      {/* ── Activity Overview Box ─────────────────────────────────────────── */}
      <div className="bg-white border border-secondary-200 rounded-2xl p-6 shadow-sm mb-10">
        <h3 className="text-lg font-bold mb-5">Activity Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-secondary-100">

          {/* ── TODAY column ── */}
          <div className="pb-4 md:pb-0 md:pr-6">
            <p className="text-sm font-bold text-red-500 mb-3">
              Today <span className="text-secondary-400 font-normal">({todayActivities.length})</span>
            </p>
            {todayActivities.length === 0
              ? <p className="text-sm text-secondary-400">No activities</p>
              : <>
                {todayActivities.slice(0, PREVIEW_LIMIT).map(a => (
                  <ActivityRow
                    key={a._id}
                    activity={a}
                    onView={() => openActModal('view', a)}
                    onEdit={() => openActModal('edit', a)}
                    onDelete={handleDeleteActivity}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
                {todayActivities.length > PREVIEW_LIMIT && (
                  <button
                    onClick={() => openListModal('today')}
                    className="mt-3 w-full text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl py-2 transition-colors duration-200"
                  >
                    Show More ({todayActivities.length - PREVIEW_LIMIT} more) →
                  </button>
                )}
              </>
            }
          </div>

          {/* ── UPCOMING column ── */}
          <div className="py-4 md:py-0 md:px-6">
            <p className="text-sm font-bold text-blue-500 mb-3">
              Upcoming <span className="text-secondary-400 font-normal">({upcomingActivities.length})</span>
              {overdueCount > 0 && (
                <span className="ml-2 text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </p>
            {upcomingActivities.length === 0
              ? <p className="text-sm text-secondary-400">No activities</p>
              : <>
                {upcomingActivities.slice(0, PREVIEW_LIMIT).map(a => (
                  <ActivityRow
                    key={a._id}
                    activity={a}
                    onView={() => openActModal('view', a)}
                    onEdit={() => openActModal('edit', a)}
                    onDelete={handleDeleteActivity}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
                {upcomingActivities.length > PREVIEW_LIMIT && (
                  <button
                    onClick={() => openListModal('upcoming')}
                    className="mt-3 w-full text-xs font-bold text-blue-500 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl py-2 transition-colors duration-200"
                  >
                    Show More ({upcomingActivities.length - PREVIEW_LIMIT} more) →
                  </button>
                )}
              </>
            }
          </div>

          {/* ── COMPLETED column ── */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <p className="text-sm font-bold text-green-500 mb-3">
              Completed <span className="text-secondary-400 font-normal">({completedActivities.length})</span>
            </p>
            {completedActivities.length === 0
              ? <p className="text-sm text-secondary-400">No activities</p>
              : <>
                {completedActivities.slice(0, PREVIEW_LIMIT).map(a => (
                  <ActivityRow
                    key={a._id}
                    activity={a}
                    onView={() => openActModal('view', a)}
                    onEdit={() => openActModal('edit', a)}
                    onDelete={handleDeleteActivity}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
                {completedActivities.length > PREVIEW_LIMIT && (
                  <button
                    onClick={() => openListModal('completed')}
                    className="mt-3 w-full text-xs font-bold text-green-500 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl py-2 transition-colors duration-200"
                  >
                    Show More ({completedActivities.length - PREVIEW_LIMIT} more) →
                  </button>
                )}
              </>
            }
          </div>

        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Report Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard icon={FileText} label="TOTAL REPORTS" value={reportStats.total} color="#6B7280" bgColor="#F3F4F6" onClick={() => openModal('reports', 'Reports Overview')} />
          <StatCard icon={Clock} label="PENDING REPORTS" value={reportStats.pending} color="#D97706" bgColor="#FEF3C7" onClick={() => openModal('reports', 'Pending Reports')} />
          <StatCard icon={CheckCircle2} label="COMPLETED REPORTS" value={reportStats.completed} color="#059669" bgColor="#D1FAE5" onClick={() => openModal('reports', 'Completed Reports')} />
          <StatCard icon={Flame} label="FIRE INCIDENTS" value={reportStats.fire} color="#DC2626" bgColor="#FEE2E2" onClick={() => openModal('reports', 'Fire Incidents')} />
        </div>
      </div>

      {/* TASK 3: Map removed from dashboard — kept in GuardTracker module only */}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.title} size="lg">
        {modal.type && <CardDetail title={modal.title} type={modal.type} data={getModalData()} />}
      </Modal>

      <Modal isOpen={listModal.open} onClose={closeListModal} title={currentList?.label || ''} size="lg">
        {currentList && (
          <ActivityListDetail
            label={currentList.label} color={currentList.color} bgColor={currentList.bgColor} activities={currentList.list}
            onView={(a) => { closeListModal(); openActModal('view', a); }}
            onEdit={(a) => { closeListModal(); openActModal('edit', a); }}
            onDelete={handleDeleteActivity}
            onMarkComplete={handleMarkComplete}
          />
        )}
      </Modal>

      <Modal isOpen={actModal.open} onClose={closeActModal} title={actModalTitle} size="md">
        {actModal.mode === 'view' && actModal.activity && <ActivityDetail activity={actModal.activity} />}
        {actModal.mode === 'add' && <ActivityForm guards={rawGuards} onSubmit={handleAddActivity} onClose={closeActModal} loading={actLoading} />}
        {actModal.mode === 'edit' && actModal.activity && <ActivityForm initial={actModal.activity} guards={rawGuards} onSubmit={handleEditActivity} onClose={closeActModal} loading={actLoading} />}
      </Modal>

      <Modal isOpen={noteModal.open} onClose={() => setNoteModal({ open: false, id: null })} title="Mark as Completed" size="sm">
        <CompletionNoteModal loading={noteLoading} onConfirm={handleConfirmComplete} onCancel={() => setNoteModal({ open: false, id: null })} />
      </Modal>

    </div>
  );
};

export default Dashboard;