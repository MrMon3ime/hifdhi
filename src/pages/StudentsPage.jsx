import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getSurahName } from '../data/quranData.js';
import ProgressMap from '../components/ProgressMap.jsx';
import { Search, Plus, Edit2, Archive, Eye, X, Users, Trash2, Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const STATUS_COLORS = {
  active: 'active', paused: 'paused', graduated: 'graduated', archived: 'archived'
};

function StudentFormModal({ student, onClose, onSave }) {
  const { t, lang, showToast, dbData } = useApp();
  const [form, setForm] = useState({
    fullName: student?.fullName || '', 
    fullNameEn: student?.fullNameEn || '', 
    dateOfBirth: student?.dateOfBirth || '', 
    gender: student?.gender || 'male',
    phone: student?.phone || '', 
    halaqaId: student?.halaqaId || '', 
    status: student?.status || 'active', 
    enrollmentDate: student?.enrollmentDate || new Date().toISOString().split('T')[0], 
    notes: student?.notes || '',
  });

  const [loading, setLoading] = useState(false);

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName) return;
    setLoading(true);
    await onSave(student ? { ...student, ...form } : form);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">
            {student ? (lang === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student') : t('addNewStudent')}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('studentNameAr')} *</label>
                <input className="input" value={form.fullName} onChange={e => handle('fullName', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">{t('studentNameEn')}</label>
                <input className="input" value={form.fullNameEn} onChange={e => handle('fullNameEn', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('dateOfBirth')}</label>
                <input type="date" className="input" value={form.dateOfBirth} onChange={e => handle('dateOfBirth', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('gender')}</label>
                <select className="select" value={form.gender} onChange={e => handle('gender', e.target.value)}>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('phone')}</label>
                <input className="input" value={form.phone} onChange={e => handle('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('enrollmentDate')}</label>
                <input type="date" className="input" value={form.enrollmentDate} onChange={e => handle('enrollmentDate', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('status')}</label>
                <select className="select" value={form.status} onChange={e => handle('status', e.target.value)}>
                  <option value="active">{t('active')}</option>
                  <option value="paused">{t('paused')}</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">{t('notes')}</label>
              <textarea className="input" rows={3} value={form.notes} onChange={e => handle('notes', e.target.value)}
                style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('loading') : t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttendanceCalendar({ studentId }) {
  const { lang, dbData } = useApp();
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const STATUS_PRIORITY = { present: 4, late: 3, excused: 2, absent: 1 };
  const statusColor = (st) => ({ present: '#10B981', late: '#F59E0B', excused: '#3B82F6', absent: '#EF4444' })[st] || '';

  const map = {};
  (dbData?.attendance || []).forEach(a => {
    const sid = a.studentId || a.student_id;
    if (sid !== studentId) return;
    const key = a.date;
    if (!map[key] || (STATUS_PRIORITY[a.status] || 0) > (STATUS_PRIORITY[map[key]] || 0)) map[key] = a.status;
  });

  const first = new Date(month.y, month.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const monthName = first.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  const dows = lang === 'ar' ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const prev = () => setMonth(p => { const m = p.m - 1; return m < 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m }; });
  const next = () => setMonth(p => { const m = p.m + 1; return m > 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m }; });
  const pad = (n) => String(n).padStart(2, '0');

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  let present = 0, absent = 0;
  Object.entries(map).forEach(([date, st]) => {
    if (!date.startsWith(`${month.y}-${pad(month.m + 1)}`)) return;
    if (st === 'present' || st === 'late') present++; else if (st === 'absent') absent++;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div className="text-small font-semibold">📅 {lang === 'ar' ? 'سجل الحضور' : 'Attendance'}
          <span className="text-xs text-muted" style={{ marginInlineStart: 8 }}>
            {lang === 'ar' ? `حاضر ${present} · غائب ${absent}` : `P ${present} · A ${absent}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={prev}>{lang === 'ar' ? '›' : '‹'}</button>
          <span className="text-xs" style={{ minWidth: 96, textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={next}>{lang === 'ar' ? '‹' : '›'}</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {dows.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={'e' + i} />;
          const date = `${month.y}-${pad(month.m + 1)}-${pad(d)}`;
          const st = map[date];
          const color = statusColor(st);
          return (
            <div key={date} title={date + (st ? ' · ' + st : '')} style={{
              aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 600,
              background: color || 'var(--bg-input)', color: color ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

function StudentProfileModal({ student, onClose }) {
  const { t, lang } = useApp();
  if (!student) return null;

  const pct = Math.round((student.totalAyahMemorized / 6236) * 100);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">{t('studentProfile')}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar avatar-xl">{student.fullName[0]}</div>
            <div style={{ flex: 1 }}>
              <h3 className="text-subtitle font-bold">{student.fullName}</h3>
              <p className="text-small text-secondary">{student.fullNameEn}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge badge-${student.status}`}>{t(student.status)}</span>
                <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  {student.gender === 'male' ? t('male') : t('female')}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#0F766E" strokeWidth="6"
                    strokeDasharray={188.5} strokeDashoffset={188.5 - (pct / 100) * 188.5}
                    strokeLinecap="round" />
                </svg>
                <span style={{
                  position: 'absolute', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>{pct}%</span>
              </div>
              <div className="text-xs text-muted">{lang === 'ar' ? 'تقدم' : 'Progress'}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            {[
              { label: t('totalAyahMemorized'), value: student.totalAyahMemorized.toLocaleString() },
              { label: t('juzCompleted'), value: student.juzCompleted.length },
              { label: t('attendancePercentage'), value: `${student.attendancePct}%` },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-input)', borderRadius: 10,
                padding: '0.875rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--emerald)' }}>{s.value}</div>
                <div className="text-xs text-muted" style={{ marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Current position */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.875rem' }}>
            <div className="text-small font-semibold" style={{ marginBottom: '0.4rem' }}>
              📍 {t('currentPosition')}
            </div>
            <div className="text-body font-medium text-emerald">
              {getSurahName(student.currentSurah, lang)} — {lang === 'ar' ? 'آية' : 'Ayah'} {student.currentAyah}
            </div>
          </div>

          {/* Progress Map (Juz / Hizb / Thumn) */}
          <ProgressMap student={student} title={`🗺️ ${t('juzMap')}`} />

          {/* Day-by-day attendance calendar */}
          <AttendanceCalendar studentId={student.id} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { t, lang, currentUser, showToast, dbData, addStudentFn, updateStudentFn, deleteStudentFn } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHalaqa, setFilterHalaqa] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);

  // Read directly from global dbData — NO local copy
  const allStudents = (dbData?.students || []).filter(s =>
    isAdmin ? true : s.sheikhId === currentUser?.id
  );

  const filtered = allStudents.filter(s => {
    const nameAr = String(s.fullName || '');
    const nameEn = String(s.fullNameEn || '');
    const matchSearch = nameAr.toLowerCase().includes(search.toLowerCase()) ||
                        nameEn.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Save: calls context which updates dbData globally → all pages re-render
  const handleSave = async (data) => {
    try {
      if (editStudent) {
        await updateStudentFn(editStudent.id, data, currentUser);
        showToast(lang === 'ar' ? 'تم التعديل بنجاح' : 'Updated successfully');
      } else {
        await addStudentFn(data, currentUser);
        showToast(lang === 'ar' ? 'تمت الإضافة بنجاح' : 'Student added successfully');
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast(`خطأ: ${err.message}`, 'error');
    }
  };

  const handleArchive = async (id) => {
    try {
      await updateStudentFn(id, { ...allStudents.find(s => s.id === id), status: 'archived' }, currentUser);
      showToast(lang === 'ar' ? 'تمت الأرشفة بنجاح' : 'Archived successfully');
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطالب نهائياً؟' : 'Permanently delete this student?')) {
      try {
        await deleteStudentFn(id);
        showToast(lang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
      } catch (err) {
        console.error('Delete error:', err);
        showToast(`خطأ في الحذف: ${err.message}`, 'error');
      }
    }
  };

  const handleExport = (format) => {
    try {
      const head = ['ID', 'Name', 'Name (EN)', 'Surah', 'Ayah', 'Total Ayahs', 'Status'];
      const body = filtered.map(s => [
        s.id, s.fullName, s.fullNameEn || '', 
        getSurahName(s.currentSurah, lang), s.currentAyah, 
        s.totalAyahMemorized, s.status
      ]);

      const fileName = `students_list_${new Date().toISOString().split('T')[0]}`;
      const isNative = Capacitor.isNativePlatform();

      const saveNativeFile = async (dataBase64, filename) => {
        try {
          const result = await Filesystem.writeFile({
            path: filename,
            data: dataBase64,
            directory: Directory.Cache,
          });
          await Share.share({
            title: filename,
            url: result.uri,
            dialogTitle: lang === 'ar' ? 'حفظ أو مشاركة القائمة' : 'Save or Share List',
          });
        } catch (e) {
          showToast(lang === 'ar' ? 'فشل حفظ الملف' : 'Failed to save file on device', 'error');
        }
      };

      if (format === 'CSV') {
        let csvContent = head.join(',') + '\n' + body.map(row => row.join(',')).join('\n');
        if (isNative) {
          const bom = "\uFEFF";
          const base64 = btoa(unescape(encodeURIComponent(bom + csvContent)));
          saveNativeFile(base64, fileName + '.csv');
        } else {
          const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
          const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName + '.csv';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else if (format === 'EXCEL') {
        import('xlsx').then((XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Students");
          if (isNative) {
            const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            saveNativeFile(base64, fileName + '.xlsx');
          } else {
            XLSX.writeFile(wb, fileName + '.xlsx');
          }
        });
      }
    } catch (err) {
      showToast(lang === 'ar' ? 'فشل التصدير' : 'Export failed', 'error');
    }
  };

  const halaqaList = (dbData?.halaqat || []).filter(h =>
    isAdmin || h.sheikhId === currentUser?.id
  );

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('students')}</h1>
          <p className="text-small text-secondary">
            {allStudents.length} {lang === 'ar' ? 'طالب إجمالاً' : 'total students'} · {filtered.length} {lang === 'ar' ? 'معروض' : 'shown'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-icon" onClick={() => handleExport('CSV')} title="CSV">
            <Download size={16} /> <span className="text-xs">CSV</span>
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => handleExport('EXCEL')} title="Excel">
            <Download size={16} /> <span className="text-xs">XLS</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="btn-add-student">
            <Plus size={16} />
            <span className="hide-on-mobile">{t('addNewStudent')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div className="search-bar" style={{ maxWidth: 300 }}>
          <Search size={15} className="search-icon" />
          <input
            className="input"
            placeholder={t('searchStudents')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingInlineStart: '2.5rem' }}
          />
        </div>
        <select
          className="select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
        >
          <option value="all">{t('all')}</option>
          <option value="active">{t('active')}</option>
          <option value="paused">{t('paused')}</option>
          <option value="graduated">{t('graduated')}</option>
          <option value="archived">{t('archived')}</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} /></div>
          <div className="text-subtitle font-semibold">{t('noStudentsFound')}</div>
          <p className="text-small text-muted">{lang === 'ar' ? 'جرّب تغيير معايير البحث' : 'Try adjusting your search'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>{t('studentName')}</th>
                <th>{t('currentPosition')}</th>
                <th>{t('totalAyahMemorized')}</th>
                <th>{t('attendancePercentage')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const halaqa = (dbData?.halaqat || []).find(h => h.id === student.halaqaId);
                const pct = Math.round((student.totalAyahMemorized / 6236) * 100);
                return (
                  <tr key={student.id}>
                    <td data-label={t('studentName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm">{student.fullName[0]}</div>
                        <div>
                          <div className="text-small font-semibold">{student.fullName}</div>
                          <div className="text-xs text-muted">{student.fullNameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label={t('currentPosition')}>
                      <span className="text-small">
                        {getSurahName(student.currentSurah, lang)}: {student.currentAyah}
                      </span>
                    </td>
                    <td data-label={t('totalAyahMemorized')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 60 }}>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-semibold">{student.totalAyahMemorized}</span>
                      </div>
                    </td>
                    <td data-label={t('attendancePercentage')}>
                      <span className={`text-small font-semibold ${student.attendancePct >= 80 ? 'text-success' : 'text-error'}`}>
                        {student.attendancePct}%
                      </span>
                    </td>
                    <td data-label={t('status')}>
                      <span className={`badge badge-${student.status}`}>{t(student.status)}</span>
                    </td>
                    <td data-label={t('actions')}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setProfileStudent(student)}
                          title={t('view')}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setEditStudent(student)}
                          title={t('edit')}
                        >
                          <Edit2 size={14} />
                        </button>
                        {student.status !== 'archived' && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleArchive(student.id)}
                            title={t('archive')}
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleDelete(student.id)}
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                          style={{ color: 'var(--error)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(showAddModal || editStudent) && (
        <StudentFormModal 
          student={editStudent}
          onClose={() => { setShowAddModal(false); setEditStudent(null); }} 
          onSave={handleSave} 
        />
      )}
      {profileStudent && (
        <StudentProfileModal student={profileStudent} onClose={() => setProfileStudent(null)} />
      )}
    </div>
  );
}
