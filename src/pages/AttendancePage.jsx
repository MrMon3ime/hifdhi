import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockStudents, mockHalaqat, mockAttendance } from '../data/mockData.js';
import { CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

const STATUS_OPTIONS = ['present', 'late', 'excused', 'absent'];

const STATUS_ICONS = {
  present: '✅', late: '🕐', excused: '📋', absent: '❌',
};

export default function AttendancePage() {
  const { t, lang, currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const myHalaqat = isAdmin
    ? mockHalaqat
    : mockHalaqat.filter(h => h.sheikhId === currentUser?.id);

  const [selectedHalaqa, setSelectedHalaqa] = useState(myHalaqat[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const halaqaStudents = mockStudents.filter(
    s => s.halaqaId === selectedHalaqa && s.status === 'active'
  );

  const [attendance, setAttendance] = useState(() => {
    const init = {};
    halaqaStudents.forEach(s => {
      const existing = mockAttendance.find(a => a.studentId === s.id && a.date === date);
      init[s.id] = existing?.status || 'present';
    });
    return init;
  });

  const [saved, setSaved] = useState(false);

  const handleHalaqaChange = (halaqaId) => {
    setSelectedHalaqa(halaqaId);
    setSaved(false);
    const studs = mockStudents.filter(s => s.halaqaId === halaqaId && s.status === 'active');
    const init = {};
    studs.forEach(s => {
      const existing = mockAttendance.find(a => a.studentId === s.id && a.date === date);
      init[s.id] = existing?.status || 'present';
    });
    setAttendance(init);
  };

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

  const saveAttendance = () => {
    setSaved(true);
    showToast(t('attendanceSaved'));
  };

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
  };

  const halaqa = myHalaqat.find(h => h.id === selectedHalaqa);

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('attendance')}</h1>
          <p className="text-small text-secondary">
            {halaqa ? (lang === 'ar' ? halaqa.name : halaqa.nameEn) : ''} · {date}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            value={selectedHalaqa}
            onChange={e => handleHalaqaChange(e.target.value)}
            style={{ minWidth: 160 }}
          >
            {myHalaqat.map(h => (
              <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : h.nameEn}</option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={date}
            onChange={e => { setDate(e.target.value); setSaved(false); }}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'present', label: t('present'), count: counts.present, color: '#065F46', bg: 'var(--status-present-bg)', icon: '✅' },
          { key: 'late',    label: t('late'),    count: counts.late,    color: '#92400E', bg: 'var(--status-late-bg)',    icon: '🕐' },
          { key: 'excused', label: t('excused'), count: counts.excused, color: '#1E40AF', bg: 'var(--status-excused-bg)',icon: '📋' },
          { key: 'absent',  label: t('absent'),  count: counts.absent,  color: '#991B1B', bg: 'var(--status-absent-bg)', icon: '❌' },
        ].map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 1rem', borderRadius: 10,
            background: item.bg, cursor: 'pointer', transition: 'transform 0.15s',
          }}
            onClick={() => markAll(item.key)}
            title={lang === 'ar' ? `تحديد الكل: ${item.label}` : `Mark all: ${item.label}`}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: item.color, lineHeight: 1 }}>
                {item.count}
              </div>
              <div style={{ fontSize: '0.7rem', color: item.color, fontWeight: 600 }}>{item.label}</div>
            </div>
          </div>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1rem', borderRadius: 10,
          background: 'var(--bg-input)', marginInlineStart: 'auto',
        }}>
          <span className="text-small text-muted">{lang === 'ar' ? 'إجمالي:' : 'Total:'}</span>
          <span className="text-small font-bold">{halaqaStudents.length}</span>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span className="text-small text-muted" style={{ alignSelf: 'center', marginInlineEnd: '0.25rem' }}>
          {lang === 'ar' ? 'تحديد الكل:' : 'Mark all:'}
        </span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className="btn btn-secondary btn-sm"
            onClick={() => markAll(s)}
          >
            {STATUS_ICONS[s]} {t(s)}
          </button>
        ))}
      </div>

      {/* Student List */}
      {halaqaStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle2 size={28} /></div>
          <div className="text-subtitle">{lang === 'ar' ? 'لا يوجد طلاب في هذه الحلقة' : 'No students in this halaqa'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {halaqaStudents.map((student, idx) => {
            const currentStatus = attendance[student.id] || 'present';
            return (
              <div key={student.id} className="attendance-tile" style={{
                animation: `slideUp 0.15s ease ${idx * 0.03}s both`,
              }}>
                <div className="avatar avatar-sm">{student.fullName[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-small font-semibold">{student.fullName}</div>
                  <div className="text-xs text-muted">{student.fullNameEn}</div>
                </div>
                {/* Status buttons */}
                <div className="attendance-actions">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      className={`att-btn ${status} ${currentStatus === status ? 'selected' : ''}`}
                      onClick={() => setStatus(student.id, status)}
                      title={t(status)}
                    >
                      {STATUS_ICONS[status]}
                      <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>
                        {' '}{t(status)}
                      </span>
                    </button>
                  ))}
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
          display: 'flex', justifyContent: 'center',
        }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={saveAttendance}
            style={{
              boxShadow: '0 8px 24px rgba(15,118,110,0.4)',
              minWidth: 220, justifyContent: 'center',
              background: saved
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #0F766E, #115E59)',
            }}
          >
            {saved ? `✅ ${lang === 'ar' ? 'تم الحفظ' : 'Saved!'}` : `💾 ${t('saveAttendance')}`}
          </button>
        </div>
      )}
    </div>
  );
}
