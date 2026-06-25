import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { MATN_TYPES } from '../data/quranData.js';
import { Plus, X, ScrollText, MessageSquare, Trash2 } from 'lucide-react';

// Matn progress has no Supabase table, so it is persisted locally on the device.
const MATN_STORAGE_KEY = 'hifz_matn_progress';
const loadMatnProgress = () => {
  try {
    const raw = localStorage.getItem(MATN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

function MatnCard({ progress, student, lang, onDelete }) {
  const matnInfo = MATN_TYPES.find(m => m.key === progress.matnType);
  const pct = progress.progressPct;
  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#D4AF37', fontSize: '1.1rem', flexShrink: 0,
        }}><ScrollText size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-small font-bold">
            {lang === 'ar' ? matnInfo?.nameAr : matnInfo?.nameEn}
          </div>
          <div className="text-xs text-muted">{student?.fullName}</div>
        </div>
        <div style={{
          fontSize: '1.25rem', fontWeight: 700,
          color, minWidth: 44, textAlign: 'center',
        }}>
          {pct}%
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(progress.id)}
          title={lang === 'ar' ? 'حذف' : 'Delete'} style={{ color: 'var(--error)', flexShrink: 0 }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span className="text-xs text-muted">{progress.chapter}</span>
        </div>
        <div className="progress-bar-container" style={{ height: 7 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>

      {progress.notes && (
        <p className="text-xs text-secondary" style={{
          background: 'var(--bg-input)', borderRadius: 8, padding: '0.5rem 0.625rem',
        }}>
          <MessageSquare size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginInlineEnd: 4 }} />{progress.notes}
        </p>
      )}
    </div>
  );
}

function AddMatnModal({ students, onClose, onSave }) {
  const { t, lang } = useApp();
  const [form, setForm] = useState({
    studentId: students[0]?.id || '',
    matnType: 'bayquniyyah',
    chapter: '',
    progressPct: 0,
    notes: '',
  });
  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">{lang === 'ar' ? 'إضافة متن' : 'Add Matn'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="input-group">
            <label className="input-label">{t('students')}</label>
            <select className="select" value={form.studentId} onChange={e => handle('studentId', e.target.value)}>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">{t('matnType')}</label>
            <select className="select" value={form.matnType} onChange={e => handle('matnType', e.target.value)}>
              {MATN_TYPES.map(m => (
                <option key={m.key} value={m.key}>{lang === 'ar' ? m.nameAr : m.nameEn}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">{t('chapter')}</label>
            <input className="input" value={form.chapter} onChange={e => handle('chapter', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('progressPercent')}: {form.progressPct}%</label>
            <input type="range" min={0} max={100} value={form.progressPct}
              onChange={e => handle('progressPct', Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--emerald)' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label">{t('notes')}</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => handle('notes', e.target.value)} style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}

export default function MatnPage() {
  const { t, lang, currentUser, showToast, dbData } = useApp();
  const safeStudent = (s) => ({
    ...s,
    fullName: s.fullName || 'بدون اسم',
  });

  const myStudents = (dbData?.students || []).filter(
    s => currentUser?.role === 'admin' || s.sheikhId === currentUser?.id
  ).map(safeStudent);
  const [progressList, setProgressList] = useState(loadMatnProgress);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Persist to localStorage whenever the list changes
  useEffect(() => {
    try {
      localStorage.setItem(MATN_STORAGE_KEY, JSON.stringify(progressList));
    } catch { /* ignore quota / serialization errors */ }
  }, [progressList]);

  const filtered = filterType === 'all' ? progressList : progressList.filter(p => p.matnType === filterType);

  const deleteMatn = (id) => setProgressList(prev => prev.filter(p => p.id !== id));

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('matn')}</h1>
          <p className="text-small text-secondary">
            {lang === 'ar' ? 'متابعة حفظ المتون الإسلامية' : 'Track Islamic text memorization'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {lang === 'ar' ? 'إضافة متن' : 'Add Matn'}
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterType('all')}
        >
          {t('all')}
        </button>
        {MATN_TYPES.map(m => (
          <button
            key={m.key}
            className={`btn btn-sm ${filterType === m.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType(m.key)}
          >
            {lang === 'ar' ? m.nameAr : m.nameEn}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ScrollText size={28} /></div>
          <div className="text-subtitle">{t('noData')}</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(p => (
            <MatnCard
              key={p.id} progress={p}
              student={myStudents.find(s => s.id === p.studentId)}
              lang={lang} onDelete={deleteMatn}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddMatnModal
          students={myStudents}
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            setProgressList(prev => [{ id: `matn-${Date.now()}`, ...data }, ...prev]);
            showToast(t('success'));
          }}
        />
      )}
    </div>
  );
}
