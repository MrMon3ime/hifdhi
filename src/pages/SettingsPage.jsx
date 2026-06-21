import { useApp } from '../context/AppContext.jsx';
import { Sun, Moon, Monitor, Globe, User, Lock, ChevronRight } from 'lucide-react';

function SettingRow({ icon: Icon, label, children, desc }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1rem', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--bg-input)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--emerald)', flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-small font-semibold">{label}</div>
        {desc && <div className="text-xs text-muted">{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang, themeMode, setThemeMode, currentUser, showToast } = useApp();

  const themeOptions = [
    { value: 'light', label: t('lightMode'), icon: Sun },
    { value: 'dark',  label: t('darkMode'),  icon: Moon },
    { value: 'system',label: t('systemDefault'), icon: Monitor },
  ];

  return (
    <div className="page-body" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-title font-bold">{t('settings')}</h1>
        <p className="text-small text-secondary">
          {lang === 'ar' ? 'تخصيص التطبيق وإدارة الحساب' : 'Customize the app and manage your account'}
        </p>
      </div>

      {/* Account */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('account')}
          </span>
        </div>
        <SettingRow icon={User} label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}>
          <span className="text-small text-secondary">{currentUser?.fullName}</span>
        </SettingRow>
        <SettingRow icon={Globe} label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}>
          <span className="text-small text-secondary">{currentUser?.email}</span>
        </SettingRow>
        <SettingRow icon={Lock} label={lang === 'ar' ? 'الدور' : 'Role'}>
          <span className={`badge ${currentUser?.role === 'admin' ? 'badge-excused' : 'badge-active'}`}>
            {currentUser?.role === 'admin' ? t('admin') : t('sheikh')}
          </span>
        </SettingRow>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('appearance')}
          </span>
        </div>

        {/* Language */}
        <SettingRow icon={Globe} label={t('language')} desc={lang === 'ar' ? 'اختر لغة واجهة التطبيق' : 'Choose interface language'}>
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 10, padding: '0.2rem', gap: '0.2rem' }}>
            {[
              { value: 'ar', label: 'العربية' },
              { value: 'en', label: 'English' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                className="btn btn-sm"
                style={{
                  minWidth: 70, justifyContent: 'center',
                  background: lang === opt.value ? 'var(--bg-card)' : 'transparent',
                  color: lang === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: lang === opt.value ? 700 : 400,
                  boxShadow: lang === opt.value ? 'var(--shadow-card)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Theme */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.875rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-input)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--emerald)', flexShrink: 0,
            }}>
              {themeMode === 'dark' ? <Moon size={16} /> : themeMode === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
            </div>
            <div>
              <div className="text-small font-semibold">{t('theme')}</div>
              <div className="text-xs text-muted">{lang === 'ar' ? 'اختر مظهر التطبيق' : 'Choose app appearance'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {themeOptions.map(opt => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setThemeMode(opt.value)}
                  style={{
                    flex: 1, minWidth: 90,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    padding: '0.875rem 0.5rem', borderRadius: 12,
                    border: `2px solid ${isSelected ? 'var(--emerald)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(15,118,110,0.06)' : 'var(--bg-input)',
                    color: isSelected ? 'var(--emerald)' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card" style={{ padding: 0, marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('security')}
          </span>
        </div>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem', width: '100%', cursor: 'pointer',
            background: 'none', border: 'none', textAlign: 'inherit',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          onClick={() => showToast(lang === 'ar' ? 'قريبًا' : 'Coming soon!')}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--emerald)', flexShrink: 0,
          }}>
            <Lock size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-small font-semibold">{t('changePassword')}</div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)', transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>

      {/* App Info */}
      <div className="card card-sm" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
        <div className="text-small font-bold">{t('appName')}</div>
        <div className="text-xs text-muted">v1.0.0 · {lang === 'ar' ? 'المرحلة الأولى' : 'MVP Phase'}</div>
        <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
          {lang === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the name of Allah, the Most Gracious'}
        </div>
      </div>
    </div>
  );
}
