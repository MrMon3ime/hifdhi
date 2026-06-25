import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getSurahName } from '../data/quranData.js';
import { FileText, Table, Sheet, Calendar, BookOpen, RefreshCw, BarChart2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export default function ReportsPage() {
  const { t, lang, currentUser, showToast, dbData } = useApp();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Compute attendance dynamically based on date range
  const allAttendance = dbData?.attendance || [];
  const filteredAttendance = allAttendance.filter(a => a.date >= dateFrom && a.date <= dateTo);

  const safeStudent = (s) => {
    const studentAtt = filteredAttendance.filter(a => a.student_id === s.id || a.studentId === s.id);
    const presentCount = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePct = studentAtt.length > 0 ? Math.round((presentCount / studentAtt.length) * 100) : 0;

    return {
      ...s,
      totalAyahMemorized: s.totalAyahMemorized || s.total_ayah_memorized || 0,
      currentSurah: s.currentSurah || s.current_surah || 1,
      currentAyah: s.currentAyah || s.current_ayah || 1,
      attendancePct,
      fullName: s.fullName || s.full_name || 'بدون اسم',
    };
  };

  const myStudents = (currentUser?.role === 'admin'
    ? (dbData?.students || [])
    : (dbData?.students || []).filter(s => s.sheikhId === currentUser?.id || s.sheikh_id === currentUser?.id)
  ).map(safeStudent);

  const handleExport = (reportId, format) => {
    try {
      const L = (ar, en) => (lang === 'ar' ? ar : en);
      let head = [];
      let body = [];

      if (reportId === 'attendance') {
        head = [L('الاسم', 'Name'), L('نسبة الحضور (النطاق المحدد)', 'Attendance % (Selected Range)')];
        body = myStudents.map(s => [s.fullName, `${s.attendancePct}%`]);
      } else if (reportId === 'progress') {
        head = [L('الاسم', 'Name'), L('السورة الحالية', 'Current Surah'), L('الآية', 'Ayah'), L('إجمالي الآيات المحفوظة', 'Total Ayahs Memorized')];
        body = myStudents.map(s => [s.fullName, getSurahName(s.currentSurah, lang), s.currentAyah, s.totalAyahMemorized]);
      } else if (reportId === 'revision') {
        head = [L('الاسم', 'Name'), L('الآيات المحفوظة', 'Ayahs Memorized'), L('نسبة الحضور', 'Attendance %')];
        body = myStudents.map(s => [s.fullName, s.totalAyahMemorized, `${s.attendancePct}%`]);
      } else {
        head = [L('الاسم', 'Name'), L('الاسم (إنجليزي)', 'Name (EN)'), L('السورة الحالية', 'Current Surah'), L('الآية', 'Ayah'), L('إجمالي الآيات', 'Total Ayahs'), L('نسبة الحضور', 'Attendance %')];
        body = myStudents.map(s => [s.fullName, s.fullNameEn || '', getSurahName(s.currentSurah, lang), s.currentAyah, s.totalAyahMemorized, `${s.attendancePct}%`]);
      }

      const reportTitles = {
        attendance:    L('تقرير الحضور', 'Attendance Report'),
        progress:      L('تقرير التقدم', 'Progress Report'),
        revision:      L('تقرير المراجعة', 'Revision Report'),
        comprehensive: L('تقرير شامل', 'Comprehensive Report'),
      };
      const reportTitle = reportTitles[reportId] || L('تقرير', 'Report');

      const fileName = `report_${reportId}_${new Date().toISOString().split('T')[0]}`;
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
            dialogTitle: lang === 'ar' ? 'حفظ أو مشاركة التقرير' : 'Save or Share Report',
          });
          
          showToast(lang === 'ar' ? 'تم تجهيز الملف للمشاركة' : 'File ready to share', 'success');
        } catch (e) {
          console.error('Filesystem/Share error:', e);
          showToast(lang === 'ar' ? 'فشل حفظ الملف في الجهاز' : 'Failed to save file on device', 'error');
        }
      };

      if (format === 'CSV') {
        // Quote fields so Arabic text / commas don't break columns
        const esc = (v) => {
          const str = String(v ?? '');
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const csvContent = [head, ...body].map(row => row.map(esc).join(',')).join('\n');
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
          showToast(lang === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully');
        }
      } else if (format === 'EXCEL') {
        import('xlsx').then((XLSX) => {
          const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
          ws['!cols'] = head.map(() => ({ wch: 22 }));
          if (lang === 'ar') ws['!views'] = [{ RTL: true }];
          const wb = XLSX.utils.book_new();
          if (lang === 'ar') wb.Workbook = { Views: [{ RTL: true }] };
          XLSX.utils.book_append_sheet(wb, ws, lang === 'ar' ? 'تقرير' : 'Report');
          if (isNative) {
            const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            saveNativeFile(base64, fileName + '.xlsx');
          } else {
            XLSX.writeFile(wb, fileName + '.xlsx');
            showToast(lang === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully');
          }
        });
      } else if (format === 'PDF') {
        const isRTL = lang === 'ar';
        const escHtml = (v) => String(v ?? '')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const rangeLine = `${L('من', 'From')} ${dateFrom} ${L('إلى', 'To')} ${dateTo}`;

        const html = `<!DOCTYPE html>
          <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${lang}">
          <head>
            <meta charset="utf-8" />
            <title>${escHtml(reportTitle)}</title>
            <style>
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              body { font-family: "Segoe UI", "Noto Naskh Arabic", "Amiri", system-ui, -apple-system, sans-serif; padding: 2rem; color: #0F172A; direction: ${isRTL ? 'rtl' : 'ltr'}; }
              h1 { color: #0F766E; text-align: center; margin-bottom: 0.25rem; }
              .sub { text-align: center; color: #64748B; font-size: 0.85rem; margin-bottom: 1.5rem; }
              table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
              th, td { border: 1px solid #E2E8F0; padding: 0.6rem 0.75rem; text-align: ${isRTL ? 'right' : 'left'}; font-size: 0.85rem; }
              th { background-color: #0F766E; font-weight: 700; color: #ffffff; }
              tr:nth-child(even) td { background-color: #F8FAFC; }
            </style>
          </head>
          <body>
            <h1>${escHtml(reportTitle)}</h1>
            <div class="sub">${escHtml(rangeLine)} · ${myStudents.length} ${escHtml(L('طالب', 'students'))}</div>
            <table>
              <thead><tr>${head.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
              <tbody>${body.map(row => `<tr>${row.map(cell => `<td>${escHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </body>
          </html>`;

        if (isNative) {
          // Save the Arabic-ready HTML report and share it (open → print to PDF).
          const base64 = btoa(unescape(encodeURIComponent(html)));
          saveNativeFile(base64, fileName + '.html');
        } else {
          // Browser print → "Save as PDF" renders Arabic perfectly.
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            showToast(lang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow pop-ups to print', 'warning');
            return;
          }
          printWindow.document.open();
          printWindow.document.write(html + '<script>window.onload=function(){window.print();}</script>');
          printWindow.document.close();
          showToast(lang === 'ar' ? 'تم تجهيز التقرير للطباعة (احفظ كـ PDF)' : 'Report ready — Save as PDF');
        }
      }

    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'فشل التصدير' : 'Export failed', 'error');
    }
  };

  const reports = [
    {
      id: 'attendance',
      title: lang === 'ar' ? 'تقرير الحضور' : 'Attendance Report',
      desc: lang === 'ar' ? 'سجل حضور وغياب جميع الطلاب' : 'Full attendance record for all students',
      icon: Calendar,
      color: '#0F766E',
      bg: '#ECFDF5',
    },
    {
      id: 'progress',
      title: lang === 'ar' ? 'تقرير التقدم' : 'Progress Report',
      desc: lang === 'ar' ? 'مستوى تقدم الطلاب في الحفظ' : 'Student memorization progress levels',
      icon: BookOpen,
      color: '#1D4ED8',
      bg: '#EFF6FF',
    },
    {
      id: 'revision',
      title: lang === 'ar' ? 'تقرير المراجعة' : 'Revision Report',
      desc: lang === 'ar' ? 'إحصاءات المراجعة والتقييمات' : 'Revision statistics and ratings',
      icon: RefreshCw,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    {
      id: 'comprehensive',
      title: lang === 'ar' ? 'تقرير شامل' : 'Comprehensive Report',
      desc: lang === 'ar' ? 'جميع البيانات والإحصاءات' : 'All data and statistics combined',
      icon: BarChart2,
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
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <label className="input-label" style={{ whiteSpace: 'nowrap' }}>{t('dateTo')}</label>
            <input type="date" className="input" style={{ width: 'auto' }}
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid-2">
        {reports.map(report => {
          const Icon = report.icon;
          return (
          <div key={report.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: report.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: report.color, flexShrink: 0,
              }}><Icon size={24} /></div>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm"
                style={{ flex: '1 1 30%', justifyContent: 'center', background: report.bg, color: report.color, fontWeight: 700 }}
                onClick={() => handleExport(report.id, 'PDF')}
              >
                <FileText size={14} /> {t('exportPDF')}
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: '1 1 30%', justifyContent: 'center', background: '#ECFDF5', color: '#047857', fontWeight: 700 }}
                onClick={() => handleExport(report.id, 'EXCEL')}
              >
                <Sheet size={14} /> {lang === 'ar' ? 'إكسل' : 'Excel'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: '1 1 30%', justifyContent: 'center' }}
                onClick={() => handleExport(report.id, 'CSV')}
              >
                <Table size={14} /> {t('exportCSV')}
              </button>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
