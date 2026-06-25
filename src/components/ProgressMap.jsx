import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { getDivisionMap, DIVISION_CONFIG } from '../data/quranData.js';
import { Map } from 'lucide-react';

const TYPES = [
  { key: 'juz',   ar: 'الأجزاء', en: 'Juz',   letterAr: 'ج', letterEn: 'J' },
  { key: 'hizb',  ar: 'الأحزاب', en: 'Hizb',  letterAr: 'ح', letterEn: 'H' },
  { key: 'thumn', ar: 'الأثمان', en: 'Thumn', letterAr: 'ث', letterEn: 'T' },
];

// Reusable Quran progress map with a Juz / Hizb / Thumn selector.
export default function ProgressMap({ student, title }) {
  const { lang } = useApp();
  const [type, setType] = useState('juz');

  const cfg = TYPES.find(c => c.key === type);
  const cells = getDivisionMap(type, student?.currentSurah ?? 1, student?.currentAyah ?? 1);
  const total = DIVISION_CONFIG[type].total;
  const completedCount = cells.filter(c => c.completed).length;
  const letter = lang === 'ar' ? cfg.letterAr : cfg.letterEn;

  // Denser grids for the finer divisions, with a scroll cap.
  const cols = type === 'thumn' ? 10 : type === 'hizb' ? 8 : 6;

  return (
    <div>
      {/* Header + selector */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '0.75rem', marginBottom: '0.875rem', flexWrap: 'wrap',
      }}>
        <div className="text-small font-semibold" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Map size={16} style={{ verticalAlign: 'text-bottom' }} />
          {title || (lang === 'ar' ? 'خريطة التقدم' : 'Progress Map')}
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 10, padding: '0.2rem', gap: '0.2rem' }}>
          {TYPES.map(opt => (
            <button
              key={opt.key}
              onClick={() => setType(opt.key)}
              className="btn btn-sm"
              style={{
                minWidth: 64, justifyContent: 'center',
                background: type === opt.key ? 'var(--bg-card)' : 'transparent',
                color: type === opt.key ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: type === opt.key ? 700 : 400,
                boxShadow: type === opt.key ? 'var(--shadow-card)' : 'none',
              }}
            >
              {lang === 'ar' ? opt.ar : opt.en}
            </button>
          ))}
        </div>
      </div>

      {/* Count summary */}
      <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>
        {lang === 'ar'
          ? `${completedCount} من ${total} ${cfg.ar} مكتملة`
          : `${completedCount} of ${total} ${cfg.en} completed`}
      </div>

      {/* Grid */}
      <div
        className="juz-map"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          maxHeight: type === 'juz' ? 'none' : 320,
          overflowY: type === 'juz' ? 'visible' : 'auto',
          gap: type === 'thumn' ? '0.25rem' : '0.4rem',
        }}
      >
        {cells.map(cell => (
          <div
            key={cell.n}
            className={`juz-cell ${cell.completed ? 'completed' : 'empty'}`}
            title={`${lang === 'ar' ? cfg.ar : cfg.en} ${cell.n}${type !== 'juz' ? ` · ${lang === 'ar' ? 'جزء' : 'Juz'} ${cell.juz}` : ''}${cell.completed ? ' ✓' : ''}`}
          >
            <span style={{ fontSize: type === 'thumn' ? '0.5rem' : '0.58rem', opacity: 0.85 }}>{letter}</span>
            <span style={{ fontSize: type === 'thumn' ? '0.62rem' : '0.75rem', fontWeight: 700 }}>{cell.n}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--emerald)' }} />
          <span className="text-xs text-muted">{lang === 'ar' ? 'مكتمل' : 'Completed'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-input)', border: '1px solid var(--border)' }} />
          <span className="text-xs text-muted">{lang === 'ar' ? 'لم يكتمل' : 'Incomplete'}</span>
        </div>
      </div>
    </div>
  );
}
