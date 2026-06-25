import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import translations from '../i18n/translations.js';
import { mockUsers, mockStudents, mockHalaqat, mockAttendance, mockSessions, mockRevisions, mockMatnProgress } from '../data/mockData.js';
import { getCompletedJuz } from '../data/quranData.js';
import { supabase } from '../lib/supabase.js';

const AppContext = createContext(null);

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
  // ── Core data state ─────────────────────────────────────────────────────
  const [dbData, setDbData] = useState({
    users: mockUsers,
    students: mockStudents,
    halaqat: mockHalaqat,
    attendance: mockAttendance,
    sessions: mockSessions,
    revisions: mockRevisions,
    matnProgress: mockMatnProgress,
    isLoading: true,
  });

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

      setDbData({
        users:       users ? transformList(users) : mockUsers,
        students:    students
          ? transformList(students).map(safeStudent).map(st => ({
              ...st,
              attendancePct: computeAttendancePct(st.id, attList),
            }))
          : mockStudents,
        halaqat:     halaqat ? transformList(halaqat) : mockHalaqat,
        attendance:  attendance ? attList : mockAttendance,
        sessions:    sessions ? transformList(sessions) : mockSessions,
        revisions:   mockRevisions,
        matnProgress: mockMatnProgress,
        isLoading: false,
      });
    } catch (err) {
      console.error('Supabase fetchData failed:', err);
      setDbData(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

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
    const { error } = await supabase.from('students').insert([payload]);
    if (error) throw error;
    await fetchData();
  }, [dbData.halaqat, fetchData]);

  const updateStudentFn = useCallback(async (id, data, currentUser) => {
    const payload = buildStudentPayload(data, dbData.halaqat, currentUser);
    const { error } = await supabase.from('students').update(payload).eq('id', id);
    if (error) throw error;
    await fetchData();
  }, [dbData.halaqat, fetchData]);

  const deleteStudentFn = useCallback(async (id) => {
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
    const { error } = await supabase.from('halaqat').insert([payload]);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const updateHalaqaFn = useCallback(async (id, data, currentUser) => {
    const payload = buildHalaqaPayload(data, currentUser);
    const { error } = await supabase.from('halaqat').update(payload).eq('id', id);
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const deleteHalaqaFn = useCallback(async (id) => {
    await supabase.from('students').update({ halaqa_id: null }).eq('halaqa_id', id);
    const { error } = await supabase.from('halaqat').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
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
    refreshData: fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
