import { useApp } from '../context/AppContext.jsx';
import { mockHalaqat, mockStudents } from '../data/mockData.js';
import { Clock, Users, MapPin } from 'lucide-react';

export default function HalaqatPage() {
  const { t, lang, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const myHalaqat = isAdmin
    ? mockHalaqat
    : mockHalaqat.filter(h => h.sheikhId === currentUser?.id);

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-title font-bold">{t('halaqat')}</h1>
        <p className="text-small text-secondary">
          {myHalaqat.length} {lang === 'ar' ? 'حلقات' : 'circles'}
        </p>
      </div>

      <div className="grid-3">
        {myHalaqat.map(h => {
          const students = mockStudents.filter(s => s.halaqaId === h.id && s.status === 'active');
          return (
            <div key={h.id} className="card" style={{ cursor: 'default', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1.3rem',
                }}>🕌</div>
                <span className={`badge ${h.isActive ? 'badge-active' : 'badge-archived'}`}>
                  {h.isActive ? (lang === 'ar' ? 'نشطة' : 'Active') : (lang === 'ar' ? 'موقوفة' : 'Inactive')}
                </span>
              </div>
              <div>
                <h3 className="text-subtitle font-bold">{lang === 'ar' ? h.name : h.nameEn}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                  <MapPin size={12} />
                  <span className="text-xs">{h.location}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 10 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald)' }}>{students.length}</div>
                  <div className="text-xs text-muted">{t('students')}</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37' }}>{h.juzCompleted || '—'}</div>
                  <div className="text-xs text-muted">{lang === 'ar' ? 'أيام/أسبوع' : 'Days/Wk'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {h.schedule.map(day => (
                  <span key={day} style={{
                    padding: '0.2rem 0.5rem', borderRadius: 6,
                    background: 'var(--bg-input)', color: 'var(--text-secondary)',
                    fontSize: '0.7rem', fontWeight: 600,
                  }}>{day}</span>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
                <Clock size={13} />
                <span className="text-xs">{h.startTime} — {h.endTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
