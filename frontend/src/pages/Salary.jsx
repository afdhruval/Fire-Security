import { useState, useEffect } from 'react';
import { Plus, DollarSign, Building2 } from 'lucide-react';
import { salariesApi, invoicesApi, guardsApi, clientsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';

const Salary = () => {
  const { token } = useAuth();
  const [guards, setGuards] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('salary');
  const [salaries, setSalaries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ guard: '', client: '', month: '', totalDaysPresent: '', totalSalary: '', amount: '' });

  const loadData = async () => {
    if (!token) return;
    try {
      const [salRes, invRes, guardsRes, clientsRes] = await Promise.all([
        salariesApi.list(token).catch(() => ({ salaries: [] })),
        invoicesApi.list(token).catch(() => ({ invoices: [] })),
        guardsApi.list(token).catch(() => ({ guards: [] })),
        clientsApi.list(token).catch(() => ({ clients: [] }))
      ]);
      setSalaries(salRes.salaries || []);
      setInvoices(invRes.invoices || []);
      setGuards(guardsRes.guards || []);
      setClients(clientsRes.clients || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'salary') {
        await salariesApi.create(token, {
          guard: formData.guard,
          month: formData.month,
          totalDaysPresent: Number(formData.totalDaysPresent || 0),
          totalSalary: Number(formData.totalSalary || 0),
          paymentStatus: 'Unpaid',
          paymentDate: null
        });
      } else {
        await invoicesApi.create(token, {
          client: formData.client,
          month: formData.month,
          amount: Number(formData.amount || 0)
        });
      }
      await loadData();
      setShowModal(false);
      setFormData({ guard: '', client: '', month: '', totalDaysPresent: '', totalSalary: '', amount: '' });
    } catch (err) { alert(err.message); }
  };

  const markSalaryPaid = async (id) => {
    try { await salariesApi.markPaid(token, id); await loadData(); }
    catch (err) { alert(err.message); }
  };

  const markInvoicePaid = async (id) => {
    try { await invoicesApi.markPaid(token, id); await loadData(); }
    catch (err) { alert(err.message); }
  };

  const salaryColumns = [
    { header: 'Guard', render: (row) => <span className="font-semibold">{row.guard?.name || '-'}</span> },
    { header: 'Month', accessor: 'month' },
    { header: 'Days Present', render: (row) => <span className="font-mono">{row.totalDaysPresent}</span> },
    { header: 'Total Salary', render: (row) => <span className="font-mono font-semibold">{formatCurrency(row.totalSalary)}</span> },
    { header: 'Payment Status', render: (row) => <Badge status={row.paymentStatus==='Paid'?'Active':'Inactive'}>{row.paymentStatus || 'Unpaid'}</Badge> },
    { header: 'Payment Date', render: (row) => row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '-' },
    { header: 'Actions', render: (row) => row.paymentStatus!=='Paid' ? <Button size="sm" variant="success" onClick={() => markSalaryPaid(row._id)}>Mark Paid</Button> : null }
  ];

  const invoiceColumns = [
    { header: 'Client / Guard', render: (row) => <span className="font-semibold">
        {row.invoiceType === 'salary'
          ? (row.guard?.name || 'Guard Invoice')
          : (row.client?.clientName || row.client?.companyName || '-')}
      </span> },
    { header: 'Month', accessor: 'month' },
    { header: 'Amount', render: (row) => <span className="font-mono font-semibold">{formatCurrency(row.amount)}</span> },
    { header: 'Status', render: (row) => <Badge status={row.status==='paid'?'Active':'Inactive'}>{row.status}</Badge> },
    { header: 'Actions', render: (row) => row.status==='unpaid' ? <Button size="sm" variant="success" onClick={() => markInvoicePaid(row._id)}>Mark Paid</Button> : null }
  ];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-900">Salary & Invoices</h1>
          <p className="text-sm text-secondary-500 mt-2">Manage payments and billing</p>
        </div>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add {activeTab==='salary'?'Salary':'Invoice'}</Button>
      </div>

      <div className="flex gap-2 bg-white border border-secondary-200 rounded-xl p-2 mb-6">
        <button onClick={()=>setActiveTab('salary')} className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all ${activeTab==='salary'?'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md':'text-secondary-600 hover:bg-secondary-50'}`}><DollarSign size={20}/> Salary</button>
        <button onClick={()=>setActiveTab('invoices')} className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all ${activeTab==='invoices'?'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md':'text-secondary-600 hover:bg-secondary-50'}`}><Building2 size={20}/> Invoices</button>
      </div>

      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden">
        <Table columns={activeTab==='salary'?salaryColumns:invoiceColumns} data={activeTab==='salary'?salaries:invoices} emptyMessage={`No ${activeTab} records yet`}/>
      </div>

      <Modal isOpen={showModal} title={`Add ${activeTab==='salary'?'Salary':'Invoice'}`} onClose={()=>setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab==='salary'?
            <>
              <div>
                <label className="block font-semibold mb-1">Guard</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={formData.guard||''} onChange={e=>setFormData({...formData, guard:e.target.value})} required>
                  <option value="">Select Guard</option>
                  {guards.map(g=><option key={g._id} value={g._id}>{g.name}</option>)}
                </select>
              </div>
              <Input label="Month" value={formData.month||''} onChange={e=>setFormData({...formData, month:e.target.value})}/>
              <Input label="Days Present" type="number" value={formData.totalDaysPresent||''} onChange={e=>setFormData({...formData, totalDaysPresent:e.target.value})}/>
              <Input label="Total Salary" type="number" value={formData.totalSalary||''} onChange={e=>setFormData({...formData, totalSalary:e.target.value})}/>
            </> :
            <>
              <div>
                <label className="block font-semibold mb-1">Client</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2" value={formData.client||''} onChange={e=>setFormData({...formData, client:e.target.value})} required>
                  <option value="">Select Client</option>
                  {clients.map(c=><option key={c._id} value={c._id}>{c.clientName||c.companyName}</option>)}
                </select>
              </div>
              <Input label="Month" value={formData.month||''} onChange={e=>setFormData({...formData, month:e.target.value})}/>
              <Input label="Amount" type="number" value={formData.amount||''} onChange={e=>setFormData({...formData, amount:e.target.value})}/>
            </>
          }
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Salary;