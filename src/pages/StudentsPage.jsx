import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockStudents, mockHalaqat } from '../data/mockData.js';
import { getSurahName } from '../data/quranData.js';
import { Search, Plus, Filter, Edit2, Archive, Eye, X } from 'lucide-react';

const STATUS_COLORS = {
  active: 'active', paused: 'paused', graduated: 'graduated', archived: 'archived'
};

function AddStudentModal({ onClose, onSave }) {
  const { t, lang, showToast } = useApp();
  const [form, setForm] = useState({
    fullName: '', fullNameEn: '', dateOfBirth: '', gender: 'male',
    phone: '', halaqaId: '', status: 'active', enrollmentDate: new Date().toISOString().split('T')[0], notes: '',
  });

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.halaqaId) return;
    onSave(form);
    showToast(t('success'));
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">{t('addNewStudent')}</h2>
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
              <div className="input-group">
                <label className="input-label">{t('halaqa')} *</label>
                <select className="select" value={form.halaqaId} onChange={e => handle('halaqaId', e.target.value)} required>
                  <option value="">{t('selectHalaqa')}</option>
                  {mockHalaqat.map(h => (
                    <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : h.nameEn}</option>
                  ))}
                </select>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentProfileModal({ student, onClose }) {
  const { t, lang, setActivePage } = useApp();
  if (!student) return null;

  const juzGrid = Array.from({ length: 30 }, (_, i) => i + 1);
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

          {/* Juz Map */}
          <div>
            <div className="text-small font-semibold" style={{ marginBottom: '0.75rem' }}>
              🗺️ {t('juzMap')}
            </div>
            <div className="juz-map">
              {juzGrid.map(j => {
                const completed = student.juzCompleted.includes(j);
                return (
                  <div
                    key={j}
                    className={`juz-cell ${completed ? 'completed' : 'empty'}`}
                    title={`${t('juz')} ${j}`}
                  >
                    <span style={{ fontSize: '0.6rem' }}>{lang === 'ar' ? 'ج' : 'J'}</span>
                    <span>{j}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { t, lang, currentUser, showToast } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [students, setStudents] = useState(
    isAdmin ? mockStudents : mockStudents.filter(s => s.sheikhId === currentUser?.id)
  );
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHalaqa, setFilterHalaqa] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);

  const filtered = students.filter(s => {
    const matchSearch = s.fullName.includes(search) || (s.fullNameEn || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchHalaqa = filterHalaqa === 'all' || s.halaqaId === filterHalaqa;
    return matchSearch && matchStatus && matchHalaqa;
  });

  const handleAdd = (data) => {
    const halaqa = mockHalaqat.find(h => h.id === data.halaqaId);
    const newStudent = {
      id: `stu-${Date.now()}`,
      sheikhId: currentUser.id,
      fullName: data.fullName,
      fullNameEn: data.fullNameEn,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      halaqaId: data.halaqaId,
      status: data.status,
      enrollmentDate: data.enrollmentDate,
      notes: data.notes,
      currentSurah: 1, currentAyah: 1,
      totalAyahMemorized: 0,
      juzCompleted: [],
      attendancePct: 0,
    };
    setStudents(prev => [newStudent, ...prev]);
  };

  const handleArchive = (id) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'archived' } : s));
    showToast(lang === 'ar' ? 'تمت الأرشفة' : 'Archived successfully');
  };

  const halaqaList = mockHalaqat.filter(h =>
    isAdmin || h.sheikhId === currentUser?.id
  );

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('students')}</h1>
          <p className="text-small text-secondary">
            {filtered.length} {lang === 'ar' ? 'طالب' : 'students'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="btn-add-student">
          <Plus size={16} />
          {t('addNewStudent')}
        </button>
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
        {halaqaList.length > 1 && (
          <select
            className="select"
            value={filterHalaqa}
            onChange={e => setFilterHalaqa(e.target.value)}
            style={{ width: 'auto', minWidth: 140 }}
          >
            <option value="all">{t('allHalaqat')}</option>
            {halaqaList.map(h => (
              <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : h.nameEn}</option>
            ))}
          </select>
        )}
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
          <table>
            <thead>
              <tr>
                <th>{t('studentName')}</th>
                <th>{t('halaqa')}</th>
                <th>{t('currentPosition')}</th>
                <th>{t('totalAyahMemorized')}</th>
                <th>{t('attendancePercentage')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const halaqa = mockHalaqat.find(h => h.id === student.halaqaId);
                const pct = Math.round((student.totalAyahMemorized / 6236) * 100);
                return (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm">{student.fullName[0]}</div>
                        <div>
                          <div className="text-small font-semibold">{student.fullName}</div>
                          <div className="text-xs text-muted">{student.fullNameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-small">
                        {halaqa ? (lang === 'ar' ? halaqa.name : halaqa.nameEn) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-small">
                        {getSurahName(student.currentSurah, lang)}: {student.currentAyah}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 60 }}>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-semibold">{student.totalAyahMemorized}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-small font-semibold ${student.attendancePct >= 80 ? 'text-success' : 'text-error'}`}>
                        {student.attendancePct}%
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${student.status}`}>{t(student.status)}</span>
                    </td>
                    <td>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddStudentModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />
      )}
      {profileStudent && (
        <StudentProfileModal student={profileStudent} onClose={() => setProfileStudent(null)} />
      )}
    </div>
  );
}
