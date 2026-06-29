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

  const isAdmin = currentUser?.role === 'admin';
  const [selectedHalaqa, setSelectedHalaqa] = useState('all');
  const halaqaList = (dbData?.halaqat || []).filter(h => isAdmin || h.sheikhId === currentUser?.id || h.sheikh_id === currentUser?.id);
  const halaqaOf = (a) => a.halaqaId || a.halaqa_id || '';
  const studentHalaqa = (s) => s.halaqaId || s.halaqa_id || '';

  // Students in scope: teacher's students, optionally narrowed to one circle.
  const baseStudents = isAdmin
    ? (dbData?.students || [])
    : (dbData?.students || []).filter(s => s.sheikhId === currentUser?.id || s.sheikh_id === currentUser?.id);
  const scopedStudents = selectedHalaqa === 'all'
    ? baseStudents
    : baseStudents.filter(s => studentHalaqa(s) === selectedHalaqa);
  const scopedIds = new Set(scopedStudents.map(s => s.id));

  // Attendance within the date range, scope, and selected circle.
  const allAttendance = dbData?.attendance || [];
  const filteredAttendance = allAttendance.filter(a =>
    a.date >= dateFrom && a.date <= dateTo
    && scopedIds.has(a.studentId || a.student_id)
    && (selectedHalaqa === 'all' || halaqaOf(a) === selectedHalaqa)
  );

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

  const myStudents = scopedStudents.map(safeStudent);

  const selectedHalaqaName = selectedHalaqa === 'all'
    ? (lang === 'ar' ? 'كل الحلقات' : 'All circles')
    : (() => { const h = halaqaList.find(x => x.id === selectedHalaqa); return h ? (lang === 'ar' ? h.name : (h.nameEn || h.name)) : ''; })();

  // Attendance totals for the current scope.
  const attTotals = { present: 0, late: 0, excused: 0, absent: 0 };
  filteredAttendance.forEach(a => { if (attTotals[a.status] !== undefined) attTotals[a.status]++; });
  const totalMarked = attTotals.present + attTotals.late + attTotals.excused + attTotals.absent;
  const overallRate = totalMarked ? Math.round((attTotals.present + attTotals.late) / totalMarked * 100) : 0;

  // ── Day-by-day attendance ─────────────────────────────────────────────────
  const dateList = (() => {
    const out = [];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    if (isNaN(start) || isNaN(end) || start > end) return out;
    const cur = new Date(start);
    let guard = 0;
    while (cur <= end && guard < 370) {
      out.push(cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0'));
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
    return out;
  })();

  // Best status per student/day (present > late > excused > absent)
  const STATUS_PRIORITY = { present: 4, late: 3, excused: 2, absent: 1 };
  const attMap = (() => {
    const m = {};
    for (const a of filteredAttendance) {
      const sid = a.studentId || a.student_id;
      const key = sid + '|' + a.date;
      if (!m[key] || (STATUS_PRIORITY[a.status] || 0) > (STATUS_PRIORITY[m[key]] || 0)) m[key] = a.status;
    }
    return m;
  })();

  const statusCode = (st) => {
    if (!st) return '-';
    return (lang === 'ar'
      ? { present: 'ح', late: 'ت', excused: 'ع', absent: 'غ' }
      : { present: 'P', late: 'L', excused: 'E', absent: 'A' })[st] || '-';
  };
  const statusColor = (st) => ({
    present: '#10B981', late: '#F59E0B', excused: '#3B82F6', absent: '#EF4444',
  })[st] || 'var(--text-muted)';
  const dayLabel = (d) => { const dt = new Date(d); return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0'); };

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
      } else if (reportId === 'daily') {
        head = [L('الاسم', 'Name'), ...dateList.map(dayLabel), L('حاضر', 'Present'), L('غائب', 'Absent')];
        body = myStudents.map(s => {
          let present = 0, absent = 0;
          const cells = dateList.map(d => {
            const st = attMap[s.id + '|' + d];
            if (st === 'present' || st === 'late') present++;
            else if (st === 'absent') absent++;
            return statusCode(st);
          });
          return [s.fullName, ...cells, present, absent];
        });
      } else if (reportId === 'summary') {
        head = [L('الاسم', 'Name'), L('حاضر', 'Present'), L('متأخر', 'Late'), L('معذور', 'Excused'), L('غائب', 'Absent'), L('النسبة', 'Rate %')];
        body = myStudents.map(s => {
          const c = { present: 0, late: 0, excused: 0, absent: 0 };
          filteredAttendance.forEach(a => { if ((a.studentId || a.student_id) === s.id && c[a.status] !== undefined) c[a.status]++; });
          const tot = c.present + c.late + c.excused + c.absent;
          const rate = tot ? Math.round((c.present + c.late) / tot * 100) : 0;
          return [s.fullName, c.present, c.late, c.excused, c.absent, `${rate}%`];
        });
      } else {
        head = [L('الاسم', 'Name'), L('الاسم (إنجليزي)', 'Name (EN)'), L('السورة الحالية', 'Current Surah'), L('الآية', 'Ayah'), L('إجمالي الآيات', 'Total Ayahs'), L('نسبة الحضور', 'Attendance %')];
        body = myStudents.map(s => [s.fullName, s.fullNameEn || '', getSurahName(s.currentSurah, lang), s.currentAyah, s.totalAyahMemorized, `${s.attendancePct}%`]);
      }

      const reportTitles = {
        attendance:    L('تقرير الحضور', 'Attendance Report'),
        summary:       L('ملخص الحضور', 'Attendance Summary'),
        daily:         L('تقرير الحضور اليومي', 'Daily Attendance Report'),
        progress:      L('تقرير التقدم', 'Progress Report'),
        revision:      L('تقرير المراجعة', 'Revision Report'),
        comprehensive: L('تقرير شامل', 'Comprehensive Report'),
      };
      const reportTitle = (reportTitles[reportId] || L('تقرير', 'Report'))
        + (selectedHalaqa !== 'all' ? ` — ${selectedHalaqaName}` : '');

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
            <div class="sub">${escHtml(selectedHalaqaName)} · ${escHtml(rangeLine)} · ${myStudents.length} ${escHtml(L('طالب', 'students'))}</div>
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

      {/* Filters: circle + date range */}
      <div className="card card-sm" style={{ marginBottom: '1.5rem' }}>
        <div className="text-small font-semibold" style={{ marginBottom: '0.6rem' }}>
          {lang === 'ar' ? 'التصفية' : 'Filters'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div className="input-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="input-label">{lang === 'ar' ? 'الحلقة' : 'Circle'}</label>
            <select className="select" style={{ width: '100%', minWidth: 0 }}
              value={selectedHalaqa} onChange={e => setSelectedHalaqa(e.target.value)}>
              <option value="all">{lang === 'ar' ? 'كل الحلقات' : 'All circles'}</option>
              {halaqaList.map(h => <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : (h.nameEn || h.name)}</option>)}
            </select>
          </div>
          <div className="input-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="input-label">{t('dateFrom')}</label>
            <input type="date" className="input" style={{ width: '100%', minWidth: 0 }}
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="input-group" style={{ margin: 0, minWidth: 0 }}>
            <label className="input-label">{t('dateTo')}</label>
            <input type="date" className="input" style={{ width: '100%', minWidth: 0 }}
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Attendance statistics summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div>
            <h3 className="text-subtitle font-bold">{lang === 'ar' ? 'إحصاءات الحضور' : 'Attendance Statistics'}</h3>
            <p className="text-xs text-muted">{selectedHalaqaName} · {myStudents.length} {lang === 'ar' ? 'طالب' : 'students'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" style={{ background: '#ECFDF5', color: '#0F766E', fontWeight: 700 }} onClick={() => handleExport('summary', 'PDF')}>
              <FileText size={14} /> {t('exportPDF')}
            </button>
            <button className="btn btn-sm" style={{ background: '#ECFDF5', color: '#047857', fontWeight: 700 }} onClick={() => handleExport('summary', 'EXCEL')}>
              <Sheet size={14} /> {lang === 'ar' ? 'إكسل' : 'Excel'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('summary', 'CSV')}>
              <Table size={14} /> {t('exportCSV')}
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '0.6rem' }}>
          {[
            { label: lang === 'ar' ? 'حاضر' : 'Present', value: attTotals.present, color: '#10B981' },
            { label: lang === 'ar' ? 'متأخر' : 'Late', value: attTotals.late, color: '#F59E0B' },
            { label: lang === 'ar' ? 'معذور' : 'Excused', value: attTotals.excused, color: '#3B82F6' },
            { label: lang === 'ar' ? 'غائب' : 'Absent', value: attTotals.absent, color: '#EF4444' },
            { label: lang === 'ar' ? 'نسبة الحضور' : 'Rate', value: `${overallRate}%`, color: '#0F766E' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.75rem 0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day-by-day attendance */}
      <div className="card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div>
            <h3 className="text-subtitle font-bold">{lang === 'ar' ? 'الحضور اليومي' : 'Daily Attendance'}</h3>
            <p className="text-xs text-muted">
              {selectedHalaqaName} · {lang === 'ar' ? `${dateList.length} يوم` : `${dateList.length} days`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" style={{ background: '#ECFDF5', color: '#0F766E', fontWeight: 700 }} onClick={() => handleExport('daily', 'PDF')}>
              <FileText size={14} /> {t('exportPDF')}
            </button>
            <button className="btn btn-sm" style={{ background: '#ECFDF5', color: '#047857', fontWeight: 700 }} onClick={() => handleExport('daily', 'EXCEL')}>
              <Sheet size={14} /> {lang === 'ar' ? 'إكسل' : 'Excel'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('daily', 'CSV')}>
              <Table size={14} /> {t('exportCSV')}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {[['present', lang === 'ar' ? 'حاضر' : 'Present'], ['late', lang === 'ar' ? 'متأخر' : 'Late'], ['excused', lang === 'ar' ? 'معذور' : 'Excused'], ['absent', lang === 'ar' ? 'غائب' : 'Absent']].map(([k, label]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: statusColor(k), color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700 }}>{statusCode(k)}</span>
              {label}
            </span>
          ))}
        </div>

        {myStudents.length === 0 || dateList.length === 0 ? (
          <div className="text-small text-muted" style={{ padding: '1rem 0' }}>{t('noData')}</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: 'max-content' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', insetInlineStart: 0, background: 'var(--bg-card)', zIndex: 2, padding: '0.4rem 0.6rem', textAlign: 'start', borderBottom: '2px solid var(--border)', minWidth: 120 }}>
                    {lang === 'ar' ? 'الطالب' : 'Student'}
                  </th>
                  {dateList.map(d => (
                    <th key={d} title={d} style={{ padding: '0.4rem 0.3rem', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dayLabel(d)}</th>
                  ))}
                  <th style={{ padding: '0.4rem 0.5rem', borderBottom: '2px solid var(--border)', color: '#10B981' }}>{lang === 'ar' ? 'ح' : 'P'}</th>
                  <th style={{ padding: '0.4rem 0.5rem', borderBottom: '2px solid var(--border)', color: '#EF4444' }}>{lang === 'ar' ? 'غ' : 'A'}</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.map(s => {
                  let present = 0, absent = 0;
                  return (
                    <tr key={s.id}>
                      <td style={{ position: 'sticky', insetInlineStart: 0, background: 'var(--bg-card)', zIndex: 1, padding: '0.35rem 0.6rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{s.fullName}</td>
                      {dateList.map(d => {
                        const st = attMap[s.id + '|' + d];
                        if (st === 'present' || st === 'late') present++;
                        else if (st === 'absent') absent++;
                        return (
                          <td key={d} style={{ textAlign: 'center', padding: '0.25rem', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ display: 'inline-flex', width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 5, fontWeight: 700, color: st ? '#fff' : 'var(--text-muted)', background: st ? statusColor(st) : 'transparent' }}>
                              {statusCode(st)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#10B981', borderBottom: '1px solid var(--border)' }}>{present}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#EF4444', borderBottom: '1px solid var(--border)' }}>{absent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                style={{ flex: '1 1 96px', justifyContent: 'center', background: report.bg, color: report.color, fontWeight: 700 }}
                onClick={() => handleExport(report.id, 'PDF')}
              >
                <FileText size={14} /> {t('exportPDF')}
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: '1 1 96px', justifyContent: 'center', background: '#ECFDF5', color: '#047857', fontWeight: 700 }}
                onClick={() => handleExport(report.id, 'EXCEL')}
              >
                <Sheet size={14} /> {lang === 'ar' ? 'إكسل' : 'Excel'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: '1 1 96px', justifyContent: 'center' }}
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
