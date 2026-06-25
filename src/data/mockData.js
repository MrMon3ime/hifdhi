// Mock data store — fallback defaults. Real data always comes from Supabase.
import { SURAHS } from './quranData.js';

// Minimal fallback users (match Supabase IDs)
export const mockUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'admin',
    fullName: 'أرسلان المدير',
    email: 'admin@hifdhi.com',
    password: 'ahmed2005',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'sheikh',
    fullName: 'الشيخ الأول',
    email: 'sheikh@hifdhi.com',
    password: 'sheikh2024',
  },
];

export const mockHalaqat    = [];
export const mockStudents   = [];
export const mockAttendance = [];
export const mockSessions   = [];
export const mockRevisions  = [];
export const mockMatnProgress = [];

// Chart helper stubs (kept to avoid broken imports in other files)
export const generateWeeklyProgressData = (lang = 'ar') => {
  const days = lang === 'ar'
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map(day => ({ day, verses: 0, attendance: 0 }));
};

export const generateMonthlyAttendanceData = (lang = 'ar') => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: lang === 'ar'
      ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][i]
      : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    present: 0,
    absent: 0,
  }));
};
