import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

// A heartfelt prayer for whoever built this app (shown on the login screen).
const CREATOR_DUA =
  'اللّهُمَّ بارِكْ لِمَن أنشأ هذا التطبيق، واجعَلْه صدقةً جاريةً لا ينقطعُ أجرُها، '
  + 'وارزُقْه بكلِّ حرفٍ يُحفَظُ به حسناتٍ تُثقِّلُ ميزانَه، واغفِرْ له ولوالديه، '
  + 'وأسكِنْه الفردوسَ الأعلى مع النبيِّين والصدِّيقين.';

export default function LoginPage() {
  const { t, signIn, showToast, lang, setLang } = useApp();
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

  return (
    <div className="auth-page auth-page-bg" style={{ position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes authGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes floatOrb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-26px)} }
        @keyframes fadeUp { from{opacity:0; transform:translateY(18px)} to{opacity:1; transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes logoGlow { 0%,100%{box-shadow:0 8px 30px rgba(15,118,110,0.45)} 50%{box-shadow:0 8px 44px rgba(212,175,55,0.45)} }
        .auth-page-bg {
          background: linear-gradient(135deg,#0B3D3A,#0F766E,#0B1F3A,#0F172A);
          background-size: 320% 320%;
          animation: authGradient 18s ease infinite;
        }
        .auth-card-modern {
          width: 100%;
          max-width: 420px;
          position: relative;
          animation: fadeUp .5s cubic-bezier(.4,0,.2,1) both;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .auth-orb { position:absolute; border-radius:50%; filter:blur(6px); animation: floatOrb 12s ease-in-out infinite; }
        .login-logo { animation: logoGlow 5s ease-in-out infinite; }
        .dua-card { position:relative; overflow:hidden; }
        .dua-card::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background: linear-gradient(110deg, transparent 35%, rgba(212,175,55,0.16) 50%, transparent 65%);
          background-size: 220% 100%;
          animation: shimmer 7s linear infinite;
        }
      `}</style>

      {/* Decorative background orbs (clipped by overflow:hidden on root) */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="auth-orb" style={{ top: '-15%', insetInlineEnd: '-20%', width: 380, height: 380,
          background: 'radial-gradient(circle, rgba(15,118,110,0.55) 0%, transparent 70%)' }} />
        <div className="auth-orb" style={{ bottom: '-12%', insetInlineStart: '-15%', width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)', animationDelay: '3s' }} />
      </div>

      <div className="auth-card auth-card-modern glass-card">
        {/* Lang toggle — small globe icon */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            title={lang === 'ar' ? 'English' : 'العربية'}
            aria-label="change language"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.35rem 0.6rem', borderRadius: 999,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.72rem', fontWeight: 700,
            }}
          >
            <Globe size={15} />
            <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="login-logo" style={{
            width: 84, height: 84, borderRadius: 22,
            background: 'linear-gradient(135deg, #0F766E, #115E59)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 className="text-title" style={{ marginBottom: '0.35rem', fontSize: '1.6rem' }}>
            {lang === 'ar' ? 'السلام عليكم' : 'Assalamu Alaikum'}
          </h1>
          <p className="text-small text-secondary">{t('loginSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <div className="input-with-icon">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                type="email"
                className="input"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('password')}</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <span className="input-icon"><Lock size={16} /></span>
              <input
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="current-password"
                style={{ width: '100%', paddingInlineEnd: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute', insetInlineEnd: '0.75rem',
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 10, padding: '0.65rem 0.875rem',
              color: '#FCA5A5', fontSize: '0.8rem', fontWeight: 500,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', padding: '0.9rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                {t('signingIn')}
              </span>
            ) : t('signIn')}
          </button>
        </form>

        {/* Dua for the creator */}
        <div className="dua-card" style={{
          marginTop: '1.75rem', padding: '1.1rem 1.15rem', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(15,118,110,0.12), rgba(212,175,55,0.08))',
          border: '1px solid rgba(212,175,55,0.30)', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8, color: 'var(--gold)' }}>
            <Sparkles size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>
              {lang === 'ar' ? 'دعاء لصاحب التطبيق' : 'A prayer for the creator'}
            </span>
            <Sparkles size={14} />
          </div>
          <p dir="rtl" style={{
            fontSize: '0.92rem', lineHeight: 2, color: 'var(--text-secondary)',
            fontWeight: 500, fontFamily: "'IBM Plex Sans Arabic', serif",
          }}>
            {CREATOR_DUA}
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {t('appName')} · {t('appTagline')}
        </p>
      </div>
    </div>
  );
}
