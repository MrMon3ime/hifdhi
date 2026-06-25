import { createClient } from '@supabase/supabase-js';
import { mockUsers, mockHalaqat, mockStudents, mockAttendance, mockSessions } from './src/data/mockData.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Please update your Supabase URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map string IDs to UUIDs so relationships are maintained
const idMap = {};
function getUuid(oldId) {
  if (!oldId) return null;
  if (!idMap[oldId]) idMap[oldId] = crypto.randomUUID();
  return idMap[oldId];
}

async function seed() {
  console.log('🌱 Starting database seed with UUID mapping...');

  try {
    console.log('Inserting Users...');
    const { error: errU } = await supabase.from('users').upsert(mockUsers.map(u => ({
      id: getUuid(u.id),
      full_name: u.fullName,
      role: u.role,
      email: u.email,
      password: u.password
    })));
    if (errU) throw errU;

    console.log('Inserting Halaqat...');
    const { error: errH } = await supabase.from('halaqat').upsert(mockHalaqat.map(h => ({
      id: getUuid(h.id),
      sheikh_id: getUuid(h.sheikhId),
      name: h.name,
      name_en: h.nameEn,
      location: h.location,
      is_active: h.isActive
    })));
    if (errH) throw errH;

    console.log('Inserting Students...');
    const { error: errS } = await supabase.from('students').upsert(mockStudents.map(s => ({
      id: getUuid(s.id),
      halaqa_id: getUuid(s.halaqaId),
      sheikh_id: getUuid(s.sheikhId),
      full_name: s.fullName,
      full_name_en: s.fullNameEn,
      total_ayah_memorized: s.totalAyahMemorized,
      current_surah: s.currentSurah,
      current_ayah: s.currentAyah,
      status: s.status
    })));
    if (errS) throw errS;

    console.log('Inserting Attendance...');
    const { error: errA } = await supabase.from('attendance').upsert(mockAttendance.map(a => ({
      id: getUuid(a.id),
      student_id: getUuid(a.studentId),
      halaqa_id: getUuid(a.halaqaId),
      date: a.date,
      status: a.status
    })));
    if (errA) throw errA;

    console.log('Inserting Sessions...');
    const { error: errSes } = await supabase.from('sessions').upsert(mockSessions.map(s => ({
      id: getUuid(s.id),
      student_id: getUuid(s.studentId),
      sheikh_id: getUuid(s.sheikhId),
      date: s.date,
      type: s.type,
      from_surah: s.fromSurah,
      from_ayah: s.fromAyah,
      to_surah: s.toSurah,
      to_ayah: s.toAyah,
      rating: s.qualityRating || 5,
      notes: s.notes || ''
    })));
    if (errSes) throw errSes;

    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message || err);
  }
}

seed();
