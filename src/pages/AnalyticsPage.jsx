import { useApp } from '../context/AppContext.jsx';
import { countAyahsBetween } from '../data/quranData.js';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Users, BookOpen, Calendar, GraduationCap } from 'lucide-react';

export default function AnalyticsPage() {
  const { t, lang, currentUser, resolvedTheme, dbData } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const isDark = resolvedTheme === 'dark';

  const safeStudent = (s) => ({
    ...s,
    totalAyahMemorized: s.totalAyahMemorized ?? 0,
    attendancePct: s.attendancePct ?? 0,
    fullName: s.fullName || 'بدون اسم',
  });

  const myStudents = (isAdmin
    ? (dbData?.students || [])
    : (dbData?.students || []).filter(s => s.sheikhId === currentUser?.id)
  ).map(safeStudent);

  const activeStudents = myStudents.filter(s => s.status === 'active');
  const graduated = myStudents.filter(s => s.status === 'graduated');
  const paused = myStudents.filter(s => s.status === 'paused');

  const totalAyah = myStudents.reduce((sum, s) => sum + (s.totalAyahMemorized || 0), 0);
  const avgAttendance = myStudents.length
    ? Math.round(myStudents.reduce((sum, s) => sum + (s.attendancePct || 0), 0) / myStudents.length)
    : 0;

  // Teacher sees only their own students' data; admin sees everything.
  const myStudentIds = new Set(myStudents.map(s => s.id));
  const mine = (r) => myStudentIds.has(r.studentId || r.student_id);
  const sessions = (dbData?.sessions || []).filter(mine);
  const attendance = (dbData?.attendance || []).filter(mine);

  // Generate dynamic week data from sessions
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const sessionVerses = (s) => s.ayah_count || s.ayahCount || countAyahsBetween(
    s.fromSurah || s.from_surah,
    s.fromAyah || s.from_ayah,
    s.toSurah || s.to_surah,
    s.toAyah || s.to_ayah,
  ) || 0;

  const weekData = last7Days.map(date => {
    const daySessions = sessions.filter(s => s.date === date);
    return {
      name: new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }),
      verses: daySessions.reduce((sum, s) => sum + sessionVerses(s), 0)
    };
  });

  const monthData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - 6);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7);
    const weekAttendance = attendance.filter(a => {
      const d = new Date(a.date);
      return d >= weekStart && d <= weekEnd;
    });
    const pct = weekAttendance.length > 0
      ? Math.round(weekAttendance.filter(a => a.status === 'present' || a.status === 'late').length / weekAttendance.length * 100)
      : 0;
    return {
      name: lang === 'ar' ? `أسبوع ${i + 1}` : `Week ${i + 1}`,
      present: pct,
      absent: weekAttendance.length > 0 ? 100 - pct : 0,
    };
  });

  const chartColors = {
    grid: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltip: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E2E8F0',
  };

  const statusPieData = [
    { name: t('active'),    value: activeStudents.length, color: '#0F766E' },
    { name: t('graduated'), value: graduated.length,       color: '#3B82F6' },
    { name: t('paused'),    value: paused.length,          color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const studentRanking = [...myStudents]
    .sort((a, b) => b.totalAyahMemorized - a.totalAyahMemorized)
    .map(s => ({
      name: s.fullName.split(' ')[0],
      verses: s.totalAyahMemorized,
      pct: Math.round((s.totalAyahMemorized / 6236) * 100),
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: chartColors.tooltip, border: `1px solid ${chartColors.tooltipBorder}`,
        borderRadius: 10, padding: '0.5rem 0.875rem',
        fontSize: '0.8rem', color: 'var(--text-primary)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || 'var(--text-primary)' }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-body">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-title font-bold">{t('analytics')}</h1>
        <p className="text-small text-secondary">
          {lang === 'ar' ? 'إحصاءات وتقارير الأداء' : 'Performance statistics and insights'}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: lang === 'ar' ? 'إجمالي الطلاب' : 'Total Students', value: myStudents.length, icon: Users, color: 'var(--emerald)' },
          { label: lang === 'ar' ? 'إجمالي الآيات المحفوظة' : 'Total Verses Memorized', value: totalAyah.toLocaleString(), icon: BookOpen, color: '#D4AF37' },
          { label: lang === 'ar' ? 'متوسط الحضور' : 'Avg Attendance', value: `${avgAttendance}%`, icon: Calendar, color: '#3B82F6' },
          { label: lang === 'ar' ? 'المتخرجون' : 'Graduated', value: graduated.length, icon: GraduationCap, color: '#8B5CF6' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
          <div key={i} className="card" style={{
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
            textAlign: 'center', cursor: 'default',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: kpi.color }}><Icon size={32} /></div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
              {kpi.value}
            </div>
            <div className="text-xs text-muted">{kpi.label}</div>
          </div>
        )})}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Weekly verses */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="text-subtitle font-semibold">{lang === 'ar' ? 'الآيات المحفوظة أسبوعيًا' : 'Weekly Verses Memorized'}</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="verses" name={lang === 'ar' ? 'آيات' : 'Verses'}
                fill="#0F766E" radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly attendance */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="text-subtitle font-semibold">{lang === 'ar' ? 'نسبة الحضور الشهرية' : 'Monthly Attendance Rate'}</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="present"
                name={lang === 'ar' ? 'حضور %' : 'Present %'}
                stroke="#0F766E" strokeWidth={2.5}
                dot={{ fill: '#0F766E', r: 3 }}
              />
              <Line type="monotone" dataKey="absent"
                name={lang === 'ar' ? 'غياب %' : 'Absent %'}
                stroke="#EF4444" strokeWidth={2}
                dot={{ fill: '#EF4444', r: 2 }}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Status distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="text-subtitle font-semibold">{lang === 'ar' ? 'توزيع حالات الطلاب' : 'Student Status Distribution'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {statusPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {statusPieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span className="text-small">{d.name}</span>
                  <span className="text-small font-bold" style={{ marginInlineStart: 'auto', color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Ranking */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="text-subtitle font-semibold">{t('topStudents')}</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={studentRanking.slice(0, 6)} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="verses" name={lang === 'ar' ? 'آيات' : 'Verses'}
                fill="#D4AF37" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
