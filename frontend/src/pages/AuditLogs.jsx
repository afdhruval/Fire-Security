import { useState, useEffect } from 'react';
import { Search, Filter, LogIn, Pencil, Trash2, Info, Shield, User, List, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });

const ACTION_COLORS = {
  LOGIN: 'bg-blue-100 text-blue-700',
  REGISTER: 'bg-purple-100 text-purple-700',
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  MARK_ATTENDANCE: 'bg-orange-100 text-orange-700',
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ module: '', action: '' });
  const [search, setSearch] = useState('');
  const LIMIT = 20;

  const fetchLogs = async (pg = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pg, limit: LIMIT });
      if (filters.module) params.append('module', filters.module);
      if (filters.action) params.append('action', filters.action);
      const res = await axios.get(`${API}/audit-logs?${params}`, getHeaders());
      setLogs(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); setPage(1); }, [filters]);
  useEffect(() => { fetchLogs(page); }, [page]);

  const cleanup = async () => {
    if (!confirm('Delete audit logs older than 90 days?')) return;
    const res = await axios.delete(`${API}/audit-logs/cleanup`, getHeaders());
    alert(`Deleted ${res.data.deleted} old logs.`);
    fetchLogs(1);
  };

  const MODULES = ['Auth', 'Guards', 'Attendance', 'Invoices', 'Reports', 'Clients', 'Sites', 'Equipment'];
  const ACTIONS = ['LOGIN', 'REGISTER', 'CREATE', 'UPDATE', 'DELETE', 'MARK_ATTENDANCE'];

  const displayed = search
    ? logs.filter(l =>
        l.userName?.toLowerCase().includes(search.toLowerCase()) ||
        l.module?.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-900">Compliance & Audit Logs</h1>
          <p className="text-secondary-500 text-sm mt-1">{total} total actions tracked</p>
        </div>
        <button
          onClick={cleanup}
          id="cleanup-logs-btn"
          className="flex items-center gap-2 h-10 px-4 border border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} /> Cleanup (90d+)
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            id="audit-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, module, or action…"
            className="w-full h-10 pl-9 pr-4 border border-secondary-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
        <select
          value={filters.module}
          onChange={e => setFilters(f => ({ ...f, module: e.target.value }))}
          className="h-10 px-3 border border-secondary-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          id="module-filter"
        >
          <option value="">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="h-10 px-3 border border-secondary-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          id="action-filter"
        >
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-secondary-400">
            <List size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Module', 'Details', 'IP'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-secondary-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {displayed.map(log => (
                  <tr key={log._id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="px-5 py-3 text-secondary-500 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                          <User size={11} className="text-primary-600" />
                        </div>
                        <span className="font-medium text-secondary-900 whitespace-nowrap">{log.userName || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ACTION_COLORS[log.action] || 'bg-secondary-100 text-secondary-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-secondary-600 max-w-xs truncate">{log.details || '–'}</td>
                    <td className="px-5 py-3 text-secondary-400 text-xs font-mono">{log.ipAddress || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-100">
            <p className="text-xs text-secondary-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-secondary-200 text-secondary-600 disabled:opacity-40 hover:bg-secondary-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-secondary-200 text-secondary-600 disabled:opacity-40 hover:bg-secondary-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
