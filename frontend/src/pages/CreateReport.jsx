import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Shield, AlertTriangle, CalendarDays, FileText, ArrowLeft, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';

const TYPE_OPTIONS = [
  { value: 'Fire',     label: 'Fire Report',      icon: Flame,         color: '#DC2626', bg: '#FEE2E2' },
  { value: 'Security', label: 'Security Report',  icon: Shield,        color: '#3B82F6', bg: '#DBEAFE' },
  { value: 'Incident', label: 'Incident Report',  icon: AlertTriangle, color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'Daily',    label: 'Daily Report',     icon: CalendarDays,  color: '#10B981', bg: '#D1FAE5' },
  { value: 'Monthly',  label: 'Monthly Report',   icon: FileText,      color: '#8B5CF6', bg: '#EDE9FE' },
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const SEVERITY_COLOR = {
  Low:      'border-gray-300 bg-gray-50 text-gray-700',
  Medium:   'border-yellow-300 bg-yellow-50 text-yellow-700',
  High:     'border-orange-300 bg-orange-50 text-orange-700',
  Critical: 'border-red-400 bg-red-50 text-red-700',
};

const CreateReport = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    type: '',
    description: '',
    location: '',
    severity: 'Medium',
    incidentDate: new Date().toISOString().slice(0, 16),
    images: [],
  });

  const [imageInput, setImageInput] = useState('');
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.type)                e.type        = 'Please select a report type';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.location.trim())    e.location    = 'Location is required';
    return e;
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !form.images.includes(url)) {
      set('images', [...form.images, url]);
      setImageInput('');
    }
  };

  const removeImage = (url) => {
    set('images', form.images.filter(u => u !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        incidentDate: new Date(form.incidentDate).toISOString(),
      };
      const res = await reportsApi.create(token, payload);
      setSubmitted(true);
      setTimeout(() => navigate(`/reports/${res.report._id}`), 1200);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create report' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="w-full min-h-full flex items-center justify-center p-10">
        <div className="text-center animate-slide-in-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Created!</h2>
          <p className="text-gray-500 text-sm">Redirecting to report details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-6 lg:p-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          id="back-to-reports"
          onClick={() => navigate('/reports')}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Report</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to log a new report</p>
        </div>
      </div>

      <form id="create-report-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left column (main fields) ─── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Report Type cards */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Report Type *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      id={`type-${opt.value.toLowerCase()}`}
                      onClick={() => set('type', opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-xs font-semibold transition-all
                        ${selected
                          ? 'shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                      style={selected ? { borderColor: opt.color, backgroundColor: opt.bg, color: opt.color } : {}}>
                      <Icon size={22} strokeWidth={1.8} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {errors.type && <p className="text-xs text-red-500 mt-2">{errors.type}</p>}
            </div>

            {/* Title */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Report Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="report-title">
                    Title *
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    placeholder="e.g. Fire outbreak at Sector B warehouse"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30
                      ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400'}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="report-description">
                    Description *
                  </label>
                  <textarea
                    id="report-description"
                    placeholder="Provide a detailed account of the incident…"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30
                      ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400'}`}
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="report-location">
                    Location *
                  </label>
                  <input
                    id="report-location"
                    type="text"
                    placeholder="e.g. Building A, Floor 3, Zone 12"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30
                      ${errors.location ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-red-400'}`}
                  />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </div>
              </div>
            </div>

            {/* Image URLs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                <span className="flex items-center gap-2"><Upload size={15} /> Image URLs (Optional)</span>
              </h2>
              <div className="flex gap-2">
                <input
                  id="image-url-input"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={imageInput}
                  onChange={e => setImageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <button type="button" id="add-image-btn" onClick={addImage}
                  className="h-11 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">
                  Add
                </button>
              </div>

              {form.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                      <img src={url} alt={`upload-${i}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(url)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right column (metadata) ───────── */}
          <div className="space-y-6">

            {/* Severity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Severity</h2>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITIES.map(s => (
                  <button key={s} type="button" id={`severity-${s.toLowerCase()}`}
                    onClick={() => set('severity', s)}
                    className={`h-10 rounded-xl border-2 text-xs font-bold transition-all ${SEVERITY_COLOR[s]} ${form.severity === s ? 'ring-2 ring-offset-1 ring-current scale-[1.02] shadow' : 'opacity-60 hover:opacity-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Incident Date & Time</h2>
              <input
                id="report-incident-date"
                type="datetime-local"
                value={form.incidentDate}
                onChange={e => set('incidentDate', e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
              />
            </div>

            {/* Summary card */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-4">Summary</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-400 text-xs mb-0.5">Type</dt>
                  <dd className="font-semibold">{form.type || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs mb-0.5">Severity</dt>
                  <dd className="font-semibold">{form.severity}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs mb-0.5">Location</dt>
                  <dd className="font-semibold truncate">{form.location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 text-xs mb-0.5">Images</dt>
                  <dd className="font-semibold">{form.images.length}</dd>
                </div>
              </dl>
            </div>

            {/* Submit */}
            {errors.submit && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            <button
              id="submit-report-btn"
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all hover:shadow-md active:scale-95 text-sm">
              {submitting ? 'Creating Report…' : 'Create Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReport;
