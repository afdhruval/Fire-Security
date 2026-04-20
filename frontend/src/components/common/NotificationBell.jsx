import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, CheckCheck, AlertTriangle, UserX, Calendar, Info, Clock } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const typeIcon = {
  guard:      <UserX        size={14} className="text-red-400"    />,
  attendance: <Calendar     size={14} className="text-yellow-400" />,
  fire:       <AlertTriangle size={14} className="text-orange-400"/>,
  incident:   <AlertTriangle size={14} className="text-red-400"   />,
  system:     <Info         size={14} className="text-blue-400"   />,
};

const typeBg = {
  guard:      'bg-red-500/10 border-red-500/20',
  attendance: 'bg-yellow-500/10 border-yellow-500/20',
  fire:       'bg-orange-500/10 border-orange-500/20',
  incident:   'bg-red-500/10 border-red-500/20',
  system:     'bg-blue-500/10 border-blue-500/20',
};

// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ toasts, onDismiss }) => createPortal(
  <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm">
    {toasts.map(t => (
      <div
        key={t.id}
        className="bg-white border border-secondary-200 rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-slide-in"
      >
        <div className={`w-7 h-7 flex-shrink-0 rounded-lg border flex items-center justify-center mt-0.5 ${typeBg[t.type] || 'bg-blue-500/10 border-blue-500/20'}`}>
          {typeIcon[t.type] || <Info size={14} className="text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-secondary-900 leading-snug">{t.message}</p>
          <p className="text-[10px] text-secondary-400 mt-0.5">Just now</p>
        </div>
        <button
          onClick={() => onDismiss(t.id)}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-secondary-100 flex-shrink-0"
        >
          <X size={11} className="text-secondary-400" />
        </button>
      </div>
    ))}
  </div>,
  document.body
);

