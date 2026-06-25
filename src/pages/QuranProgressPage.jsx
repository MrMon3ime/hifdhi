import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  SURAHS, getSurahName, countAyahsBetween,
  toGlobalAyah, fromGlobalAyah, mergeIntervals, intervalsCount, furthestMemorized,
  rangeOverlaps, rangeWithin, getMemorizedIntervals,
} from '../data/quranData.js';
import ProgressMap from '../components/ProgressMap.jsx';
import { Plus, X, BookOpen, RefreshCw, Info, MapPin, Trash2, Edit3 } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────── */
const totalQuranAyahs = 6236;

/* ── StarRating ───────────────────────────────────────────── */
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.5rem', padding: '0.1rem',
            color: n <= (hovered || value) ? '#D4AF37' : 'var(--border)',
            transition: 'color 0.1s, transform 0.1s',
            transform: n <= (hovered || value) ? 'scale(1.1)' : 'scale(1)',
          }}>★</button>
      ))}
    </div>
  );
}

/* ── AddSessionModal ──────────────────────────────────────── */
function AddSessionModal({ student, editSession, memorizedIntervals = [], onClose, onSave }) {
  const { t, lang } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const isEditing = !!editSession;

  const [form, setForm] = useState(() => {
    if (editSession) {
      return {
        fromSurah: editSession.fromSurah || editSession.from_surah || 1,
        fromAyah: editSession.fromAyah || editSession.from_ayah || 1,
        toSurah: editSession.toSurah || editSession.to_surah || 1,
        toAyah: editSession.toAyah || editSession.to_ayah || 1,
        date: editSession.date || today,
        type: editSession.type || 'new',
        rating: editSession.qualityRating || editSession.rating || 0,
        notes: editSession.notes || '',
      };
    }
    // Default a NEW session to the next un-memorized ayah (just a convenience —
    // the teacher can freely pick any surah/ayah, no forced start from Al-Fatihah).
    const fm = furthestMemorized(memorizedIntervals);
    const start = fm && fm < totalQuranAyahs ? fromGlobalAyah(fm + 1) : { surah: 1, ayah: 1 };
    return {
      fromSurah: start.surah, fromAyah: start.ayah,
      toSurah: start.surah, toAyah: start.ayah,
      date: today, type: 'new', rating: 0, notes: '',
    };
  });

  const handle = (k, v) => setForm(p => {
    const next = { ...p, [k]: v };
    // When the surah changes, keep the ayah within that surah's range
    if (k === 'fromSurah') {
      const s = SURAHS.find(x => x.number === Number(v));
      if (s && Number(next.fromAyah) > s.ayahs) next.fromAyah = s.ayahs;
    }
    if (k === 'toSurah') {
      const s = SURAHS.find(x => x.number === Number(v));
      if (s && Number(next.toAyah) > s.ayahs) next.toAyah = s.ayahs;
    }
    return next;
  });

  // Snap an ayah field to a valid number only when the user leaves it,
  // so the field can be cleared and retyped freely while editing.
  const clampAyah = (ayahKey, surahKey) => setForm(p => {
    const s = SURAHS.find(x => x.number === Number(p[surahKey]));
    const max = s?.ayahs || 7;
    let n = Number(p[ayahKey]);
    if (!n || n < 1) n = 1;
    if (n > max) n = max;
    return { ...p, [ayahKey]: n };
  });

  const fromSurahData = SURAHS.find(s => s.number === Number(form.fromSurah));
  const toSurahData = SURAHS.find(s => s.number === Number(form.toSurah));
  const ayahCount = countAyahsBetween(Number(form.fromSurah), Number(form.fromAyah), Number(form.toSurah), Number(form.toAyah));

  const fromG = toGlobalAyah(Number(form.fromSurah), Number(form.fromAyah));
  const toG = toGlobalAyah(Number(form.toSurah), Number(form.toAyah));
  const isValidRange = toG >= fromG;

  // NEW: range must not overlap already-memorized ayahs.
  // MURAJA'AH: range must be fully inside the memorized set.
  let conflict = null;
  if (isValidRange && form.type === 'new' && rangeOverlaps(fromG, toG, memorizedIntervals)) {
    conflict = 'overlap';
  } else if (isValidRange && form.type === 'muraja3ah' && !rangeWithin(fromG, toG, memorizedIntervals)) {
    conflict = 'notMemorized';
  }

  const isValid = isValidRange && !conflict;

  const submit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({ ...form, studentId: student.id, ayahCount, editId: editSession?.id || null });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="text-subtitle font-semibold">
              {isEditing ? (lang === 'ar' ? 'تعديل الجلسة' : 'Edit Session') : t('recordNewSession')}
            </h2>
            <p className="text-small text-muted">{student?.fullName}</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Type */}
            <div className="input-group">
              <label className="input-label">{t('sessionType')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['new', 'muraja3ah'].map(type => (
                  <button key={type} type="button"
                    className={`btn btn-sm ${form.type === type ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handle('type', type)} style={{ flex: 1, justifyContent: 'center' }}>
                    {type === 'new' ? <><BookOpen size={14} /> {t('newMemorization')}</> : <><RefreshCw size={14} /> {t('revision')}</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Current position */}
            <div style={{
              background: 'rgba(15,118,110,0.08)', border: '1px solid rgba(15,118,110,0.2)',
              borderRadius: 10, padding: '0.75rem', fontSize: '0.82rem', color: 'var(--emerald)',
            }}>
              <Info size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
              {' '}{lang === 'ar' ? 'أبعد آية محفوظة:' : 'Memorized up to:'}
              {' '}<strong>{getSurahName(student?.currentSurah, lang)} — {lang === 'ar' ? 'آية' : 'Ayah'} {student?.currentAyah}</strong>
            </div>

            {/* From */}
            <div>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>{t('fromAyah')}</div>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{t('surah')}</label>
                  <select className="select" value={form.fromSurah} onChange={e => handle('fromSurah', Number(e.target.value))}>
                    {SURAHS.map(s => <option key={s.number} value={s.number}>{s.number}. {lang === 'ar' ? s.nameAr : s.nameEn} ({s.ayahs})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{lang === 'ar' ? 'رقم الآية' : 'Ayah'} (1-{fromSurahData?.ayahs})</label>
                  <input type="number" className="input" min={1} max={fromSurahData?.ayahs || 7}
                    value={form.fromAyah}
                    onChange={e => handle('fromAyah', e.target.value)}
                    onBlur={() => clampAyah('fromAyah', 'fromSurah')} />
                </div>
              </div>
            </div>

            {/* To */}
            <div>
              <div className="input-label" style={{ marginBottom: '0.5rem' }}>{t('toAyah')}</div>
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{t('surah')}</label>
                  <select className="select" value={form.toSurah} onChange={e => handle('toSurah', Number(e.target.value))}>
                    {SURAHS.map(s => <option key={s.number} value={s.number}>{s.number}. {lang === 'ar' ? s.nameAr : s.nameEn} ({s.ayahs})</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>{lang === 'ar' ? 'رقم الآية' : 'Ayah'} (1-{toSurahData?.ayahs})</label>
                  <input type="number" className="input" min={1} max={toSurahData?.ayahs || 7}
                    value={form.toAyah}
                    onChange={e => handle('toAyah', e.target.value)}
                    onBlur={() => clampAyah('toAyah', 'toSurah')} />
                </div>
              </div>
            </div>

            {/* Ayah count + validation */}
            <div style={{
              padding: '0.75rem', borderRadius: 10,
              background: isValid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isValid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              fontSize: '0.85rem', fontWeight: 600,
              color: isValid ? 'var(--success)' : 'var(--error)',
            }}>
              {isValid
                ? `${lang === 'ar' ? 'عدد الآيات:' : 'Ayah count:'} ${ayahCount}`
                : conflict === 'overlap'
                  ? (lang === 'ar' ? 'بعض هذه الآيات محفوظة بالفعل — اخترها في المراجعة' : 'Some of these ayahs are already memorized — use Revision')
                  : conflict === 'notMemorized'
                    ? (lang === 'ar' ? 'لا يمكنك مراجعة آيات لم تُحفظ بعد' : 'You can only revise ayahs already memorized')
                    : (lang === 'ar' ? 'نطاق غير صالح — يجب أن تكون "إلى" بعد "من"' : 'Invalid range — "To" must be after "From"')}
            </div>

            <div className="input-group">
              <label className="input-label">{t('sessionDate')}</label>
              <input type="date" className="input" value={form.date} onChange={e => handle('date', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('qualityRating')}</label>
              <StarRating value={form.rating} onChange={v => handle('rating', v)} />
            </div>
            <div className="input-group">
              <label className="input-label">{t('sessionNotes')} ({t('optional')})</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => handle('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={!isValid}>{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── SessionCard ──────────────────────────────────────────── */
function SessionCard({ session, lang, t, onEdit, onDelete }) {
  const stars = session.qualityRating || session.rating || 0;
  const colors = { 5: '#10B981', 4: '#14B8A6', 3: '#F59E0B', 2: '#F97316', 1: '#EF4444' };
  // ayah_count is not stored in the DB, so derive it from the saved range.
  const count = session.ayahCount || session.ayah_count || countAyahsBetween(
    session.fromSurah || session.from_surah,
    session.fromAyah || session.from_ayah,
    session.toSurah || session.to_surah,
    session.toAyah || session.to_ayah,
  ) || 0;
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{
      display: 'flex', gap: '1rem', padding: '1rem',
      background: 'var(--bg-card)', borderRadius: 12,
      border: '1.5px solid var(--border)', transition: 'all 0.15s',
    }}>
      <div style={{
        flexShrink: 0, width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white',
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
            {getSurahName(session.fromSurah || session.from_surah, lang)} {session.fromAyah || session.from_ayah} — {getSurahName(session.toSurah || session.to_surah, lang)} {session.toAyah || session.to_ayah}
          </span>
          <span className={`badge ${session.type === 'new' ? 'badge-active' : 'badge-excused'}`}>
            {session.type === 'new' ? (lang === 'ar' ? 'حفظ جديد' : 'New') : t('revision')}
          </span>
        </div>
        {session.notes && <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{session.notes}</p>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="text-xs font-semibold text-emerald">+{count} {lang === 'ar' ? 'آية' : 'ayahs'}</span>
            {stars > 0 && (
              <div style={{ display: 'flex', gap: '1px' }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: '0.75rem', color: n <= stars ? colors[stars] : 'var(--border)' }}>★</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(session)}
              title={lang === 'ar' ? 'تعديل' : 'Edit'}
              style={{ color: 'var(--info)', padding: '0.25rem' }}>
              <Edit3 size={14} />
            </button>
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button className="btn btn-sm" onClick={() => { onDelete(session); setConfirmDelete(false); }}
                  style={{ background: 'var(--error)', color: 'white', padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: 6 }}>
                  {lang === 'ar' ? 'تأكيد' : 'Yes'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDelete(false)}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: 6 }}>
                  {lang === 'ar' ? 'لا' : 'No'}
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirmDelete(true)}
                title={lang === 'ar' ? 'حذف' : 'Delete'}
                style={{ color: 'var(--error)', padding: '0.25rem' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function QuranProgressPage() {
  const { t, lang, currentUser, showToast, dbData, refreshData } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const safe = (s) => ({
    ...(s || {}),
    fullName: String(s?.fullName || 'بدون اسم'),
    fullNameEn: String(s?.fullNameEn || ''),
    juzCompleted: Array.isArray(s?.juzCompleted) ? s.juzCompleted : [],
    totalAyahMemorized: s?.totalAyahMemorized ?? 0,
    currentSurah: s?.currentSurah ?? 1,
    currentAyah: s?.currentAyah ?? 1,
  });

  const myStudents = (isAdmin
    ? (dbData?.students || [])
    : (dbData?.students || []).filter(s => s.sheikhId === currentUser?.id && s.status === 'active')
  ).map(safe);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [tab, setTab] = useState('timeline');

  useEffect(() => {
    if (!selectedStudent && myStudents.length > 0) setSelectedStudent(myStudents[0]);
  }, [myStudents.length]);

  // Keep selectedStudent in sync with latest dbData
  useEffect(() => {
    if (selectedStudent) {
      const updated = myStudents.find(s => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [dbData?.students]);

  useEffect(() => { if (dbData?.sessions) setSessions([...dbData.sessions]); }, [dbData?.sessions]);

  const studentSessions = sessions
    .filter(s => s.studentId === selectedStudent?.id || s.student_id === selectedStudent?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const pct = selectedStudent ? Math.min(100, Math.round((selectedStudent.totalAyahMemorized / totalQuranAyahs) * 100)) : 0;

  const recalculateStudentProgress = async (studentId) => {
    try {
      const { data: newSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'new');

      // Total = union of memorized ranges (supports non-linear memorization).
      const intervals = mergeIntervals((newSessions || []).map(s => [
        toGlobalAyah(s.from_surah, s.from_ayah),
        toGlobalAyah(s.to_surah, s.to_ayah),
      ]));
      const total = intervalsCount(intervals);
      const fm = furthestMemorized(intervals);
      const pos = fm ? fromGlobalAyah(fm) : { surah: 1, ayah: 1 };

      await supabase.from('students').update({
        current_surah: pos.surah,
        current_ayah: pos.ayah,
        total_ayah_memorized: total,
      }).eq('id', studentId);
    } catch (err) {
      console.error('Error recalculating progress:', err);
    }
  };

  // ── Reset ALL students progress to 0 (for fresh start) ──
  const resetAllProgress = async () => {
    if (!window.confirm(lang === 'ar'
      ? 'هل تريد إعادة تعيين تقدم جميع الطلاب إلى الصفر؟ سيتم حذف جميع الجلسات!'
      : 'Reset ALL students progress to 0? This will delete ALL sessions!'
    )) return;
    try {
      // Delete all sessions
      await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Reset all students to surah 1, ayah 1, 0 verses
      for (const s of myStudents) {
        await supabase.from('students').update({
          current_surah: 1, current_ayah: 1, total_ayah_memorized: 0
        }).eq('id', s.id);
      }
      await refreshData();
      showToast(lang === 'ar' ? 'تم إعادة تعيين جميع البيانات بنجاح' : 'All progress reset to 0');
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleSaveSession = async (data) => {
    try {
      const payload = {
        student_id: data.studentId, sheikh_id: currentUser.id,
        date: data.date, from_surah: Number(data.fromSurah), from_ayah: Number(data.fromAyah),
        to_surah: Number(data.toSurah), to_ayah: Number(data.toAyah),
        rating: data.rating || 5, notes: data.notes || '', type: data.type,
      };

      if (data.editId) {
        const { error } = await supabase.from('sessions').update(payload).eq('id', data.editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sessions').insert([payload]);
        if (error) throw error;
      }

      // Always completely recalculate to ensure 100% accuracy after any save/edit
      await recalculateStudentProgress(data.studentId);
      await refreshData();

      setEditingSession(null);
      showToast(lang === 'ar' ? 'تم حفظ الجلسة بنجاح' : 'Session saved successfully');
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDeleteSession = async (session) => {
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', session.id);
      if (error) throw error;

      // Completely recalculate to ensure 100% accuracy after delete
      const sId = session.studentId || session.student_id;
      if (sId) {
        await recalculateStudentProgress(sId);
      }
      await refreshData();

      showToast(lang === 'ar' ? 'تم حذف الجلسة' : 'Session deleted');
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setShowModal(true);
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('quranProgress')}</h1>
          <p className="text-small text-secondary">
            {lang === 'ar' ? 'متابعة حفظ الطلاب وتسجيل الجلسات' : 'Track student memorization and log sessions'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
          {isAdmin && (
            <button
              className="btn btn-secondary"
              onClick={resetAllProgress}
              title={lang === 'ar' ? 'إعادة تعيين الكل إلى 0' : 'Reset all to 0'}
              style={{ color: 'var(--error)', borderColor: 'var(--error)', flex: '1 1 auto', justifyContent: 'center', minWidth: 140 }}
            >
              <RefreshCw size={14} />
              {lang === 'ar' ? 'إعادة تعيين الكل' : 'Reset All'}
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            disabled={!selectedStudent}
            id="btn-record-session"
            style={{ flex: '1 1 auto', justifyContent: 'center', minWidth: 160 }}
          >
            <Plus size={16} /> {t('recordNewSession')}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Student picker + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card card-sm">
            <div className="input-label" style={{ marginBottom: '0.5rem' }}>{t('students')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 280, overflowY: 'auto' }}>
              {myStudents.map(student => {
                const isSelected = selectedStudent?.id === student.id;
                return (
                  <button key={student.id} onClick={() => setSelectedStudent(student)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 10,
                    border: `1.5px solid ${isSelected ? 'var(--emerald)' : 'transparent'}`,
                    background: isSelected ? 'rgba(15,118,110,0.08)' : 'var(--bg-hover)',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'inherit',
                  }}>
                    <div className="avatar avatar-sm">{student.fullName[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-small font-semibold truncate">{student.fullName}</div>
                      <div className="text-xs text-muted">{student.totalAyahMemorized} {lang === 'ar' ? 'آية' : 'verses'}</div>
                    </div>
                    <div style={{ width: 40 }}>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${Math.round((student.totalAyahMemorized / totalQuranAyahs) * 100)}%` }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStudent && studentSessions.length > 0 && (
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(15,118,110,0.06), rgba(212,175,55,0.04))',
              border: '1px solid rgba(15,118,110,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="avatar avatar-lg">{selectedStudent.fullName[0]}</div>
                <div>
                  <div className="text-subtitle font-bold">{selectedStudent.fullName}</div>
                  <div className="text-small text-secondary">
                    <MapPin size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
                    {' '}{getSurahName(selectedStudent.currentSurah, lang)} — {lang === 'ar' ? 'آية' : 'Ayah'} {selectedStudent.currentAyah}
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
                  <span className="text-xs text-muted">{selectedStudent.totalAyahMemorized} / {totalQuranAyahs} {lang === 'ar' ? 'آية' : 'verses'}</span>
                  <span className="text-xs text-muted">{selectedStudent.juzCompleted.length} / 30 {lang === 'ar' ? 'جزء' : 'juz'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline / Juz Map */}
        <div>
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'var(--bg-input)', borderRadius: 10, padding: '0.25rem' }}>
            {[
              { key: 'timeline', label: t('progressTimeline') },
              { key: 'juzmap', label: t('juzMap') },
            ].map(tab_ => (
              <button key={tab_.key} onClick={() => setTab(tab_.key)} className="btn btn-sm" style={{
                flex: 1, justifyContent: 'center',
                background: tab === tab_.key ? 'var(--bg-card)' : 'transparent',
                color: tab === tab_.key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === tab_.key ? 'var(--shadow-card)' : 'none',
                fontWeight: tab === tab_.key ? 600 : 400,
              }}>{tab_.label}</button>
            ))}
          </div>

          {tab === 'timeline' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 500, overflowY: 'auto' }}>
              {studentSessions.length === 0 ? (
                <div className="empty-state"><div className="text-subtitle">{t('noData')}</div></div>
              ) : studentSessions.map(session => (
                <SessionCard key={session.id} session={session} lang={lang} t={t}
                  onEdit={handleEditSession} onDelete={handleDeleteSession} />
              ))}
            </div>
          ) : (
            <div className="card">
              <ProgressMap
                student={selectedStudent}
                title={`${t('juzMap')} — ${selectedStudent?.fullName || ''}`}
              />
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddSessionModal
          student={selectedStudent}
          editSession={editingSession}
          memorizedIntervals={getMemorizedIntervals(sessions, selectedStudent?.id, editingSession?.id)}
          onClose={() => { setShowModal(false); setEditingSession(null); }}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}
