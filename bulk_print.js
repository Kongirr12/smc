const fs = require('fs');
let code = fs.readFileSync('code.gs', 'utf8');

const newFunctions = `
/* ============================================================
 *  PRINT HTML — ตารางสอนพิมพ์ทั้งหมด (Batch Print)
 * ============================================================ */
function generateAllSchedulesPrintHTML(type, ids, academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    
    if (!ids || ids.length === 0) return { status: 'error', message: 'ไม่มีข้อมูลให้พิมพ์' };
    
    let combinedBody = '';
    
    for (let i = 0; i < ids.length; i++) {
      let res;
      if (type === 'class') {
        res = generateSchedulePrintHTML(ids[i], academicYear, semester, sessionToken);
      } else {
        res = generateTeacherScheduleHTML(ids[i], academicYear, semester, sessionToken);
      }
      
      if (res && res.status === 'success') {
        // Extract inner body content
        let html = res.html;
        const bodyStart = html.indexOf('<body>') + 6;
        const bodyEnd = html.lastIndexOf('</body>');
        if (bodyStart > 5 && bodyEnd > -1) {
          let bodyContent = html.substring(bodyStart, bodyEnd);
          // Remove the "no-print" button from each individual page
          bodyContent = bodyContent.replace(/<button class="no-print"[^>]*>.*?<\\/button>/g, '');
          
          if (i > 0) {
            combinedBody += '\\n<div style="page-break-before: always;"></div>\\n';
          }
          combinedBody += bodyContent;
        }
      }
    }
    
    if (!combinedBody) {
      return { status: 'error', message: 'ไม่สามารถสร้างข้อมูลพิมพ์ได้' };
    }
    
    // Add the print button at the very top of the combined HTML
    const finalHtml = \`<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8">
<title>พิมพ์ตารางสอนทั้งหมด</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 1cm; }
  body {
    font-family: 'Sarabun', sans-serif;
    font-size: 12px; color: #0F172A; margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header {
    text-align: center; margin-bottom: 20px;
  }
  table {
    width: 100%; border-collapse: collapse;
    border: 2px solid #000;
    table-layout: fixed;
  }
  th, td {
    border: 1px solid #000;
    vertical-align: top;
  }
  th {
    background: #FFF !important; color: #000 !important; text-align: center;
    padding: 10px 8px; font-size: 13px; font-weight: 700; border-bottom: 2px solid #000;
  }
  td { vertical-align: middle; min-height: 60px; }
  .signature-row {
    display: flex; justify-content: space-around;
    margin-top: 30px; text-align: center; font-size: 11px;
  }
  .sig-line { border-bottom: 1px dotted #000; width: 180px; margin: 0 auto 4px; padding-bottom: 24px; }
  .sig-row {
    display: flex; justify-content: space-around;
    margin-top: 30px; text-align: center; font-size: 11px;
  }
  .workload {
    text-align: right; margin-bottom: 6px; font-size: 11px; color: #475569;
  }
  @media print {
    .no-print { display: none; }
    body { font-size: 11px; }
  }
  .no-print {
    position: fixed; top: 10px; right: 10px;
    background: #800020; color: white; padding: 8px 16px;
    border-radius: 8px; cursor: pointer; border: none;
    font-family: inherit; font-weight: 700; font-size: 13px;
    z-index: 100;
  }
</style></head><body>
<button class="no-print" onclick="window.print()">🖨 พิมพ์ทั้งหมด</button>
\${combinedBody}
</body></html>\`;
    
    return { status: 'success', html: finalHtml };
  } catch (e) {
    logError({ fn:'generateAllSchedulesPrintHTML', error:e.message });
    return { status:'error', message:e.message };
  }
}
`;

if (code.indexOf('function generateAllSchedulesPrintHTML') === -1) {
  code += '\\n' + newFunctions;
  fs.writeFileSync('code.gs', code, 'utf8');
  console.log('Added generateAllSchedulesPrintHTML');
} else {
  console.log('generateAllSchedulesPrintHTML already exists');
}
