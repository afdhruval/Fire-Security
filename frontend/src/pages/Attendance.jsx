import { useState, useEffect } from 'react';
import { attendanceApi, guardsApi } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';

const Attendance = () => {
  const { user, token } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState([]);

  const loadAttendance = async () => {
    if (!token) return;
    try {
      const [guardsRes, attRes] = await Promise.all([
        guardsApi.list(token),
        attendanceApi.getByDate(token, date),
      ]);

      // 2705 Fix: removed .filter(g => g.status === 'active') — marking absent sets guard inactive in DB
      const guards = guardsRes.guards || [];
      const records = attRes.records || [];

      const data = guards.map(guard => {
        const gid = guard.id || guard._id;
        const record = records.find(
          r => (r.guard?.id || r.guard?._id || r.guard) === gid
        );
        return {
          guardId: gid,
          guardName: record?.guard?.name || guard.name,
          siteId: guard.assignedSite?.id || guard.assignedSite?._id || guard.assignedSite,
          siteName: guard.assignedSite?.siteName || '-',
          date,
          // ✅ Fix: null means "not marked yet" — both buttons stay enabled
          status: record?.status || null,
        };
      });

      setAttendance(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadAttendance(); }, [date, token]);

  const markAttendance = async (guardId, siteId, status) => {
    try {
      await attendanceApi.mark(token, { guard: guardId, site: siteId, date, status });
      await loadAttendance();
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    {
      header: 'Guard',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.guardName} />
          <span className="font-semibold">{row.guardName}</span>
        </div>
      ),
    },
    {
      header: 'Site',
      render: (row) => <span>{row.siteName}</span>,
    },
    {
      header: 'Date',
      render: (row) => <span className="font-mono">{formatDate(row.date)}</span>,
    },
    {
      header: 'Status',
      render: (row) => {
        if (!row.status) {
          return (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary-100 text-secondary-500">
              Not Marked
            </span>
          );
        }
        return (
          <Badge status={row.status === 'present' ? 'Active' : 'Inactive'}>
            {row.status}
          </Badge>
        );
      },
    },
    ...(user.role === 'Admin' || user.role === 'HR'
      ? [
          {
            header: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => markAttendance(row.guardId, row.siteId, 'present')}
                  disabled={row.status === 'present'}
                >
                  Present
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => markAttendance(row.guardId, row.siteId, 'absent')}
                  disabled={row.status === 'absent'}
                >
                  Absent
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-900">
            Attendance Management
          </h1>
          <p className="text-sm text-secondary-500 mt-2">Track guard attendance</p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
        />
      </div>

      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={attendance}
          emptyMessage="No guards to track"
        />
      </div>
    </div>
  );
};

export default Attendance;