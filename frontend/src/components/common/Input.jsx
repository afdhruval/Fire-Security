const Input = ({ label, error, className = '', icon: Icon, ...props }) => (
  <div className={`flex flex-col ${className}`}>
    {label && <label className="h-6 flex items-center text-sm font-semibold text-secondary-900 mb-2">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute left-0 top-0 h-11 w-11 flex items-center justify-center"><Icon size={20} className="text-secondary-400" /></div>}
      <input className={`w-full h-11 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-900 transition-all duration-200 ${Icon ? 'pl-11 pr-4' : 'px-4'} focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-secondary-50 ${error ? 'border-red-500' : ''}`} {...props} />
    </div>
    {error && <span className="h-5 flex items-center mt-1 text-xs text-red-600">{error}</span>}
  </div>
);

export default Input;
