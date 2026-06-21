import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function LoginPage() {
  const { t, signIn, signInDemo, showToast, lang, setLang } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      signIn(email, password);
      showToast(t('success'));
    } catch {
      setError(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    signInDemo(role);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Decorative background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,118,110,0.3) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
        }} />
      </div>

      <div className="auth-card" style={{ position: 'relative' }}>
        {/* Lang toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="btn btn-secondary btn-sm"
            style={{ minWidth: 60 }}
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #0F766E, #115E59)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(15,118,110,0.3)',
          }}>
            <span style={{ fontSize: '2rem' }}>📖</span>
          </div>
          <h1 className="text-title" style={{ marginBottom: '0.25rem' }}>{t('welcomeBack')}</h1>
          <p className="text-small text-secondary">{t('loginSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <div className="input-with-icon">
              <span className="input-icon" style={{ fontSize: '0.875rem' }}>✉️</span>
              <input
                type="email"
                className="input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('password')}</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <span className="input-icon" style={{ fontSize: '0.875rem' }}>🔒</span>
              <input
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="current-password"
                style={{ paddingInlineEnd: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', insetInlineEnd: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.875rem',
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, padding: '0.65rem 0.875rem',
              color: '#991B1B', fontSize: '0.8rem', fontWeight: 500,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.875rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {t('signingIn')}
              </span>
            ) : t('signIn')}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          margin: '1.5rem 0', color: 'var(--text-muted)',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {lang === 'ar' ? 'أو جرّب الوضع التجريبي' : 'Or try demo'}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Demo Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleDemo('sheikh')}
            disabled={loading}
            style={{ justifyContent: 'center' }}
          >
            🎓 {t('demoSheikhLogin')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleDemo('admin')}
            disabled={loading}
            style={{ justifyContent: 'center' }}
          >
            ⚙️ {t('demoAdminLogin')}
          </button>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '2rem',
          fontSize: '0.7rem', color: 'var(--text-muted)',
        }}>
          {t('appName')} · {t('appTagline')}
        </p>
      </div>
    </div>
  );
}
