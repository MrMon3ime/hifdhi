import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockUsers, mockHalaqat } from '../data/mockData.js';
import { GraduationCap, Plus, Users } from 'lucide-react';

export default function TeachersPage() {
  const { t, lang } = useApp();
  const teachers = mockUsers.filter(u => u.role === 'sheikh');

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-title font-bold">{t('teachers')}</h1>
          <p className="text-small text-secondary">{teachers.length} {lang === 'ar' ? 'مشايخ' : 'teachers'}</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> {lang === 'ar' ? 'إضافة شيخ' : 'Add Sheikh'}
        </button>
      </div>

      <div className="grid-3">
        {teachers.map(teacher => {
          const myHalaqat = mockHalaqat.filter(h => h.sheikhId === teacher.id);
          const totalStudents = myHalaqat.reduce((sum, h) => sum + h.studentCount, 0);
          return (
            <div key={teacher.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
              <div className="avatar avatar-xl" style={{
                background: 'linear-gradient(135deg, var(--emerald), var(--gold))',
              }}>
                {teacher.fullName[0]}
              </div>
              <div>
                <h3 className="text-subtitle font-bold">{teacher.fullName}</h3>
                <p className="text-small text-muted">{teacher.fullNameEn}</p>
                <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{teacher.email}</p>
              </div>
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
              <span className="badge badge-active" style={{ alignSelf: 'center' }}>
                {lang === 'ar' ? 'نشط' : 'Active'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
