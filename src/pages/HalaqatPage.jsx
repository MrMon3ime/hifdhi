import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Clock, Users, MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';

// Circle schedule & times have no DB columns, so they are stored locally per circle.
const HALAQA_EXTRA_KEY = 'hifz_halaqa_extra';
export const loadHalaqaExtras = () => {
  try { return JSON.parse(localStorage.getItem(HALAQA_EXTRA_KEY)) || {}; } catch { return {}; }
};
const saveHalaqaExtra = (id, extra) => {
  if (!id) return;
  try {
    const all = loadHalaqaExtras();
    all[id] = extra;
    localStorage.setItem(HALAQA_EXTRA_KEY, JSON.stringify(all));
  } catch { /* quota */ }
};

// Prayer-based session times (e.g. after Fajr / after Maghrib).
export const PRAYER_PERIODS = [
  { key: 'fajr', ar: 'بعد صلاة الفجر', en: 'After Fajr' },
  { key: 'dhuhr', ar: 'بعد صلاة الظهر', en: 'After Dhuhr' },
  { key: 'asr', ar: 'بعد صلاة العصر', en: 'After Asr' },
  { key: 'maghrib', ar: 'بعد صلاة المغرب', en: 'After Maghrib' },
  { key: 'isha', ar: 'بعد صلاة العشاء', en: 'After Isha' },
];
export const periodLabel = (key, lang) => {
  const p = PRAYER_PERIODS.find(x => x.key === key);
  return p ? (lang === 'ar' ? p.ar : p.en) : '';
};

