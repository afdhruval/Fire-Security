import { X } from 'lucide-react';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl animate-slide-in-up overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="h-18 flex items-center justify-between border-b border-secondary-200 px-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-secondary-900">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary-100 transition-colors"><X size={20} className="text-secondary-600" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
