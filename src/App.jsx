import { useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import QuranProgressPage from './pages/QuranProgressPage.jsx';
import MurajahPage from './pages/MurajahPage.jsx';
import MatnPage from './pages/MatnPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import HalaqatPage from './pages/HalaqatPage.jsx';
import TeachersPage from './pages/TeachersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { Menu, Bell } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'dashboard', students: 'students', attendance: 'attendance',
  quranProgress: 'quranProgress', muraja3ah: 'muraja3ah', matn: 'matn',
  analytics: 'analytics', reports: 'reports', halaqat: 'halaqat',
  teachers: 'teachers', settings: 'settings', auditLogs: 'auditLogs',
};

function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span style={{ fontSize: '1rem' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function AppShell() {
  const { currentUser, t, activePage, lang, isRTL } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <DashboardPage />;
      case 'students':     return <StudentsPage />;
      case 'attendance':   return <AttendancePage />;
      case 'quranProgress':return <QuranProgressPage />;
      case 'muraja3ah':    return <MurajahPage />;
      case 'matn':         return <MatnPage />;
      case 'analytics':    return <AnalyticsPage />;
      case 'reports':      return <ReportsPage />;
      case 'halaqat':      return <HalaqatPage />;
      case 'teachers':     return <TeachersPage />;
      case 'settings':     return <SettingsPage />;
      default:             return <DashboardPage />;
    }
  };

  const today = new Date().toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'var(--overlay)',
            zIndex: 99, display: 'none',
          }}
          id="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(p => !p)}
              style={{ display: 'none' }}
              id="hamburger-btn"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-subtitle font-bold" style={{ lineHeight: 1.2 }}>
                {t(PAGE_TITLES[activePage] || 'dashboard')}
              </h2>
              <p className="text-xs text-muted">{today}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Notification bell */}
            <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: 4, insetInlineEnd: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--error)', border: '2px solid var(--bg-card)',
              }} />
            </button>
          </div>
        </div>

        {/* Page Content */}
        {renderPage()}
      </main>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { currentUser } = useApp();
  return currentUser ? <AppShell /> : <LoginPage />;
}
