import { UserCheck, X, DollarSign, Flame, FileText, Clock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

// ─── mini sub-card ───────────────────────────────────────────────────────────
const InfoRow = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-3 border-b border-secondary-100 last:border-0">
    <span className="text-sm font-medium text-secondary-500">{label}</span>
    <span className={`text-sm font-bold ${accent || 'text-secondary-900'}`}>{value}</span>
  </div>
);

const SectionCard = ({ title, color, bgColor, icon: Icon, children }) => (
  <div className="bg-white border border-secondary-200 rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-secondary-100" style={{ backgroundColor: bgColor }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '22', color }}>
        <Icon size={18} />
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color }}>{title}</h3>
    </div>
    <div className="px-5 py-2">{children}</div>
  </div>
);

// ─── Attendance Detail ────────────────────────────────────────────────────────
const AttendanceDetail = ({ data }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-4xl font-extrabold text-green-700">{data.present}</p>
        <p className="text-xs font-bold text-green-600 uppercase mt-1">Present Today</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <p className="text-4xl font-extrabold text-red-600">{data.absent}</p>
        <p className="text-xs font-bold text-red-500 uppercase mt-1">Absent Today</p>
      </div>
    </div>
    <SectionCard title="Guard Attendance List" color="#10B981" bgColor="#F0FDF4" icon={UserCheck}>
      {data.guards && data.guards.length > 0 ? (
        data.guards.map((g, i) => (
          <InfoRow
            key={i}
            label={g.name}
            value={g.status}
            accent={g.status === 'present' ? 'text-green-600' : 'text-red-500'}
          />
        ))
      ) : (
        <p className="text-sm text-secondary-400 py-4 text-center">No attendance records for today.</p>
      )}
    </SectionCard>
  </div>
);

// ─── Reports Detail ───────────────────────────────────────────────────────────
const ReportsDetail = ({ data }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-secondary-50 border border-secondary-200 rounded-2xl p-4 text-center">
        <p className="text-3xl font-extrabold text-secondary-800">{data.total}</p>
        <p className="text-xs font-bold text-secondary-500 uppercase mt-1">Total</p>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
        <p className="text-3xl font-extrabold text-yellow-700">{data.pending}</p>
        <p className="text-xs font-bold text-yellow-600 uppercase mt-1">Pending</p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
        <p className="text-3xl font-extrabold text-green-700">{data.completed}</p>
        <p className="text-xs font-bold text-green-600 uppercase mt-1">Completed</p>
      </div>
    </div>
    <SectionCard title="Report Breakdown" color="#6B7280" bgColor="#F9FAFB" icon={FileText}>
      <InfoRow label="Total Reports" value={data.total} />
      <InfoRow label="Pending" value={data.pending} accent="text-yellow-600" />
      <InfoRow label="Completed" value={data.completed} accent="text-green-600" />
      <InfoRow label="Fire Incidents" value={data.fire ?? 0} accent="text-red-600" />
    </SectionCard>
  </div>
);

// ─── Billing Detail ───────────────────────────────────────────────────────────
const BillingDetail = ({ data }) => (
  <div className="space-y-5">
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
      <p className="text-4xl font-extrabold text-blue-700">₹ {(data.total || 0).toLocaleString('en-IN')}</p>
      <p className="text-xs font-bold text-blue-500 uppercase mt-1">Total Billing Amount</p>
    </div>
    <SectionCard title="Invoice Summary" color="#3B82F6" bgColor="#EFF6FF" icon={DollarSign}>
      {data.invoices && data.invoices.length > 0 ? (
        data.invoices.map((inv, i) => (
          <InfoRow
            key={i}
            label={inv.label}
            value={`₹ ${(inv.amount || 0).toLocaleString('en-IN')}`}
            accent={inv.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}
          />
        ))
      ) : (
        <p className="text-sm text-secondary-400 py-4 text-center">No invoices found.</p>
      )}
    </SectionCard>
  </div>
);

// ─── Equipment Detail ─────────────────────────────────────────────────────────
const EquipmentDetail = ({ data }) => (
  <div className="space-y-5">
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
      <p className="text-4xl font-extrabold text-amber-700">{data.total}</p>
      <p className="text-xs font-bold text-amber-600 uppercase mt-1">Total Equipment Items</p>
    </div>
    <SectionCard title="Equipment List" color="#F59E0B" bgColor="#FFFBEB" icon={Flame}>
      {data.items && data.items.length > 0 ? (
        data.items.map((item, i) => (
          <InfoRow
            key={i}
            label={item.name}
            value={item.condition || item.status || 'Good'}
            accent={item.condition === 'poor' || item.status === 'inactive' ? 'text-red-500' : 'text-green-600'}
          />
        ))
      ) : (
        <p className="text-sm text-secondary-400 py-4 text-center">No equipment found.</p>
      )}
    </SectionCard>
  </div>
);

// ─── On-Duty Detail ───────────────────────────────────────────────────────────
const OnDutyDetail = ({ data }) => (
  <div className="space-y-5">
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
      <p className="text-4xl font-extrabold text-red-600">{data.total}</p>
      <p className="text-xs font-bold text-red-500 uppercase mt-1">Guards On Duty</p>
    </div>
    <SectionCard title="Active Guards" color="#DC2626" bgColor="#FEF2F2" icon={Shield}>
      {data.guards && data.guards.length > 0 ? (
        data.guards.map((g, i) => (
          <InfoRow key={i} label={g.name} value={g.site || g.status || 'Active'} accent="text-green-600" />
        ))
      ) : (
        <p className="text-sm text-secondary-400 py-4 text-center">No active guards found.</p>
      )}
    </SectionCard>
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const CardDetail = ({ title, data, type }) => {
  const renderContent = () => {
    switch (type) {
      case 'attendance': return <AttendanceDetail data={data} />;
      case 'reports':    return <ReportsDetail data={data} />;
      case 'billing':    return <BillingDetail data={data} />;
      case 'equipment':  return <EquipmentDetail data={data} />;
      case 'on-duty':    return <OnDutyDetail data={data} />;
      default:           return <p className="text-secondary-400 text-sm">No detail view available.</p>;
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-4">{title} · Detailed View</p>
      {renderContent()}
    </div>
  );
};

export default CardDetail;
