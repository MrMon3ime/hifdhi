import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CheckCircle2, XCircle, Clock, ClipboardList, Save } from 'lucide-react';

const STATUS_OPTIONS = ['present', 'late', 'excused', 'absent'];
const STATUS_ICONS = {
  present: CheckCircle2, late: Clock, excused: ClipboardList, absent: XCircle,
};

// Removed HALQA_TIMES to rely on database halaqat list

export default function AttendancePage() {
  const { t, lang, currentUser, showToast, dbData, saveAttendanceFn, online } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const myHalaqat = isAdmin
    ? (dbData?.halaqat || [])
    : (dbData?.halaqat || []).filter(h => h.sheikhId === currentUser?.id);

  // Selected halqa + time slot
  const [selectedHalaqa, setSelectedHalaqa] = useState(myHalaqat[0]?.id || '');

  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  });

  useEffect(() => {
    if (!selectedHalaqa && myHalaqat.length > 0) setSelectedHalaqa(myHalaqat[0].id);
  }, [myHalaqat, selectedHalaqa]);

  const safeStudent = (s) => ({
    ...s,
    fullName: s.fullName || 'بدون اسم',
    fullNameEn: s.fullNameEn || '',
  });

  // A teacher sees only their own active students; the admin sees all.
  const allActiveStudents = (dbData?.students || [])
    .filter(s => s.status === 'active' && (isAdmin || s.sheikhId === currentUser?.id))
    .map(safeStudent);

  const halaqaStudents = allActiveStudents;

  const [attendance, setAttendance] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const init = {};
    halaqaStudents.forEach(s => {
      // Look for existing attendance with matching halqa_id
      const existing = (dbData?.attendance || []).find(a => {
        const studentMatch = (a.studentId === s.id || a.student_id === s.id);
        const dateMatch = a.date === date;
        // Normalize null/undefined/"" so they all compare equal
        const rowHalaqa = a.halaqaId ?? a.halaqa_id ?? '';
        const halaqaMatch = (rowHalaqa || '') === (selectedHalaqa || '');
        return studentMatch && dateMatch && halaqaMatch;
      });
      // Default to empty (no status yet) so teacher has to explicitly mark
      init[s.id] = existing?.status || '';
    });
    setAttendance(init);
    setSaved(false);
  }, [selectedHalaqa, date, dbData?.attendance, dbData?.students]);

  const markAll = (status) => {
    const updated = {};
    halaqaStudents.forEach(s => { updated[s.id] = status; });
    setAttendance(updated);
    setSaved(false);
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const saveAttendance = async () => {
    try {
      // Only save students who have a status set
      const studentsWithStatus = halaqaStudents.filter(s => attendance[s.id]);
      if (studentsWithStatus.length === 0) {
        showToast(lang === 'ar' ? 'حدد حالة الحضور أولاً' : 'Set attendance status first', 'error');
        return;
      }

      // halaqa_id is a UUID column — send null (not "") when no halqa is selected.
      const halaqaId = selectedHalaqa || null;

      const payload = studentsWithStatus.map(s => ({
        student_id: s.id,
        halaqa_id: halaqaId,
        date: date,
        status: attendance[s.id],
      }));
      const studentIds = studentsWithStatus.map(s => s.id);

      // Offline-aware: saves to the server when online, or queues locally and
      // syncs automatically when the connection returns.
      await saveAttendanceFn({ date, halaqaId, studentIds, payload });

      setSaved(true);
      showToast(online
        ? (lang === 'ar' ? 'تم حفظ الحضور بنجاح' : 'Attendance saved successfully')
        : (lang === 'ar' ? 'تم الحفظ دون اتصال — ستتم المزامنة تلقائياً' : 'Saved offline — will sync automatically'),
        online ? 'success' : 'warning');
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const markedStudents = halaqaStudents.filter(s => attendance[s.id]);
  const counts = {
    present: markedStudents.filter(s => attendance[s.id] === 'present').length,
    late: markedStudents.filter(s => attendance[s.id] === 'late').length,
    excused: markedStudents.filter(s => attendance[s.id] === 'excused').length,
    absent: markedStudents.filter(s => attendance[s.id] === 'absent').length,
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('attendance')}</h1>
          <p className="text-small text-secondary">
            {lang === 'ar' ? 'تسجيل حضور وغياب الطلاب' : 'Record student attendance'} · {date}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" value={selectedHalaqa}
            onChange={e => setSelectedHalaqa(e.target.value)} style={{ minWidth: 140 }}>
            {myHalaqat.map(h => (
              <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : (h.nameEn || h.name)}</option>
            ))}
          </select>
          <input type="date" className="input" value={date}
            onChange={e => { setDate(e.target.value); setSaved(false); }}
            style={{ width: 'auto' }} />
        </div>
      </div>      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'present', label: t('present'), count: counts.present, color: '#065F46', bg: 'var(--status-present-bg)', icon: CheckCircle2 },
          { key: 'late', label: t('late'), count: counts.late, color: '#92400E', bg: 'var(--status-late-bg)', icon: Clock },
          { key: 'excused', label: t('excused'), count: counts.excused, color: '#1E40AF', bg: 'var(--status-excused-bg)', icon: ClipboardList },
          { key: 'absent', label: t('absent'), count: counts.absent, color: '#991B1B', bg: 'var(--status-absent-bg)', icon: XCircle },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.875rem', borderRadius: 10,
              background: item.bg, cursor: 'pointer', transition: 'transform 0.15s',
              flex: '1 1 0',  minWidth: 80,
            }}
              onClick={() => markAll(item.key)}
              title={lang === 'ar' ? `تحديد الكل: ${item.label}` : `Mark all: ${item.label}`}>
              <Icon size={20} color={item.color} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.count}</div>
                <div style={{ fontSize: '0.65rem', color: item.color, fontWeight: 600 }}>{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span className="text-small text-muted" style={{ alignSelf: 'center', marginInlineEnd: '0.25rem' }}>
          {lang === 'ar' ? 'تحديد الكل:' : 'Mark all:'}
        </span>
        {STATUS_OPTIONS.map(s => {
          const Icon = STATUS_ICONS[s];
          return (
            <button key={s} className="btn btn-secondary btn-sm" onClick={() => markAll(s)}>
              <Icon size={14} /> {t(s)}
            </button>
          );
        })}
      </div>

      {/* Student List */}
      {halaqaStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle2 size={28} /></div>
          <div className="text-subtitle">{lang === 'ar' ? 'لا يوجد طلاب نشطون' : 'No active students'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {halaqaStudents.map((student, idx) => {
            const currentStatus = attendance[student.id] || '';
            return (
              <div key={student.id} className="attendance-tile" style={{
                animation: `slideUp 0.15s ease ${idx * 0.02}s both`,
                borderColor: currentStatus ? 'var(--border)' : 'rgba(239,68,68,0.15)',
              }}>
                <div className="avatar avatar-sm">{student.fullName[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-small font-semibold truncate">{student.fullName}</div>
                  {student.fullNameEn && <div className="text-xs text-muted truncate">{student.fullNameEn}</div>}
                </div>
                <div className="attendance-actions">
                  {STATUS_OPTIONS.map(status => {
                    const Icon = STATUS_ICONS[status];
                    return (
                      <button key={status}
                        className={`att-btn ${status} ${currentStatus === status ? 'selected' : ''}`}
                        onClick={() => setStatus(student.id, status)}
                        title={t(status)}>
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {halaqaStudents.length > 0 && (
        <div style={{
          position: 'sticky', bottom: '1.5rem', marginTop: '1.5rem',
          display: 'flex', justifyContent: 'center', zIndex: 41,
        }}>
          <button className="btn btn-primary btn-lg" onClick={saveAttendance}
            style={{
              boxShadow: '0 8px 24px rgba(15,118,110,0.4)',
              minWidth: 220, justifyContent: 'center',
              background: saved
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #0F766E, #115E59)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {saved
                ? <><CheckCircle2 size={18} /> {lang === 'ar' ? 'تم الحفظ' : 'Saved!'}</>
                : <><Save size={18} /> {t('saveAttendance')}</>}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
