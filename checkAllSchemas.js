import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['users', 'students', 'halaqat', 'attendance', 'sessions'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) console.log(`❌ ${t}:`, error.message);
    else {
      const cols = data?.length > 0 ? Object.keys(data[0]) : 'No rows (table exists)';
      console.log(`✅ ${t}:`, cols);
    }
  }

  // Test insert then delete
  console.log('\n--- Testing student INSERT ---');
  const { data: ins, error: insErr } = await supabase.from('students').insert([{
    full_name: 'TEST_STUDENT',
    status: 'active'
  }]).select().single();
  if (insErr) console.log('❌ Insert error:', insErr.message, insErr.details, insErr.hint);
  else {
    console.log('✅ Insert worked! Row:', ins);
    // cleanup
    await supabase.from('students').delete().eq('id', ins.id);
    console.log('✅ Cleanup done');
  }
}
check();
