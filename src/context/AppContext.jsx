import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import translations from '../i18n/translations.js';
import { mockUsers, mockStudents, mockHalaqat, mockAttendance, mockSessions, mockRevisions, mockMatnProgress } from '../data/mockData.js';
import { getCompletedJuz, getMemorizedIntervals, intervalsCount, furthestMemorized, fromGlobalAyah, getCompletedJuzFromIntervals } from '../data/quranData.js';
import { supabase } from '../lib/supabase.js';
import { isOnline, saveCache, loadCache, queueCount, enqueue, flushQueue } from '../lib/offline.js';

const AppContext = createContext(null);

const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2));

// ── camelCase ↔ snake_case helpers ─────────────────────────────────────────
const toCamel = (obj) => {
  if (!obj) return {};
  const out = {};
  for (const key in obj) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = obj[key];
  }
  return out;
};

const transformList = (rows) => (rows || []).map(toCamel);

// ── safeStudent defaults ────────────────────────────────────────────────────
// Note: the `students` table has no `juz_completed` column, so completed juz is
// always derived on the client from the current memorization position.
export const safeStudent = (s) => {
  const st = s || {};
  const currentSurah = st.currentSurah ?? 1;
  const currentAyah = st.currentAyah ?? 1;
  return {
    ...st,
    fullName: String(st.fullName || 'بدون اسم'),
    fullNameEn: String(st.fullNameEn || ''),
    juzCompleted: getCompletedJuz(currentSurah, currentAyah),
    attendancePct: st.attendancePct ?? 0,
    totalAyahMemorized: st.totalAyahMemorized ?? 0,
    currentSurah,
    currentAyah,
    gender: st.gender || 'male',
    status: st.status || 'active',
    halaqaId: st.halaqaId || '',
  };
};

// Compute a student's attendance percentage from the attendance rows.
const computeAttendancePct = (studentId, attRows) => {
  const rows = (attRows || []).filter(a => (a.studentId || a.student_id) === studentId);
  if (!rows.length) return 0;
  const present = rows.filter(a => a.status === 'present' || a.status === 'late').length;
  return Math.round((present / rows.length) * 100);
};

