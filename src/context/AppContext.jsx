import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../i18n/translations.js';
import { mockUsers } from '../data/mockData.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // --- Language ---
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('hifz_lang');
    if (saved) return saved;
    const deviceLang = navigator.language || 'ar';
    return deviceLang.startsWith('ar') ? 'ar' : 'en';
  });

  // --- Theme ---
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('hifz_theme') || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    const html = document.querySelector('html');

    let theme = themeMode;
    if (themeMode === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setResolvedTheme(theme);
    root.setAttribute('data-theme', theme);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('hifz_theme', themeMode);
    localStorage.setItem('hifz_lang', lang);
  }, [themeMode, lang]);

  // Listen for system theme changes
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

  // --- Auth ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hifz_user');
    return saved ? JSON.parse(saved) : null;
  });

  const signIn = useCallback((email, password) => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('invalid_credentials');
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    localStorage.setItem('hifz_user', JSON.stringify(safeUser));
    return safeUser;
  }, []);

  const signInDemo = useCallback((role) => {
    const user = mockUsers.find(u => u.role === role);
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    localStorage.setItem('hifz_user', JSON.stringify(safeUser));
    return safeUser;
  }, []);

  const signOut = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('hifz_user');
  }, []);

  // --- Toast ---
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // --- Active nav item ---
  const [activePage, setActivePage] = useState('dashboard');

  // --- Translation helper ---
  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['ar'][key] || key;
  }, [lang]);

  const isRTL = lang === 'ar';

  const value = {
    lang, setLang,
    themeMode, setThemeMode,
    resolvedTheme,
    currentUser, signIn, signInDemo, signOut,
    toasts, showToast,
    activePage, setActivePage,
    t, isRTL,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
