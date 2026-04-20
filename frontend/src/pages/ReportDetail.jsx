import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Flame, Shield, AlertTriangle, CalendarDays, FileText,
  MapPin, User, Clock, CheckCircle2, ChevronRight, Pencil, Save, X, Image as ImgIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import { formatDate, formatTime } from '../utils/helpers';

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Fire:     { color: '#DC2626', bg: '#FEE2E2', icon: Flame },
  Security: { color: '#3B82F6', bg: '#DBEAFE', icon: Shield },
  Incident: { color: '#F59E0B', bg: '#FEF3C7', icon: AlertTriangle },
  Daily:    { color: '#10B981', bg: '#D1FAE5', icon: CalendarDays },
  Monthly:  { color: '#8B5CF6', bg: '#EDE9FE', icon: FileText },
};

const STATUS_FLOW = ['Pending', 'In Progress', 'Completed'];

const STATUS_CONFIG = {
  Pending:       { badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400' },
  'In Progress': { badge: 'bg-blue-100 text-blue-700 border border-blue-200',   dot: 'bg-blue-400'   },
  Completed:     { badge: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-400'  },
};

const SEVERITY_BADGE = {
  Low:      'bg-gray-100 text-gray-600',
  Medium:   'bg-yellow-100 text-yellow-700',
  High:     'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

// ─── Status stepper ───────────────────────────────────────────────────────────
const StatusStepper = ({ current, onAdvance, loading }) => {
  const idx = STATUS_FLOW.indexOf(current);
  const next = STATUS_FLOW[idx + 1];

  return (
    <div className="flex items-center gap-2 mt-4">
      {STATUS_FLOW.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        return (
          <div key={s} className="flex items-center gap-1.5 flex-1">
            <div className={`flex-1 h-1.5 rounded-full ${done || active ? (s === 'Completed' ? 'bg-green-400' : s === 'In Progress' ? 'bg-blue-400' : 'bg-yellow-400') : 'bg-gray-200'}`} />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
              ${active ? (s === 'Completed' ? 'bg-green-500' : s === 'In Progress' ? 'bg-blue-500' : 'bg-yellow-500') : done ? 'bg-gray-400' : 'bg-gray-200 text-gray-400'}`}>
              {done ? '✓' : i + 1}
            </div>
          </div>
        );
      })}
      {next && (
        <button
          id="advance-status-btn"
          onClick={() => onAdvance(next)}
          disabled={loading}
          className="ml-3 flex items-center gap-1.5 h-9 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex-shrink-0">
          {loading ? '…' : <>Mark {next} <ChevronRight size={13} /></>}
        </button>
      )}
    </div>
  );
};

// ─── Timeline entry ───────────────────────────────────────────────────────────
const TimelineEntry = ({ entry, isLast }) => {
  const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG['Pending'];
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cfg.badge}`}>{entry.status}</span>
          <span className="text-xs text-gray-400">{formatDate(entry.changedAt)} {formatTime(entry.changedAt)}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
        {entry.changedBy?.name && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <User size={11} /> {entry.changedBy.name}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Edit modal ───────────────────────────────────────────────────────────────
const EditModal = ({ report, token, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title:       report.title,
    description: report.description,
    location:    report.location,
    severity:    report.severity,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      setErr('Title, description and location are required');
      return;
    }
    setSaving(true);
    try {
      const res = await reportsApi.update(token, report._id, form);
      onSaved(res.report);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-slide-in-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Edit Report</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={4} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Severity</label>
              <select value={form.severity} onChange={e => set('severity', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30">
                {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {err && <p className="text-xs text-red-500 mt-3">{err}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ReportDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [showEdit, setShowEdit]   = useState(searchParams.get('edit') === 'true');
  const [imgIdx, setImgIdx]       = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await reportsApi.get(token, id);
        setReport(res.report);
      } catch {
        navigate('/reports');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token, id, navigate]);

  const advanceStatus = async (nextStatus) => {
    setAdvancing(true);
    try {
      const res = await reportsApi.update(token, id, {
        status: nextStatus,
        note: `Status advanced to ${nextStatus}`,
      });
      setReport(res.report);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) return null;

  const tc    = TYPE_CONFIG[report.type] || TYPE_CONFIG.Incident;
  const Icon  = tc.icon;
  const scfg  = STATUS_CONFIG[report.status] || STATUS_CONFIG['Pending'];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">

      {/* Back */}
      <button
        id="back-to-reports"
        onClick={() => navigate('/reports')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Reports
      </button>

      {/* Hero banner */}
      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start gap-4"
           style={{ backgroundColor: tc.bg }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{ backgroundColor: tc.color }}>
          <Icon size={32} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: tc.color, color: '#fff' }}>{report.type}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${SEVERITY_BADGE[report.severity]}`}>
              {report.severity}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${scfg.badge}`}>
              {report.status}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {report.location}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} /> {formatDate(report.incidentDate)}</span>
            <span className="flex items-center gap-1.5"><User size={13} /> {report.createdBy?.name}</span>
          </div>
        </div>

        <button
          id="edit-report-btn"
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 h-10 px-4 bg-white/70 hover:bg-white border border-white/50 rounded-xl text-sm font-semibold text-gray-700 transition-all shadow-sm flex-shrink-0">
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Main left column ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>

          {/* Images */}
          {report.images?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <ImgIcon size={14} /> Photos ({report.images.length})
              </h2>
              {/* Main image */}
              <div className="rounded-xl overflow-hidden aspect-video bg-gray-100 mb-3">
                <img src={report.images[imgIdx]} alt="report" className="w-full h-full object-cover" />
              </div>
              {/* Thumbnails */}
              {report.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {report.images.map((url, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === imgIdx ? 'border-red-500' : 'border-transparent'}`}>
                      <img src={url} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Activity Timeline</h2>
            {report.timeline?.length > 0 ? (
              <div>
                {report.timeline.map((entry, i) => (
                  <TimelineEntry key={i} entry={entry} isLast={i === report.timeline.length - 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No timeline entries yet.</p>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">

          {/* Status management */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} /> Status
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${scfg.dot}`} />
              <span className="font-semibold text-gray-900">{report.status}</span>
            </div>
            <StatusStepper current={report.status} onAdvance={advanceStatus} loading={advancing} />
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Report ID',    value: `#${report._id.slice(-6).toUpperCase()}` },
                { label: 'Type',         value: report.type },
                { label: 'Severity',     value: report.severity },
                { label: 'Location',     value: report.location },
                { label: 'Created by',   value: report.createdBy?.name },
                { label: 'Role',         value: report.createdBy?.role },
                { label: 'Created at',   value: formatDate(report.createdAt) },
                { label: 'Last updated', value: formatDate(report.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-gray-400 text-xs font-medium flex-shrink-0">{label}</dt>
                  <dd className="font-semibold text-gray-900 text-right truncate">{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditModal
          report={report}
          token={token}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setReport(updated)}
        />
      )}
    </div>
  );
};

export default ReportDetail;
