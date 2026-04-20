import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'Employee' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await signup(userData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-secondary-900 to-secondary-800 relative overflow-hidden px-4 py-8">
      <div className="absolute w-[600px] h-[600px] bg-gradient-radial from-primary-600/15 to-transparent rounded-full -top-48 -right-48" />
      <div className="absolute w-[400px] h-[400px] bg-gradient-radial from-green-600/10 to-transparent rounded-full -bottom-24 -left-24" />

      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl animate-slide-in-up relative z-10">
        <div className="h-auto border-b border-secondary-200 px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-600/30">
            <Shield size={32} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold text-secondary-900 tracking-wide">Create Account</h1>
          <p className="text-sm text-secondary-500 font-medium mt-1">Join Krisha Fire Security</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          <Input label="Full Name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" icon={User} required />
          <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" icon={Mail} required />
          <Select label="Role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} options={[{ value: 'Employee', label: 'Employee' }, { value: 'Admin', label: 'Admin' }, { value: 'HR', label: 'HR' }]} required />
          <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" icon={Lock} required />
          <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="••••••••" icon={Lock} required />

          <Button type="submit" fullWidth size="lg">Create Account</Button>
        </form>

        <div className="h-auto border-t border-secondary-200 bg-secondary-50 rounded-b-3xl px-8 py-5 text-center">
          <p className="text-sm text-secondary-600">Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
