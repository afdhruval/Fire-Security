import { useState, useEffect } from 'react';
import { Star, Send, MessageSquarePlus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => !readOnly && onChange(star)}
        className={`transition-colors duration-150 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        disabled={readOnly}
      >
        <Star
          size={readOnly ? 16 : 28}
          className={star <= value ? 'text-amber-400 fill-amber-400' : 'text-secondary-300'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

const STORAGE_KEY = 'firesentrix_feedback';

const loadFeedback = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveFeedback = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// ─── Feedback Page ────────────────────────────────────────────────────────────
const Feedback = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '', rating: 0 });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);

  useEffect(() => {
    setFeedbackList(loadFeedback());
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    if (form.rating === 0) errs.rating = 'Please select a rating.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleRating = (val) => {
    setForm(prev => ({ ...prev, rating: val }));
    if (errors.rating) setErrors(prev => ({ ...prev, rating: undefined }));
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const newEntry = { id: Date.now().toString(), ...form, submittedAt: new Date().toISOString() };
    const updated = [newEntry, ...feedbackList];
    setFeedbackList(updated);
    saveFeedback(updated);
    setForm({ name: '', email: '', message: '', rating: 0 });
    setErrors({});
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleDelete = (id) => {
    const updated = feedbackList.filter(f => f.id !== id);
    setFeedbackList(updated);
    saveFeedback(updated);
  };

  return (
    <div className="w-full min-h-full p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
          <MessageSquarePlus size={24} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Share your experience or suggestions</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white border border-secondary-200 rounded-2xl shadow-sm p-6 lg:p-8 mb-8 max-w-2xl">
        <h2 className="text-base font-bold text-secondary-700 uppercase tracking-wider mb-6">Submit Feedback</h2>

        {submitted && (
          <div className="mb-5 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold text-green-700 animate-fade-in">
            ✓ Thank you! Your feedback has been submitted.
          </div>
        )}

        {/* Name */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            className={`w-full h-11 px-4 text-sm rounded-xl border bg-secondary-50 text-secondary-900 placeholder-secondary-400 outline-none transition-all focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 ${errors.name ? 'border-red-400 bg-red-50' : 'border-secondary-200'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full h-11 px-4 text-sm rounded-xl border bg-secondary-50 text-secondary-900 placeholder-secondary-400 outline-none transition-all focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 ${errors.email ? 'border-red-400 bg-red-50' : 'border-secondary-200'}`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5">Message *</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="Write your feedback here..."
            className={`w-full px-4 py-3 text-sm rounded-xl border bg-secondary-50 text-secondary-900 placeholder-secondary-400 outline-none transition-all resize-none focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 ${errors.message ? 'border-red-400 bg-red-50' : 'border-secondary-200'}`}
          />
          {errors.message && <p className="mt-1 text-xs text-red-500 font-medium">{errors.message}</p>}
        </div>

        {/* Rating */}
        <div className="mb-7">
          <label className="block text-xs font-bold text-secondary-500 uppercase tracking-wider mb-2">Rating *</label>
          <StarRating value={form.rating} onChange={handleRating} />
          {errors.rating && <p className="mt-1 text-xs text-red-500 font-medium">{errors.rating}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Send size={16} />
          Submit Feedback
        </button>
      </div>

      {/* Submitted list */}
      {feedbackList.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Submitted Feedback</h2>
          <div className="space-y-4 max-w-2xl">
            {feedbackList.map(fb => (
              <div key={fb.id} className="bg-white border border-secondary-200 rounded-2xl p-5 shadow-sm animate-fade-in">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-bold text-secondary-900">{fb.name}</p>
                    <p className="text-xs text-secondary-400">{fb.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating value={fb.rating} readOnly />
                    <button
                      onClick={() => handleDelete(fb.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors group"
                    >
                      <Trash2 size={15} className="text-secondary-300 group-hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-secondary-700 leading-relaxed">{fb.message}</p>
                <p className="text-xs text-secondary-400 mt-3">{formatDate(fb.submittedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
