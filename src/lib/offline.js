// Offline-first support: cache the last-loaded data, queue writes made while
// offline, and replay them to Supabase when the connection returns.

const CACHE_KEY = 'hifz_data_cache';
const QUEUE_KEY = 'hifz_sync_queue';

export const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

// ── Data cache (for offline reads) ──────────────────────────────────────────
export const saveCache = (data) => {
  try {
    const { isLoading, ...rest } = data || {};
    localStorage.setItem(CACHE_KEY, JSON.stringify(rest));
  } catch { /* quota */ }
};
export const loadCache = () => {
  try { const r = localStorage.getItem(CACHE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};

// ── Write queue (for offline writes) ────────────────────────────────────────
export const loadQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
};
const saveQueue = (q) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* quota */ }
};
export const queueCount = () => loadQueue().length;
export const enqueue = (op) => {
  const q = loadQueue();
  q.push({ ...op, ts: Date.now() });
  saveQueue(q);
  return q.length;
};

// Replay all queued operations against Supabase, preserving order. Ops that
// still fail are kept for the next attempt.
export async function flushQueue(supabase) {
  const q = loadQueue();
  if (!q.length) return { flushed: 0, remaining: 0 };
  const remaining = [];
  let flushed = 0;
  for (const op of q) {
    try {
      if (op.kind === 'insert') {
        const { error } = await supabase.from(op.table).insert(op.payload);
        if (error) throw error;
      } else if (op.kind === 'update') {
        const { error } = await supabase.from(op.table).update(op.payload).eq(op.matchCol, op.matchVal);
        if (error) throw error;
      } else if (op.kind === 'delete') {
        const { error } = await supabase.from(op.table).delete().eq(op.matchCol, op.matchVal);
        if (error) throw error;
      } else if (op.kind === 'studentDelete') {
        try { await supabase.from('attendance').delete().eq('student_id', op.id); } catch { /* ignore */ }
        try { await supabase.from('sessions').delete().eq('student_id', op.id); } catch { /* ignore */ }
        const { error } = await supabase.from('students').delete().eq('id', op.id);
        if (error) throw error;
      } else if (op.kind === 'halaqaDelete') {
        try { await supabase.from('students').update({ halaqa_id: null }).eq('halaqa_id', op.id); } catch { /* ignore */ }
        const { error } = await supabase.from('halaqat').delete().eq('id', op.id);
        if (error) throw error;
      } else if (op.kind === 'attendanceSave') {
        let del = supabase.from('attendance').delete().in('student_id', op.studentIds).eq('date', op.date);
        del = op.halaqaId ? del.eq('halaqa_id', op.halaqaId) : del.is('halaqa_id', null);
        try { await del; } catch { /* ignore */ }
        const { error } = await supabase.from('attendance').insert(op.payload);
        if (error) throw error;
      }
      flushed++;
    } catch {
      remaining.push(op); // keep for the next sync
    }
  }
  saveQueue(remaining);
  return { flushed, remaining: remaining.length };
}
