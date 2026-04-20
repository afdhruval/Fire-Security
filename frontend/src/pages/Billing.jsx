import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
const getHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });

const formatCurrency = (n) => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n) : '–';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '–';

const StatusBadge = ({ s }) => {
  const map = {
    paid: 'bg-green-100 text-green-700', unpaid: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
  };
  const icons = { paid: CheckCircle, unpaid: AlertCircle, pending: Clock, active: CheckCircle, expired: AlertCircle };
  const Icon = icons[s] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${map[s] || 'bg-secondary-100 text-secondary-600'}`}>
      <Icon size={11} /> {s}
    </span>
  );
};

// ─── Invoice Modal ────────────────────────────────────────────────
const InvoiceModal = ({ invoice, clients, onClose, onSave }) => {
  const [form, setForm] = useState({
    client: invoice?.client?._id || '',
    amount: invoice?.amount || '',
    month: invoice?.month || '',
    status: invoice?.status || 'unpaid',
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (invoice?._id) {
        await axios.put(`${API}/invoices/${invoice._id}`, form, getHeaders());
      } else {
        await axios.post(`${API}/invoices`, form, getHeaders());
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving invoice');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-secondary-100">
          <h2 className="font-bold text-lg text-secondary-900">{invoice?._id ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <button onClick={onClose}><X size={20} className="text-secondary-400" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-secondary-600 mb-1 block">Client*</label>
            <select required value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
              <option value="">Select client…</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.clientName} — {c.companyName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">Amount (₹)*</label>
              <input required type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="e.g. 50000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">Month*</label>
              <input required type="month" value={form.month}
                onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 border border-secondary-300 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50">Cancel</button>
            <button type="submit" className="flex-1 h-11 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">{invoice?._id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Contract Modal ───────────────────────────────────────────────
const ContractModal = ({ contract, clients, onClose, onSave }) => {
  const [form, setForm] = useState({
    client: contract?.client?._id || '',
    startDate: contract?.startDate ? contract.startDate.slice(0, 10) : '',
    endDate: contract?.endDate ? contract.endDate.slice(0, 10) : '',
    terms: contract?.terms || '',
    value: contract?.value || '',
    status: contract?.status || 'active',
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (contract?._id) {
        await axios.put(`${API}/contracts/${contract._id}`, form, getHeaders());
      } else {
        await axios.post(`${API}/contracts`, form, getHeaders());
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving contract');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-secondary-100">
          <h2 className="font-bold text-lg text-secondary-900">{contract?._id ? 'Edit Contract' : 'New Contract'}</h2>
          <button onClick={onClose}><X size={20} className="text-secondary-400" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-secondary-600 mb-1 block">Client*</label>
            <select required value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
              <option value="">Select client…</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.clientName} — {c.companyName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">Start Date*</label>
              <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">End Date*</label>
              <input required type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">Value (₹)</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full h-10 border border-secondary-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary-600 mb-1 block">Terms & Conditions</label>
            <textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} rows={3}
              className="w-full border border-secondary-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 border border-secondary-300 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50">Cancel</button>
            <button type="submit" className="flex-1 h-11 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">{contract?._id ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Billing Page ────────────────────────────────────────────
const Billing = () => {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [contractModal, setContractModal] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [inv, con, cli] = await Promise.all([
        axios.get(`${API}/invoices`, getHeaders()),
        axios.get(`${API}/contracts`, getHeaders()),
        axios.get(`${API}/clients`, getHeaders()),
      ]);
      setInvoices(inv.data.invoices || inv.data.data || []);
      setContracts(con.data.data || []);
      setClients(cli.data.clients || cli.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteInvoice = async (id) => {
    if (!confirm('Delete invoice?')) return;
    await axios.delete(`${API}/invoices/${id}`, getHeaders());
    fetchAll();
  };

  const deleteContract = async (id) => {
    if (!confirm('Delete contract?')) return;
    await axios.delete(`${API}/contracts/${id}`, getHeaders());
    fetchAll();
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + (i.amount || 0), 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-secondary-900">Client Billing & Contracts</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage invoices and client contracts</p>
        </div>
        <button
          onClick={() => tab === 'invoices' ? setInvoiceModal({}) : setContractModal({})}
          id="create-billing-btn"
          className="flex items-center gap-2 h-10 px-4 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> {tab === 'invoices' ? 'New Invoice' : 'New Contract'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-extrabold">{formatCurrency(totalRevenue)}</p>
          <p className="text-white/60 text-xs mt-1">{invoices.filter(i => i.status === 'paid').length} paid invoices</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-extrabold">{formatCurrency(totalPending)}</p>
          <p className="text-white/60 text-xs mt-1">{invoices.filter(i => i.status === 'unpaid').length} unpaid invoices</p>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Active Contracts</p>
          <p className="text-2xl font-extrabold">{activeContracts}</p>
          <p className="text-white/60 text-xs mt-1">{contracts.length} total contracts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary-100 p-1 rounded-xl w-fit">
        {['invoices', 'contracts'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 h-9 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white shadow text-primary-700' : 'text-secondary-600 hover:text-secondary-900'}`}>{t}</button>
        ))}
      </div>

      {/* Invoices Table */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Client', 'Company', 'Month', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-secondary-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-secondary-400">No invoices yet. Create one!</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-secondary-900">{inv.client?.clientName || '–'}</td>
                    <td className="px-5 py-3 text-secondary-600">{inv.client?.companyName || '–'}</td>
                    <td className="px-5 py-3 text-secondary-600">{inv.month || '–'}</td>
                    <td className="px-5 py-3 font-bold text-secondary-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3"><StatusBadge s={inv.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setInvoiceModal(inv)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100" title="Edit"><Edit2 size={14} className="text-secondary-500" /></button>
                        <button onClick={() => deleteInvoice(inv._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      {tab === 'contracts' && (
        <div className="bg-white rounded-2xl border border-secondary-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Client', 'Start Date', 'End Date', 'Value', 'Status', 'Terms', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-secondary-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {contracts.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-secondary-400">No contracts yet. Create one!</td></tr>
                ) : contracts.map(con => (
                  <tr key={con._id} className="hover:bg-secondary-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-secondary-900">{con.client?.clientName || '–'}</td>
                    <td className="px-5 py-3 text-secondary-600">{formatDate(con.startDate)}</td>
                    <td className="px-5 py-3 text-secondary-600">{formatDate(con.endDate)}</td>
                    <td className="px-5 py-3 font-bold text-secondary-900">{formatCurrency(con.value)}</td>
                    <td className="px-5 py-3"><StatusBadge s={con.status} /></td>
                    <td className="px-5 py-3 text-secondary-500 max-w-[180px] truncate">{con.terms || '–'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setContractModal(con)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-100" title="Edit"><Edit2 size={14} className="text-secondary-500" /></button>
                        <button onClick={() => deleteContract(con._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {invoiceModal !== null && (
        <InvoiceModal
          invoice={invoiceModal?._id ? invoiceModal : null}
          clients={clients}
          onClose={() => setInvoiceModal(null)}
          onSave={() => { setInvoiceModal(null); fetchAll(); }}
        />
      )}
      {contractModal !== null && (
        <ContractModal
          contract={contractModal?._id ? contractModal : null}
          clients={clients}
          onClose={() => setContractModal(null)}
          onSave={() => { setContractModal(null); fetchAll(); }}
        />
      )}
    </div>
  );
};

export default Billing;
