import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getSurahName, countAyahsBetween } from '../data/quranData.js';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, CalendarCheck, BookOpen, RefreshCw, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

function ProgressRing({ pct, size = 64, stroke = 6, color = '#0F766E' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function KpiCard({ icon: Icon, label, value, change, changeType, iconClass }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconClass}`}>
        <Icon size={22} />
      </div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {change && (
          <span className={`kpi-change ${changeType}`}>{change}</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t, lang, currentUser, resolvedTheme, setActivePage, dbData } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const safeStudent = (s) => {
    const student = s || {};
    return {
      ...student,
      fullName: String(student.fullName || 'بدون اسم'),
      juzCompleted: Array.isArray(student.juzCompleted) ? student.juzCompleted : [],
      attendancePct: student.attendancePct ?? 0,
      totalAyahMemorized: student.totalAyahMemorized ?? 0,
      currentSurah: student.currentSurah ?? 1,
      currentAyah: student.currentAyah ?? 1,
      fullNameEn: String(student.fullNameEn || ''),
    };
  };

  const myStudents = (isAdmin
    ? (dbData?.students || [])
    : (dbData?.students || []).filter(s => s.sheikhId === currentUser?.id)
  ).map(safeStudent);

  const activeStudents = myStudents.filter(s => s.status === 'active');

  // Halaqa picker — a student may attend at Fajr or another time, so attendance
  // stats can be viewed per circle (or across all circles).
  const myHalaqat = (dbData?.halaqat || []).filter(h => isAdmin || h.sheikhId === currentUser?.id);
  const [selectedHalaqa, setSelectedHalaqa] = useState('all');
  const halaqaOf = (a) => a.halaqaId || a.halaqa_id || '';
  const inSelectedHalaqa = (a) => selectedHalaqa === 'all' || halaqaOf(a) === selectedHalaqa;

  // A teacher only sees their own students' data; the admin sees everything.
  const myStudentIds = new Set(myStudents.map(s => s.id));
  const studentId = (r) => r.studentId || r.student_id;
  const mine = (r) => myStudentIds.has(studentId(r));

  // Verses memorized in a session — ayah_count is not stored, so derive it from
  // the range. Sessions are camelCased (fromSurah…) with snake-case fallback.
  const sessionVerses = (s) => s.ayahCount || s.ayah_count || countAyahsBetween(
    s.fromSurah || s.from_surah, s.fromAyah || s.from_ayah,
    s.toSurah || s.to_surah, s.toAyah || s.to_ayah,
  ) || 0;

  const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })();
  const todayAtt = (dbData?.attendance || []).filter(a => mine(a) && a.date === today && inSelectedHalaqa(a));
  const presentIds = new Set(todayAtt.filter(a => a.status === 'present' || a.status === 'late').map(studentId));
  const presentCount = presentIds.size;

  let absentCount, attRate;
  if (selectedHalaqa === 'all') {
    absentCount = Math.max(0, activeStudents.length - presentCount);
    attRate = activeStudents.length > 0 ? Math.round((presentCount / activeStudents.length) * 100) : 0;
  } else {
    const absentIds = new Set(todayAtt.filter(a => a.status === 'absent').map(studentId));
    absentCount = absentIds.size;
    const totalMarked = presentCount + absentCount;
    attRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;
  }

  const myStudentSessions = (dbData?.sessions || []).filter(mine);
  const todaySessions = myStudentSessions.filter(s => s.date === today);
  const todayVerses = todaySessions.reduce((sum, s) => sum + sessionVerses(s), 0);

  // Charts use the same scoped data
  const allSessions = myStudentSessions;
  const allAttendance = (dbData?.attendance || []).filter(a => mine(a) && inSelectedHalaqa(a));

  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const daySessions = allSessions.filter(s => s.date === dateStr);
      return {
        name: d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }),
        verses: daySessions.reduce((sum, s) => sum + sessionVerses(s), 0),
      };
    });
  }, [allSessions, lang]);

  const monthData = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (3 - i) * 7 - 6);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7);
      const weekAttendance = allAttendance.filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd;
      });
      const pct = weekAttendance.length > 0
        ? Math.round(weekAttendance.filter(a => a.status === 'present' || a.status === 'late').length / weekAttendance.length * 100)
        : 0;
      return {
        name: lang === 'ar' ? `أسبوع ${i + 1}` : `Week ${i + 1}`,
        pct,
      };
    });
  }, [allAttendance, lang]);
  const isDark = resolvedTheme === 'dark';

  const chartColors = {
    grid: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#94A3B8' : '#64748B',
    tooltip: isDark ? '#1E293B' : '#FFFFFF',
    tooltipBorder: isDark ? '#334155' : '#E2E8F0',
  };

  const topStudents = [...myStudents]
    .sort((a, b) => b.totalAyahMemorized - a.totalAyahMemorized)
    .slice(0, 5);

  const revisionSessions = myStudentSessions.filter(s => s.type === 'muraja3ah' || s.type === 'revision');
  const pendingRevisions = revisionSessions.filter(r => r.status === 'pending').length;
  const missedRevisions = revisionSessions.filter(r => r.status === 'missed').length;

  // Low-attendance alert: active students with recorded attendance below 75%.
  const recordedIds = new Set((dbData?.attendance || []).map(a => a.studentId || a.student_id));
  const lowAttendance = activeStudents
    .filter(s => recordedIds.has(s.id) && (s.attendancePct ?? 0) < 75)
    .sort((a, b) => (a.attendancePct ?? 0) - (b.attendancePct ?? 0))
    .slice(0, 6);

  const greet = () => {
    return lang === 'ar' ? 'السلام عليكم' : 'Peace be upon you';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: chartColors.tooltip, border: `1px solid ${chartColors.tooltipBorder}`,
        borderRadius: 10, padding: '0.5rem 0.875rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        fontSize: '0.8rem', color: 'var(--text-primary)',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-body">
      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-display" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            {greet()}، {currentUser?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-secondary text-small">{t('todaySummary')}</p>
        </div>
        {/* Per-circle attendance stats (Fajr / other times / all) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
            {lang === 'ar' ? 'إحصاءات الحلقة:' : 'Circle stats:'}
          </span>
          <select
            className="select"
            value={selectedHalaqa}
            onChange={e => setSelectedHalaqa(e.target.value)}
            style={{ width: 'auto', minWidth: 150 }}
          >
            <option value="all">{lang === 'ar' ? 'كل الحلقات' : 'All circles'}</option>
            {myHalaqat.map(h => (
              <option key={h.id} value={h.id}>{lang === 'ar' ? h.name : (h.nameEn || h.name)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi" style={{ marginBottom: '1.5rem' }}>
        <KpiCard
          icon={Users} label={t('totalStudents')}
          value={myStudents.length} iconClass="emerald"
          change={`${activeStudents.length} ${t('active')}`} changeType="up"
        />
        <KpiCard
          icon={CalendarCheck} label={t('presentToday')}
          value={presentCount} iconClass="blue"
          change={`${attRate}%`} changeType={attRate >= 80 ? 'up' : 'down'}
        />
        <KpiCard
          icon={AlertCircle} label={t('absentToday')}
          value={absentCount} iconClass="error"
          change={absentCount > 0 ? `${absentCount} ${t('absent')}` : null}
          changeType="down"
        />
        <KpiCard
          icon={BookOpen} label={t('newMemorized')}
          value={todayVerses} iconClass="gold"
          change={`+${todaySessions.length} ${lang === 'ar' ? 'جلسة' : 'sessions'}`} changeType="up"
        />
      </div>

      {/* Main content row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Weekly Progress Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="text-subtitle font-semibold">{t('progressThisWeek')}</div>
              <div className="text-xs text-muted">{lang === 'ar' ? 'الآيات المحفوظة يوميًا' : 'Daily verses memorized'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="verses" name={lang === 'ar' ? 'آيات' : 'Verses'}
                fill="#0F766E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Rate Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="text-subtitle font-semibold">{t('attendanceRate')}</div>
              <div className="text-xs text-muted">{lang === 'ar' ? 'نسبة الحضور الشهرية' : 'Monthly attendance rate'}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pct" name={lang === 'ar' ? 'حضور %' : 'Present %'}
                stroke="#0F766E" strokeWidth={2.5} dot={{ fill: '#0F766E', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-3">
        {/* Top Students */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="text-subtitle font-semibold">{t('topStudents')}</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('students')}>
              {t('all')} →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {topStudents.map((student, idx) => {
              const pct = Math.round((student.totalAyahMemorized / 6236) * 100);
              const medals = ['#1', '#2', '#3', '#4', '#5'];
              return (
                <div key={student.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.625rem 0.75rem', borderRadius: 10,
                  background: idx === 0 ? 'linear-gradient(135deg, rgba(15,118,110,0.08), rgba(212,175,55,0.06))' : 'var(--bg-hover)',
                  border: idx === 0 ? '1px solid rgba(15,118,110,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 24 }}>{medals[idx]}</span>
                  <div className="avatar avatar-sm">{student.fullName[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-small font-semibold truncate">{student.fullName}</div>
                    <div className="text-xs text-muted">
                      {getSurahName(student.currentSurah, lang)} · {student.totalAyahMemorized} {lang === 'ar' ? 'آية' : 'verses'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 60 }}>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions + Revision Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Low attendance alert */}
          {lowAttendance.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
              border: '1px solid #FECACA', borderRadius: 12, padding: '1rem',
            }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                <AlertCircle size={16} style={{ color: '#DC2626' }} />
                <span className="text-small font-semibold" style={{ color: '#991B1B' }}>
                  {lang === 'ar' ? 'حضور منخفض' : 'Low Attendance'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {lowAttendance.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#7F1D1D' }}>
                    <span className="truncate" style={{ maxWidth: 140 }}>{s.fullName}</span>
                    <span style={{ fontWeight: 700 }}>{s.attendancePct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revision Alert */}
          {(pendingRevisions > 0 || missedRevisions > 0) && (
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
              border: '1px solid #FDE68A',
              borderRadius: 12, padding: '1rem',
            }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                <RefreshCw size={16} style={{ color: '#D97706' }} />
                <span className="text-small font-semibold" style={{ color: '#92400E' }}>
                  {t('pendingRevisions')}
                </span>
              </div>
              {pendingRevisions > 0 && (
                <div className="text-xs" style={{ color: '#78350F' }}>
                  • {pendingRevisions} {lang === 'ar' ? 'مراجعة معلقة' : 'pending revisions'}
                </div>
              )}
              {missedRevisions > 0 && (
                <div className="text-xs" style={{ color: '#991B1B', marginTop: 2 }}>
                  • {missedRevisions} {lang === 'ar' ? 'مراجعة فائتة' : 'missed revisions'}
                </div>
              )}
              <button
                className="btn btn-sm"
                onClick={() => setActivePage('muraja3ah')}
                style={{
                  marginTop: '0.75rem', background: '#D97706', color: 'white',
                  width: '100%', justifyContent: 'center', fontSize: '0.75rem',
                }}
              >
                {lang === 'ar' ? 'عرض المراجعات' : 'View Revisions'}
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card card-sm">
            <div className="text-small font-semibold" style={{ marginBottom: '0.75rem' }}>
              {t('quickActions')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[
                { label: t('markAttendance'), page: 'attendance', icon: CheckCircle2 },
                { label: t('recordSession'), page: 'quranProgress', icon: BookOpen },
                { label: t('students'), page: 'students', icon: Users },
                { label: t('reports'), page: 'reports', icon: FileText },
              ].map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.page}
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivePage(action.page)}
                    style={{ justifyContent: 'flex-start', gap: '0.625rem' }}
                  >
                    <Icon size={16} className="text-muted" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
