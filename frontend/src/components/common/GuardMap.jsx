import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";

// ── Fix Leaflet icons using local node_modules path (no CDN, no tracking block)
import markerIcon2x   from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon     from "leaflet/dist/images/marker-icon.png";
import markerShadow   from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

// ── Auto-fit map to markers only on first load ────────────────────────────────
const FitBounds = ({ guards, fitted, setFitted }) => {
  const map = useMap();
  useEffect(() => {
    if (fitted || guards.length === 0) return;
    const bounds = guards.map(g => [g.location.latitude, g.location.longitude]);
    map.fitBounds(bounds, { padding: [60, 60] });
    setFitted(true);
  }, [guards, map, fitted, setFitted]);
  return null;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
const API        = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

const isValidCoord = (g) =>
  g.location &&
  typeof g.location.latitude  === "number" &&
  typeof g.location.longitude === "number" &&
  !(g.location.latitude === 0 && g.location.longitude === 0);

const GuardMap = ({ token }) => {
  const [guards, setGuards]         = useState([]);
  const [error, setError]           = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [fitted, setFitted]         = useState(false);
  const socketRef                   = useRef(null);

  const loadLocations = async () => {
    try {
      const res  = await fetch(`${API}/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const valid = (data.guards || []).filter(isValidCoord);
        setGuards(valid);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } else {
        setError("Failed to load locations");
      }
    } catch {
      setError("Could not connect to server");
    }
  };

  useEffect(() => {
    if (!token) return;

    loadLocations();

    // Poll every 5 seconds to always get fresh data
    const poll = setInterval(loadLocations, 5000);

    // Socket.io for instant updates
    const socket = io(SOCKET_URL, {
      auth:               { token },
      transports:         ["websocket", "polling"],
      reconnection:       true,
      reconnectionDelay:  1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("guardLocationUpdated", (payload) => {
      const { guardId, latitude, longitude, name, status } = payload;
      if (!latitude || !longitude || (latitude === 0 && longitude === 0)) return;

      setGuards(prev => {
        const exists = prev.find(g => String(g._id) === String(guardId));
        if (exists) {
          return prev.map(g =>
            String(g._id) === String(guardId)
              ? { ...g, name: name || g.name, status: status || g.status, location: { latitude, longitude } }
              : g
          );
        }
        return [...prev, {
          _id: guardId, name: name || "Guard",
          status: status || "active",
          location: { latitude, longitude },
        }];
      });
      setLastUpdate(new Date().toLocaleTimeString());
    });

    socket.on("connect_error", () => {
      setError("Real-time connection failed — using polling");
    });

    return () => {
      clearInterval(poll);
      socket.disconnect();
    };
  }, [token]);

  return (
    <div style={{ width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }}>

      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px",
        background: error ? "#fef2f2" : "#f0fdf4",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: error ? "#dc2626" : "#16a34a" }}>
          {error ? `⚠ ${error}` : `🟢 ${guards.length} guard${guards.length !== 1 ? "s" : ""} live on map`}
        </span>
        {lastUpdate && (
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>
            Last update: {lastUpdate}
          </span>
        )}
      </div>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds guards={guards} fitted={fitted} setFitted={setFitted} />

        {guards.map((g) => (
          <Marker key={g._id} position={[g.location.latitude, g.location.longitude]}>
            <Popup>
              <div style={{ minWidth: "160px" }}>
                <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                  🛡 {g.name}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "3px" }}>
                  Status:{" "}
                  <span style={{ color: g.status === "active" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                    {g.status}
                  </span>
                </p>
                {g.assignedSite?.siteName && (
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "3px" }}>
                    Site: {g.assignedSite.siteName}
                  </p>
                )}
                <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                  {g.location.latitude.toFixed(5)}, {g.location.longitude.toFixed(5)}
                </p>
                <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                  Updated: {lastUpdate || "—"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GuardMap;