import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockStudents, mockSessions } from '../data/mockData.js';
import { SURAHS, getSurahName } from '../data/quranData.js';
import { Plus, X, Star } from 'lucide-react';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.5rem', padding: '0.1rem',
            color: n <= (hovered || value) ? '#D4AF37' : 'var(--border)',
            transition: 'color 0.1s, transform 0.1s',
            transform: n <= (hovered || value) ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function AddSessionModal({ student, onClose, onSave }) {
  const { t, lang } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    fromSurah: student?.currentSurah || 1,
    fromAyah: student?.currentAyah || 1,
    toSurah: student?.currentSurah || 1,
    toAyah: student?.currentAyah || 1,
    date: today,
    type: 'new',
    rating: 0,
    notes: '',
  });

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fromSurahData = SURAHS.find(s => s.number === Number(form.fromSurah));
  const toSurahData = SURAHS.find(s => s.number === Number(form.toSurah));

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, studentId: student.id });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="text-subtitle font-semibold">{t('recordNewSession')}</h2>
            <p className="text-small text-muted">{student?.fullName}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Session Type */}
            <div className="input-group">
              <label className="input-label">{t('sessionType')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['new', 'muraja3ah'].map(type => (
                  <button
                    key={type} type="button"
                    className={`btn btn-sm ${form.type === type ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handle('type', type)}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {type === 'new' ? `📖 ${t('newMemorization')}` : `🔄 ${t('revision')}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Current position hint */}
            <div style={{
              background: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.2)',
              borderRadius: 10, padding: '0.75rem',
              fontSize: '0.82rem', color: 'var(--emerald)',
            }}>
              💡 {lang === 'ar' ? 'الموقع الحالي:' : 'Current position:'}
              {' '}<strong>{getSurahName(student?.currentSurah, lang)} — {lang === 'ar' ? 'آية' : 'Ayah'} {student?.currentAyah}</strong>
            </div>

            {/* From */}
            <div>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>
                {t('fromAyah')}
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{t('surah')}</label>
                  <select className="select" value={form.fromSurah} onChange={e => handle('fromSurah', Number(e.target.value))}>
                    {SURAHS.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {lang === 'ar' ? s.nameAr : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{lang === 'ar' ? 'رقم الآية' : 'Ayah number'}</label>
                  <input
                    type="number" className="input"
                    min={1} max={fromSurahData?.ayahs || 286}
                    value={form.fromAyah}
                    onChange={e => handle('fromAyah', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* To */}
            <div>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>
                {t('toAyah')}
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{t('surah')}</label>
                  <select className="select" value={form.toSurah} onChange={e => handle('toSurah', Number(e.target.value))}>
                    {SURAHS.map(s => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {lang === 'ar' ? s.nameAr : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{lang === 'ar' ? 'رقم الآية' : 'Ayah number'}</label>
                  <input
                    type="number" className="input"
                    min={1} max={toSurahData?.ayahs || 286}
                    value={form.toAyah}
                    onChange={e => handle('toAyah', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="input-group">
              <label className="input-label">{t('sessionDate')}</label>
              <input type="date" className="input" value={form.date} onChange={e => handle('date', e.target.value)} />
            </div>

            {/* Rating */}
            <div className="input-group">
              <label className="input-label">{t('qualityRating')}</label>
              <StarRating value={form.rating} onChange={v => handle('rating', v)} />
            </div>

            {/* Notes */}
            <div className="input-group">
              <label className="input-label">{t('sessionNotes')} ({t('optional')})</label>
              <textarea
                className="input" rows={3}
                value={form.notes}
                onChange={e => handle('notes', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionCard({ session, lang, t }) {
  const stars = session.qualityRating || 0;
  const colors = {
    5: '#10B981', 4: '#14B8A6', 3: '#F59E0B', 2: '#F97316', 1: '#EF4444'
  };
  return (
    <div style={{
      display: 'flex', gap: '1rem', padding: '1rem',
      background: 'var(--bg-card)', borderRadius: 12,
      border: '1.5px solid var(--border)',
      transition: 'border-color 0.15s',
    }}>
      {/* Date bubble */}
      <div style={{
        flexShrink: 0, width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'white',
      }}>
        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
          {new Date(session.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en', { month: 'short' })}
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>
          {new Date(session.date).getDate()}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="text-small font-semibold">
            {getSurahName(session.fromSurah, lang)} {session.fromAyah} — {getSurahName(session.toSurah, lang)} {session.toAyah}
          </span>
          <span className={`badge ${session.type === 'new' ? 'badge-active' : 'badge-excused'}`}>
            {session.type === 'new' ? (lang === 'ar' ? 'حفظ جديد' : 'New') : t('revision')}
          </span>
        </div>
        {session.notes && (
          <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{session.notes}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.375rem' }}>
          <span className="text-xs font-semibold text-emerald">
            +{session.ayahCount} {lang === 'ar' ? 'آية' : 'ayahs'}
          </span>
          {stars > 0 && (
            <div style={{ display: 'flex', gap: '1px' }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize: '0.75rem', color: n <= stars ? colors[stars] : 'var(--border)' }}>★</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuranProgressPage() {
  const { t, lang, currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const myStudents = isAdmin
    ? mockStudents
    : mockStudents.filter(s => s.sheikhId === currentUser?.id && s.status === 'active');

  const [selectedStudent, setSelectedStudent] = useState(myStudents[0]);
  const [sessions, setSessions] = useState([...mockSessions]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('timeline'); // 'timeline' | 'juzmap'

  const studentSessions = sessions
    .filter(s => s.studentId === selectedStudent?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const juzGrid = Array.from({ length: 30 }, (_, i) => i + 1);
  const pct = selectedStudent
    ? Math.round((selectedStudent.totalAyahMemorized / 6236) * 100)
    : 0;

  const handleSaveSession = (data) => {
    const ayahCount = Math.abs(data.toAyah - data.fromAyah) + 1;
    const newSession = {
      id: `ses-${Date.now()}`,
      studentId: data.studentId,
      sheikhId: currentUser.id,
      date: data.date,
      fromSurah: data.fromSurah,
      fromAyah: data.fromAyah,
      toSurah: data.toSurah,
      toAyah: data.toAyah,
      ayahCount,
      qualityRating: data.rating || null,
      notes: data.notes,
      type: data.type,
    };
    setSessions(prev => [newSession, ...prev]);
    showToast(t('sessionSaved'));
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('quranProgress')}</h1>
          <p className="text-small text-secondary">
            {lang === 'ar' ? 'متابعة حفظ الطلاب وتسجيل الجلسات' : 'Track student memorization and log sessions'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          disabled={!selectedStudent}
          id="btn-record-session"
        >
          <Plus size={16} />
          {t('recordNewSession')}
        </button>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Student picker + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Student selector */}
          <div className="card card-sm">
            <div className="input-label" style={{ marginBottom: '0.5rem' }}>{t('students')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 280, overflowY: 'auto' }}>
              {myStudents.map(student => {
                const isSelected = selectedStudent?.id === student.id;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.75rem', borderRadius: 10,
                      border: `1.5px solid ${isSelected ? 'var(--emerald)' : 'transparent'}`,
                      background: isSelected ? 'rgba(15,118,110,0.08)' : 'var(--bg-hover)',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'inherit',
                    }}
                  >
                    <div className="avatar avatar-sm">{student.fullName[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-small font-semibold truncate">{student.fullName}</div>
                      <div className="text-xs text-muted">{student.totalAyahMemorized} {lang === 'ar' ? 'آية' : 'verses'}</div>
                    </div>
                    <div style={{ width: 40 }}>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill"
                          style={{ width: `${Math.round((student.totalAyahMemorized / 6236) * 100)}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student progress card */}
          {selectedStudent && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(15,118,110,0.06), rgba(212,175,55,0.04))',
              border: '1px solid rgba(15,118,110,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="avatar avatar-lg">{selectedStudent.fullName[0]}</div>
                <div>
                  <div className="text-subtitle font-bold">{selectedStudent.fullName}</div>
                  <div className="text-small text-secondary">
                    📍 {getSurahName(selectedStudent.currentSurah, lang)} — {lang === 'ar' ? 'آية' : 'Ayah'} {selectedStudent.currentAyah}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-xs text-muted">{t('overallProgress')}</span>
                  <span className="text-xs font-bold text-emerald">{pct}%</span>
                </div>
                <div className="progress-bar-container" style={{ height: 8 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-xs text-muted">{selectedStudent.totalAyahMemorized} / 6236 {lang === 'ar' ? 'آية' : 'verses'}</span>
                  <span className="text-xs text-muted">{selectedStudent.juzCompleted.length} / 30 {lang === 'ar' ? 'جزء' : 'juz'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline / Juz Map */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'var(--bg-input)', borderRadius: 10, padding: '0.25rem' }}>
            {[
              { key: 'timeline', label: t('progressTimeline') },
              { key: 'juzmap',   label: t('juzMap') },
            ].map(tab_ => (
              <button
                key={tab_.key}
                onClick={() => setTab(tab_.key)}
                className="btn btn-sm"
                style={{
                  flex: 1, justifyContent: 'center',
                  background: tab === tab_.key ? 'var(--bg-card)' : 'transparent',
                  color: tab === tab_.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === tab_.key ? 'var(--shadow-card)' : 'none',
                  fontWeight: tab === tab_.key ? 600 : 400,
                }}
              >
                {tab_.label}
              </button>
            ))}
          </div>

          {tab === 'timeline' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 500, overflowY: 'auto' }}>
              {studentSessions.length === 0 ? (
                <div className="empty-state">
                  <div className="text-subtitle">{t('noData')}</div>
                </div>
              ) : (
                studentSessions.map(session => (
                  <SessionCard key={session.id} session={session} lang={lang} t={t} />
                ))
              )}
            </div>
          ) : (
            <div className="card">
              <div className="text-small font-semibold" style={{ marginBottom: '1rem' }}>
                🗺️ {t('juzMap')} — {selectedStudent?.fullName}
              </div>
              <div className="juz-map">
                {juzGrid.map(j => {
                  const completed = selectedStudent?.juzCompleted.includes(j);
                  return (
                    <div
                      key={j}
                      className={`juz-cell ${completed ? 'completed' : 'empty'}`}
                      title={`${t('juz')} ${j}${completed ? ' ✅' : ''}`}
                    >
                      <span style={{ fontSize: '0.58rem' }}>{lang === 'ar' ? 'ج' : 'J'}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{j}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--emerald)' }} />
                  <span className="text-xs text-muted">{lang === 'ar' ? 'مكتمل' : 'Completed'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-input)', border: '1px solid var(--border)' }} />
                  <span className="text-xs text-muted">{lang === 'ar' ? 'لم يكتمل' : 'Incomplete'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddSessionModal
          student={selectedStudent}
          onClose={() => setShowModal(false)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}
