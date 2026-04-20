import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Flame, Shield, AlertTriangle, CalendarDays, Search,
  SlidersHorizontal, Plus, Eye, Pencil, Trash2, ChevronLeft,
  ChevronRight, X, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import { formatDate } from '../utils/helpers';

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  Fire:     { color: '#DC2626', bg: '#FEE2E2', icon: Flame },
  Security: { color: '#3B82F6', bg: '#DBEAFE', icon: Shield },
  Incident: { color: '#F59E0B', bg: '#FEF3C7', icon: AlertTriangle },
  Daily:    { color: '#10B981', bg: '#D1FAE5', icon: CalendarDays },
  Monthly:  { color: '#8B5CF6', bg: '#EDE9FE', icon: FileText },
};

const STATUS_CONFIG = {
  Pending:     'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  Completed:   'bg-green-100 text-green-700 border border-green-200',
};

const SEVERITY_CONFIG = {
  Low:      'bg-gray-100 text-gray-600',
  Medium:   'bg-yellow-100 text-yellow-700',
  High:     'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
         style={{ backgroundColor: bg, color }}>
      <Icon size={22} strokeWidth={2} />
    </div>
    <div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── Delete confirmation modal ─────────────────────────────────────────────────
const DeleteModal = ({ report, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in-up">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Trash2 size={28} className="text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Report</h3>
      <p className="text-sm text-gray-500 text-center mb-6">
        Are you sure you want to delete <strong>"{report?.title}"</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Reports = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [total, setTotal]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    severity: '',
    from: '',
    to: '',
  });

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.search)   params.search   = filters.search;
      if (filters.type)     params.type     = filters.type;
      if (filters.status)   params.status   = filters.status;
      if (filters.severity) params.severity = filters.severity;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to;

      const res = await reportsApi.list(token, params);
      setReports(res.reports || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, filters]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const res = await reportsApi.analytics(token);
      setAnalytics(res.analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
    fetchAnalytics();
  }, [fetchReports, fetchAnalytics]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', status: '', severity: '', from: '', to: '' });
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportsApi.remove(token, deleteTarget._id);
      setDeleteTarget(null);
      fetchReports();
      fetchAnalytics();
    } catch (err) {
      alert(err.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="w-full min-h-full p-6 lg:p-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">{total} report{total !== 1 ? 's' : ''} found</p>
        </div>
        <button
          id="create-report-btn"
          onClick={() => navigate('/reports/create')}
          className="flex items-center gap-2 h-11 px-5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow transition-all hover:shadow-md active:scale-95">
          <Plus size={18} />
          New Report
        </button>
      </div>

      {/* Analytics strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Reports"    value={analytics.total}      icon={FileText}     color="#6B7280" bg="#F3F4F6" />
          <StatCard label="Pending"          value={analytics.pending}    icon={Clock}        color="#D97706" bg="#FEF3C7" />
          <StatCard label="Completed"        value={analytics.completed}  icon={CheckCircle2} color="#059669" bg="#D1FAE5" />
          <StatCard label="Fire Incidents"   value={analytics.fire}       icon={Flame}        color="#DC2626" bg="#FEE2E2" />
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="report-search"
              type="text"
              placeholder="Search by title, description or location…"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>

          {/* Filter toggle */}
          <button
            id="toggle-filters-btn"
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <select
              id="filter-type"
              value={filters.type}
              onChange={e => handleFilterChange('type', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30">
              <option value="">All Types</option>
              {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
            </select>

            <select
              id="filter-status"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30">
              <option value="">All Statuses</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>

            <select
              id="filter-severity"
              value={filters.severity}
              onChange={e => handleFilterChange('severity', e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/30">
              <option value="">All Severities</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>

            <div className="flex gap-2">
              <input type="date" id="filter-from" value={filters.from}
                onChange={e => handleFilterChange('from', e.target.value)}
                className="flex-1 h-10 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
              <input type="date" id="filter-to" value={filters.to}
                onChange={e => handleFilterChange('to', e.target.value)}
                className="flex-1 h-10 px-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <FileText size={48} strokeWidth={1} />
            <p className="mt-3 font-semibold">No reports found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs">Title</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs">Type</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs hidden md:table-cell">Severity</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs hidden lg:table-cell">Location</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-500 uppercase tracking-wide text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map(report => {
                  const tc = TYPE_CONFIG[report.type] || TYPE_CONFIG.Incident;
                  const Icon = tc.icon;
                  return (
                    <tr key={report._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 truncate max-w-[180px]">{report.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{report.createdBy?.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-lg text-xs font-semibold"
                             style={{ backgroundColor: tc.bg, color: tc.color }}>
                          <Icon size={13} />
                          {report.type}
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${SEVERITY_CONFIG[report.severity]}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-500 max-w-[140px] truncate">
                        {report.location}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell text-gray-500 whitespace-nowrap">
                        {formatDate(report.incidentDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CONFIG[report.status]}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`view-${report._id}`}
                            onClick={() => navigate(`/reports/${report._id}`)}
                            title="View"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                            <Eye size={16} />
                          </button>
                          <button
                            id={`edit-${report._id}`}
                            onClick={() => navigate(`/reports/${report._id}?edit=true`)}
                            title="Edit"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button
                            id={`delete-${report._id}`}
                            onClick={() => setDeleteTarget(report)}
                            title="Delete"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="prev-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button
              id="next-page-btn"
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          report={deleteTarget}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default Reports;
