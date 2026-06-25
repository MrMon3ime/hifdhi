import { useState, useEffect } from 'react';
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
import { Menu, Bell, ArrowLeft, ArrowRight, LogOut } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

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

const DUAS = [
  "اللهم بارك في أوقاتنا",
  "رب زدني علماً",
  "اللهم اجعل القرآن ربيع قلوبنا",
  "سبحان الله وبحمده",
  "اللهم يسر لنا حفظ كتابك",
  "اللهم افتح علينا فتوح العارفين"
];

function AppShell() {
  const { currentUser, t, activePage, setActivePage, lang, isRTL, dbData, signOut } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState(new Date());
  const [duaIndex, setDuaIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const duaTimer = setInterval(() => {
      setDuaIndex(prev => (prev + 1) % DUAS.length);
    }, 10000);
    return () => {
      clearInterval(timer);
      clearInterval(duaTimer);
    };
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const handleBackButton = async ({ canGoBack }) => {
      if (activePage === 'dashboard') {
        CapApp.exitApp();
      } else {
        setActivePage('dashboard');
      }
    };
    const listener = CapApp.addListener('backButton', handleBackButton);
    return () => {
      listener.then(l => l.remove());
    };
  }, [activePage, setActivePage]);

  const pendingRevisions = (dbData?.revisions || []).filter(r => r.status === 'pending').length;
  const notificationsList = [
    { id: 1, title: lang === 'ar' ? 'مرحباً بك' : 'Welcome', desc: lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully', time: lang === 'ar' ? 'الآن' : 'Now' }
  ];
  if (pendingRevisions > 0) {
    notificationsList.unshift({ id: 2, title: lang === 'ar' ? 'مراجعات معلقة' : 'Pending Revisions', desc: lang === 'ar' ? `لديك ${pendingRevisions} مراجعات معلقة` : `You have ${pendingRevisions} pending revisions`, time: lang === 'ar' ? 'اليوم' : 'Today' });
  }

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

  const today = time.toLocaleDateString(
    lang === 'ar' ? 'ar-SA' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );
  const timeStr = time.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="app-shell">
      <style>
        {`
          @keyframes duaWalk {
            0% { transform: translateY(15px); opacity: 0; }
            10% { transform: translateY(0); opacity: 1; }
            90% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-15px); opacity: 0; }
          }
          .dua-animated {
            display: inline-block;
            animation: duaWalk 10s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}
      </style>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* Page Header */}
        {/* Page Header */}
        <div className="page-header" style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderBottom: 'none', 
          padding: '1rem 1.5rem', gap: '1rem', flexWrap: 'wrap'
        }}>
          
          {/* Left: Menu & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(p => !p)}
              id="hamburger-btn"
            >
              <Menu size={24} />
            </button>
            
            {activePage !== 'dashboard' && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setActivePage('dashboard')}
                title={t('backToDashboard')}
              >
                {isRTL ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
              </button>
            )}

            <h2 className="text-display font-bold" style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {t(PAGE_TITLES[activePage] || 'dashboard')}
            </h2>
          </div>

          {/* Center: Dynamic Pill (Date, Time, Dua) */}
          <div className="hide-on-mobile" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '1rem', background: 'var(--bg-input)', padding: '0.625rem 1.5rem',
            borderRadius: '100px', fontSize: '1rem', fontWeight: 500,
            color: 'var(--text-secondary)', border: '1px solid var(--border)',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.02)',
            flex: '0 1 auto', minWidth: 'fit-content'
          }}>
            <span>{today}</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{timeStr}</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <div style={{ overflow: 'hidden', minWidth: '220px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
              <span key={duaIndex} className="dua-animated" style={{ color: 'var(--emerald)', fontWeight: 600, fontSize: '0.85rem', lineHeight: '1.2' }}>
                {DUAS[duaIndex]}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: '1 1 200px', justifyContent: 'flex-end', position: 'relative' }}>
            <button
              className="btn btn-ghost" 
              onClick={signOut}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}
              title={t('signOut')}
            >
              <LogOut size={18} />
              <span className="hide-on-mobile text-small font-semibold">{t('signOut')}</span>
            </button>
            {/* Notification bell */}
            <button 
              className="btn btn-ghost btn-icon" 
              style={{ position: 'relative' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {notificationsList.length > 0 && (
                <span style={{
                  position: 'absolute', top: 4, insetInlineEnd: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--error)', border: '2px solid var(--bg-card)',
                }} />
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowNotifications(false)} />
                <div className="card" style={{
                  position: 'absolute', top: 'calc(100% + 0.5rem)', insetInlineEnd: 0,
                  width: 'min(320px, calc(100vw - 1.5rem))', maxWidth: 320,
                  zIndex: 99, padding: 0, overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-small font-bold">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                    <span className="badge badge-active">{notificationsList.length}</span>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notificationsList.map(n => (
                      <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className="text-small font-semibold">{n.title}</span>
                          <span className="text-xs text-muted">{n.time}</span>
                        </div>
                        <div className="text-xs text-secondary">{n.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        {renderPage()}
      </main>

      {/* Bottom dua bar — phone only (the header dua pill is hidden on mobile) */}
      <div className="show-on-mobile mobile-dua-bar">
        <span key={duaIndex} className="dua-animated" style={{
          color: 'var(--emerald)', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.3,
        }}>
          {DUAS[duaIndex]}
        </span>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { currentUser } = useApp();
  return currentUser ? <AppShell /> : <LoginPage />;
}
