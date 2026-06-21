import { useApp } from '../context/AppContext.jsx';
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen, RefreshCw,
  BookMarked, BarChart2, FileText, GraduationCap, Settings,
  LogOut, ChevronRight, Menu, X, ScrollText,
} from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard',     icon: LayoutDashboard, label: 'dashboard',     roles: ['admin', 'sheikh'] },
  { key: 'students',      icon: Users,           label: 'students',      roles: ['admin', 'sheikh'] },
  { key: 'attendance',    icon: CalendarCheck,   label: 'attendance',    roles: ['admin', 'sheikh'] },
  { key: 'quranProgress', icon: BookOpen,        label: 'quranProgress', roles: ['admin', 'sheikh'] },
  { key: 'muraja3ah',     icon: RefreshCw,       label: 'muraja3ah',     roles: ['admin', 'sheikh'] },
  { key: 'matn',          icon: BookMarked,      label: 'matn',          roles: ['admin', 'sheikh'] },
  { key: 'analytics',     icon: BarChart2,       label: 'analytics',     roles: ['admin', 'sheikh'] },
  { key: 'reports',       icon: FileText,        label: 'reports',       roles: ['admin', 'sheikh'] },
  { SECTION: true, label: 'admin',               roles: ['admin'] },
  { key: 'teachers',      icon: GraduationCap,   label: 'teachers',      roles: ['admin'] },
  { key: 'halaqat',       icon: ScrollText,      label: 'halaqat',       roles: ['admin', 'sheikh'] },
  { key: 'auditLogs',     icon: ScrollText,      label: 'auditLogs',     roles: ['admin'] },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t, currentUser, signOut, activePage, setActivePage, isRTL } = useApp();
  const role = currentUser?.role || 'sheikh';

  const getInitials = (name) => {
    const parts = name?.split(' ') || [];
    return parts.slice(0, 2).map(p => p[0]).join('');
  };

  const handleNav = (key) => {
    setActivePage(key);
    onClose?.();
  };

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.SECTION) return item.roles.includes(role);
    return item.roles.includes(role);
  });

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📖</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">{t('appName')}</span>
          <span className="sidebar-logo-sub">{t('appTagline')}</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onClose}
          style={{ marginInlineStart: 'auto', display: 'none' }}
          id="sidebar-close-btn"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {visibleItems.map((item, idx) => {
          if (item.SECTION) {
            return (
              <div key={`section-${idx}`} className="sidebar-section-label">
                {t(item.label)}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activePage === item.key;

          return (
            <button
              key={item.key}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.key)}
              id={`nav-${item.key}`}
            >
              <Icon size={17} className="nav-item-icon" />
              <span>{t(item.label)}</span>
              {isActive && (
                <ChevronRight
                  size={14}
                  style={{
                    marginInlineStart: 'auto',
                    transform: isRTL ? 'rotate(180deg)' : 'none',
                    opacity: 0.5,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="nav-item"
          onClick={() => handleNav('settings')}
          id="nav-settings"
        >
          <Settings size={17} />
          <span>{t('settings')}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(currentUser?.fullName || '')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-small font-semibold truncate">
              {currentUser?.fullName}
            </div>
            <div className="text-xs text-muted">
              {currentUser?.role === 'admin' ? t('admin') : t('sheikh')}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={signOut}
            title={t('signOut')}
            id="btn-signout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
