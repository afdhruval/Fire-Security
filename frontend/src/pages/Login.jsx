import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-secondary-900 to-secondary-800 relative overflow-hidden px-4">
      <div className="absolute w-[600px] h-[600px] bg-gradient-radial from-primary-600/15 to-transparent rounded-full -top-48 -right-48" />
      <div className="absolute w-[400px] h-[400px] bg-gradient-radial from-green-600/10 to-transparent rounded-full -bottom-24 -left-24" />

      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl animate-slide-in-up relative z-10">
        <div className="h-auto border-b border-secondary-200 px-8 pt-12 pb-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/30">
            <Shield size={40} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold text-secondary-900 tracking-wide">KRISHA FIRE</h1>
          <p className="text-sm text-secondary-500 font-medium mt-2">Security Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="admin@krishafire.com" icon={Mail} required />
          <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" icon={Lock} required />

          <Button type="submit" fullWidth size="lg">Sign In</Button>
        </form>

        <div className="h-auto border-t border-secondary-200 bg-secondary-50 rounded-b-3xl px-8 py-5 text-center">
          <p className="text-sm text-secondary-600">Don't have an account? <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">Sign Up</Link></p>
          <p className="text-xs text-secondary-500 mt-2">Default: admin@krishafire.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
