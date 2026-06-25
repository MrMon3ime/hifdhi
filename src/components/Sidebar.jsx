import { useApp } from '../context/AppContext.jsx';
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen, RefreshCw,
  BookMarked, BarChart2, FileText, GraduationCap, Settings,
  LogOut, ChevronRight, ChevronLeft, X, ScrollText,
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
];

export default function Sidebar({ isOpen, onClose }) {
  const { t, currentUser, signOut, activePage, setActivePage, isRTL } = useApp();
  const role = currentUser?.role || 'sheikh';

  const getInitials = (name) => {
    const parts = (name || '').split(' ');
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
  };

  const handleNav = (key) => {
    setActivePage(key);
    onClose?.();
  };

  const visibleItems = NAV_ITEMS.filter(item => item.roles?.includes(role));
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* ── Backdrop overlay (click to close) ── */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        className={`sidebar${isOpen ? ' open' : ''}`}
        style={{ zIndex: 100 }}
      >
        {/* Header: Logo + Close */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
          gap: '0.75rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <img
              src="/logo.png"
              alt="Hifdhi"
              style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            />
            <span style={{ fontWeight: 700, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              حِفْظِي
            </span>
          </div>
          {/* Close button — always visible on mobile */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            id="sidebar-close-btn"
            style={{ flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav" style={{ paddingTop: '0.75rem' }}>
          {visibleItems.map((item, idx) => {
            if (item.SECTION) {
              return (
                <div key={`sec-${idx}`} className="sidebar-section-label">
                  {t(item.label)}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activePage === item.key;

            return (
              <button
                key={item.key}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => handleNav(item.key)}
                id={`nav-${item.key}`}
              >
                <Icon size={20} className="nav-item-icon" />
                <span style={{ flex: 1, textAlign: 'start' }}>{t(item.label)}</span>
                {isActive && (
                  <ChevronIcon size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
                )}
              </button>
            );
          })}

          {/* Settings inside nav */}
          <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
            <button
              className={`nav-item${activePage === 'settings' ? ' active' : ''}`}
              onClick={() => handleNav('settings')}
              id="nav-settings"
            >
              <Settings size={20} className="nav-item-icon" />
              <span style={{ flex: 1, textAlign: 'start' }}>{t('settings')}</span>
            </button>
          </div>
        </nav>

        {/* Footer: user info + logout */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="sidebar-avatar"
              style={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}
            >
              {getInitials(currentUser?.fullName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-small font-semibold truncate">{currentUser?.fullName}</div>
              <div className="text-xs text-muted">
                {currentUser?.role === 'admin' ? t('admin') : t('sheikh')}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={signOut}
            id="btn-signout"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', color: 'var(--error)' }}
          >
            <LogOut size={16} />
            {t('signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
