import { useState, useEffect } from 'react';
import { Plus, X, QrCode, MapPin, Shield, Trash2, Edit2, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });

// ─── Sub-components ───────────────────────────────────────────────

const StatusBadge = ({ s }) => {
  const map = {
    'in-progress': 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    incomplete: 'bg-red-100 text-red-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] || 'bg-secondary-100 text-secondary-600'}`}>{s}</span>;
};

// ─── Guard Scan Panel ─────────────────────────────────────────────
const ScanPanel = ({ route, guard, onDone }) => {
  const [log, setLog] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const startPatrol = async () => {
    try {
      const res = await axios.post(`${API}/patrol/logs/start`, { routeId: route._id, guardId: guard }, getHeaders());
      setLog(res.data.data);
      setMsg('Patrol started! Scan checkpoints below.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start patrol');
    }
  };

  const scan = async () => {
    if (!qrInput.trim()) return;
    try {
      const res = await axios.post(`${API}/patrol/logs/${log._id}/scan`, { qrValue: qrInput.trim() }, getHeaders());
      setLog(res.data.data);
      setQrInput('');
      setError('');
      setMsg('Checkpoint scanned!');
      if (res.data.data.status === 'completed') setMsg('🎉 All checkpoints completed!');
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid QR code');
      setMsg('');
    }
  };

  const completed = log?.checkpoints?.filter(c => c.status === 'completed').length || 0;
  const total = log?.checkpoints?.length || route.checkpoints.length;

  return (
    <div className="bg-white rounded-2xl border border-secondary-200 p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-secondary-900 text-lg">🛡️ {route.name}</h3>
        <button onClick={onDone} className="text-secondary-400 hover:text-secondary-600"><X size={18} /></button>
      </div>

      {!log ? (
        <button
          onClick={startPatrol}
          id="start-patrol-btn"
          className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Play size={18} /> Start Patrol
        </button>
      ) : (
        <>
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary-600 font-medium">Progress</span>
              <span className="font-bold text-primary-600">{completed}/{total}</span>
            </div>
            <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
            </div>
          </div>

          {msg && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{msg}</div>}
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

          {/* QR Scan Input */}
          {log.status === 'in-progress' && (
            <div className="flex gap-2">
              <input
                id="qr-scan-input"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scan()}
                placeholder="Enter / Scan QR code value…"
                className="flex-1 h-11 border border-secondary-300 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                onClick={scan}
                id="scan-qr-btn"
                className="h-11 px-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <QrCode size={16} /> Scan
              </button>
            </div>
          )}

          {/* Checkpoint List */}
          <div className="space-y-2">
            {log.checkpoints.map((cp, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cp.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-secondary-50 border-secondary-200'}`}>
                {cp.status === 'completed'
                  ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  : <Clock size={16} className="text-secondary-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900">{cp.name}</p>
                  <p className="text-xs text-secondary-400 font-mono">{cp.qrValue}</p>
                </div>
                <StatusBadge s={cp.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Patrol Page ─────────────────────────────────────────────
const Patrol = () => {
  const [routes, setRoutes] = useState([]);
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('routes'); // routes | logs | scan
  const [showForm, setShowForm] = useState(false);
  const [scanRoute, setScanRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editRoute, setEditRoute] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', assignedGuard: '', site: '',
    checkpoints: [{ name: '', location: '', qrValue: '', order: 0 }]
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [r, g, s, l] = await Promise.all([
        axios.get(`${API}/patrol/routes`, getHeaders()).catch(() => ({ data: { data: [] } })),
        axios.get(`${API}/guards`, getHeaders()).catch(() => ({ data: { guards: [] } })),
        axios.get(`${API}/sites`, getHeaders()).catch(() => ({ data: { sites: [] } })),
        axios.get(`${API}/patrol/logs`, getHeaders()).catch(() => ({ data: { data: [] } })),
      ]);
      setRoutes(r.data.data || []);
      setGuards(g.data.guards || []);
      setSites(s.data.sites || s.data.data || []);
      setLogs(l.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCheckpointChange = (i, field, val) => {
    const cps = [...form.checkpoints];
    cps[i][field] = val;
    setForm(f => ({ ...f, checkpoints: cps }));
  };

  const addCheckpoint = () =>
    setForm(f => ({ ...f, checkpoints: [...f.checkpoints, { name: '', location: '', qrValue: `CP-${Date.now()}`, order: f.checkpoints.length }] }));

  const removeCheckpoint = (i) =>
    setForm(f => ({ ...f, checkpoints: f.checkpoints.filter((_, idx) => idx !== i) }));

  const openCreate = () => {
    setEditRoute(null);
    setForm({ name: '', description: '', assignedGuard: '', site: '', checkpoints: [{ name: '', location: '', qrValue: `CP-${Date.now()}`, order: 0 }] });
    setShowForm(true);
  };

  const openEdit = (route) => {
    setEditRoute(route._id);
    setForm({
      name: route.name, description: route.description,
      assignedGuard: route.assignedGuard?._id || '',
      site: route.site?._id || '',
      checkpoints: route.checkpoints.map(cp => ({ name: cp.name, location: cp.location, qrValue: cp.qrValue, order: cp.order }))
    });
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      if (editRoute) {
        await axios.put(`${API}/patrol/routes/${editRoute}`, form, getHeaders());
      } else {
        await axios.post(`${API}/patrol/routes`, form, getHeaders());
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving route');
    }
  };

  const deleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return;
    await axios.delete(`${API}/patrol/routes/${id}`, getHeaders());
    fetchAll();
  };

  const completedCount = (chks) => chks.filter(c => c.status === 'completed').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-900">Guard Patrol System</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage routes, checkpoints & track patrols</p>
        </div>
        <button onClick={openCreate} id="create-route-btn" className="flex items-center gap-2 h-10 px-4 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
          <Plus size={16} /> New Route
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary-100 p-1 rounded-xl w-fit">
        {['routes', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 h-9 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-primary-700' : 'text-secondary-600 hover:text-secondary-900'}`}>{t}</button>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-100">
              <h2 className="font-bold text-lg text-secondary-900">{editRoute ? 'Edit Route' : 'Create Patrol Route'}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-secondary-400" /></button>
            </div>
            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-secondary-600 mb-1 block">Route Name*</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="e.g. Perimeter A" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-600 mb-1 block">Assign Guard</label>
                  <select value={form.assignedGuard} onChange={e => setForm(f => ({ ...f, assignedGuard: e.target.value }))} className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                    <option value="">-- None --</option>
                    {guards.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-secondary-600 mb-1 block">Site</label>
                  <select value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))} className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                    <option value="">-- None --</option>
                    {sites.map(s => <option key={s._id} value={s._id}>{s.siteName || s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-secondary-600 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-secondary-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
                </div>
              </div>

              {/* Checkpoints */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-secondary-600 uppercase tracking-wider">Checkpoints</label>
                  <button type="button" onClick={addCheckpoint} className="flex items-center gap-1 text-xs text-primary-600 font-semibold hover:text-primary-700">
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {form.checkpoints.map((cp, i) => (
                    <div key={i} className="bg-secondary-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-secondary-500">Checkpoint {i + 1}</span>
                        {form.checkpoints.length > 1 && (
                          <button type="button" onClick={() => removeCheckpoint(i)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          required value={cp.name}
                          onChange={e => handleCheckpointChange(i, 'name', e.target.value)}
                          placeholder="Name*"
                          className="h-9 border border-secondary-300 rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <input
                          value={cp.location}
                          onChange={e => handleCheckpointChange(i, 'location', e.target.value)}
                          placeholder="Location"
                          className="h-9 border border-secondary-300 rounded-lg px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                        <input
                          required value={cp.qrValue}
                          onChange={e => handleCheckpointChange(i, 'qrValue', e.target.value)}
                          placeholder="QR Value*"
                          className="h-9 border border-secondary-300 rounded-lg px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 border border-secondary-300 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 h-11 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">
                  {editRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {tab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {routes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-40 text-secondary-400">
              <Shield size={36} className="mb-3 opacity-30" />
              <p>No patrol routes yet. Create one!</p>
            </div>
          ) : routes.map(route => (
            <div key={route._id} className="bg-white rounded-2xl border border-secondary-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-secondary-900">{route.name}</h3>
                  <p className="text-xs text-secondary-500 mt-0.5">{route.description || 'No description'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(route)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100"><Edit2 size={14} className="text-secondary-500" /></button>
                  <button onClick={() => deleteRoute(route._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-secondary-600">
                  <Shield size={12} className="text-primary-500" />
                  <span>{route.assignedGuard?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary-600">
                  <MapPin size={12} className="text-primary-500" />
                  <span>{route.site?.siteName || route.site?.name || 'No site'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary-600">
                  <QrCode size={12} className="text-primary-500" />
                  <span>{route.checkpoints.length} checkpoint{route.checkpoints.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <button
                onClick={() => { setScanRoute(route); setTab('scan'); }}
                className="w-full h-9 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Play size={14} /> Start Patrol
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Patrol Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 text-sm">Patrol Logs</h2>
          </div>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-secondary-400 text-sm">No logs yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary-50">
                  <tr>
                    {['Route', 'Guard', 'Date', 'Progress', 'Status'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-bold text-secondary-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-secondary-900">{log.route?.name || '–'}</td>
                      <td className="px-6 py-3 text-secondary-600">{log.guard?.name || '–'}</td>
                      <td className="px-6 py-3 text-secondary-500">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3">
                        <span className="text-primary-600 font-semibold">{completedCount(log.checkpoints)}/{log.checkpoints.length}</span>
                      </td>
                      <td className="px-6 py-3"><StatusBadge s={log.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Scan Panel */}
      {tab === 'scan' && scanRoute && (
        <ScanPanel
          route={scanRoute}
          guard={scanRoute.assignedGuard?._id || ''}
          onDone={() => { setTab('routes'); setScanRoute(null); fetchAll(); }}
        />
      )}
    </div>
  );
};

export default Patrol;
