import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

function AddTeacherModal({ onClose, onSave, editingTeacher }) {
  const { t, lang, showToast } = useApp();
  const [form, setForm] = useState(
    editingTeacher || {
      fullName: '', fullNameEn: '', email: '', password: '', role: 'sheikh'
    }
  );

  const handle = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="text-subtitle font-semibold">
            {editingTeacher ? (lang === 'ar' ? 'تعديل بيانات الشيخ' : 'Edit Sheikh') : (lang === 'ar' ? 'إضافة شيخ جديد' : 'Add New Sheikh')}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('studentNameAr')} (Name AR) *</label>
                <input className="input" value={form.fullName} onChange={e => handle('fullName', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">{t('studentNameEn')} (Name EN)</label>
                <input className="input" value={form.fullNameEn} onChange={e => handle('fullNameEn', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">{t('email')} *</label>
              <input type="email" className="input" value={form.email} onChange={e => handle('email', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">{t('password')} *</label>
              <input type="text" className="input" value={form.password} onChange={e => handle('password', e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="input-label">{lang === 'ar' ? 'الصلاحية' : 'Role'} *</label>
              <select className="select" value={form.role} onChange={e => handle('role', e.target.value)} required>
                <option value="sheikh">{t('sheikh')}</option>
                <option value="admin">{t('admin')}</option>
              </select>
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

export default function TeachersPage() {
  const { t, lang, dbData, showToast, refreshData } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const teachers = (dbData?.users || []).filter(u => u.role === 'sheikh' || u.role === 'admin');

  const handleSave = async (data) => {
    try {
      const isEdit = !!data.id;
      const payload = {
        id: isEdit ? data.id : crypto.randomUUID(),
        full_name: data.fullName,
        role: data.role,
        email: data.email,
        password: data.password
      };

      const { error } = await supabase.from('users').upsert([payload]);
      
      if (error) throw error;

      showToast(t('success'));
      setShowAddModal(false);
      setEditingTeacher(null);
      
      // Refresh global context
      refreshData();
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving data', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      showToast(t('success'));
      refreshData();
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting data', 'error');
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('teachers')} / {t('admin')}</h1>
          <p className="text-small text-secondary">{teachers.length} {lang === 'ar' ? 'حسابات' : 'Accounts'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTeacher(null); setShowAddModal(true); }}>
          <Plus size={16} /> {lang === 'ar' ? 'إضافة حساب' : 'Add Account'}
        </button>
      </div>

      <div className="grid-3">
        {teachers.map(teacher => {
          const myHalaqat = (dbData?.halaqat || []).filter(h => h.sheikhId === teacher.id);
          const totalStudents = (dbData?.students || []).filter(s => s.sheikhId === teacher.id).length;
          return (
            <div key={teacher.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, insetInlineEnd: 12, display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingTeacher(teacher); setShowAddModal(true); }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(teacher.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="avatar avatar-xl" style={{
                background: teacher.role === 'admin' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'linear-gradient(135deg, var(--emerald), var(--gold))',
              }}>
                {teacher.fullName ? teacher.fullName[0] : '?'}
              </div>
              <div>
                <h3 className="text-subtitle font-bold">{teacher.fullName}</h3>
                <p className="text-small text-muted">{teacher.fullNameEn}</p>
                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{teacher.email}</p>
                <p className="text-xs" style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>PW: {teacher.password}</p>
              </div>
              {teacher.role === 'sheikh' && (
                <div style={{ display: 'flex', gap: '1rem', width: '100%', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--emerald)' }}>{myHalaqat.length}</div>
                    <div className="text-xs text-muted">{t('halaqat')}</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37' }}>{totalStudents}</div>
                    <div className="text-xs text-muted">{t('students')}</div>
                  </div>
                </div>
              )}
              <span className={`badge ${teacher.role === 'admin' ? 'badge-excused' : 'badge-active'}`} style={{ alignSelf: 'center' }}>
                {teacher.role === 'admin' ? t('admin') : t('sheikh')}
              </span>
            </div>
          );
        })}
      </div>
      
      {showAddModal && (
        <AddTeacherModal 
          onClose={() => { setShowAddModal(false); setEditingTeacher(null); }} 
          onSave={handleSave} 
          editingTeacher={editingTeacher} 
        />
      )}
    </div>
  );
}
