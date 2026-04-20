import React from "react";
import { AlertTriangle, CheckCircle2, Eye, Pencil, Trash2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isOverdue = (a) =>
  a.status === "upcoming" && a.time && new Date(a.time) < new Date();

// ─── Priority Badge ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const map = {
    low:    { label: "Low",    bg: "bg-gray-100",    text: "text-gray-600" },
    medium: { label: "Medium", bg: "bg-yellow-100",  text: "text-yellow-700" },
    high:   { label: "High",   bg: "bg-red-100",     text: "text-red-700" },
  };
  const p = map[priority] || map.medium;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
      {p.label}
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, overdue }) => {
  if (overdue)
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 inline-flex items-center gap-1">
        <AlertTriangle size={10} /> Overdue
      </span>
    );
  const map = {
    today:     { label: "Today",     bg: "bg-red-100",   text: "text-red-600" },
    upcoming:  { label: "Upcoming",  bg: "bg-blue-100",  text: "text-blue-600" },
    completed: { label: "Completed", bg: "bg-green-100", text: "text-green-600" },
  };
  const s = map[status] || map.today;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

// ─── Single Activity Card ─────────────────────────────────────────────────────
const ActivityCard = ({ activity, onDelete, onEdit, onView, onMarkComplete }) => {
  const overdue = isOverdue(activity);

  // Format time nicely
  const formattedTime = activity.time
    ? (() => {
        const d = new Date(activity.time);
        return isNaN(d)
          ? activity.time
          : d.toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
      })()
    : null;

  return (
    <div
      className={`border rounded-xl p-4 mb-3 transition-all duration-200 hover:shadow-md ${
        overdue
          ? "border-orange-200 bg-orange-50"
          : "border-secondary-200 bg-white"
      }`}
    >
      {/* ── Row 1: Title + Status + Priority ── */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <p className="text-sm font-semibold flex-1 min-w-0 truncate">
          {activity.title}
        </p>
        <StatusBadge status={activity.status} overdue={overdue} />
        <PriorityBadge priority={activity.priority} />
      </div>

      {/* ── Row 2: Time + Location ── */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        {formattedTime && (
          <p
            className={`text-xs flex items-center gap-1 ${
              overdue ? "text-orange-500 font-semibold" : "text-secondary-400"
            }`}
          >
            🕐 {formattedTime}
            {overdue && " ⚠"}
          </p>
        )}
        {activity.location && (
          <p className="text-xs text-secondary-400">📍 {activity.location}</p>
        )}
      </div>

      {/* ── Row 3: Assigned To + Assigned By ── */}
      <div className="flex items-center gap-4 flex-wrap mb-2">
        {activity.assignedGuard?.name && (
          <p className="text-xs text-secondary-500">
            <span className="font-bold text-secondary-400">Assigned to:</span>{" "}
            <span className="font-semibold text-secondary-700">
              👤 {activity.assignedGuard.name}
            </span>
          </p>
        )}
        {activity.addedBy?.name && (
          <p className="text-xs text-secondary-500">
            <span className="font-bold text-secondary-400">By:</span>{" "}
            <span className="font-semibold text-secondary-700">
              ➕ {activity.addedBy.name}
            </span>
            {activity.addedBy.role && (
              <span className="text-secondary-400">
                {" "}({activity.addedBy.role})
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Row 4: Completion Note ── */}
      {activity.completionNote && (
        <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-2 py-1 mb-2">
          📝 {activity.completionNote}
        </p>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex items-center gap-1 justify-end mt-1">
        {activity.status !== "completed" && onMarkComplete && (
          <button
            onClick={() => onMarkComplete(activity._id)}
            title="Mark as Completed"
            className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors"
          >
            <CheckCircle2 size={15} />
          </button>
        )}
        {onView && (
          <button
            onClick={() => onView(activity)}
            title="View Details"
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
          >
            <Eye size={15} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(activity)}
            title="Edit"
            className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-500 transition-colors"
          >
            <Pencil size={15} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(activity._id)}
            title="Delete"
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── ActivitySection ──────────────────────────────────────────────────────────
const ActivitySection = ({ activities, onDelete, onEdit, onView, onMarkComplete }) => {
  const today     = activities.filter((a) => a.status === "today");
  const upcoming  = activities.filter((a) => a.status === "upcoming");
  const completed = activities.filter((a) => a.status === "completed");
  const overdueCount = upcoming.filter(isOverdue).length;

  const renderList = (list) => {
    if (list.length === 0)
      return <p className="text-sm text-secondary-400">No activities</p>;
    return list.map((a) => (
      <ActivityCard
        key={a._id}
        activity={a}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
        onMarkComplete={onMarkComplete}
      />
    ));
  };

  return (
    <div className="mt-10 bg-white border border-secondary-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6">Activity Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-secondary-100">

        {/* Today */}
        <div className="pb-4 md:pb-0 md:pr-6">
          <p className="text-sm font-bold text-red-500 mb-3">
            Today{" "}
            <span className="text-secondary-400 font-normal">({today.length})</span>
          </p>
          {renderList(today)}
        </div>

        {/* Upcoming */}
        <div className="py-4 md:py-0 md:px-6">
          <p className="text-sm font-bold text-blue-500 mb-3 flex items-center gap-2">
            Upcoming{" "}
            <span className="text-secondary-400 font-normal">({upcoming.length})</span>
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={9} /> {overdueCount} overdue
              </span>
            )}
          </p>
          {renderList(upcoming)}
        </div>

        {/* Completed */}
        <div className="pt-4 md:pt-0 md:pl-6">
          <p className="text-sm font-bold text-green-500 mb-3">
            Completed{" "}
            <span className="text-secondary-400 font-normal">({completed.length})</span>
          </p>
          {renderList(completed)}
        </div>

      </div>
    </div>
  );
};

export default ActivitySection;