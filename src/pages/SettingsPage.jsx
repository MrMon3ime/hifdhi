import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Sun, Moon, Monitor, Globe, User, Lock, ChevronRight, BookOpen, X } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

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

function ChangePasswordModal({ onClose }) {
  const { t, lang, currentUser, showToast } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }
    
    // In this MVP, we check the current password against what's saved in the users table
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', currentUser.id)
        .single();
        
      if (fetchError || !data || data.password !== currentPassword) {
        showToast(lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect', 'error');
        setLoading(false);
        return;
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', currentUser.id);
        
      if (updateError) throw updateError;
      
      showToast(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      onClose();
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Error changing password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">{t('changePassword')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'} *</label>
              <input type="password" className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} *</label>
              <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *</label>
              <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang, themeMode, setThemeMode, currentUser, dbData } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
          onClick={() => setShowPasswordModal(true)}
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
        </div>
        <div className="text-small font-bold">{t('appName')}</div>
        <div className="text-xs text-muted">v1.0.0 · {lang === 'ar' ? 'المرحلة الأولى' : 'MVP Phase'}</div>
        <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
          {lang === 'ar' ? 'بسم الله الرحمن الرحيم' : 'In the name of Allah, the Most Gracious'}
        </div>
      </div>
      
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}
