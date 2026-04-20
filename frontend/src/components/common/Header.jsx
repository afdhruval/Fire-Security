import { Menu, Shield } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Header = ({ onMenuClick }) => (
  <header className="lg:hidden sticky top-0 z-30 h-16 bg-white border-b border-secondary-200 px-4 flex items-center gap-4">
    <button onClick={onMenuClick} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary-100 transition-colors">
      <Menu size={24} className="text-secondary-900" />
    </button>
    <div className="flex items-center gap-3 flex-1">
      <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
        <Shield size={20} className="text-white" />
      </div>
      <span className="text-lg font-extrabold text-primary-600 tracking-wider">KRISHA FIRE</span>
    </div>
    <NotificationBell />
  </header>
);

export default Header;
