import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { mockStudents, mockAttendance, mockSessions, mockRevisions, generateWeeklyProgressData, generateMonthlyAttendanceData } from '../data/mockData.js';
import { getSurahName, SURAHS } from '../data/quranData.js';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, CalendarCheck, BookOpen, RefreshCw, TrendingUp, Star, AlertCircle } from 'lucide-react';

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
  const { t, lang, currentUser, resolvedTheme, setActivePage } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const myStudents = isAdmin
    ? mockStudents
    : mockStudents.filter(s => s.sheikhId === currentUser?.id);

  const activeStudents = myStudents.filter(s => s.status === 'active');
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = mockAttendance.filter(a => a.date === today);
  const presentCount = todayAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentCount = activeStudents.length - presentCount;
  const todaySessions = mockSessions.filter(s => s.date === today);
  const todayVerses = todaySessions.reduce((sum, s) => sum + s.ayahCount, 0);
  const attRate = activeStudents.length > 0 ? Math.round((presentCount / activeStudents.length) * 100) : 0;

  const weekData = generateWeeklyProgressData(lang);
  const monthData = generateMonthlyAttendanceData(lang);
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

  const pendingRevisions = mockRevisions.filter(r => r.status === 'pending').length;
  const missedRevisions = mockRevisions.filter(r => r.status === 'missed').length;

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 17) return t('goodAfternoon');
    return t('goodEvening');
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-display" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          {greet()}، {currentUser?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-secondary text-small">{t('todaySummary')}</p>
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
              <XAxis dataKey="day" tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} />
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
              <XAxis dataKey="month" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="present" name={lang === 'ar' ? 'حضور %' : 'Present %'}
                stroke="#0F766E" strokeWidth={2.5} dot={{ fill: '#0F766E', r: 3 }} />
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
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div key={student.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.625rem 0.75rem', borderRadius: 10,
                  background: idx === 0 ? 'linear-gradient(135deg, rgba(15,118,110,0.08), rgba(212,175,55,0.06))' : 'var(--bg-hover)',
                  border: idx === 0 ? '1px solid rgba(15,118,110,0.2)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '1.1rem', minWidth: 24 }}>{medals[idx]}</span>
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
                { label: t('markAttendance'), page: 'attendance', emoji: '✅' },
                { label: t('recordSession'), page: 'quranProgress', emoji: '📖' },
                { label: t('students'), page: 'students', emoji: '👥' },
                { label: t('reports'), page: 'reports', emoji: '📄' },
              ].map(action => (
                <button
                  key={action.page}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActivePage(action.page)}
                  style={{ justifyContent: 'flex-start', gap: '0.625rem' }}
                >
                  <span>{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
