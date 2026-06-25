import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Print an HTML document (web → print dialog / Save as PDF) or save & share it
// as a file on native (so it can go to WhatsApp, etc.).
export async function printOrShareHtml(html, fileBase, lang = 'ar') {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(html)));
      const res = await Filesystem.writeFile({ path: `${fileBase}.html`, data: base64, directory: Directory.Cache });
      await Share.share({
        title: fileBase,
        url: res.uri,
        dialogTitle: lang === 'ar' ? 'مشاركة' : 'Share',
      });
    } catch { /* user cancelled or fs error */ }
  } else {
    const w = window.open('', '_blank');
    if (!w) return false;
    w.document.open();
    w.document.write(html + '<script>window.onload=function(){window.print();}<\/script>');
    w.document.close();
  }
  return true;
}

// Download a text/blob file (web) or save & share it (native).
export async function downloadOrShare(filename, content, mime, lang = 'ar') {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = btoa(unescape(encodeURIComponent(content)));
      const res = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: filename, url: res.uri, dialogTitle: lang === 'ar' ? 'مشاركة' : 'Share' });
    } catch { /* ignore */ }
  } else {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Shared document <style> for printable Arabic/English reports.
export const docStyles = (rtl) => `
  @page { size: A4; margin: 16mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
  body { font-family: "Tahoma","Segoe UI",sans-serif; color:#0F172A; direction:${rtl ? 'rtl' : 'ltr'}; padding: 8px; }
  h1 { color:#0F766E; text-align:center; margin:.2rem 0; }
  .sub { text-align:center; color:#64748B; font-size:.85rem; margin-bottom:1.2rem; }
  table { width:100%; border-collapse:collapse; margin:.6rem 0; }
  th,td { border:1px solid #E2E8F0; padding:.5rem .6rem; text-align:${rtl ? 'right' : 'left'}; font-size:.85rem; }
  th { background:#0F766E; color:#fff; }
  tr:nth-child(even) td { background:#F8FAFC; }
  .grid { display:flex; gap:.6rem; flex-wrap:wrap; margin:.6rem 0; }
  .stat { flex:1; min-width:120px; border:1px solid #E2E8F0; border-radius:10px; padding:.6rem; text-align:center; }
  .stat b { display:block; font-size:1.4rem; color:#0F766E; }
  .stat span { font-size:.72rem; color:#64748B; }
`;
