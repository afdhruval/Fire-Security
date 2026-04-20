import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { equipmentApi, siteApi } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';

const emptyForm = { 
  id: null, 
  equipmentName: '', 
  type: 'Extinguisher', 
  quantity: 1, 
  site: '', 
  lastInspectionDate: '' 
};

const Equipment = () => {
  const { token } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [sites, setSites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Load equipment list
  const loadEquipment = async () => {
    if (!token) return;
    try {
      const { equipment: list } = await equipmentApi.list(token);
      setEquipment(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Load site list
  const loadSites = async () => {
    if (!token) return;
    try {
      const { sites: list } = await siteApi.list(token);
      setSites(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEquipment();
    loadSites();
  }, [token]);

  const openCreate = () => {
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (e) => {
    setFormData({
      id: e._id,
      equipmentName: e.equipmentName,
      type: e.type,
      quantity: e.quantity,
      site: e.site?._id || '',
      lastInspectionDate: e.lastInspectionDate ? e.lastInspectionDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.site) return alert('Please select a site before submitting');
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity)
      };
      await (formData.id 
        ? equipmentApi.update(token, formData.id, payload)
        : equipmentApi.create(token, payload)
      );
      await loadEquipment();
      setShowModal(false);
      setFormData(emptyForm);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this equipment?')) {
      try {
        await equipmentApi.remove(token, id);
        await loadEquipment();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const columns = [
    { header: 'Equipment', render: row => <span className="font-semibold">{row.equipmentName}</span> },
    { header: 'Type', render: row => <Badge status={row.type}>{row.type}</Badge> },
    { header: 'Qty', render: row => <span className="font-mono">{row.quantity}</span> },
    { header: 'Site', render: row => <span>{row.site?.siteName || '-'}</span> },
    { 
      header: 'Last Inspection', 
      render: row => (
        <span className="font-mono">
          {row.lastInspectionDate ? formatDate(row.lastInspectionDate) : ''}
        </span>
      )
    },
    {
      header: 'Actions',
      render: row => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={Edit2} onClick={() => openEdit(row)} />
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(row._id)} />
        </div>
      )
    }
  ];

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-900">Fire Equipment</h1>
          <p className="text-sm text-secondary-500 mt-2">Track equipment and inspections</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Equipment</Button>
      </div>

      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden">
        <Table columns={columns} data={equipment} emptyMessage="No equipment yet" />
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={formData.id ? 'Edit Equipment' : 'Add Equipment'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Equipment Name"
            value={formData.equipmentName}
            onChange={e => setFormData({ ...formData, equipmentName: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm"
            >
              <option value="Extinguisher">Extinguisher</option>
              <option value="Alarm">Alarm</option>
              <option value="CCTV">CCTV</option>
              <option value="Hydrant">Hydrant</option>
            </select>
          </div>

          <Input
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Site</label>
            <select
              value={formData.site}
              onChange={e => setFormData({ ...formData, site: e.target.value })}
              required
              className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm"
            >
              <option value="">Select Site</option>
              {sites.map(site => (
                <option key={site._id} value={site._id}>{site.siteName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2">Last Inspection Date</label>
            <input
              type="date"
              value={formData.lastInspectionDate}
              onChange={e => setFormData({ ...formData, lastInspectionDate: e.target.value })}
              className="w-full h-12 border border-secondary-300 rounded-xl px-4 text-sm"
            />
          </div>

          <Button type="submit" fullWidth>
            {formData.id ? 'Update Equipment' : 'Add Equipment'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Equipment;