export function AppProvider({ children }) {
  // ── Core data state (seeded from the offline cache when available) ───────
  const [dbData, setDbData] = useState(() => {
    const cached = loadCache();
    if (cached && cached.students) return { ...cached, isLoading: !isOnline() ? false : true };
    return {
      users: mockUsers, students: mockStudents, halaqat: mockHalaqat,
      attendance: mockAttendance, sessions: mockSessions,
      revisions: mockRevisions, matnProgress: mockMatnProgress, isLoading: true,
    };
  });

  // ── Online / sync state ──────────────────────────────────────────────────
  const [online, setOnline] = useState(isOnline());
  const [pendingSync, setPendingSync] = useState(queueCount());
  const refreshPending = () => setPendingSync(queueCount());

  const channelRef = useRef(null);

  // ── Fetch ALL data from Supabase ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [
        { data: users,      error: e1 },
        { data: students,   error: e2 },
        { data: halaqat,    error: e3 },
        { data: attendance, error: e4 },
        { data: sessions,   error: e5 },
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('students').select('*'),
        supabase.from('halaqat').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('sessions').select('*'),
      ]);

      // If any critical table fails, fall back to mock
      if (e1 || e2 || e3) {
        console.warn('Supabase error — using mock data', e1 || e2 || e3);
        setDbData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const attList = attendance ? transformList(attendance) : [];
      const sessionList = sessions ? transformList(sessions) : [];

      const next = {
        users:       users ? transformList(users) : mockUsers,
        students:    students
          ? transformList(students).map(safeStudent).map(st => {
              // Progress is derived from the union of memorized ("new") sessions,
              // so non-linear memorization (any range, any order) is tracked correctly.
              const intervals = getMemorizedIntervals(sessionList, st.id);
              const total = intervalsCount(intervals);
              const fm = furthestMemorized(intervals);
              const pos = fm ? fromGlobalAyah(fm) : { surah: 1, ayah: 1 };
              return {
                ...st,
                attendancePct: computeAttendancePct(st.id, attList),
                memorizedIntervals: intervals,
                juzCompleted: getCompletedJuzFromIntervals(intervals),
                totalAyahMemorized: total,
                currentSurah: pos.surah,
                currentAyah: pos.ayah,
              };
            })
          : mockStudents,
        halaqat:     halaqat ? transformList(halaqat) : mockHalaqat,
        attendance:  attendance ? attList : mockAttendance,
        sessions:    sessions ? sessionList : mockSessions,
        revisions:   mockRevisions,
        matnProgress: mockMatnProgress,
        isLoading: false,
      };
      setDbData(next);
      saveCache(next);   // keep a copy for offline use
    } catch (err) {
      console.error('Supabase fetchData failed (using cached/offline data):', err);
      setDbData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // ── Sync the offline write queue, then refresh ───────────────────────────
  const syncNow = useCallback(async () => {
    if (!isOnline()) return { flushed: 0, remaining: queueCount() };
    const res = await flushQueue(supabase);
    refreshPending();
    if (res.flushed > 0) await fetchData();
    return res;
  }, [fetchData]);

  // ── Initial load + real-time subscription ────────────────────────────────
  useEffect(() => {
    const hasSupabase =
      import.meta.env.VITE_SUPABASE_URL &&
      !import.meta.env.VITE_SUPABASE_URL.includes('your-project');

    if (!hasSupabase) {
      setDbData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    fetchData();

    // Subscribe to ALL table changes → re-fetch everything so every page updates
    const channel = supabase
      .channel('app-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' },   fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'halaqat' },    fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' },   fetchData)
      .subscribe();

    channelRef.current = channel;

    // Fallback polling every 30 seconds (in case realtime is not enabled on the Supabase project)
    const pollInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  // ── CRUD helpers (all mutations go through here so the whole app updates) ─
  // students table exact columns: id, halaqa_id, sheikh_id, full_name, full_name_en,
  //                               total_ayah_memorized, current_surah, current_ayah, status
  const buildStudentPayload = (data, halaqat, currentUser) => {
    const halaqa = (halaqat || []).find(h => h.id === data.halaqaId);
    return {
      full_name:             String(data.fullName || ''),
      full_name_en:          String(data.fullNameEn || data.fullName || ''), // NOT NULL
      halaqa_id:             data.halaqaId || null,
      status:                data.status || 'active',
      sheikh_id:             halaqa?.sheikhId || currentUser?.id || null,
      current_surah:         Number(data.currentSurah)        || 1,
      current_ayah:          Number(data.currentAyah)         || 1,
      total_ayah_memorized:  Number(data.totalAyahMemorized)  || 0,
    };
  };

  const addStudentFn = useCallback(async (data, currentUser) => {
    const payload = buildStudentPayload(data, dbData.halaqat, currentUser);
    if (isOnline()) {
      const { error } = await supabase.from('students').insert([payload]);
      if (error) throw error;
      await fetchData();
    } else {
      const id = newId();
      enqueue({ kind: 'insert', table: 'students', payload: { id, ...payload } });
      refreshPending();
      setDbData(prev => {
        const st = { ...safeStudent(toCamel({ id, ...payload })), memorizedIntervals: [], attendancePct: 0 };
        const next = { ...prev, students: [...prev.students, st] };
        saveCache(next); return next;
      });
    }
  }, [dbData.halaqat, fetchData]);

  const updateStudentFn = useCallback(async (id, data, currentUser) => {
    const payload = buildStudentPayload(data, dbData.halaqat, currentUser);
    if (isOnline()) {
      const { error } = await supabase.from('students').update(payload).eq('id', id);
      if (error) throw error;
      await fetchData();
    } else {
      enqueue({ kind: 'update', table: 'students', payload, matchCol: 'id', matchVal: id });
      refreshPending();
      setDbData(prev => {
        const next = { ...prev, students: prev.students.map(s => s.id === id ? { ...s, ...toCamel(payload) } : s) };
        saveCache(next); return next;
      });
    }
  }, [dbData.halaqat, fetchData]);

  const deleteStudentFn = useCallback(async (id) => {
    if (!isOnline()) {
      enqueue({ kind: 'studentDelete', id });
      refreshPending();
      setDbData(prev => {
        const next = { ...prev, students: prev.students.filter(s => s.id !== id) };
        saveCache(next); return next;
      });
      return;
    }
    console.log('🗑️ Attempting to delete student:', id);

    // Step 1: Clean up child tables (ignore errors if table doesn't exist or RLS blocks)
    const tables = [
      { name: 'attendance', col: 'student_id' },
      { name: 'sessions',   col: 'student_id' },
    ];

    for (const { name, col } of tables) {
      const { error } = await supabase.from(name).delete().eq(col, id);
      if (error) {
        console.warn(`⚠️ Could not delete from ${name}:`, error.message, error.code);
        // Only throw on real errors (not missing table 42P01 or RLS 42501)
        if (error.code !== '42P01' && error.code !== '42501' && error.code !== 'PGRST116') {
          throw new Error(`${name}: ${error.message}`);
        }
      } else {
        console.log(`✅ Cleared ${name} for student ${id}`);
      }
    }

    // Try optional tables silently (these may not exist — ignore any error).
    // Note: Supabase query builders are thenable but have no `.catch()`, so we
    // await them and swallow the returned error instead.
    try { await supabase.from('matn_progress').delete().eq('student_id', id); } catch { /* ignore */ }
    try { await supabase.from('revisions').delete().eq('student_id', id); } catch { /* ignore */ }

    // Step 2: Delete the student record
    console.log('🗑️ Deleting student row...');
    const { error: studentError } = await supabase.from('students').delete().eq('id', id);
    
    if (studentError) {
      console.error('❌ Failed to delete student:', studentError);
      throw new Error(studentError.message);
    }

    console.log('✅ Student deleted successfully');

    // Optimistic local update, then re-sync from the server
    setDbData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
    }));
    await fetchData();
  }, [fetchData]);

  // halaqat table columns: id, sheikh_id, name, name_en, location, is_active.
  // (start_time / end_time / schedule are not persisted — no such columns.)
  const buildHalaqaPayload = (data, currentUser) => {
    return {
      name: String(data.name || ''),
      name_en: String(data.nameEn || data.name || ''),
      sheikh_id: data.sheikhId || currentUser?.id || null,
      location: data.location || '',
      is_active: data.isActive ?? true,
    };
  };

  const addHalaqaFn = useCallback(async (data, currentUser) => {
    const payload = buildHalaqaPayload(data, currentUser);
    if (isOnline()) {
      const { data: row, error } = await supabase.from('halaqat').insert([payload]).select('id').single();
      if (error) throw error;
      await fetchData();
      return row?.id;
    }
    const id = newId();
    enqueue({ kind: 'insert', table: 'halaqat', payload: { id, ...payload } });
    refreshPending();
    setDbData(prev => {
      const next = { ...prev, halaqat: [...prev.halaqat, toCamel({ id, ...payload })] };
      saveCache(next); return next;
    });
    return id;
  }, [fetchData]);

  const updateHalaqaFn = useCallback(async (id, data, currentUser) => {
    const payload = buildHalaqaPayload(data, currentUser);
    if (isOnline()) {
      const { error } = await supabase.from('halaqat').update(payload).eq('id', id);
      if (error) throw error;
      await fetchData();
    } else {
      enqueue({ kind: 'update', table: 'halaqat', payload, matchCol: 'id', matchVal: id });
      refreshPending();
      setDbData(prev => {
        const next = { ...prev, halaqat: prev.halaqat.map(h => h.id === id ? { ...h, ...toCamel(payload) } : h) };
        saveCache(next); return next;
      });
    }
  }, [fetchData]);

  const deleteHalaqaFn = useCallback(async (id) => {
    if (!isOnline()) {
      enqueue({ kind: 'halaqaDelete', id });
      refreshPending();
      setDbData(prev => {
        const next = {
          ...prev,
          halaqat: prev.halaqat.filter(h => h.id !== id),
          students: prev.students.map(s => s.halaqaId === id ? { ...s, halaqaId: '' } : s),
        };
        saveCache(next); return next;
      });
      return;
    }
    await supabase.from('students').update({ halaqa_id: null }).eq('halaqa_id', id);
    const { error } = await supabase.from('halaqat').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  // ── Attendance (offline-aware: queue + optimistic update) ─────────────────
  const queueAttendanceLocally = (date, halaqaId, studentIds, payload) => {
    enqueue({ kind: 'attendanceSave', date, halaqaId: halaqaId || null, studentIds, payload });
    refreshPending();
    setDbData(prev => {
      const keep = prev.attendance.filter(a => {
        const sid = a.studentId || a.student_id;
        const sameDay = a.date === date;
        const sameH = (a.halaqaId || a.halaqa_id || '') === (halaqaId || '');
        return !(studentIds.includes(sid) && sameDay && sameH);
      });
      const nextAtt = [...keep, ...payload];
      const students = prev.students.map(s => ({ ...s, attendancePct: computeAttendancePct(s.id, nextAtt) }));
      const next = { ...prev, attendance: nextAtt, students };
      saveCache(next); return next;
    });
  };

  const saveAttendanceFn = useCallback(async ({ date, halaqaId, studentIds, payload }) => {
    if (!isOnline()) { queueAttendanceLocally(date, halaqaId, studentIds, payload); return; }
    try {
      let del = supabase.from('attendance').delete().in('student_id', studentIds).eq('date', date);
      del = halaqaId ? del.eq('halaqa_id', halaqaId) : del.is('halaqa_id', null);
      const { error: delErr } = await del;
      if (delErr) throw delErr;
      const { error } = await supabase.from('attendance').insert(payload);
      if (error) throw error;
      await fetchData();
    } catch (e) {
      // Network failure even though the browser thinks it's online → queue it.
      if (/fetch|network|failed|timeout/i.test(e?.message || '')) { queueAttendanceLocally(date, halaqaId, studentIds, payload); return; }
      throw e;
    }
  }, [fetchData]);

  // ── Language ─────────────────────────────────────────────────────────────
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('hifz_lang');
    if (saved) return saved;
    return (navigator.language || 'ar').startsWith('ar') ? 'ar' : 'en';
  });

  // ── Theme ─────────────────────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('hifz_theme') || 'system'
  );
  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const html = document.documentElement;
    let theme = themeMode;
    if (themeMode === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setResolvedTheme(theme);
    html.setAttribute('data-theme', theme);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('hifz_theme', themeMode);
    localStorage.setItem('hifz_lang', lang);
  }, [themeMode, lang]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      const t = e.matches ? 'dark' : 'light';
      setResolvedTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hifz_user');
    return saved ? JSON.parse(saved) : null;
  });

  const signIn = useCallback((email, password) => {
    const user = dbData.users.find(
      u => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password
    );
    if (!user) throw new Error('invalid_credentials');
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    localStorage.setItem('hifz_user', JSON.stringify(safeUser));
    return safeUser;
  }, [dbData.users]);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('hifz_user');
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Auto-sync when the connection returns ─────────────────────────────────
  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      const res = await syncNow();
      if (res && res.flushed > 0) {
        showToast(lang === 'ar' ? `تمت مزامنة ${res.flushed} تغيير` : `Synced ${res.flushed} change(s)`);
      }
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (isOnline() && queueCount() > 0) goOnline(); // sync leftovers on load
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [syncNow, showToast, lang]);

  // ── Active page ───────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState('dashboard');

  // ── Translation helper ────────────────────────────────────────────────────
  const t = useCallback(
    (key) => translations[lang]?.[key] || translations['ar']?.[key] || key,
    [lang]
  );

  const isRTL = lang === 'ar';

  const value = {
    lang, setLang,
    themeMode, setThemeMode,
    resolvedTheme,
    currentUser, signIn, signOut,
    toasts, showToast,
    activePage, setActivePage,
    t, isRTL,
    dbData,
    // Centralized CRUD — use these everywhere, never call supabase directly from pages
    addStudentFn,
    updateStudentFn,
    deleteStudentFn,
    addHalaqaFn,
    updateHalaqaFn,
    deleteHalaqaFn,
    saveAttendanceFn,
    refreshData: fetchData,
    // Offline / sync
    online,
    pendingSync,
    syncNow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
