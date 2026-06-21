import { useApp } from '../context/AppContext.jsx';
import { mockStudents } from '../data/mockData.js';
import { Download, FileText, Table } from 'lucide-react';

export default function ReportsPage() {
  const { t, lang, currentUser, showToast } = useApp();

  const myStudents = currentUser?.role === 'admin'
    ? mockStudents
    : mockStudents.filter(s => s.sheikhId === currentUser?.id);

  const handleExport = (type, format) => {
    showToast(lang === 'ar'
      ? `جارٍ تصدير ${type} بصيغة ${format}...`
      : `Exporting ${type} as ${format}...`
    );
  };

  const reports = [
    {
      id: 'attendance',
      title: lang === 'ar' ? 'تقرير الحضور' : 'Attendance Report',
      desc: lang === 'ar' ? 'سجل حضور وغياب جميع الطلاب' : 'Full attendance record for all students',
      icon: '📅',
      color: '#0F766E',
      bg: '#ECFDF5',
    },
    {
      id: 'progress',
      title: lang === 'ar' ? 'تقرير التقدم' : 'Progress Report',
      desc: lang === 'ar' ? 'مستوى تقدم الطلاب في الحفظ' : 'Student memorization progress levels',
      icon: '📖',
      color: '#1D4ED8',
      bg: '#EFF6FF',
    },
    {
      id: 'revision',
      title: lang === 'ar' ? 'تقرير المراجعة' : 'Revision Report',
      desc: lang === 'ar' ? 'إحصاءات المراجعة والتقييمات' : 'Revision statistics and ratings',
      icon: '🔄',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    {
      id: 'comprehensive',
      title: lang === 'ar' ? 'تقرير شامل' : 'Comprehensive Report',
      desc: lang === 'ar' ? 'جميع البيانات والإحصاءات' : 'All data and statistics combined',
      icon: '📊',
      color: '#D4AF37',
      bg: '#FEFCE8',
    },
  ];

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-title font-bold">{t('reports')}</h1>
        <p className="text-small text-secondary">
          {lang === 'ar' ? 'إنشاء وتصدير التقارير' : 'Generate and export reports'}
        </p>
      </div>

      {/* Date range */}
      <div className="card card-sm" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="text-small font-semibold">{lang === 'ar' ? 'نطاق التاريخ:' : 'Date Range:'}</span>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <label className="input-label" style={{ whiteSpace: 'nowrap' }}>{t('dateFrom')}</label>
            <input type="date" className="input" style={{ width: 'auto' }}
              defaultValue={new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0]} />
          </div>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <label className="input-label" style={{ whiteSpace: 'nowrap' }}>{t('dateTo')}</label>
            <input type="date" className="input" style={{ width: 'auto' }}
              defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid-2">
        {reports.map(report => (
          <div key={report.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: report.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
              }}>{report.icon}</div>
              <div>
                <h3 className="text-subtitle font-bold">{report.title}</h3>
                <p className="text-small text-secondary">{report.desc}</p>
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: 'var(--bg-input)', borderRadius: 10,
              padding: '0.875rem', fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}>
              {report.id === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {myStudents.slice(0, 3).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.fullName}</span>
                      <span style={{ fontWeight: 700, color: s.attendancePct >= 80 ? '#10B981' : '#EF4444' }}>
                        {s.attendancePct}%
                      </span>
                    </div>
                  ))}
                  {myStudents.length > 3 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      +{myStudents.length - 3} {lang === 'ar' ? 'آخرون' : 'more'}
                    </div>
                  )}
                </div>
              )}
              {report.id === 'progress' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {myStudents.slice(0, 3).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.fullName}</span>
                      <span style={{ fontWeight: 700, color: report.color }}>
                        {s.totalAyahMemorized} {lang === 'ar' ? 'آية' : 'ayahs'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(report.id === 'revision' || report.id === 'comprehensive') && (
                <div style={{ color: 'var(--text-muted)' }}>
                  {lang === 'ar' ? 'سيتم إنشاء التقرير وتحميله تلقائيًا' : 'Report will be generated and downloaded automatically'}
                </div>
              )}
            </div>

            {/* Export buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: 'center', background: report.bg, color: report.color, fontWeight: 700 }}
                onClick={() => handleExport(report.title, 'PDF')}
              >
                <FileText size={14} /> {t('exportPDF')}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => handleExport(report.title, 'CSV')}
              >
                <Table size={14} /> {t('exportCSV')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
