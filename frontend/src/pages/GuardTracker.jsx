import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { guardLocationApi } from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";

// ── Fix Leaflet default icon (same as GuardMap.jsx) ─────────────────────────
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── 25 preset Gujarat locations ──────────────────────────────────────────────
const GUJARAT_LOCATIONS = [
  { label: "Ahmedabad", latitude: 23.0225, longitude: 72.5714 },
  { label: "Surat", latitude: 21.1702, longitude: 72.8311 },
  { label: "Vadodara", latitude: 22.3072, longitude: 73.1812 },
  { label: "Rajkot", latitude: 22.3039, longitude: 70.8022 },
  { label: "Bhavnagar", latitude: 21.7645, longitude: 72.1519 },
  { label: "Jamnagar", latitude: 22.4707, longitude: 70.0577 },
  { label: "Junagadh", latitude: 21.5222, longitude: 70.4579 },
  { label: "Gandhinagar", latitude: 23.2156, longitude: 72.6369 },
  { label: "Anand", latitude: 22.5645, longitude: 72.9289 },
  { label: "Navsari", latitude: 20.9467, longitude: 72.9520 },
  { label: "Mehsana", latitude: 23.5880, longitude: 72.3693 },
  { label: "Morbi", latitude: 22.8173, longitude: 70.8370 },
  { label: "Surendranagar", latitude: 22.7278, longitude: 71.6406 },
  { label: "Bharuch", latitude: 21.7051, longitude: 72.9959 },
  { label: "Ankleshwar", latitude: 21.6262, longitude: 73.0090 },
  { label: "Valsad", latitude: 20.5992, longitude: 72.9342 },
  { label: "Amreli", latitude: 21.6046, longitude: 71.2210 },
  { label: "Botad", latitude: 22.1692, longitude: 71.6671 },
  { label: "Patan", latitude: 23.8493, longitude: 72.1266 },
  { label: "Palanpur", latitude: 24.1722, longitude: 72.4381 },
  { label: "Porbandar", latitude: 21.6426, longitude: 69.6093 },
  { label: "Dwarka", latitude: 22.2394, longitude: 68.9678 },
  { label: "Somnath", latitude: 20.9060, longitude: 70.3842 },
  { label: "Dahod", latitude: 22.8329, longitude: 74.2574 },
  { label: "Godhra", latitude: 22.7783, longitude: 73.6143 },
];

const DUTY_STATUSES = ["On Duty", "Leave", "Off Duty", "Break"];

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