function HalaqaFormModal({ halaqa, onClose, onSave }) {
  const { t, lang, dbData, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const extra = (halaqa && loadHalaqaExtras()[halaqa.id]) || {};

  const [form, setForm] = useState({
    name: halaqa?.name || '',
    nameEn: halaqa?.nameEn || '',
    sheikhId: halaqa?.sheikhId || currentUser?.id || '',
    location: halaqa?.location || '',
    period: extra.period || '',
    startTime: extra.startTime || '',
    endTime: extra.endTime || '',
    isActive: halaqa ? halaqa.isActive : true,
    schedule: extra.schedule || [],
  });

  const [loading, setLoading] = useState(false);

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleDay = (day) => {
    setForm(p => {
      const schedule = p.schedule.includes(day)
        ? p.schedule.filter(d => d !== day)
        : [...p.schedule, day];
      return { ...p, schedule };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    await onSave(halaqa ? { ...halaqa, ...form } : form);
    setLoading(false);
    onClose();
  };

  const days = lang === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">
            {halaqa ? (lang === 'ar' ? 'تعديل الحلقة' : 'Edit Circle') : (lang === 'ar' ? 'إضافة حلقة جديدة' : 'Add New Circle')}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'اسم الحلقة (عربي) *' : 'Circle Name (AR) *'}</label>
                <input className="input" value={form.name} onChange={e => handle('name', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'اسم الحلقة (إنجليزي)' : 'Circle Name (EN)'}</label>
                <input className="input" value={form.nameEn} onChange={e => handle('nameEn', e.target.value)} />
              </div>
            </div>

            {isAdmin && (
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'معلم الحلقة' : 'Circle Teacher'}</label>
                <select className="select" value={form.sheikhId} onChange={e => handle('sheikhId', e.target.value)} required>
                  <option value="">{lang === 'ar' ? 'اختر المعلم' : 'Select Teacher'}</option>
                  {(dbData?.users || []).filter(u => u.role === 'sheikh').map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'المكان' : 'Location'}</label>
              <input className="input" value={form.location} onChange={e => handle('location', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'وقت الحلقة (الصلاة)' : 'Session time (prayer)'}</label>
              <select className="select" value={form.period} onChange={e => handle('period', e.target.value)}>
                <option value="">{lang === 'ar' ? 'غير محدد' : 'Not set'}</option>
                {PRAYER_PERIODS.map(p => (
                  <option key={p.key} value={p.key}>{lang === 'ar' ? p.ar : p.en}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'وقت البدء' : 'Start Time'}</label>
                <input type="time" className="input" value={form.startTime} onChange={e => handle('startTime', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">{lang === 'ar' ? 'وقت الانتهاء' : 'End Time'}</label>
                <input type="time" className="input" value={form.endTime} onChange={e => handle('endTime', e.target.value)} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'أيام الحلقة' : 'Circle Days'}</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {days.map(day => {
                  const isActive = form.schedule.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '0.5rem', borderRadius: 8, flex: '1 1 auto', textAlign: 'center',
                        background: isActive ? 'var(--emerald)' : 'var(--bg-input)',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => handle('isActive', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="isActive" style={{ cursor: 'pointer' }}>
                {lang === 'ar' ? 'الحلقة نشطة' : 'Circle is active'}
              </label>
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

export default function HalaqatPage() {
  const { t, lang, currentUser, dbData, showToast, addHalaqaFn, updateHalaqaFn, deleteHalaqaFn } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editHalaqa, setEditHalaqa] = useState(null);

  const myHalaqat = isAdmin
    ? (dbData?.halaqat || [])
    : (dbData?.halaqat || []).filter(h => h.sheikhId === currentUser?.id);
  const halaqaExtras = loadHalaqaExtras();

  const handleSave = async (data) => {
    try {
      const extra = { period: data.period || '', startTime: data.startTime || '', endTime: data.endTime || '', schedule: data.schedule || [] };
      if (editHalaqa) {
        await updateHalaqaFn(editHalaqa.id, data, currentUser);
        saveHalaqaExtra(editHalaqa.id, extra);
        showToast(lang === 'ar' ? 'تم التعديل بنجاح' : 'Updated successfully');
      } else {
        const newId = await addHalaqaFn(data, currentUser);
        saveHalaqaExtra(newId, extra);
        showToast(lang === 'ar' ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الحلقة؟' : 'Are you sure you want to delete this circle?')) {
      try {
        await deleteHalaqaFn(id);
        showToast(lang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('halaqat')}</h1>
          <p className="text-small text-secondary">
            {myHalaqat.length} {lang === 'ar' ? 'حلقات' : 'circles'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          {lang === 'ar' ? 'إضافة حلقة' : 'Add Circle'}
        </button>
      </div>

      {myHalaqat.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} /></div>
          <div className="text-subtitle">{lang === 'ar' ? 'لا توجد حلقات' : 'No circles found'}</div>
        </div>
      ) : (
        <div className="grid-3">
          {myHalaqat.map(h => {
            const students = (dbData?.students || []).filter(s => s.halaqaId === h.id && s.status === 'active');
            const ex = halaqaExtras[h.id] || {};
            const schedule = ex.schedule || [];
            const sheikh = (dbData?.users || []).find(u => u.id === h.sheikhId);
            return (
              <div key={h.id} className="card" style={{ cursor: 'default', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--emerald), var(--emerald-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.3rem',
                  }}><Users size={20} /></div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditHalaqa(h)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(h.id)}>
                      <Trash2 size={14} />
                    </button>
                    <span className={`badge ${h.isActive ? 'badge-active' : 'badge-archived'}`}>
                      {h.isActive ? (lang === 'ar' ? 'نشطة' : 'Active') : (lang === 'ar' ? 'موقوفة' : 'Inactive')}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-subtitle font-bold">{lang === 'ar' ? h.name : (h.nameEn || h.name)}</h3>
                  {h.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      <MapPin size={12} />
                      <span className="text-xs">{h.location}</span>
                    </div>
                  )}
                  {isAdmin && sheikh && (
                    <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                      {lang === 'ar' ? 'الشيخ:' : 'Sheikh:'} {sheikh.fullName}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald)' }}>{students.length}</div>
                    <div className="text-xs text-muted">{t('students')}</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37' }}>{schedule.length || '—'}</div>
                    <div className="text-xs text-muted">{lang === 'ar' ? 'أيام/أسبوع' : 'Days/Wk'}</div>
                  </div>
                </div>

                {schedule.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {schedule.map(day => (
                      <span key={day} style={{
                        padding: '0.2rem 0.5rem', borderRadius: 6,
                        background: 'var(--bg-input)', color: 'var(--text-secondary)',
                        fontSize: '0.7rem', fontWeight: 600,
                      }}>{day}</span>
                    ))}
                  </div>
                )}

                {ex.period && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', alignSelf: 'flex-start', padding: '0.25rem 0.625rem', borderRadius: 999, background: 'rgba(15,118,110,0.1)', color: 'var(--emerald)', fontSize: '0.72rem', fontWeight: 700 }}>
                    <Clock size={12} /> {periodLabel(ex.period, lang)}
                  </div>
                )}

                {(ex.startTime || ex.endTime) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                    <span className="text-xs">{ex.startTime || '—'} — {ex.endTime || '—'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(showAddModal || editHalaqa) && (
        <HalaqaFormModal
          halaqa={editHalaqa}
          onClose={() => { setShowAddModal(false); setEditHalaqa(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
