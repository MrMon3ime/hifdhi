// resetDB.js — Run with: node resetDB.js
// Clears ALL students, sessions, attendance and resets users to admin + 1 sheikh

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function resetDB() {
  console.log('🔄 Clearing database...\n');

  // 1. Delete all sessions
  const { error: e1 } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e1) console.error('sessions delete:', e1.message); else console.log('✅ sessions cleared');

  // 2. Delete all attendance
  const { error: e2 } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e2) console.error('attendance delete:', e2.message); else console.log('✅ attendance cleared');

  // 3. Delete all students
  const { error: e3 } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e3) console.error('students delete:', e3.message); else console.log('✅ students cleared');

  // 4. Delete all halaqat
  const { error: e4 } = await supabase.from('halaqat').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e4) console.error('halaqat delete:', e4.message); else console.log('✅ halaqat cleared');

  // 5. Delete all users
  const { error: e5 } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (e5) console.error('users delete:', e5.message); else console.log('✅ users cleared');

  console.log('\n📝 Inserting admin + 1 sheikh...');

  // 6. Insert admin
  const adminId = '11111111-1111-1111-1111-111111111111';
  const { data: admin, error: e6 } = await supabase.from('users').insert([{
    id: adminId,
    full_name: 'أرسلان المدير',
    role: 'admin',
    email: 'admin@hifdhi.com',
    password: 'ahmed2005',
  }]).select().single();
  if (e6) { console.error('admin insert:', e6.message); return; }
  console.log('✅ Admin created:', admin.id);

  // 7. Insert default sheikh
  const sheikId = '22222222-2222-2222-2222-222222222222';
  const { data: sheikh, error: e7 } = await supabase.from('users').insert([{
    id: sheikId,
    full_name: 'الشيخ الأول',
    role: 'sheikh',
    email: 'sheikh@hifdhi.com',
    password: 'sheikh2024',
  }]).select().single();
  if (e7) { console.error('sheikh insert:', e7.message); return; }
  console.log('✅ Sheikh created:', sheikh.id);

  // 8. Insert a default halaqa for the sheikh
  const { error: e8 } = await supabase.from('halaqat').insert([{
    name: 'الحلقة الأولى',
    name_en: 'Circle One',
    sheikh_id: sheikh.id,
    location: 'المسجد',
    is_active: true,
  }]);
  if (e8) console.error('halaqat insert:', e8.message); else console.log('✅ Default halaqa created');

  console.log('\n🎉 Database reset complete!');
  console.log('   Admin: admin@hifdhi.com / ahmed2005');
  console.log('   Sheikh: sheikh@hifdhi.com / sheikh2024');
}

resetDB();
