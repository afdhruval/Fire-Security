const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`flex flex-col ${className}`}>
    {label && <label className="h-6 flex items-center text-sm font-semibold text-secondary-900 mb-2">{label}</label>}
    <select className={`w-full h-11 bg-white border border-secondary-200 rounded-xl text-sm text-secondary-900 px-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${error ? 'border-red-500' : ''}`} {...props}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <span className="h-5 flex items-center mt-1 text-xs text-red-600">{error}</span>}
  </div>
);

export default Select;
