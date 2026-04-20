import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, TrendingUp, Building2, Users, Flame, Calendar,
  DollarSign, MessageSquare, LogOut, X, FileText,
  BarChart2, MapPin, ClipboardList, Receipt, MessageSquarePlus,
  ChevronLeft, ChevronRight, Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAccessibleRoutes } from '../../utils/helpers';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const allMenuItems = [
    { path: '/dashboard',      label: 'Dashboard',           icon: TrendingUp,        id: 'dashboard'      },
    { path: '/analytics',      label: 'Analytics',           icon: BarChart2,         id: 'analytics'      },
    { path: '/clients',        label: 'Client & Sites',      icon: Building2,         id: 'clients'        },
    { path: '/guards',         label: 'Guard Management',    icon: Users,             id: 'guards'         },
    { path: '/patrol',         label: 'Guard Patrol',        icon: MapPin,            id: 'patrol'         },
    { path: '/guard-tracker',  label: 'Live Tracker',        icon: Navigation,        id: 'guard-tracker'  },
    { path: '/equipment',      label: 'Fire Equipment',      icon: Flame,             id: 'equipment'      },
    { path: '/attendance',     label: 'Attendance',          icon: Calendar,          id: 'attendance'     },
    { path: '/salary',         label: 'Salary & Invoices',   icon: DollarSign,        id: 'salary'         },
    { path: '/billing',        label: 'Billing & Contracts', icon: Receipt,           id: 'billing'        },
    { path: '/chat',           label: 'Live Chat',           icon: MessageSquare,     id: 'chat'           },
    { path: '/reports',        label: 'Reports',             icon: FileText,          id: 'reports'        },
    { path: '/audit-logs',     label: 'Audit Logs',          icon: ClipboardList,     id: 'audit-logs'     },
    { path: '/feedback',       label: 'Feedback',            icon: MessageSquarePlus, id: 'feedback'       },
  ];

  const accessibleRoutes = getAccessibleRoutes(user?.role);
  const menuItems = allMenuItems.filter(item => accessibleRoutes.includes(item.id));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen bg-secondary-800
          flex flex-col border-r border-secondary-700
          transition-all duration-300
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-[72px]' : 'w-[280px]'}
        `}
      >
        {/* ── Logo Row ── */}
        <div className="h-[72px] flex items-center gap-3 border-b border-secondary-700 px-3 relative flex-shrink-0">

          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={22} className="text-white" strokeWidth={2.5} />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-white tracking-wider truncate">KRISHA FIRE</h2>
              <p className="text-xs text-secondary-400 font-medium mt-0.5">Security System</p>
            </div>
          )}

          {!collapsed && (
            <div className="hidden lg:flex flex-shrink-0">
              <NotificationBell />
            </div>
          )}

          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary-700 transition-colors flex-shrink-0"
          >
            <X size={18} className="text-white" />
          </button>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-secondary-700 border border-secondary-600 rounded-full items-center justify-center hover:bg-secondary-600 transition-colors z-10 shadow-md"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight size={12} className="text-secondary-300" />
              : <ChevronLeft  size={12} className="text-secondary-300" />
            }
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-11 px-3 rounded-xl mb-0.5 text-sm font-medium transition-all duration-200 group relative
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-gradient-to-r from-primary-600/90 to-primary-700/90 text-white shadow-md'
                    : 'text-secondary-400 hover:bg-secondary-700 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {collapsed && (
                      <span className="absolute left-full ml-3 px-2 py-1 bg-secondary-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── User + Logout ── */}
        <div className="border-t border-secondary-700 py-4 px-2 space-y-2 flex-shrink-0">

          {collapsed && (
            <div className="hidden lg:flex justify-center mb-2">
              <NotificationBell />
            </div>
          )}

          <div className={`flex items-center gap-3 px-2 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar name={user?.name} size="md" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-secondary-400 mt-0.5 capitalize">{user?.role}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`w-full h-11 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all ${collapsed ? 'px-0' : ''}`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;