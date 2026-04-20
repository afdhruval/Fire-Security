import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Power, CalendarClock } from 'lucide-react';
import { guardsApi, siteApi } from '../services/api';
import { hasPermission } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import Avatar from '../components/common/Avatar';

const emptyForm = {
  id:             null,
  name:           '',
  phone:          '',
  salary:         '',
  assignedSite:   '',
  shiftStartTime: '09:00',
  shiftHours:     8,
  status:         'inactive',
  reactivateAt:   '',
};

// ─── Shift End Time helper ────────────────────────────────────────────────────
const calcShiftEnd = (startTime, hours) => {
  if (!startTime) return '—';
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date();
  end.setHours(h + hours, m, 0, 0);
  return end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ─── Format datetime-local value from ISO string ──────────────────────────────
const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  // datetime-local needs "YYYY-MM-DDTHH:MM"
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Reactivation countdown label ────────────────────────────────────────────
const ReactivationLabel = ({ reactivateAt }) => {
  if (!reactivateAt) return null;
  const date = new Date(reactivateAt);
  if (isNaN(date)) return null;
  const now = new Date();
  const diffMs = date - now;

  let label = '';
  if (diffMs <= 0) {
    label = 'Reactivating soon…';
  } else {
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    if (diffH >= 24) {
      const diffD = Math.floor(diffH / 24);
      label = `in ${diffD}d ${diffH % 24}h`;
    } else if (diffH > 0) {
      label = `in ${diffH}h ${diffM}m`;
    } else {
      label = `in ${diffM}m`;
    }
  }

  return (
    <span className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold mt-0.5">
      <CalendarClock size={10} />
      {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
      {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
      <span className="text-orange-400 font-normal">({label})</span>
    </span>
  );
};

const Guards = () => {
  const { user, token } = useAuth();
  const [guards, setGuards]           = useState([]);
  const [sites, setSites]             = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [formData, setFormData]       = useState(emptyForm);
  const [togglingId, setTogglingId]   = useState(null); // tracks inline toggle loading

  // ── Status toggle modal state ─────────────────────────────────────────────
  const [statusModal, setStatusModal] = useState({ open: false, guard: null });
  const [scheduleDate, setScheduleDate] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const loadGuards = async () => {
    if (!token) return;
    try {
      const { guards: list } = await guardsApi.list(token);
      setGuards(list || []);
    } catch (err) { console.error(err); }
  };

  const loadSites = async () => {
    if (!token) return;
    try {
      const { sites: list } = await siteApi.list(token);
      setSites(list || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadGuards();
    loadSites();
  }, [token]);

  const openCreate = () => { setFormData(emptyForm); setShowModal(true); };

  const openEdit = (g) => {
    setFormData({
      id:             g._id,
      name:           g.name,
      phone:          g.phone,
      salary:         g.salary || '',
      assignedSite:   g.assignedSite?._id || '',
      shiftStartTime: g.shiftStartTime || '09:00',
      shiftHours:     g.shiftHours     || 8,
      status:         g.status         || 'inactive',
      reactivateAt:   toDatetimeLocal(g.reactivateAt),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assignedSite) return alert('Please select a site for the guard');
    try {
      const payload = {
        ...formData,
        salary:       Number(formData.salary),
        shiftHours:   Number(formData.shiftHours),
        // Only send reactivateAt when guard is inactive and a date was picked
        reactivateAt: (formData.status === 'inactive' && formData.reactivateAt)
          ? new Date(formData.reactivateAt).toISOString()
          : null,
      };
      if (formData.id) {
        await guardsApi.update(token, formData.id, payload);
      } else {
        await guardsApi.create(token, payload);
      }
      await loadGuards();
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!hasPermission(user.role, 'delete')) return alert('No permission');
    if (confirm('Delete this guard?')) {
      try {
        await guardsApi.remove(token, id);
        await loadGuards();
      } catch (err) { alert(err.message); }
    }
  };

  // ── Inline toggle: immediately flips status, no schedule ─────────────────
  const handleInlineToggle = async (guard) => {
    const newStatus = guard.status === 'active' ? 'inactive' : 'active';

    // If going inactive → open the schedule modal instead of toggling blindly
    if (newStatus === 'inactive') {
      setScheduleDate('');
      setStatusModal({ open: true, guard });
      return;
    }

    // If going active → just activate instantly
    setTogglingId(guard._id);
    try {
      const res = await guardsApi.toggleStatus(token, guard._id, { status: 'active', reactivateAt: null });
      const updated = res.guard || res;
      setGuards(prev => prev.map(g => g._id === updated._id ? updated : g));
    } catch (err) { alert(err.message); }
    setTogglingId(null);
  };

  // ── Confirm from status modal (inactive + optional schedule) ──────────────
  const handleConfirmInactive = async () => {
    if (!statusModal.guard) return;
    setStatusLoading(true);
    try {
      const res = await guardsApi.toggleStatus(token, statusModal.guard._id, {
        status:       'inactive',
        reactivateAt: scheduleDate ? new Date(scheduleDate).toISOString() : null,
      });
      const updated = res.guard || res;
      setGuards(prev => prev.map(g => g._id === updated._id ? updated : g));
      setStatusModal({ open: false, guard: null });
      setScheduleDate('');
    } catch (err) { alert(err.message); }
    setStatusLoading(false);
  };

  // ── Min datetime for the schedule picker (must be in the future) ──────────
  const minDatetime = (() => {
    const d = new Date(Date.now() + 60000); // at least 1 min in future
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const columns = [
    {
      header: 'Name',
      render: row => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} />
          <span className="font-semibold">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Phone',
      render: row => <span className="font-mono">{row.phone}</span>,
    },
    {
      header: 'Salary',
      render: row => <span className="font-mono">₹{row.salary?.toLocaleString()}</span>,
    },
    {
      header: 'Site',
      render: row => <span>{row.assignedSite?.siteName || 'Unassigned'}</span>,
    },

    // ── Shift column ──────────────────────────────────────────────────────
    {
      header: 'Shift',
      render: row => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-secondary-700">
            <Clock size={11} className="text-secondary-400" />
            {row.shiftStartTime || '09:00'}
            {' → '}
            {calcShiftEnd(row.shiftStartTime || '09:00', row.shiftHours || 8)}
          </div>
          <p className="text-[10px] text-secondary-400">{row.shiftHours || 8} hrs</p>
        </div>
      ),
    },

    // ── Status — inline toggle button ────────────────────────────────────
    {
      header: 'Status',
      render: row => {
        const isActive   = row.status === 'active';
        const isToggling = togglingId === row._id;
        return (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleInlineToggle(row)}
              disabled={isToggling}
              title={isActive ? 'Click to deactivate' : 'Click to activate'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 select-none
                ${isActive
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                }
                ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Power size={11} />
              {isToggling ? '…' : isActive ? 'Active' : 'Inactive'}
            </button>

            {/* Scheduled reactivation countdown */}
            {!isActive && row.reactivateAt && (
              <ReactivationLabel reactivateAt={row.reactivateAt} />
            )}

            {row.lastCheckIn && (
              <p className="text-[10px] text-secondary-400">
                In: {new Date(row.lastCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            )}
          </div>
        );
      },
    },

    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={Edit2} onClick={() => openEdit(row)} />
          {hasPermission(user.role, 'delete') && (
            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(row._id)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-900">Guard Management</h1>
          <p className="text-sm text-secondary-500 mt-2">
            Toggle status inline or schedule auto-reactivation when setting a guard inactive
          </p>
        </div>
        {hasPermission(user.role, 'create') && (
          <Button icon={Plus} onClick={openCreate}>Add Guard</Button>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700">
          ● Active: {guards.filter(g => g.status === 'active').length}
        </span>
        <span className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-xs font-semibold text-red-600">
          ○ Inactive: {guards.filter(g => g.status === 'inactive').length}
        </span>
        {guards.filter(g => g.status === 'inactive' && g.reactivateAt).length > 0 && (
          <span className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-600 flex items-center gap-1">
            <CalendarClock size={11} />
            Scheduled: {guards.filter(g => g.status === 'inactive' && g.reactivateAt).length}
          </span>
        )}
        <span className="px-3 py-1.5 bg-secondary-100 border border-secondary-200 rounded-full text-xs font-semibold text-secondary-600">
          Total: {guards.length}
        </span>
      </div>

      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden">
        <Table columns={columns} data={guards} emptyMessage="No guards yet" />
      </div>

      {/* ── Add / Edit Guard Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={formData.id ? 'Edit Guard' : 'Add New Guard'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Salary"
            type="number"
            min="0"
            value={formData.salary}
            onChange={e => setFormData({ ...formData, salary: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Site</label>
            <select
              value={formData.assignedSite}
              onChange={e => setFormData({ ...formData, assignedSite: e.target.value })}
              required
              className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm"
            >
              <option value="">Select Site</option>
              {sites.map(site => (
                <option key={site._id} value={site._id}>{site.siteName}</option>
              ))}
            </select>
          </div>

          {/* ── Shift fields ── */}
          <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider flex items-center gap-2">
              <Clock size={13} /> Shift Schedule
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Shift Start Time
                </label>
                <input
                  type="time"
                  value={formData.shiftStartTime}
                  onChange={e => setFormData({ ...formData, shiftStartTime: e.target.value })}
                  className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm focus:outline-none focus:border-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Shift Duration (hrs)
                </label>
                <select
                  value={formData.shiftHours}
                  onChange={e => setFormData({ ...formData, shiftHours: Number(e.target.value) })}
                  className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm focus:outline-none focus:border-red-400"
                >
                  {[4, 6, 8, 10, 12].map(h => (
                    <option key={h} value={h}>{h} hours</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Live preview */}
            <p className="text-xs text-secondary-500">
              Shift ends at:{' '}
              <span className="font-semibold text-secondary-700">
                {calcShiftEnd(formData.shiftStartTime, formData.shiftHours)}
              </span>
            </p>
          </div>

          {/* ── Status + Reactivation (edit only) ── */}
          {formData.id && (
            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 space-y-4">
              <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider flex items-center gap-2">
                <Power size={13} /> Guard Status
              </p>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">Status</label>
                <div className="flex gap-3">
                  {['active', 'inactive'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s, reactivateAt: s === 'active' ? '' : formData.reactivateAt })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200
                        ${formData.status === s
                          ? s === 'active'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-red-500 border-red-500 text-white'
                          : 'bg-white border-secondary-300 text-secondary-500 hover:border-secondary-400'
                        }`}
                    >
                      {s === 'active' ? '● Active' : '○ Inactive'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reactivation date — only shown when setting inactive */}
              {formData.status === 'inactive' && (
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-1 flex items-center gap-2">
                    <CalendarClock size={13} className="text-orange-500" />
                    Auto-Reactivate On <span className="text-secondary-400 font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    min={minDatetime}
                    value={formData.reactivateAt}
                    onChange={e => setFormData({ ...formData, reactivateAt: e.target.value })}
                    className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <p className="text-[11px] text-secondary-400 mt-1">
                    Leave empty for manual reactivation only
                  </p>
                </div>
              )}
            </div>
          )}

          <Button type="submit" fullWidth>
            {formData.id ? 'Update Guard' : 'Add Guard'}
          </Button>
        </form>
      </Modal>

      {/* ── Inline Status Toggle Modal (set inactive + optional schedule) ── */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => { setStatusModal({ open: false, guard: null }); setScheduleDate(''); }}
        title={`Deactivate — ${statusModal.guard?.name || ''}`}
        size="sm"
      >
        <div className="flex flex-col gap-5">

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            This guard will be marked <strong>Inactive</strong> immediately. You can optionally schedule an
            auto-reactivation date so the system brings them back automatically.
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-1 flex items-center gap-2">
              <CalendarClock size={13} className="text-orange-500" />
              Auto-Reactivate On <span className="text-secondary-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="datetime-local"
              min={minDatetime}
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm focus:outline-none focus:border-orange-400"
            />
            <p className="text-[11px] text-secondary-400 mt-1">
              Leave empty — you can reactivate manually anytime by clicking the status button
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStatusModal({ open: false, guard: null }); setScheduleDate(''); }}
              className="flex-1 border border-secondary-200 rounded-xl py-2.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmInactive}
              disabled={statusLoading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {statusLoading ? 'Saving…' : 'Confirm Inactive'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Guards;