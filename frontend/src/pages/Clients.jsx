import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { clientsApi } from '../services/api';
import { hasPermission } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Table from '../components/common/Table';

const emptyForm = {
  id: null,
  clientName: '',
  companyName: '',
  contactPhone: '',
  contactEmail: '',
  address: ''
};

const Clients = () => {
  const { user, token } = useAuth();
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    if (!token) return;
    try {
      const { clients: list } = await clientsApi.list(token);
      setClients(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [token]);

  const openCreate = () => {
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setFormData({
      id: c.id || c._id,
      clientName: c.clientName,
      companyName: c.companyName,
      contactPhone: c.contactPhone || '',
      contactEmail: c.contactEmail || '',
      address: c.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      clientName: formData.clientName,
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      address: formData.address
    };

    try {
      if (formData.id) {
        await clientsApi.update(token, formData.id, payload);
      } else {
        await clientsApi.create(token, payload);
      }
      await loadClients();
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!hasPermission(user.role, 'delete')) return alert('No permission');
    if (confirm('Delete this client?')) {
      try {
        await clientsApi.remove(token, id);
        await loadClients();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const toggleStatus = async (client) => {
    try {
      const updatedStatus = !client.isActive;
      await clientsApi.update(token, client.id || client._id, { isActive: updatedStatus });

      setClients(prev =>
        prev.map(c =>
          (c._id === client._id || c.id === client.id)
            ? { ...c, isActive: updatedStatus }
            : c
        )
      );
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  const columns = [
    { header: 'Client Name', render: row => <span className="font-semibold">{row.clientName}</span> },
    { header: 'Company', render: row => <span>{row.companyName}</span> },
    { header: 'Phone', render: row => <span className="font-mono">{row.contactPhone}</span> },
    { header: 'Email', accessor: 'contactEmail' },
    { header: 'Address', render: row => <span>{row.address}</span> },
    { header: 'Status', render: row => (
        <button
          onClick={() => toggleStatus(row)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            row.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </button>
      )
    },
    { header: 'Actions', render: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={Edit2} onClick={() => openEdit(row)} />
          {hasPermission(user.role, 'delete') && <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(row.id || row._id)} />}
        </div>
      )
    }
  ];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-900">Client Management</h1>
          <p className="text-sm text-secondary-500 mt-2">Manage your clients</p>
        </div>
        {hasPermission(user.role, 'create') && <Button icon={Plus} onClick={openCreate}>Add Client</Button>}
      </div>

      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden">
        <Table columns={columns} data={clients} emptyMessage={loading ? 'Loading clients...' : 'No clients yet'} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? 'Edit Client' : 'Add New Client'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Client Name" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} required />
          <Input label="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required />
          <Input label="Phone" type="tel" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} required />
          <Input label="Email" type="email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

          <Button type="submit" fullWidth>{formData.id ? 'Update Client' : 'Add Client'}</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Clients;