import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the mockData import completely
  content = content.replace(/import\s+\{\s*mock[A-Za-z0-9_,\s]+\}\s+from\s+['"]\.\.\/data\/mockData\.js['"];?\n?/, '');
  
  // Also handle cases where mockData import has generateWeeklyProgressData etc
  content = content.replace(/import\s+\{[^}]*mock[^}]*\}\s+from\s+['"]\.\.\/data\/mockData\.js['"];?\n?/, '');

  // Add the mock variables extraction from useApp
  // We look for: const { t, lang, ... } = useApp();
  // and inject dbData
  if (content.includes('useApp()')) {
    content = content.replace(/const\s+\{\s*(.*?)\s*\}\s*=\s*useApp\(\);/, (match, p1) => {
      if (!p1.includes('dbData')) {
        return `const { ${p1}, dbData } = useApp();`;
      }
      return match;
    });
  }

  // Replace mockStudents with dbData.students
  content = content.replace(/\bmockStudents\b/g, '(dbData?.students || [])');
  content = content.replace(/\bmockHalaqat\b/g, '(dbData?.halaqat || [])');
  content = content.replace(/\bmockAttendance\b/g, '(dbData?.attendance || [])');
  content = content.replace(/\bmockSessions\b/g, '(dbData?.sessions || [])');
  content = content.replace(/\bmockRevisions\b/g, '(dbData?.revisions || [])');
  content = content.replace(/\bmockMatnProgress\b/g, '(dbData?.matnProgress || [])');
  content = content.replace(/\bmockUsers\b/g, '(dbData?.users || [])');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', file);
}
