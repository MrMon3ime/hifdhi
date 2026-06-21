import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockStudents, mockRevisions } from '../data/mockData.js';
import { getSurahName } from '../data/quranData.js';
import { Plus, X, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: '#10B981', bg: '#ECFDF5', label: 'completed' },
  pending:   { icon: Clock,       color: '#F59E0B', bg: '#FFFBEB', label: 'pending' },
  missed:    { icon: XCircle,     color: '#EF4444', bg: '#FEF2F2', label: 'missed' },
  partial:   { icon: AlertTriangle,color:'#F97316', bg: '#FFF7ED', label: 'partial' },
};

export default function MurajahPage() {
  const { t, lang, currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const myStudents = isAdmin
    ? mockStudents
    : mockStudents.filter(s => s.sheikhId === currentUser?.id && s.status === 'active');

  const [revisions, setRevisions] = useState([...mockRevisions]);
  const [filter, setFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');

  const filtered = revisions.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchStudent = selectedStudentId === 'all' || r.studentId === selectedStudentId;
    return matchStatus && matchStudent;
  });

  const updateStatus = (id, status) => {
    setRevisions(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    showToast(t('success'));
  };

  const counts = {
    all: revisions.length,
    pending: revisions.filter(r => r.status === 'pending').length,
    completed: revisions.filter(r => r.status === 'completed').length,
    missed: revisions.filter(r => r.status === 'missed').length,
    partial: revisions.filter(r => r.status === 'partial').length,
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-title font-bold">{t('muraja3ah')}</h1>
        <p className="text-small text-secondary">
          {lang === 'ar' ? 'متابعة المراجعات اليومية والأسبوعية' : 'Track daily and weekly revisions'}
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.875rem', borderRadius: 10,
              background: cfg.bg, cursor: 'pointer',
              border: filter === status ? `2px solid ${cfg.color}` : '2px solid transparent',
              transition: 'border 0.15s',
            }}
              onClick={() => setFilter(filter === status ? 'all' : status)}
            >
              <Icon size={15} style={{ color: cfg.color }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color }}>{counts[status]}</span>
              <span style={{ fontSize: '0.75rem', color: cfg.color }}>{t(cfg.label)}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select className="select" value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)} style={{ minWidth: 180 }}>
          <option value="all">{lang === 'ar' ? 'كل الطلاب' : 'All Students'}</option>
          {myStudents.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <select className="select" value={filter}
          onChange={e => setFilter(e.target.value)} style={{ minWidth: 130 }}>
          <option value="all">{t('all')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="completed">{t('completed')}</option>
          <option value="missed">{t('missed')}</option>
          <option value="partial">{t('partial')}</option>
        </select>
      </div>

      {/* Revision Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Clock size={28} /></div>
          <div className="text-subtitle">{t('noData')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(rev => {
            const student = myStudents.find(s => s.id === rev.studentId);
            const cfg = STATUS_CONFIG[rev.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={rev.id} style={{
                background: 'var(--bg-card)', borderRadius: 14,
                border: `1.5px solid var(--border)`,
                padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                transition: 'border-color 0.15s, transform 0.15s',
              }}>
                {/* Status indicator */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>

                {/* Student */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 140 }}>
                  <div className="avatar avatar-sm">{student?.fullName[0]}</div>
                  <div>
                    <div className="text-small font-semibold">{student?.fullName}</div>
                    <div className="text-xs text-muted">{rev.date}</div>
                  </div>
                </div>

                {/* Range */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="text-small font-medium">
                    {getSurahName(rev.fromSurah, lang)} {rev.fromAyah}
                    {' → '}
                    {getSurahName(rev.toSurah, lang)} {rev.toAyah}
                  </div>
                  {rev.qualityRating && (
                    <div style={{ display: 'flex', gap: '1px', marginTop: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: '0.72rem', color: n <= rev.qualityRating ? '#D4AF37' : 'var(--border)' }}>★</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {rev.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 700 }}
                      onClick={() => updateStatus(rev.id, 'completed')}
                    >
                      ✅ {t('completed')}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}
                      onClick={() => updateStatus(rev.id, 'partial')}
                    >
                      ⚡ {t('partial')}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#FEF2F2', color: '#991B1B', fontWeight: 700 }}
                      onClick={() => updateStatus(rev.id, 'missed')}
                    >
                      ❌ {t('missed')}
                    </button>
                  </div>
                )}

                {rev.status !== 'pending' && (
                  <span className={`badge badge-${rev.status === 'completed' ? 'active' : rev.status === 'missed' ? 'absent' : 'late'}`}>
                    {t(rev.status)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