// ── Auto-fit map bounds ──────────────────────────────────────────────────────
const FitBounds = ({ guards, fitted, setFitted }) => {
  const map = useMap();
  useEffect(() => {
    if (fitted) return;
    const valid = guards.filter(g => g.location?.latitude && g.location?.longitude);
    if (valid.length === 0) return;
    const bounds = valid.map(g => [g.location.latitude, g.location.longitude]);
    map.fitBounds(bounds, { padding: [60, 60] });
    setFitted(true);
  }, [guards, map, fitted, setFitted]);
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE VIEW — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeTrackerView = ({ user, token }) => {
  const [status, setStatus] = useState("Starting...");
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [lastSent, setLastSent] = useState(null);
  const guardId = user?._id || user?.id;

  const sendLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation is not supported by your browser."); return; }
    if (!guardId) { setError("Guard ID not found. Please log in again."); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setCoords({ latitude, longitude });
        try {
          const res = await fetch(`${API}/location/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ guardId, latitude, longitude }),
          });
          const data = await res.json();
          if (data.success) { setStatus("Active ✓"); setLastSent(new Date().toLocaleTimeString()); setError(null); }
          else { setError(data.message || "Server error"); }
        } catch { setError("Could not reach server"); }
      },
      (err) => { setError(`Location error: ${err.message}`); setStatus("Failed"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!token || !guardId) return;
    sendLocation();
    const interval = setInterval(sendLocation, 5000);
    return () => clearInterval(interval);
  }, [token, guardId]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: "400px", width: "100%" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: error ? "#fee2e2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "28px" }}>
          {error ? "⚠️" : "📍"}
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>{error ? "Tracking Error" : "Tracking Active"}</h2>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
          {error ? error : "Your live location is being sent to headquarters every 5 seconds."}
        </p>
        {user && (
          <div style={{ background: "#f3f4f6", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", textAlign: "left" }}>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}><strong>Guard:</strong> {user.name}</p>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}><strong>ID:</strong> {guardId}</p>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}><strong>Role:</strong> {user.role}</p>
            <p style={{ fontSize: "13px", color: "#374151" }}>
              <strong>Status:</strong>{" "}
              <span style={{ color: error ? "#dc2626" : "#16a34a", fontWeight: 600 }}>{status}</span>
            </p>
          </div>
        )}
        {coords && (
          <div style={{ background: "#eff6ff", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", textAlign: "left" }}>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}><strong>Latitude:</strong> {coords.latitude.toFixed(6)}</p>
            <p style={{ fontSize: "13px", color: "#374151", marginBottom: "4px" }}><strong>Longitude:</strong> {coords.longitude.toFixed(6)}</p>
            {lastSent && <p style={{ fontSize: "12px", color: "#9ca3af" }}>Last sent: {lastSent}</p>}
          </div>
        )}
        {!guardId && (
          <div style={{ background: "#fef2f2", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", color: "#dc2626" }}>⚠ No guard ID found. Please log out and log in again as a guard.</p>
          </div>
        )}
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>Updates every 5 seconds automatically</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / HR VIEW — All guards + map + Gujarat location assignment + duty status
// readOnly=true  → HR and Employee: see all data, no edits allowed
// readOnly=false → Admin only: can assign location + duty status
// ─────────────────────────────────────────────────────────────────────────────
const AdminTrackerView = ({ token, readOnly = false }) => {
  const [guards, setGuards] = useState([]);
  const [mapGuards, setMapGuards] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fitted, setFitted] = useState(false);
  const [saving, setSaving] = useState({});   // { [guardId]: true } while saving
  const socketRef = useRef(null);

  // Local edit state — { [guardId]: { locationLabel, dutyStatus } }
  const [edits, setEdits] = useState({});

  const loadAllGuards = async () => {
    try {
      const res = await guardLocationApi.getAllGuards(token);
      if (res.success) {
        setGuards(res.guards || []);
        // Only put guards with valid coords on the map
        setMapGuards((res.guards || []).filter(g => g.location?.latitude && g.location?.longitude));
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } else {
        setError("Failed to load guards");
      }
    } catch (err) {
      setError(err.message || "Could not connect to server");
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAllGuards();
    const poll = setInterval(loadAllGuards, 15000);

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("guardLocationUpdated", (payload) => {
      const { guardId, latitude, longitude, dutyStatus, locationLabel, name, status } = payload;
      setGuards(prev => prev.map(g =>
        String(g._id) === String(guardId)
          ? {
            ...g,
            name: name || g.name,
            status: status || g.status,
            dutyStatus: dutyStatus !== undefined ? dutyStatus : g.dutyStatus,
            locationLabel: locationLabel !== undefined ? locationLabel : g.locationLabel,
            location: latitude && longitude
              ? { ...g.location, latitude, longitude }
              : g.location,
          }
          : g
      ));
      if (latitude && longitude) {
        setMapGuards(prev => {
          const exists = prev.find(g => String(g._id) === String(guardId));
          if (exists) {
            return prev.map(g =>
              String(g._id) === String(guardId)
                ? { ...g, location: { latitude, longitude } }
                : g
            );
          }
          return [...prev, { _id: guardId, name: name || "Guard", status: status || "inactive", location: { latitude, longitude } }];
        });
      }
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socket.on("connect_error", () => setError("Real-time connection failed — using polling"));

    return () => { clearInterval(poll); socket.disconnect(); };
  }, [token]);

  const getEdit = (guardId, field, fallback) =>
    edits[guardId]?.[field] !== undefined ? edits[guardId][field] : fallback;

  const setEdit = (guardId, field, value) =>
    setEdits(prev => ({ ...prev, [guardId]: { ...prev[guardId], [field]: value } }));

  const handleAssign = async (guard) => {
    const locLabel = getEdit(guard._id, "locationLabel", guard.locationLabel || "");
    const dutyStatus = getEdit(guard._id, "dutyStatus", guard.dutyStatus || "Off Duty");
    const preset = GUJARAT_LOCATIONS.find(l => l.label === locLabel);

    setSaving(prev => ({ ...prev, [guard._id]: true }));
    try {
      await guardLocationApi.assignLocation(token, guard._id, {
        locationLabel: locLabel,
        dutyStatus,
        ...(preset ? { latitude: preset.latitude, longitude: preset.longitude } : {}),
      });
      // Clear local edit after save
      setEdits(prev => { const n = { ...prev }; delete n[guard._id]; return n; });
      await loadAllGuards();
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
    setSaving(prev => ({ ...prev, [guard._id]: false }));
  };

  const dutyColor = (status) => {
    if (status === "On Duty") return "#16a34a";
    if (status === "Leave") return "#d97706";
    if (status === "Break") return "#2563eb";
    return "#6b7280";
  };

  return (
    <div style={{ padding: "24px", background: "#f9fafb", minHeight: "100vh" }}>

      {/* Page header — same style as existing tracker page */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>Live Tracker</h1>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>Real-time guard locations across Gujarat</p>
      </div>

      {/* Error strip */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
          ⚠ {error}
        </div>
      )}

      {/* Map */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#f0fdf4", borderBottom: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>
            Live Guard Map
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {lastUpdate && <span style={{ fontSize: "12px", color: "#9ca3af" }}>Last update: {lastUpdate}</span>}
            <button onClick={loadAllGuards} style={{ fontSize: "12px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: "8px 16px", display: "flex", gap: "16px", borderBottom: "1px solid #f3f4f6" }}>
          {[["On Duty", "#16a34a"], ["Leave", "#d97706"], ["Break", "#2563eb"], ["Off Duty", "#6b7280"]].map(([label, color]) => (
            <span key={label} style={{ fontSize: "12px", color, fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>

        <MapContainer center={[22.2587, 71.1924]} zoom={7} style={{ height: "380px", width: "100%" }}>
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds guards={mapGuards} fitted={fitted} setFitted={setFitted} />
          {mapGuards.map(g => (
            <Marker key={g._id} position={[g.location.latitude, g.location.longitude]}>
              <Popup>
                <div style={{ minWidth: "160px" }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>🛡 {g.name}</p>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "3px" }}>
                    Duty:{" "}
                    <span style={{ color: dutyColor(g.dutyStatus), fontWeight: 600 }}>
                      {g.dutyStatus || "Off Duty"}
                    </span>
                  </p>
                  {g.locationLabel && (
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "3px" }}>📍 {g.locationLabel}</p>
                  )}
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {g.location.latitude.toFixed(5)}, {g.location.longitude.toFixed(5)}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Updated: {lastUpdate || "—"}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {mapGuards.length === 0 && (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "12px", fontSize: "13px" }}>
            No guards have reported a location yet.
          </p>
        )}
      </div>

      {/* All Guards Table */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700 }}>All Guards – Tracking Status</h2>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {/* Hide ACTION column when read-only */}
              {(readOnly ? ["GUARD", "STATUS", "LOCATION", "LAST UPDATE", "ACTIVE"] : ["GUARD", "STATUS", "LOCATION", "LAST UPDATE", "ACTIVE", "ACTION"]).map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guards.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#9ca3af", fontSize: "13px" }}>No guards found</td>
              </tr>
            ) : guards.map(g => (
              <tr key={g._id} style={{ borderBottom: "1px solid #f3f4f6" }}>

                {/* Guard name */}
                <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>{g.name}</td>

                {/* Duty Status — dropdown for Admin, plain text for HR/Employee */}
                <td style={{ padding: "12px 16px" }}>
                  {readOnly ? (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: dutyColor(g.dutyStatus || "Off Duty") }}>
                      {g.dutyStatus || "Off Duty"}
                    </span>
                  ) : (
                    <select
                      value={getEdit(g._id, "dutyStatus", g.dutyStatus || "Off Duty")}
                      onChange={e => setEdit(g._id, "dutyStatus", e.target.value)}
                      style={{
                        fontSize: "12px", fontWeight: 600, padding: "4px 8px",
                        borderRadius: "6px", border: "1px solid #d1d5db",
                        color: dutyColor(getEdit(g._id, "dutyStatus", g.dutyStatus || "Off Duty")),
                        background: "white", cursor: "pointer",
                      }}
                    >
                      {DUTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </td>

                {/* Location — dropdown for Admin, plain text for HR/Employee */}
                <td style={{ padding: "12px 16px" }}>
                  {readOnly ? (
                    <span style={{ fontSize: "12px", color: "#374151" }}>
                      {g.locationLabel ? `📍 ${g.locationLabel}` : <span style={{ color: "#9ca3af" }}>—</span>}
                    </span>
                  ) : (
                    <select
                      value={getEdit(g._id, "locationLabel", g.locationLabel || "")}
                      onChange={e => setEdit(g._id, "locationLabel", e.target.value)}
                      style={{
                        fontSize: "12px", padding: "4px 8px", borderRadius: "6px",
                        border: "1px solid #d1d5db", background: "white", cursor: "pointer",
                        minWidth: "150px",
                      }}
                    >
                      <option value="">— Select Location —</option>
                      {GUJARAT_LOCATIONS.map(loc => (
                        <option key={loc.label} value={loc.label}>{loc.label}</option>
                      ))}
                    </select>
                  )}
                </td>

                {/* Last seen */}
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "#9ca3af" }}>
                  {g.lastSeen ? new Date(g.lastSeen).toLocaleTimeString() : "—"}
                </td>

                {/* Active status pill */}
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                    background: g.status === "active" ? "#dcfce7" : "#f3f4f6",
                    color: g.status === "active" ? "#16a34a" : "#6b7280",
                  }}>
                    {g.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>

                {/* Save button — only for Admin (not readOnly) */}
                {!readOnly && (
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => handleAssign(g)}
                      disabled={saving[g._id]}
                      style={{
                        fontSize: "12px", fontWeight: 600, padding: "5px 14px",
                        borderRadius: "8px", border: "none", cursor: saving[g._id] ? "not-allowed" : "pointer",
                        background: saving[g._id] ? "#d1d5db" : "#2563eb",
                        color: "white", transition: "background 0.2s",
                      }}
                    >
                      {saving[g._id] ? "Saving…" : "Assign"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root component — picks view based on role
// ─────────────────────────────────────────────────────────────────────────────
const GuardTracker = () => {
  const { user, token } = useAuth();
  const role = user?.role;

  // Admin: full editable view (can assign locations + duty status)
  // HR: read-only view (sees all guard data, map, duty status — no edits)
  // Employee: read-only view (sees where all guards are — no edits)
  if (role === "Admin") return <AdminTrackerView token={token} readOnly={false} />;
  if (role === "HR") return <AdminTrackerView token={token} readOnly={true} />;
  return <AdminTrackerView token={token} readOnly={true} />;
};

export default GuardTracker;