// ─── NotificationBell ─────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [open, setOpen]           = useState(false);
  const [alerts, setAlerts]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [snoozeOpen, setSnoozeOpen]   = useState(null); // alert._id with snooze menu open

  const bellRef     = useRef(null);
  const dropdownRef = useRef(null);
  const prevUnread  = useRef(0);

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // ── Request browser push permission once ──────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Show browser push notification ────────────────────────────────────
  const pushBrowserNotif = useCallback((message, type) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const icons = { guard: '🔴', attendance: '📅', fire: '🔥', system: '🔔', incident: '⚠️' };
      new Notification(`${icons[type] || '🔔'} Krisha Fire`, { body: message, icon: '/favicon.ico' });
    }
  }, []);

  // ── Show toast ────────────────────────────────────────────────────────
  const showToast = useCallback((message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Fetch alerts ──────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [alertsRes, countRes] = await Promise.all([
        axios.get(`${API}/alerts`, getHeaders()),
        axios.get(`${API}/alerts/unread-count`, getHeaders()),
      ]);
      const newAlerts = alertsRes.data.data || [];
      const newCount  = countRes.data.count  || 0;

      // If new unread alerts arrived — show toast + browser push for each new one
      if (newCount > prevUnread.current && prevUnread.current > 0) {
        const incoming = newAlerts.slice(0, newCount - prevUnread.current);
        incoming.forEach(a => {
          showToast(a.message, a.type);
          pushBrowserNotif(a.message, a.type);
        });
      }

      prevUnread.current = newCount;
      setAlerts(newAlerts);
      setUnread(newCount);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  }, [showToast, pushBrowserNotif]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellRef.current     && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSnoozeOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Bell click — calc dropdown position ──────────────────────────────
  const handleOpen = () => {
    if (!open && bellRef.current) {
      const rect          = bellRef.current.getBoundingClientRect();
      const dropdownWidth = 384;
      const viewportWidth = window.innerWidth;
      let right = viewportWidth - rect.right;
      if (rect.right - dropdownWidth < 8) {
        right = viewportWidth - Math.min(rect.right + dropdownWidth - 8, viewportWidth - 8);
      }
      setDropdownPos({ top: rect.bottom + 8, right: Math.max(8, right) });
    }
    setOpen(prev => !prev);
    setSnoozeOpen(null);
  };

  // ── Actions ───────────────────────────────────────────────────────────
  const markRead = async (id) => {
    try {
      await axios.patch(`${API}/alerts/${id}/read`, {}, getHeaders());
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'read' } : a));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`${API}/alerts/read-all`, {}, getHeaders());
      setAlerts(prev => prev.map(a => ({ ...a, status: 'read' })));
      setUnread(0);
    } catch {}
  };

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${API}/alerts/${id}`, getHeaders());
      const was = alerts.find(a => a._id === id);
      setAlerts(prev => prev.filter(a => a._id !== id));
      if (was?.status === 'unread') setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  // ── Snooze: extract activityId from alert message if present ─────────
  const snoozeAlert = async (alertId, minutes) => {
    try {
      // Find activityId embedded in alert if possible — for now just mark alert read + show toast
      await markRead(alertId);
      showToast(`⏰ Reminder snoozed for ${minutes} minutes`, 'system');
      setSnoozeOpen(null);
    } catch {}
  };

  const formatTime = (ts) => {
    const d    = new Date(ts);
    const now  = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  // ── Dropdown portal ───────────────────────────────────────────────────
  const dropdown = open && createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
      className="w-96 bg-white rounded-2xl shadow-2xl border border-secondary-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100 bg-gradient-to-r from-primary-50 to-white">
        <div>
          <h3 className="font-bold text-secondary-900 text-sm">Notifications</h3>
          <p className="text-xs text-secondary-500 mt-0.5">{unread} unread</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary-100 transition-colors">
            <X size={16} className="text-secondary-500" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-secondary-400 text-sm">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-secondary-400">
            <Bell size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert._id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-secondary-50 hover:bg-secondary-50 transition-colors group ${alert.status === 'unread' ? 'bg-primary-50/30' : ''}`}
            >
              <div className={`w-7 h-7 flex-shrink-0 rounded-lg border flex items-center justify-center mt-0.5 ${typeBg[alert.type] || 'bg-secondary-100 border-secondary-200'}`}>
                {typeIcon[alert.type] || <Info size={14} className="text-secondary-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${alert.status === 'unread' ? 'text-secondary-900 font-medium' : 'text-secondary-600'}`}>
                  {alert.message}
                </p>
                <p className="text-[11px] text-secondary-400 mt-1">{formatTime(alert.createdAt)}</p>

                {/* Snooze options — only for system/activity alerts */}
                {alert.type === 'system' && alert.status === 'unread' && (
                  <div className="mt-1.5 relative">
                    <button
                      onClick={() => setSnoozeOpen(snoozeOpen === alert._id ? null : alert._id)}
                      className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium"
                    >
                      <Clock size={10} /> Remind me later
                    </button>

                    {snoozeOpen === alert._id && (
                      <div className="absolute left-0 top-5 bg-white border border-secondary-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {[15, 30, 60].map(mins => (
                          <button
                            key={mins}
                            onClick={() => snoozeAlert(alert._id, mins)}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-secondary-50 text-secondary-700 font-medium"
                          >
                            In {mins} minute{mins > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {alert.status === 'unread' && (
                  <button onClick={() => markRead(alert._id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-primary-100 transition-colors" title="Mark read">
                    <Check size={12} className="text-primary-600" />
                  </button>
                )}
                <button onClick={() => deleteAlert(alert._id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors" title="Delete">
                  <X size={12} className="text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="relative">
        <button
          ref={bellRef}
          onClick={handleOpen}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-secondary-700 hover:bg-secondary-600 transition-colors"
          title="Notifications"
        >
          <Bell size={20} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {dropdown}
      </div>
    </>
  );
};

export default NotificationBell;