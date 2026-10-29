/* ============================================================
 *  Smart School Office — js3
 *  Part 3: Academic | Finance | Documents | Approvals | Registration
 * ============================================================ */


/* ============================================================
 *  Shared: เปิด HTML ที่ได้จาก backend / client (รองรับทั้ง iPhone/Android หน้าจอโฮม และคอมพิวเตอร์)
 * ============================================================ */
function getPrintEnv() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/i.test(ua);
  const isStandalone = window.navigator.standalone === true ||
    (window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    ));
  const isMobile = isIOS || isAndroid || (window.innerWidth <= 768);
  return { isIOS, isAndroid, isStandalone, isIOSStandalone: Boolean(isIOS && isStandalone), isMobile };
}

function getSafePrintTitle(title) {
  return (title || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '_').trim();
}

/**
 * แปลงเอกสาร HTML เป็นไฟล์ PDF ขนาด A4 คมชัดสูง รองรับภาษาไทย Sarabun และสไตล์ครบถ้วน
 * @param {string} html - โค้ด HTML ของเอกสาร
 * @param {string} title - ชื่อเอกสาร
 * @param {'download'|'share'|'blob'|'open'} action - สิ่งที่ต้องการทำกับไฟล์ PDF
 * @returns {Promise<Blob|boolean|null>}
 */
async function generatePdfFromHtml(html, title, action = 'download', opts = {}) {
  if (!html) return null;
  const isSilent = Boolean(opts && opts.silent);
  const safeTitle = getSafePrintTitle(title);
  const modal = document.getElementById('printDocModal');
  const isLandscape = (modal && modal.style.display !== 'none' && modal._currentOrientation)
    ? (modal._currentOrientation === 'landscape')
    : (html.includes('A4 landscape') || html.includes('แนวนอน') || html.includes('landscape') ||
       (title && (title.includes('ตารางเรียน') || title.includes('ตารางสอน') || title.includes('ปพ.5') || title.includes('ปพ.๕'))));

  if (!isSilent) showLoading('กำลังจัดเตรียมเอกสารสำหรับพิมพ์...');

  let renderHost = null;
  try {
    // 1. ตรวจสอบและเตรียม jsPDF / html2canvas
    let jsPdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPdfLib && typeof html2pdf !== 'undefined' && html2pdf.Worker) {
      try {
        const dummyWorker = new html2pdf.Worker();
        jsPdfLib = dummyWorker.prop.jsPDF;
      } catch (_) {}
    }
    if (!jsPdfLib) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'jspdf.umd.min.js?v=3.3.21';
        s.onload = () => {
          jsPdfLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
          resolve();
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'html2canvas.min.js?v=3.3.21';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    // 2. Parse HTML ต้นฉบับ และดึง styles
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const rawStyles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    // ลบ @media screen blocks ออกเพื่อใช้กฎ @media print สำหรับการแปลงเป็น PDF คมชัดสูง
    const cleanStyles = rawStyles
      .replace(/@media\s+screen\s*\{[\s\S]*?\}\s*\}/gi, '')
      .replace(/@media\s+screen\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, '');

    // ลบองค์ประกอบควบคุมที่ไม่ต้องการพิมพ์
    doc.querySelectorAll('.no-print, .no-print-bar, .no-print-toolbar, button, script').forEach(el => el.remove());

    // 3. แยกเอกสารออกเป็นหน้ารายบุคคล / รายห้องเรียน (Page-by-Page Isolation)
    const pageSelector = '.schedule-page, .grid-month-page, .print-page-wrapper, .pp6-container, .pp5-sheet, .calendar-container, .form-doc-wrapper';
    let pageNodes = Array.from(doc.querySelectorAll(pageSelector));

    if (pageNodes.length > 1) {
      // กรองเฉพาะ element ชั้นนอกสุด ไม่ซ้อนกัน
      pageNodes = pageNodes.filter(node => !pageNodes.some(parent => parent !== node && parent.contains(node)));
    }

    if (pageNodes.length === 0) {
      const docNodes = Array.from(doc.querySelectorAll('.print-doc'));
      if (docNodes.length > 0) pageNodes = docNodes;
    }

    if (pageNodes.length === 0) {
      // ตรวจสอบ div ที่ระบุ page-break-after
      const breakNodes = Array.from(doc.body ? doc.body.children : []).filter(el => {
        const s = el.getAttribute('style') || '';
        return s.includes('page-break-after') || s.includes('break-after: page');
      });
      if (breakNodes.length > 0) {
        pageNodes = breakNodes;
      } else {
        pageNodes = [doc.body || doc.documentElement];
      }
    }

    // 4. CSS พิเศษที่ถอดแบบมาจาก @media print และหน้าพรีวิว 100%
    // รับประกันว่า PDF บนมือถือและคอมพิวเตอร์จะออกมาสมบูรณ์แบบตรงกับภาพต้นฉบับทุกประการ:
    // อัตราส่วน A4 มาตรฐาน (Landscape: 1060x744px, Portrait: 760x1075px) ตารางขยายเต็มหน้า ช่องคาบเรียนสม่ำเสมอเท่ากัน
    const hostWidthPx = isLandscape ? 1060 : 760;
    const hostHeightPx = isLandscape ? 744 : 1075;

    const pdfFixCss = `
      <style>
        * {
          box-sizing: border-box !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #FFFFFF !important;
          color: #000000 !important;
          width: ${hostWidthPx}px !important;
          min-width: ${hostWidthPx}px !important;
          max-width: ${hostWidthPx}px !important;
          font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
        }
        .schedule-page, .print-page-wrapper, .pp6-container, .pp5-sheet, .calendar-container, .print-doc, .form-doc-wrapper {
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 auto !important;
          background: #FFFFFF !important;
          width: ${hostWidthPx}px !important;
          min-width: ${hostWidthPx}px !important;
          max-width: ${hostWidthPx}px !important;
          min-height: ${hostHeightPx}px !important;
          height: ${hostHeightPx}px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          padding: ${isLandscape ? '14px 18px' : '14px 16px'} !important;
          box-sizing: border-box !important;
        }
        .header {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          margin-bottom: 4px !important;
          flex-shrink: 0 !important;
        }
        .header img, .logo, .school-logo {
          width: 48px !important;
          height: 48px !important;
          object-fit: contain !important;
          margin: 0 auto 3px auto !important;
          display: block !important;
        }
        .header > div:nth-child(2), .header .title {
          font-size: 16px !important;
          font-weight: 800 !important;
          color: #0F172A !important;
          margin-bottom: 2px !important;
          line-height: 1.25 !important;
        }
        .header > div:nth-child(3), .header .subtitle {
          font-size: 12.5px !important;
          font-weight: 700 !important;
          color: #800020 !important;
          line-height: 1.25 !important;
        }
        .header > div:nth-child(4), .header .meta {
          font-size: 10.5px !important;
          color: #64748B !important;
          margin-top: 1px !important;
          line-height: 1.25 !important;
        }
        .workload {
          font-size: 10.5px !important;
          font-weight: 600 !important;
          margin-bottom: 6px !important;
          text-align: right !important;
          color: #475569 !important;
          flex-shrink: 0 !important;
        }
        .summary-bar {
          display: flex !important;
          justify-content: space-between !important;
          font-size: 10.5px !important;
          background: #F8FAFC !important;
          border: 1px solid #CBD5E1 !important;
          padding: 6px 12px !important;
          margin-bottom: 8px !important;
          flex-shrink: 0 !important;
        }
        /* สไตล์ตารางตารางสอน / ตารางเรียน */
        .schedule-page table, table.schedule-table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border: 2px solid #000000 !important;
          flex: 1 1 auto !important;
          height: 440px !important;
          min-height: 400px !important;
          margin: 0 !important;
        }
        .schedule-page table th, .schedule-page table td {
          border: 1px solid #000000 !important;
          text-align: center !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
        }
        .schedule-page table th {
          background: #FFFFFF !important;
          color: #000000 !important;
          font-weight: 700 !important;
          font-size: 10.5px !important;
          padding: 5px 2px !important;
          height: 40px !important;
          border-bottom: 2px solid #000000 !important;
        }
        .schedule-page table tr {
          height: calc((100% - 40px) / 5) !important;
          min-height: 72px !important;
        }
        .schedule-page table td {
          font-size: 10px !important;
          line-height: 1.35 !important;
          padding: 4px 3px !important;
        }
        .schedule-page table td:first-child {
          font-weight: 700 !important;
          font-size: 11px !important;
          color: #0F172A !important;
        }
        .schedule-page table th:nth-child(1), .schedule-page table td:nth-child(1) { width: 9% !important; }
        .schedule-page table th:nth-child(2), .schedule-page table td:nth-child(2) { width: 10% !important; }
        .schedule-page table th:nth-child(3), .schedule-page table td:nth-child(3) { width: 9.6% !important; }
        .schedule-page table th:nth-child(4), .schedule-page table td:nth-child(4) { width: 9.6% !important; }
        .schedule-page table th:nth-child(5), .schedule-page table td:nth-child(5) { width: 9.6% !important; }
        .schedule-page table th:nth-child(6), .schedule-page table td:nth-child(6) { width: 9.6% !important; }
        .schedule-page table th:nth-child(7), .schedule-page table td:nth-child(7) { width: 7.6% !important; }
        .schedule-page table th:nth-child(8), .schedule-page table td:nth-child(8) { width: 9.6% !important; }
        .schedule-page table th:nth-child(9), .schedule-page table td:nth-child(9) { width: 9.6% !important; }
        .schedule-page table th:nth-child(10), .schedule-page table td:nth-child(10) { width: 9.6% !important; }

        /* สไตล์ตารางรายงานการเช็คแถว / เข้าเรียน */
        .print-page-wrapper table:not(.cal-table):not(.compact-events-table), .print-doc table:not(.cal-table):not(.compact-events-table) {
          width: 100% !important;
          border-collapse: collapse !important;
          border: 2px solid #000000 !important;
          flex: 1 1 auto !important;
          margin: 0 auto !important;
        }
        .print-page-wrapper table:not(.cal-table):not(.compact-events-table) th, .print-page-wrapper table:not(.cal-table):not(.compact-events-table) td,
        .print-doc table:not(.cal-table):not(.compact-events-table) th, .print-doc table:not(.cal-table):not(.compact-events-table) td {
          border: 1px solid #000000 !important;
          box-sizing: border-box !important;
        }
        .print-page-wrapper table:not(.cal-table):not(.compact-events-table) th, .print-doc table:not(.cal-table):not(.compact-events-table) th {
          background: #FFFFFF !important;
          color: #000000 !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          padding: 5px 2px !important;
          border-bottom: 2px solid #000000 !important;
        }
        .print-page-wrapper table:not(.cal-table):not(.compact-events-table) td, .print-doc table:not(.cal-table):not(.compact-events-table) td {
          font-size: 9.5px !important;
          padding: 3.5px 3px !important;
          vertical-align: middle !important;
        }

        /* สไตล์ปฏิทินรายเดือน (MHC Calendar 2-Column Full A4 Fit) */
        .grid-month-page {
          height: 188mm !important;
          min-height: 188mm !important;
          max-height: 188mm !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always !important;
          break-after: page !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          box-sizing: border-box !important;
        }
        .grid-month-page:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .grid-month-page .sig-container {
          margin-top: auto !important;
          margin-bottom: 2px !important;
        }
        .grid-month-page .print-footer {
          margin-top: 4px !important;
          padding-top: 3px !important;
        }
        .cal-month-body {
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: row !important;
          gap: 10px !important;
          align-items: stretch !important;
          margin: 3px 0 5px 0 !important;
          height: auto !important;
        }
        .cal-grid-col {
          flex: 0 0 64% !important;
          max-width: 64% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .cal-events-col {
          flex: 0 0 36% !important;
          max-width: 36% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .cal-table {
          width: 100% !important;
          height: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          border: 1.5px solid #0F172A !important;
        }
        .cal-table th {
          background: #F8FAFC !important;
          color: #0F172A !important;
          font-weight: 700 !important;
          font-size: 10.5px !important;
          padding: 4px 2px !important;
          text-align: center !important;
          border: 1px solid #CBD5E1 !important;
          height: 26px !important;
        }
        .cal-table td {
          border: 1px solid #CBD5E1 !important;
          vertical-align: top !important;
          padding: 3px 4px !important;
          box-sizing: border-box !important;
        }
        .events-panel {
          border: 1.5px solid #CBD5E1 !important;
          border-radius: 6px !important;
          background: #FFFFFF !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          overflow: hidden !important;
        }
        .events-panel-body {
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .compact-events-table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: auto !important;
          font-size: 9.5px !important;
        }
        .compact-events-table th {
          background: #F1F5F9 !important;
          color: #475569 !important;
          font-weight: 700 !important;
          padding: 4px 5px !important;
          border-bottom: 1.5px solid #CBD5E1 !important;
          font-size: 9.5px !important;
        }
        .compact-events-table td {
          border-bottom: 1px solid #F1F5F9 !important;
          padding: 4px 5px !important;
          vertical-align: middle !important;
        }
        .events-panel-notes {
          margin-top: auto !important;
          padding: 8px 10px !important;
          background: #F8FAFC !important;
          border-top: 1px solid #E2E8F0 !important;
          flex: 1 1 auto !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-end !important;
        }
        .notes-line {
          border-bottom: 1px dotted #CBD5E1 !important;
          height: 24px !important;
        }

        /* ลายเซ็นทุกฝ่าย */
        .sig-row, .signature-row, .signatures {
          display: flex !important;
          justify-content: space-around !important;
          align-items: flex-start !important;
          margin-top: 14px !important;
          text-align: center !important;
          font-size: 10.5px !important;
          flex-shrink: 0 !important;
          gap: 20px !important;
        }
        .sig-box, .sig-row > div {
          min-width: 180px !important;
          max-width: 340px !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
        }
        .sig-stamp-zone {
          height: 38px !important;
          min-height: 38px !important;
          max-height: 38px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-end !important;
          margin: 0 auto 3px auto !important;
        }
        .teacher-sig-img, .mhc-sig-img {
          max-height: 36px !important;
          max-width: 140px !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
        }
        .sig-line, .sig-line:empty {
          border-bottom: 1px dotted #000000 !important;
          width: 180px !important;
          margin: 0 auto 4px auto !important;
        }
        .sig-dots {
          font-size: 10px !important;
          color: #0F172A !important;
          margin-top: 2px !important;
        }
        .sig-name {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: #000000 !important;
          margin-top: 2px !important;
        }
        .sig-title {
          font-size: 10px !important;
          color: #334155 !important;
          margin-top: 2px !important;
        }
        .sig-date {
          font-size: 9.5px !important;
          color: #475569 !important;
          margin-top: 2px !important;
        }
        .footer {
          display: flex !important;
          justify-content: space-between !important;
          font-size: 8.5px !important;
          color: #94A3B8 !important;
          margin-top: 8px !important;
          flex-shrink: 0 !important;
        }
        .no-print, .no-print-bar, .no-print-toolbar, button {
          display: none !important;
        }
      </style>
    `;

    // 5. สร้าง Render Host ใต้หน้าต่างพรีวิว
    const existingHost = document.getElementById('pdfRenderHost');
    if (existingHost && existingHost.parentNode) existingHost.parentNode.removeChild(existingHost);

    renderHost = document.createElement('div');
    renderHost.id = 'pdfRenderHost';
    renderHost.style.position = 'fixed';
    renderHost.style.left = '0';
    renderHost.style.top = '0';
    renderHost.style.width = `${hostWidthPx}px`;
    renderHost.style.minWidth = `${hostWidthPx}px`;
    renderHost.style.maxWidth = `${hostWidthPx}px`;
    renderHost.style.minHeight = `${hostHeightPx}px`;
    renderHost.style.background = '#FFFFFF';
    renderHost.style.color = '#000000';
    renderHost.style.zIndex = '10';
    renderHost.style.opacity = '1';
    renderHost.style.pointerEvents = 'none';
    renderHost.style.boxSizing = 'border-box';
    renderHost.style.padding = '0';
    renderHost.style.margin = '0';
    renderHost.style.overflow = 'hidden';
    document.body.appendChild(renderHost);

    // 6. กำหนดขนาด A4 สำหรับ jsPDF
    const pdf = new jsPdfLib({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidthMm = isLandscape ? 297 : 210;
    const pageHeightMm = isLandscape ? 210 : 297;
    const marginX = isLandscape ? 6.0 : 7.0;
    const marginY = isLandscape ? 5.0 : 6.0;
    const renderWidthMm = pageWidthMm - (marginX * 2);
    const maxPageHeightMm = pageHeightMm - (marginY * 2);

    let isFirstPdfPage = true;
    const defaultSchoolLogo = window.OFFICIAL_SCHOOL_LOGO_DATA_URL || 'school-logo.png';

    // 7. วนลูปเรนเดอร์แยกทีละหน้าอย่างเป็นอิสระ
    for (let pIdx = 0; pIdx < pageNodes.length; pIdx++) {
      const node = pageNodes[pIdx];
      const nodeContent = node.outerHTML || node.innerHTML;

      renderHost.innerHTML = cleanStyles + pdfFixCss + nodeContent;

      renderHost.querySelectorAll('img').forEach(img => {
        const s = (img.getAttribute('src') || '').toLowerCase();
        const isSchoolLogo = s.includes('lh3.googleusercontent.com') ||
                             s.includes('school_logo') ||
                             s.includes('school-logo') ||
                             s.includes('app-icon') ||
                             img.classList.contains('logo') ||
                             img.classList.contains('school-logo') ||
                             (img.alt || '').toLowerCase().includes('logo') ||
                             (img.alt || '').includes('ตรา');
        if (isSchoolLogo) {
          img.removeAttribute('onerror');
          img.setAttribute('src', defaultSchoolLogo);
          img.src = defaultSchoolLogo;
        }
      });

      const imgs = Array.from(renderHost.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if (img.decode) return img.decode().catch(() => {});
        return new Promise(res => { img.onload = res; img.onerror = res; });
      }));

      await new Promise(r => setTimeout(r, 40));

      const canvas = await window.html2canvas(renderHost, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: hostWidthPx
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.warn(`Canvas empty for page ${pIdx}`);
        continue;
      }

      const sliceHeightPx = Math.floor((maxPageHeightMm / renderWidthMm) * canvas.width);
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const renderHeightMm = (canvas.height / canvas.width) * renderWidthMm;

      if (!isFirstPdfPage) {
        pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
      } else {
        isFirstPdfPage = false;
      }

      const canvasAspect = canvas.width / canvas.height;
      const pageAspect = renderWidthMm / maxPageHeightMm;

      if (renderHeightMm <= maxPageHeightMm * 1.15) {
        let finalW = renderWidthMm;
        let finalH = maxPageHeightMm;
        let posX = marginX;
        let posY = marginY;

        if (Math.abs(canvasAspect - pageAspect) < 0.1) {
          finalW = renderWidthMm;
          finalH = maxPageHeightMm;
          posX = marginX;
          posY = marginY;
        } else if (canvasAspect > pageAspect) {
          finalW = renderWidthMm;
          finalH = renderWidthMm / canvasAspect;
          posY = marginY + Math.max(0, (maxPageHeightMm - finalH) / 2);
        } else {
          finalH = maxPageHeightMm;
          finalW = maxPageHeightMm * canvasAspect;
          posX = marginX + Math.max(0, (renderWidthMm - finalW) / 2);
        }

        pdf.addImage(imgData, 'JPEG', posX, posY, finalW, finalH, undefined, 'FAST');
      } else {
        let currentY = 0;
        let isFirstSlice = true;
        while (currentY < canvas.height) {
          const remainingPx = canvas.height - currentY;
          const chunkHeightPx = Math.min(sliceHeightPx, remainingPx);

          const chunkCanvas = document.createElement('canvas');
          chunkCanvas.width = canvas.width;
          chunkCanvas.height = chunkHeightPx;
          const chunkCtx = chunkCanvas.getContext('2d');
          chunkCtx.fillStyle = '#FFFFFF';
          chunkCtx.fillRect(0, 0, chunkCanvas.width, chunkCanvas.height);
          chunkCtx.drawImage(
            canvas,
            0, currentY, canvas.width, chunkHeightPx,
            0, 0, canvas.width, chunkHeightPx
          );

          const chunkImgData = chunkCanvas.toDataURL('image/jpeg', 0.98);
          const chunkH = (chunkHeightPx / canvas.width) * renderWidthMm;

          if (!isFirstSlice) {
            pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
          } else {
            isFirstSlice = false;
          }

          pdf.addImage(chunkImgData, 'JPEG', marginX, marginY, renderWidthMm, chunkH, undefined, 'FAST');
          currentY += chunkHeightPx;
        }
      }
    }

    if (!isSilent) hideLoading();

    if (action === 'download') {
      pdf.save(`${safeTitle}.pdf`);
      if (!isSilent) showToast('success', 'ดาวน์โหลดไฟล์ PDF เรียบร้อย');
      return true;
    } else {
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    }

  } catch (err) {
    console.error('PDF Generation Error:', err);
    if (!isSilent) {
      hideLoading();
      showToast('error', 'เกิดข้อผิดพลาดในการสร้าง PDF');
    }
    return null;
  } finally {
    if (renderHost && renderHost.parentNode) {
      renderHost.parentNode.removeChild(renderHost);
    }
  }
}

function downloadPdfBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

async function downloadPdfDocument(html, title) {
  if (!html) return;
  const safeTitle = getSafePrintTitle(title);
  const pdfBlob = await generatePdfFromHtml(html, title, 'blob');
  if (pdfBlob) {
    downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
    showToast('success', 'ดาวน์โหลดไฟล์ PDF เรียบร้อย');
    return true;
  }
  return false;
}

async function sharePdfDocument(html, title) {
  if (!html) return;
  const safeTitle = getSafePrintTitle(title);
  const canShare = !!navigator.share;

  showLoading('กำลังจัดเตรียมไฟล์ PDF...');

  let pdfBlob = null;
  try {
    pdfBlob = await generatePdfFromHtml(html, title, 'blob');
  } catch (err) {
    console.error('generatePdfFromHtml error:', err);
  } finally {
    hideLoading();
  }

  if (!pdfBlob) {
    showToast('error', 'ไม่สามารถสร้างไฟล์ PDF ได้');
    return;
  }

  const file = new File([pdfBlob], `${safeTitle}.pdf`, { type: 'application/pdf' });
  const isShareableFile = canShare && navigator.canShare && navigator.canShare({ files: [file] });

  // WebKit Transient Activation fix:
  // บน iOS WebKit การประมวลผล PDF ใช้เวลามากกว่า 1 วินาที ทำให้ User Activation หมดอายุ
  // การเรียก navigator.share ทันทีจะถูกปฏิเสธด้วย NotAllowedError
  // จึงใช้ SweetAlert เพื่อให้ผู้ใช้แตะปุ่ม เป็น Direct User Gesture ครั้งใหม่
  // และเรียก navigator.share({ files: [file] }) แบบ Synchronous ทันทีที่แตะ!
  if (canShare && (isShareableFile || navigator.canShare)) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'success',
        title: 'ไฟล์ PDF พร้อมส่งออกแล้ว',
        html: `
          <div class="text-left text-xs sm:text-sm text-slate-600 space-y-2 mt-2">
            <p>สร้างเอกสาร <b>"${escapeHtml(title)}"</b> เรียบร้อย</p>
            <p class="text-slate-500">แตะปุ่ม <b>"เปิดเมนูแชร์"</b> ด้านล่างเพื่อส่งไฟล์ทาง LINE หรือบันทึกไฟล์</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bx bx-share-alt mr-1"></i> เปิดเมนูแชร์ (Share Sheet)',
        cancelButtonText: '<i class="bx bx-download mr-1"></i> ดาวน์โหลด PDF',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#059669',
        reverseButtons: true,
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          // Direct Synchronous User Gesture!
          if (isShareableFile) {
            navigator.share({
              files: [file]
            }).catch((err) => {
              if (err.name === 'AbortError') return;
              console.warn('Share file failed, fallback to download:', err);
              downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
            });
          } else {
            const modal = document.getElementById('printDocModal');
            const shareUrl = (modal && modal._currentDirectUrl) || '';
            if (shareUrl) {
              navigator.share({
                title: `${title} (PDF)`,
                text: `เอกสาร PDF: ${title} โรงเรียนมหาชัยพิทยาคาร`,
                url: shareUrl
              }).catch(() => downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`));
            } else {
              downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
            }
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
        }
      });
    } else {
      if (isShareableFile) {
        navigator.share({
          files: [file]
        }).catch(() => downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`));
      } else {
        downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
      }
    }
  } else {
    // กรณี Browser ไม่รองรับ navigator.share (เช่น เดสก์ท็อปเก่า): ดาวน์โหลดไฟล์ทันที
    downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
    showToast('success', 'ดาวน์โหลดไฟล์ PDF เรียบร้อย');
  }
}

async function openPdfPreview(html, title) {
  if (!html) return;
  const safeTitle = getSafePrintTitle(title);
  const pdfBlob = await generatePdfFromHtml(html, title, 'blob');
  if (!pdfBlob) return;

  const url = URL.createObjectURL(pdfBlob);
  const w = window.open(url, '_blank');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1500);
  }
}

async function prepareDirectPrintUrl(html, title) {
  if (!html) return null;
  const gasUrl = window.GAS_URL || '';
  if (!gasUrl) return null;

  return new Promise((resolve) => {
    try {
      if (window.google && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(res => {
            if (res && res.status === 'success' && res.id) {
              const finalUrl = `${gasUrl}?action=printDoc&id=${encodeURIComponent(res.id)}&title=${encodeURIComponent(title || 'พิมพ์เอกสาร')}`;
              resolve(finalUrl);
            } else if (res && res.url) {
              resolve(res.url);
            } else {
              resolve(null);
            }
          })
          .withFailureHandler(() => resolve(null))
          .saveTemporaryPrintDoc(html, title, (window.APP && APP.token) || '');
      } else {
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveTemporaryPrintDoc',
            args: [html, title, (window.APP && APP.token) || '']
          })
        })
        .then(r => r.json())
        .then(res => {
          if (res && res.status === 'success' && res.id) {
            const finalUrl = `${gasUrl}?action=printDoc&id=${encodeURIComponent(res.id)}&title=${encodeURIComponent(title || 'พิมพ์เอกสาร')}`;
            resolve(finalUrl);
          } else if (res && res.url) {
            resolve(res.url);
          } else {
            resolve(null);
          }
        })
        .catch(() => resolve(null));
      }
    } catch (_) {
      resolve(null);
    }
  });
}

async function openInExternalSafari(directUrl, html, title) {
  let targetUrl = directUrl;

  if (targetUrl) {
    if (!targetUrl.includes('autoprint=1')) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'autoprint=1';
    }
    const modal = document.getElementById('printDocModal');
    if (modal) modal._currentDirectUrl = targetUrl;

    const w = window.open(targetUrl, '_blank');
    if (!w) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 200);
    }
    return;
  }

  if (html) {
    showLoading('กำลังเตรียมเปิดใน Safari...');
    let preparedUrl = null;
    try {
      preparedUrl = await prepareDirectPrintUrl(html, title);
    } catch (_) {}
    hideLoading();

    if (preparedUrl) {
      if (!preparedUrl.includes('autoprint=1')) {
        preparedUrl += (preparedUrl.includes('?') ? '&' : '?') + 'autoprint=1';
      }
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '<div class="flex items-center justify-center gap-2 text-indigo-700 text-base font-bold"><i class="bx bx-check-circle text-emerald-500"></i> เอกสารพร้อมพิมพ์แล้ว</div>',
          html: '<p class="text-xs text-slate-600 mb-2">แตะปุ่มด้านล่างเพื่อเปิดหน้าต่าง Safari และสั่งพิมพ์ AirPrint ขนาด A4 พอดีหน้า 100%</p>',
          confirmButtonText: '🚀 เปิดใน Safari สั่งพิมพ์',
          confirmButtonColor: '#4F46E5',
          showCancelButton: true,
          cancelButtonText: 'ยกเลิก',
          cancelButtonColor: '#94A3B8',
          customClass: { popup: 'rounded-2xl max-w-xs' }
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(preparedUrl, '_blank');
          }
        });
      } else {
        window.open(preparedUrl, '_blank');
      }
    } else {
      sharePdfDocument(html, title);
    }
  }
}

function showIOSPrintOptionsModal(html, title, directUrl) {
  if (typeof Swal === 'undefined') {
    downloadPdfDocument(html, title);
    return;
  }

  Swal.fire({
    title: '<div class="flex items-center justify-center gap-2 text-indigo-700 text-base sm:text-lg font-bold"><i class="bx bxs-file-pdf text-2xl text-red-600"></i> การพิมพ์และส่งออก PDF (iPhone)</div>',
    html: `
      <div class="text-left text-sm text-slate-600 space-y-3 pt-1">
        <p class="text-xs text-indigo-900 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 leading-relaxed font-medium">
          <i class="bx bx-info-circle mr-1 text-base align-middle text-indigo-600"></i>
          บน iPhone เมื่อเปิดจากหน้าจอโฮมหรือที่คั่นหน้า กรุณาเลือกวิธีพิมพ์หรือส่งออกเอกสารที่ต้องการ:
        </p>
        <div class="space-y-2">
          <!-- 1. แนะนำสูงสุด: แชร์ไฟล์ PDF / พิมพ์ AirPrint ผ่าน Share Sheet (ปลอดภัยและรองรับ 100% ทุกอุปกรณ์) -->
          <button id="swalBtnSharePdf" type="button" class="w-full text-left p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/90 hover:bg-indigo-100 flex items-center gap-3 transition cursor-pointer shadow-xs">
            <div class="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
              <i class="bx bx-share-alt"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
                <span>แชร์ไฟล์ PDF / พิมพ์ AirPrint</span>
                <span class="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">แนะนำ</span>
              </div>
              <div class="text-[11px] text-indigo-700 truncate">สร้าง PDF ขนาด A4 คมชัด เปิดเมนู iOS เลือกพิมพ์ AirPrint หรือส่ง LINE</div>
            </div>
          </button>

          <!-- 2. ดาวน์โหลดไฟล์ PDF ขนาด A4 -->
          <button id="swalBtnDownloadPdf" type="button" class="w-full text-left p-3 rounded-xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 flex items-center gap-3 transition cursor-pointer shadow-xs">
            <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              <i class="bx bxs-file-pdf"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-emerald-950 text-xs sm:text-sm">ดาวน์โหลดไฟล์ PDF ขนาด A4</div>
              <div class="text-[11px] text-emerald-700 truncate">สร้างไฟล์ .pdf A4 จัดหน้าแยกห้องเรียนเรียบร้อย บันทึกเก็บไว้ในแอปไฟล์</div>
            </div>
          </button>

          <!-- 3. เปิดใน Safari เพื่อสั่งพิมพ์ -->
          <button id="swalBtnSafari" type="button" class="w-full text-left p-3 rounded-xl border border-blue-300 bg-blue-50/90 hover:bg-blue-100 flex items-center gap-3 transition cursor-pointer shadow-xs">
            <div class="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
              <i class="bx bx-globe"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-bold text-blue-950 text-xs sm:text-sm">เปิดใน Safari เพื่อสั่งพิมพ์</div>
              <div class="text-[11px] text-blue-700 truncate">เปิดหน้าเอกสารใน Safari เพื่อสั่งพิมพ์ AirPrint พอดีกระดาษ A4 (100%)</div>
            </div>
          </button>

          <!-- 4. สั่งพิมพ์ AirPrint ในแอปโดยตรง -->
          <button id="swalBtnDirectPrint" type="button" class="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-3 transition cursor-pointer shadow-2xs">
            <div class="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center text-lg flex-shrink-0">
              <i class="bx bx-printer"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 text-xs sm:text-sm">สั่งพิมพ์ AirPrint ในหน้านี้โดยตรง</div>
              <div class="text-[10px] text-slate-500 truncate">เรียกคำสั่งพิมพ์ตรง (มีปุ่มย้อนกลับให้กดออกได้ตลอดเวลา)</div>
            </div>
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'ปิดหน้าต่าง',
    cancelButtonColor: '#64748B',
    customClass: {
      popup: 'rounded-2xl max-w-sm sm:max-w-md',
      cancelButton: 'text-xs px-4 py-2 rounded-lg'
    },
    didOpen: () => {
      const bDirect = document.getElementById('swalBtnDirectPrint');
      const bDownload = document.getElementById('swalBtnDownloadPdf');
      const bShare = document.getElementById('swalBtnSharePdf');
      const bSafari = document.getElementById('swalBtnSafari');

      const getActiveHtml = () => {
        const modal = document.getElementById('printDocModal');
        return (modal && modal._currentHtml) || html;
      };

      if (bShare) {
        bShare.onclick = () => {
          Swal.close();
          sharePdfDocument(getActiveHtml(), title);
        };
      }
      if (bDownload) {
        bDownload.onclick = () => {
          Swal.close();
          downloadPdfDocument(getActiveHtml(), title);
        };
      }
      if (bSafari) {
        bSafari.onclick = () => {
          Swal.close();
          openInExternalSafari(directUrl, getActiveHtml(), title);
        };
      }
      if (bDirect) {
        bDirect.onclick = () => {
          Swal.close();
          triggerDirectInAppPrint(getActiveHtml());
        };
      }
    }
  });
}

/**
 * เตรียมพื้นที่ #inAppPrintArea และ #mhcDynamicPrintPageStyle ล่วงหน้าทันทีที่เปิดหน้าพรีวิว
 * เพื่อให้เมื่อผู้ใช้แตะปุ่ม "พิมพ์เอกสาร" บน iPhone (ทั้งใน Safari และที่คั่นหน้าจอโฮม) สามารถเรียก window.print() (AirPrint) แบบ Synchronous ทันที 100%
 * และคงรูปแบบเอกสารให้ตรงกับฟอร์มที่แสดงในพรีวิวทุกประการ
 */
function prepareInAppPrintArea(html, isLandOverride) {
  let printArea = document.getElementById('inAppPrintArea');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'inAppPrintArea';
    printArea.className = 'in-app-print-area';
    document.body.appendChild(printArea);
  }

  const modal = document.getElementById('printDocModal');
  const currentOri = (modal && modal._currentOrientation) || '';
  const isLand = typeof isLandOverride === 'boolean'
    ? isLandOverride
    : (currentOri === 'landscape' ||
       (html || '').toLowerCase().includes('size: a4 landscape') ||
       (html || '').toLowerCase().includes('a4 landscape') ||
       (html || '').toLowerCase().includes('แนวนอน') ||
       (html || '').toLowerCase().includes('landscape'));

  let dynamicStyle = document.getElementById('mhcDynamicPrintPageStyle');
  if (!dynamicStyle) {
    dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'mhcDynamicPrintPageStyle';
    document.head.appendChild(dynamicStyle);
  }

  // ถอดแบบ CSS จาก cleanPreviewOverride ให้ตรงกับหน้าพรีวิว 100% (ใช้ table-layout: auto ไม่บีบคอลัมน์ ไม่ตัดคำว่า กิจกรรมหน้าเสาธง)
  dynamicStyle.textContent = `
    @media screen {
      #inAppPrintArea {
        display: none !important;
      }
    }
    @media print {
      @page {
        size: A4 ${isLand ? 'landscape' : 'portrait'} !important;
        margin: ${isLand ? '5mm 6mm 6mm 6mm' : '8mm 10mm 10mm 10mm'} !important;
      }
      html, body {
        background: #FFFFFF !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body > *:not(#inAppPrintArea):not(#cardPrintOverlay) {
        display: none !important;
        visibility: hidden !important;
      }
      #printDocModal, #appLayout, #loginScreen, #loadingOverlay, .swal2-container, nav, header, aside, .sidebar, .topbar {
        display: none !important;
        visibility: hidden !important;
      }
      #inAppPrintArea {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        overflow: visible !important;
      }
      #inAppPrintArea .print-page-wrapper,
      #inAppPrintArea .print-doc,
      #inAppPrintArea .pp6-container,
      #inAppPrintArea .pp5-sheet,
      #inAppPrintArea .schedule-page,
      #inAppPrintArea .calendar-container,
      #inAppPrintArea .receipt-box {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: #FFFFFF !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: visible !important;
      }
      #inAppPrintArea .schedule-page:last-child,
      #inAppPrintArea .print-page-wrapper:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      #inAppPrintArea .header {
        margin-bottom: 6px !important;
      }
      #inAppPrintArea .header img {
        width: 50px !important;
        height: 50px !important;
        object-fit: contain !important;
        margin-bottom: 2px !important;
      }
      #inAppPrintArea .workload {
        text-align: right !important;
        margin-bottom: 6px !important;
        font-size: 11px !important;
        color: #475569 !important;
      }
      #inAppPrintArea table:not(.cal-table) {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        table-layout: auto !important;
        border-collapse: collapse !important;
        border-radius: 0 !important;
        overflow: visible !important;
        box-shadow: none !important;
      }
      #inAppPrintArea .schedule-page table {
        border: 2px solid #000000 !important;
        table-layout: auto !important;
      }
      #inAppPrintArea .schedule-page th,
      #inAppPrintArea .schedule-page td {
        border: 1px solid #000000 !important;
      }
      #inAppPrintArea thead, #inAppPrintArea tbody, #inAppPrintArea tfoot, #inAppPrintArea tr, #inAppPrintArea th, #inAppPrintArea td {
        border-radius: 0 !important;
        letter-spacing: normal !important;
        text-transform: none !important;
      }
      #inAppPrintArea thead { display: table-header-group !important; }
      #inAppPrintArea tfoot { display: table-footer-group !important; }
      #inAppPrintArea tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      #inAppPrintArea .sig-row,
      #inAppPrintArea .signature-row,
      #inAppPrintArea .signatures,
      #inAppPrintArea .sig-container {
        display: flex !important;
        justify-content: space-around !important;
        align-items: flex-start !important;
        margin-top: 16px !important;
        gap: 16px !important;
        flex-wrap: nowrap !important;
        text-align: center !important;
        font-size: 11px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #inAppPrintArea .sig-box {
        flex: 1 !important;
        min-width: 180px !important;
        max-width: 340px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }
      #inAppPrintArea .sig-stamp-zone {
        height: 44px !important;
        min-height: 44px !important;
        max-height: 44px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-end !important;
        margin: 0 auto 3px auto !important;
      }
      #inAppPrintArea .teacher-sig-img,
      #inAppPrintArea .mhc-sig-img {
        max-height: 40px !important;
        max-width: 145px !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
      }
      #inAppPrintArea .sig-line:empty {
        border-bottom: 1px dotted #64748B !important;
        width: 170px !important;
        margin: 0 auto 4px auto !important;
      }
      #inAppPrintArea .sig-line:not(:empty) {
        border-bottom: none !important;
        width: auto !important;
      }
      #inAppPrintArea .sig-name {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: #0F172A !important;
        margin-top: 2px !important;
        white-space: nowrap !important;
      }
      #inAppPrintArea .sig-title, #inAppPrintArea .sig-date {
        font-size: 10.5px !important;
        color: #334155 !important;
        margin-top: 2px !important;
        white-space: nowrap !important;
      }
      #inAppPrintArea .no-print,
      #inAppPrintArea .no-print-bar,
      #inAppPrintArea .no-print-toolbar,
      #inAppPrintArea button {
        display: none !important;
      }
    }
  `;

  if (html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('.no-print, .no-print-bar, .no-print-toolbar, button, script').forEach(el => el.remove());

      const rawStyles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('\n')
        .replace(/@media\s+screen\s*\{[\s\S]*?\}\s*\}/gi, '')
        .replace(/@media\s+screen\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gi, '');

      const defaultSchoolLogo = window.OFFICIAL_SCHOOL_LOGO_DATA_URL || 'school-logo.png';
      doc.querySelectorAll('img').forEach(img => {
        const s = (img.getAttribute('src') || '').toLowerCase();
        const isSchoolLogo = s.includes('lh3.googleusercontent.com') ||
                             s.includes('school_logo') ||
                             s.includes('school-logo') ||
                             s.includes('app-icon') ||
                             img.classList.contains('logo') ||
                             img.classList.contains('school-logo') ||
                             (img.alt || '').toLowerCase().includes('logo') ||
                             (img.alt || '').includes('ตรา');
        if (isSchoolLogo) {
          img.removeAttribute('onerror');
          img.setAttribute('src', defaultSchoolLogo);
        }
      });

      printArea.innerHTML = rawStyles + (doc.body ? doc.body.innerHTML : html);
      Array.from(printArea.querySelectorAll('img')).forEach(img => {
        if (img.decode) img.decode().catch(() => {});
      });
    } catch (_) {
      printArea.innerHTML = html;
    }
  }
}

/**
 * สำหรับโหมดไอคอนหน้าจอโฮม iPhone (iOS Standalone WebClip: window.navigator.standalone === true)
 * ซึ่งระบบ iOS บล็อกคำสั่ง window.print() ไม่ให้ทำงาน:
 * จะเปิด iOS Share Sheet (ที่มีเมนู "พิมพ์ / AirPrint" ในตัว) ทันทีในคลิกเดียวโดยใช้ไฟล์ PDF ที่เรนเดอร์เตรียมไว้ล่วงหน้า
 */
async function triggerIOSStandaloneAirPrint(html, title) {
  const modal = document.getElementById('printDocModal');
  const activeHtml = html || (modal && modal._currentHtml) || '';
  const activeTitle = title || (modal && modal._currentTitle) || 'เอกสาร';
  const safeTitle = getSafePrintTitle(activeTitle);

  // กรณีที่ 1: ไฟล์ PDF ถูกสร้างเตรียมไว้ในหน่วยความจำเรียบร้อยแล้วระหว่างดูพรีวิว -> เปิดเมนู AirPrint / Share Sheet ทันที (0ms Synchronous Gesture!)
  if (modal && modal._prebuiltPdfFile && navigator.share && (!navigator.canShare || navigator.canShare({ files: [modal._prebuiltPdfFile] }))) {
    try {
      await navigator.share({
        files: [modal._prebuiltPdfFile]
      });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.warn('Direct prebuilt share fallback:', err);
    }
  }

  // กรณีที่ 2: ผู้ใช้กดปุ่มพิมพ์ทันทีขณะกำลังเรนเดอร์พื้นหลัง หรือต้องการ User Gesture ใหม่
  showLoading('กำลังเตรียมหน้าต่างพิมพ์ AirPrint...');
  let pdfBlob = null;
  try {
    if (modal && modal._prebuiltPdfPromise) {
      pdfBlob = await modal._prebuiltPdfPromise;
    }
    if (!pdfBlob) {
      pdfBlob = await generatePdfFromHtml(activeHtml, activeTitle, 'blob', { silent: true });
    }
  } catch (e) {
    console.error('AirPrint PDF prep error:', e);
  }
  hideLoading();

  if (!pdfBlob) {
    showToast('error', 'ไม่สามารถเตรียมเอกสารสำหรับพิมพ์ได้');
    return;
  }

  const file = new File([pdfBlob], `${safeTitle}.pdf`, { type: 'application/pdf' });
  if (modal) modal._prebuiltPdfFile = file;

  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: 'info',
      title: 'พร้อมสั่งพิมพ์ AirPrint',
      html: `<div class="text-xs sm:text-sm text-slate-600 leading-relaxed">แตะปุ่มด้านล่าง แล้วเลือกเมนู <b>"พิมพ์" (Print / AirPrint)</b> เพื่อพิมพ์เอกสารออกทางเครื่องพิมพ์ทันที</div>`,
      confirmButtonText: '<i class="bx bx-printer mr-1"></i> เปิดหน้าต่างพิมพ์ (AirPrint)',
      confirmButtonColor: '#4F46E5',
      showCancelButton: true,
      cancelButtonText: 'ยกเลิก',
      cancelButtonColor: '#94A3B8',
      customClass: { popup: 'rounded-2xl max-w-xs sm:max-w-sm' }
    }).then((res) => {
      if (res.isConfirmed) {
        if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          navigator.share({ files: [file] }).catch((err) => {
            if (err && err.name === 'AbortError') return;
            downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
          });
        } else {
          downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
        }
      }
    });
  } else if (navigator.share) {
    navigator.share({ files: [file] }).catch(() => downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`));
  } else {
    downloadPdfBlob(pdfBlob, `${safeTitle}.pdf`);
  }
}

function triggerDirectInAppPrint(html) {
  const modal = document.getElementById('printDocModal');
  const activeHtml = html || (modal && modal._currentHtml) || '';
  const activeTitle = (modal && modal._currentTitle) || 'เอกสาร';
  const isLand = modal ? (modal._currentOrientation === 'landscape') : undefined;

  const env = getPrintEnv();
  if (env.isIOSStandalone) {
    triggerIOSStandaloneAirPrint(activeHtml, activeTitle);
    return;
  }

  prepareInAppPrintArea(activeHtml, isLand);
  document.body.classList.add('is-printing-doc');

  try {
    window.focus();
    window.print();
  } catch (e) {
    console.warn('In-app print error:', e);
  }
}

// Global handler called from top bar or from inside the iframe preview
window.triggerInAppPrint = function() {
  const modal = document.getElementById('printDocModal');
  const html = (modal && modal._currentHtml) || '';
  triggerDirectInAppPrint(html);
};

/* ============================================================
 *  UNIVERSAL PRINT SIGNATURE ENGINE
 * ============================================================ */

// 1. ตัดขอบขาวของ Canvas ลายเซ็นอัตโนมัติ (GAS Best Practice Rule #6)
function trimCanvasWhitespace(canvas) {
  try {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasPixel = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        const isWhite = data[idx] > 240 && data[idx + 1] > 240 && data[idx + 2] > 240;
        if (alpha > 20 && !isWhite) {
          hasPixel = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixel) return null;

    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width, maxX + pad);
    maxY = Math.min(height, maxY + pad);

    const cropW = maxX - minX;
    const cropH = maxY - minY;

    const trimmed = document.createElement('canvas');
    trimmed.width = cropW;
    trimmed.height = cropH;
    const tCtx = trimmed.getContext('2d');
    tCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    return trimmed.toDataURL('image/png');
  } catch (e) {
    console.warn('Trim whitespace error:', e);
    return canvas.toDataURL('image/png');
  }
}

// 2. แปลงรูปถ่ายลายเซ็นให้โปร่งแสงและตัดขอบขาว
function makeImageTransparent(imgElement, callback) {
  try {
    const c = document.createElement('canvas');
    c.width = imgElement.naturalWidth || imgElement.width || 400;
    c.height = imgElement.naturalHeight || imgElement.height || 160;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      if (r > 215 && g > 215 && b > 215) {
        d[i+3] = 0;
      } else {
        const avg = (r + g + b) / 3;
        if (avg < 180) {
          d[i] = Math.max(0, r - 35);
          d[i+1] = Math.max(0, g - 35);
          d[i+2] = Math.max(0, b - 35);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const trimmed = trimCanvasWhitespace(c);
    callback(trimmed || c.toDataURL('image/png'));
  } catch (e) {
    callback(imgElement.src);
  }
}

// 3. ตัวสร้างลายเซ็นดิจิทัลทางการระดับผู้บริหาร (SVG Official Calligraphy Signatures)
function generateDirectorSignatureSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 85" width="260" height="85">
    <path d="M 20 48 C 24 22, 40 18, 48 38 C 52 48, 44 58, 36 52 C 32 46, 38 32, 55 30 C 70 28, 80 48, 90 40 C 100 32, 110 20, 122 34 C 132 46, 142 28, 155 30 C 170 32, 185 18, 200 34 C 210 44, 180 58, 145 62 C 115 65, 75 64, 40 60 C 65 58, 115 56, 170 52 C 190 50, 210 48, 220 45" 
      fill="none" stroke="#002B9E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 46 22 C 48 16, 52 14, 56 17 C 58 20, 54 24, 50 23" 
      fill="none" stroke="#002B9E" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 124 20 C 128 14, 135 16, 134 22 C 132 25, 128 24, 126 22" 
      fill="none" stroke="#002B9E" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 168 18 C 173 12, 180 14, 178 20 C 176 23, 172 22, 170 20" 
      fill="none" stroke="#002B9E" stroke-width="2.2" stroke-linecap="round" />
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function generateEvaluatorSignatureSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 80" width="250" height="80">
    <path d="M 25 50 C 35 25, 50 20, 58 35 C 62 45, 52 56, 42 50 C 36 44, 45 28, 65 30 C 80 32, 92 48, 105 36 C 118 24, 130 38, 145 32 C 160 26, 172 40, 185 30 C 195 24, 205 38, 215 32 C 190 55, 140 60, 60 58 C 90 54, 140 50, 195 48" 
      fill="none" stroke="#002B9E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 52 22 C 55 16, 60 18, 58 24" fill="none" stroke="#002B9E" stroke-width="2.0" stroke-linecap="round" />
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function generateTeacherSignatureSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80">
    <path d="M 28 52 C 36 24, 54 18, 62 38 C 66 48, 56 58, 48 50 C 42 42, 54 28, 72 30 C 88 32, 98 48, 112 36 C 126 24, 138 40, 152 32 C 166 24, 180 38, 196 28 C 206 22, 214 36, 202 46 C 182 58, 132 62, 54 58 C 88 54, 144 50, 208 46" 
      fill="none" stroke="#002B9E" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 116 20 C 120 14, 126 16, 124 22" fill="none" stroke="#002B9E" stroke-width="2.0" stroke-linecap="round" />
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// 4. อ่านสถานะและข้อมูลลายเซ็นแบบครบทุกผู้ลงนาม 4 ฝ่าย พร้อมรองรับการแยกลายเซ็นตามระดับชั้น (ม.1 - ม.6)
function getPrintMultiSignatureState() {
  let savedMulti = null;
  try {
    const raw = localStorage.getItem('mhc_multi_signatures');
    if (raw) savedMulti = JSON.parse(raw);
  } catch (e) {}

  const legacySig = localStorage.getItem('mhc_custom_signature') || '';
  const legacyName = localStorage.getItem('mhc_custom_signature_name') || '';
  const userSig = (typeof APP !== 'undefined' && APP.user && APP.user.signature) ? APP.user.signature : '';
  const userName = (typeof APP !== 'undefined' && APP.user && (APP.user.name || APP.user.username)) ? (APP.user.name || APP.user.username) : '';

  let teacherName = (savedMulti && savedMulti.teacher && savedMulti.teacher.name) || legacyName || userName || 'ครูก้องนที อุ่นเจริญ';
  if (teacherName === 'ผู้ดูแลระบบ' || teacherName === 'admin') teacherName = 'ครูก้องนที อุ่นเจริญ';
  const defaultTeacherSig = generateTeacherSignatureSvg();
  const teacherSig = (savedMulti && savedMulti.teacher && savedMulti.teacher.signature) || legacySig || userSig || defaultTeacherSig;

  // โหมดตรวจจับและดึงลายเซ็นครูประจำชั้นตรงตามห้องเรียน/ระดับชั้นอัตโนมัติ (Auto-Match)
  const autoMatchClassroom = (savedMulti && savedMulti.autoMatchClassroom !== undefined) ? !!savedMulti.autoMatchClassroom : true;

  // ลายเซ็นแยกรายระดับชั้น (ม.1 - ม.6)
  const DEFAULT_GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  const gradeTeachers = {};
  DEFAULT_GRADES.forEach(g => {
    const savedG = (savedMulti && savedMulti.gradeTeachers && savedMulti.gradeTeachers[g]) || {};
    gradeTeachers[g] = {
      grade: g,
      roleId: 'grade_' + g.replace('.', ''),
      title: `ครูประจำชั้น / หัวหน้าระดับชั้น ${g}`,
      enabled: savedG.enabled !== undefined ? !!savedG.enabled : true,
      signature: savedG.signature || '',
      name: savedG.name || ''
    };
  });

  const defaultDirSig = generateDirectorSignatureSvg();
  const directorSig = (savedMulti && savedMulti.director && savedMulti.director.signature) || defaultDirSig;
  const directorName = 'นายอธิการ สุขศรี';

  const defaultEvalSig = generateEvaluatorSignatureSvg();
  const evaluatorSig = (savedMulti && savedMulti.evaluator && savedMulti.evaluator.signature) || defaultEvalSig;
  const evaluatorName = (savedMulti && savedMulti.evaluator && savedMulti.evaluator.name) || 'หัวหน้างานวัดและประเมินผลการศึกษา';

  const parentSig = (savedMulti && savedMulti.parent && savedMulti.parent.signature) || '';
  const parentName = (savedMulti && savedMulti.parent && savedMulti.parent.name) || 'ผู้ปกครองนักเรียน';

  const savedMaster = localStorage.getItem('mhc_sig_enabled');
  const masterEnabled = savedMaster !== null ? (savedMaster === 'true') : true;

  return {
    masterEnabled: masterEnabled,
    autoMatchClassroom: autoMatchClassroom,
    teacher: {
      roleId: 'teacher',
      title: 'ครูประจำชั้น / ครูผู้สอน (ทั่วไป)',
      enabled: savedMulti && savedMulti.teacher ? !!savedMulti.teacher.enabled : true,
      signature: teacherSig,
      name: teacherName
    },
    gradeTeachers: gradeTeachers,
    evaluator: {
      roleId: 'evaluator',
      title: 'หัวหน้างานวัดและประเมินผล',
      enabled: savedMulti && savedMulti.evaluator ? !!savedMulti.evaluator.enabled : true,
      signature: evaluatorSig,
      name: evaluatorName
    },
    director: {
      roleId: 'director',
      title: 'ผู้อำนวยการโรงเรียน (นายอธิการ สุขศรี)',
      enabled: savedMulti && savedMulti.director ? !!savedMulti.director.enabled : true,
      signature: directorSig,
      name: directorName
    },
    parent: {
      roleId: 'parent',
      title: 'ผู้ปกครองนักเรียน',
      enabled: savedMulti && savedMulti.parent ? !!savedMulti.parent.enabled : false,
      signature: parentSig,
      name: parentName
    }
  };
}

function savePrintMultiSignatureState(state) {
  try {
    localStorage.setItem('mhc_multi_signatures', JSON.stringify(state));
    localStorage.setItem('mhc_sig_enabled', state.masterEnabled ? 'true' : 'false');
    if (state.teacher) {
      localStorage.setItem('mhc_custom_signature', state.teacher.signature || '');
      localStorage.setItem('mhc_custom_signature_name', state.teacher.name || '');
    }
  } catch (e) {}
}

/**
 * ดึงและแคชข้อมูลความสัมพันธ์ห้องเรียน - ครูประจำชั้น - ลายเซ็นดิจิทัล สำหรับ Client
 */
function ensureClassroomTeachersMap(callback) {
  if (window._mhcClassroomTeachersMap && window._mhcClassroomTeachersMap.status === 'success') {
    if (typeof callback === 'function') callback(window._mhcClassroomTeachersMap);
    return;
  }
  if (typeof google !== 'undefined' && google.script && google.script.run && typeof APP !== 'undefined' && APP.token) {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.status === 'success') {
          window._mhcClassroomTeachersMap = res;
          // ซิงค์ลายเซ็นจริงของ ผอ. จากฐานข้อมูล Personnel ทันทีเมื่อมีข้อมูล
          if (res.director && res.director.signature) {
            try {
              const multi = getPrintMultiSignatureState();
              const defaultSvg = generateDirectorSignatureSvg();
              if (!multi.director.signature || multi.director.signature === defaultSvg) {
                multi.director.signature = res.director.signature;
                if (res.director.name) multi.director.name = res.director.name;
                savePrintMultiSignatureState(multi);
              }
            } catch (_) {}
          }
        }
        if (typeof callback === 'function') callback(window._mhcClassroomTeachersMap || null);
      })
      .withFailureHandler(() => {
        if (typeof callback === 'function') callback(null);
      })
      .getClassroomTeachersMap(APP.token);
  } else if (typeof callback === 'function') {
    callback(null);
  }
}

// Wrapper เพื่อความเข้ากันได้ย้อนหลัง 100%
function getPrintSignatureState() {
  const multi = getPrintMultiSignatureState();
  const hasAny = (multi.teacher.enabled && !!multi.teacher.signature) ||
                 (multi.director.enabled && !!multi.director.signature) ||
                 (multi.evaluator.enabled && !!multi.evaluator.signature) ||
                 (multi.parent.enabled && !!multi.parent.signature);
  return {
    enabled: multi.masterEnabled && hasAny,
    hasSignature: hasAny,
    signature: multi.teacher.signature || multi.director.signature || '',
    name: multi.teacher.name || 'ครูก้องนที อุ่นเจริญ',
    multi: multi
  };
}

// 5. แทรกรูปภาพลายเซ็นลงใน HTML เอกสารทุกรูปแบบ ทุกหน้าที่พิมพ์ รองรับครบทุกตำแหน่งและแยกลายเซ็นตามระดับชั้น/ห้องเรียน
function applySignatureToDocument(html, sigOptionsOrUrl, legacyTeacherName) {
  if (!html) return html;

  let multiState = null;
  if (sigOptionsOrUrl && typeof sigOptionsOrUrl === 'object' && sigOptionsOrUrl.teacher) {
    multiState = sigOptionsOrUrl;
  } else if (typeof sigOptionsOrUrl === 'string' && sigOptionsOrUrl) {
    multiState = {
      masterEnabled: true,
      autoMatchClassroom: true,
      teacher: { enabled: true, signature: sigOptionsOrUrl, name: legacyTeacherName || 'ครูก้องนที อุ่นเจริญ' },
      gradeTeachers: {},
      evaluator: { enabled: false, signature: '', name: '' },
      director: { enabled: false, signature: '', name: 'นายอธิการ สุขศรี' },
      parent: { enabled: false, signature: '', name: '' }
    };
  } else {
    multiState = getPrintMultiSignatureState();
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ฝัง CSS สไตล์ลายเซ็นแบบคมชัด สวยงาม สมดุลเท่ากันทุกช่อง ไม่ซ้อนทับตัวหนังสือ
    let style = doc.querySelector('style#mhcSigStyle');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'mhcSigStyle';
      style.textContent = `
        .sig-stamp-zone {
          height: 48px !important;
          min-height: 48px !important;
          max-height: 48px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: flex-end !important;
          margin: 0 auto 3px auto !important;
        }
        .teacher-sig-img, .mhc-sig-img {
          max-height: 44px !important;
          max-width: 145px !important;
          object-fit: contain !important;
          pointer-events: none !important;
          display: block !important;
          margin: 0 auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .sig-line:empty {
          border-bottom: 1px dotted #64748B !important;
          width: 170px !important;
          margin: 0 auto 4px auto !important;
          padding-bottom: 0 !important;
          min-height: 0 !important;
        }
        .sig-line:not(:empty) {
          border-bottom: none !important;
          width: auto !important;
          margin-top: 2px !important;
          white-space: nowrap !important;
        }
        .sig-row, .signature-row, .signatures, .sig-container {
          display: flex !important;
          justify-content: space-around !important;
          align-items: flex-start !important;
          margin-top: 20px !important;
          text-align: center !important;
          font-size: 11px !important;
          gap: 16px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .sig-box {
          flex: 1 !important;
          min-width: 200px !important;
          max-width: 340px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
        }
        .sig-dots {
          white-space: nowrap !important;
          font-size: 10.5px !important;
          color: #334155 !important;
        }
        .sig-name {
          font-weight: 600 !important;
          font-size: 11px !important;
          color: #0F172A !important;
          margin-top: 2px !important;
          white-space: nowrap !important;
        }
        .sig-title, .sig-date {
          font-size: 10.5px !important;
          color: #334155 !important;
          margin-top: 2px !important;
          white-space: nowrap !important;
        }
        .mhc-sig-inline-wrap {
          display: inline-flex !important;
          align-items: flex-end !important;
          gap: 6px !important;
          vertical-align: bottom !important;
          margin: 2px 0 !important;
        }
        @media print {
          .teacher-sig-img, .mhc-sig-img {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;
      if (doc.head) doc.head.appendChild(style);
      else if (doc.body) doc.body.insertBefore(style, doc.body.firstChild);
    }

    // กรณีปิดลายเซ็น (Signatures: OFF)
    if (!multiState.masterEnabled) {
      doc.querySelectorAll('.sig-stamp-zone').forEach(sz => { sz.innerHTML = ''; });
      doc.querySelectorAll('.teacher-sig-img, .mhc-sig-img').forEach(img => { img.remove(); });
      doc.querySelectorAll('.sig-dots').forEach(d => { d.style.display = ''; });
      return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
    }

    const tSig = (multiState.teacher && multiState.teacher.enabled && multiState.teacher.signature) ? multiState.teacher.signature : '';
    const tName = (multiState.teacher && multiState.teacher.name) ? multiState.teacher.name : 'ครูก้องนที อุ่นเจริญ';

    const dSig = (multiState.director && multiState.director.enabled && multiState.director.signature) ? multiState.director.signature : '';
    const dName = 'นายอธิการ สุขศรี';

    const eSig = (multiState.evaluator && multiState.evaluator.enabled && multiState.evaluator.signature) ? multiState.evaluator.signature : '';
    const eName = (multiState.evaluator && multiState.evaluator.name) ? multiState.evaluator.name : 'หัวหน้ากลุ่มบริหารวิชาการ';

    const pSig = (multiState.parent && multiState.parent.enabled && multiState.parent.signature) ? multiState.parent.signature : '';
    const pName = (multiState.parent && multiState.parent.name) ? multiState.parent.name : 'ผู้ปกครองนักเรียน';

    // A. ปพ.5, ปพ.6, ตารางเรียน/สอน และรายงาน: โครงสร้าง .sig-box, .signature-grid, .signature-row, .sig-row
    const stampBoxes = doc.querySelectorAll('.sig-box, .signature-grid > div, .signature-row > div, .sig-row > div, .signatures > div, .sig-container > div');
    stampBoxes.forEach((box, idx) => {
      const roleAttr = (box.getAttribute('data-sig-role') || '').toLowerCase();
      const boxTxt = box.textContent || '';
      const isDirector = roleAttr === 'director' || boxTxt.includes('ผู้อำนวยการ') || boxTxt.includes('อธิการ') || boxTxt.includes('สุขศรี') || boxTxt.includes('อนุมัติผล') || boxTxt.includes('ทราบ / อนุมัติ');
      const isEvaluator = roleAttr === 'evaluator' || boxTxt.includes('หัวหน้างานวัด') || boxTxt.includes('หัวหน้ากลุ่มสาระ') || boxTxt.includes('วัดและประเมินผล') || boxTxt.includes('วิชาการ') || boxTxt.includes('หัวหน้างานวิชาการ') || boxTxt.includes('หัวหน้ากลุ่มบริหารวิชาการ');
      const isParent = roleAttr === 'parent' || boxTxt.includes('ผู้ปกครอง');
      const isTeacher = roleAttr === 'teacher' || (!isDirector && !isEvaluator && !isParent && (
        boxTxt.includes('ครูประจำชั้น') || boxTxt.includes('ครูผู้สอน') || boxTxt.includes('ผู้รายงาน') || 
        boxTxt.includes('ผู้สรุปรายงาน') || boxTxt.includes('ผู้ตรวจเช็ค') || boxTxt.includes('ผู้จัดทำ') || 
        boxTxt.includes('ครูที่ปรึกษา') || boxTxt.includes('ตำแหน่ง') || idx === 0
      ));

      let targetSig = '';
      let targetName = '';
      if (isDirector) {
        if (multiState.director && multiState.director.enabled !== false) {
          targetSig = dSig || generateDirectorSignatureSvg();
          targetName = dName;
        }
      } else if (isEvaluator) {
        if (multiState.evaluator && multiState.evaluator.enabled) {
          targetSig = eSig || generateEvaluatorSignatureSvg();
          targetName = eName;
        }
      } else if (isParent) {
        if (multiState.parent && multiState.parent.enabled) {
          targetSig = pSig;
          targetName = pName;
        }
      } else if (isTeacher) {
        if (multiState.teacher && multiState.teacher.enabled !== false) {
          // หาข้อมูลระดับชั้นหรือห้องเรียนของกล่องนี้เพื่อแยกลายเซ็นอย่างถูกต้อง
          const wrapper = box.closest('.grade-level-section, .print-page-wrapper, .schedule-page, [data-grade-level], [data-classroom]');
          let boxGrade = box.getAttribute('data-grade-level') || (wrapper ? wrapper.getAttribute('data-grade-level') : '') || '';
          let boxClassroom = box.getAttribute('data-classroom') || (wrapper ? wrapper.getAttribute('data-classroom') : '') || '';

          if (!boxGrade) {
            const contextText = (box.textContent || '') + ' ' + (wrapper ? wrapper.textContent : '');
            const mMatch = contextText.match(/(ม\.[1-6]|มัธยมศึกษาปีที่\s*([1-6])|ชั้นมัธยมศึกษาปีที่\s*([1-6]))/i);
            if (mMatch) {
              if (mMatch[1].startsWith('ม.')) boxGrade = mMatch[1];
              else if (mMatch[2]) boxGrade = 'ม.' + mMatch[2];
              else if (mMatch[3]) boxGrade = 'ม.' + mMatch[3];
            }
          }
          if (!boxClassroom && boxGrade) {
            const cMatch = (wrapper ? wrapper.textContent : '').match(/(ม\.[1-6]\/\d+)/i);
            if (cMatch) boxClassroom = cMatch[1];
          }

          const existingSigImg = box.querySelector('.teacher-sig-img');
          const hasExistingValidSig = existingSigImg && existingSigImg.src && (existingSigImg.src.startsWith('data:image') || existingSigImg.src.startsWith('http'));

          const gTeacher = (boxGrade && multiState.gradeTeachers && multiState.gradeTeachers[boxGrade]) || null;
          const autoMap = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
          const autoRoomTeacher = (boxClassroom && autoMap && autoMap.byClassroom && autoMap.byClassroom[boxClassroom]) || null;
          const autoGradeTeacher = (boxGrade && autoMap && autoMap.byGrade && autoMap.byGrade[boxGrade]) || null;

          // ลำดับความสำคัญในการเลือกข้อมูลครูประจำชั้น / หัวหน้าระดับชั้น:
          // Priority 1: มีการระบุลายเซ็นเฉพาะระดับชั้นนั้นใน Studio (Grade-Level Custom Override)
          if (gTeacher && gTeacher.enabled && gTeacher.signature) {
            targetSig = gTeacher.signature;
            targetName = gTeacher.name || tName;
          }
          // Priority 2: มีลายเซ็นที่ดึงตรงตามห้องเรียน/ระดับชั้นจาก Server มาอยู่แล้ว (Auto-Matched by Classroom)
          else if (hasExistingValidSig && multiState.autoMatchClassroom !== false) {
            targetSig = existingSigImg.src;
            const rawCurName = (box.querySelector('.sig-name')?.textContent || '').replace(/[()]/g, '').trim();
            const isOnlyDots = rawCurName.replace(/[\.\s_…\-]/g, '').length === 0;
            const curName = isOnlyDots ? '' : rawCurName;
            targetName = curName || (autoRoomTeacher ? autoRoomTeacher.name : (autoGradeTeacher ? autoGradeTeacher.name : tName));
          }
          // Priority 3: ดึงอัตโนมัติตามห้องเรียนจาก Cache ใน Client (Auto Match Classroom)
          else if (autoRoomTeacher && autoRoomTeacher.signature && multiState.autoMatchClassroom !== false) {
            targetSig = autoRoomTeacher.signature;
            targetName = autoRoomTeacher.name || tName;
          }
          // Priority 4: ดึงอัตโนมัติตามระดับชั้นจาก Cache ใน Client (Auto Match Grade)
          else if (autoGradeTeacher && autoGradeTeacher.signature && multiState.autoMatchClassroom !== false) {
            targetSig = autoGradeTeacher.signature;
            targetName = autoGradeTeacher.name || tName;
          }
          // Priority 5: ใช้ลายเซ็นครูประจำชั้นทั่วไป หรือลายเซ็นดิจิทัลมาตรฐาน (Global Default Teacher)
          else {
            targetSig = tSig || generateTeacherSignatureSvg();
            const rawDomName = (box.querySelector('.sig-name')?.textContent || '').replace(/[()]/g, '').trim();
            const domNameClean = rawDomName.replace(/[\.\s_…\-]/g, '').length === 0 ? '' : rawDomName;
            targetName = domNameClean || (gTeacher && gTeacher.name) || (autoRoomTeacher && autoRoomTeacher.name) || (autoGradeTeacher && autoGradeTeacher.name) || tName;
          }

          if (!targetName || targetName.replace(/[\.\s_…\-]/g, '').length === 0) {
            targetName = tName || 'ครูก้องนที อุ่นเจริญ';
          }
        }
      }

      if (targetSig) {
        let sz = box.querySelector('.sig-stamp-zone');
        if (!sz) {
          sz = doc.createElement('div');
          sz.className = 'sig-stamp-zone';
          const ref = box.querySelector('.sig-line, .sig-name, .sig-dots') || box.firstChild;
          box.insertBefore(sz, ref);
        }
        sz.innerHTML = `<img src="${targetSig}" class="teacher-sig-img mhc-sig-img" alt="ลายเซ็น" />`;

        const dots = box.querySelector('.sig-dots');
        if (dots) dots.style.display = 'none';

        let line = box.querySelector('.sig-line');
        if (!line) {
          line = doc.createElement('div');
          line.className = 'sig-line';
          sz.after(line);
        }

        // อัปเดตชื่อผู้ลงนาม
        const nameEl = box.querySelector('.sig-name');
        if (nameEl) {
          nameEl.textContent = `( ${targetName} )`;
        } else {
          const allEls = box.querySelectorAll('div, p, span');
          allEls.forEach(el => {
            const t = (el.textContent || '').trim();
            if (/^\(\s*[\.]{3,}\s*\)$/.test(t) || /^\(\s*…+\s*\)$/.test(t) || /^\(\s*_{3,}\s*\)$/.test(t) || /^\(\s*\)$/.test(t) || (isDirector && t.includes('อธิการ'))) {
              el.textContent = `( ${targetName} )`;
            }
          });
        }
        box.setAttribute('data-mhc-signed', 'true');
      } else {
        // ไม่มีลายเซ็น หรือตำแหน่งนี้ถูกปิด: เคลียร์รูปภาพออก และคงเส้นประไว้
        const sz = box.querySelector('.sig-stamp-zone');
        if (sz) sz.innerHTML = '';
        const dots = box.querySelector('.sig-dots');
        if (dots) dots.style.display = '';
        let line = box.querySelector('.sig-line');
        if (!line && !dots) {
          line = doc.createElement('div');
          line.className = 'sig-line';
          if (sz) sz.after(line);
          else box.prepend(line);
        }
      }
    });

    // B. อัปเดต elements ที่มี .teacher-sig-img อยู่เดิมใน HTML
    doc.querySelectorAll('.teacher-sig-img').forEach(img => {
      if (img.closest('[data-mhc-signed]')) return;
      const parentTxt = (img.closest('.sig-box, .sig-row, div, td') || {}).textContent || '';
      if ((parentTxt.includes('ผู้อำนวยการ') || parentTxt.includes('อธิการ')) && (dSig || generateDirectorSignatureSvg())) {
        img.src = dSig || generateDirectorSignatureSvg();
      } else if ((parentTxt.includes('หัวหน้า') || parentTxt.includes('วัดผล')) && eSig) {
        img.src = eSig;
      } else if (parentTxt.includes('ผู้ปกครอง') && pSig) {
        img.src = pSig;
      } else if (multiState.autoMatchClassroom !== false && img.src && (img.src.startsWith('data:image') || img.src.startsWith('http'))) {
        // คงรูปลายเซ็นเดิมที่ระบบแมตช์ตามห้องเรียนไว้
      } else if (tSig) {
        img.src = tSig;
      }
    });

    // C. แทรกในบล็อกข้อความราชการที่มี "ลงชื่อ" (แบบฟอร์ม 4 ฝ่าย / บันทึกข้อความ) ที่อยู่นอก .sig-box
    const allDivs = doc.querySelectorAll('div, p, td');
    allDivs.forEach(el => {
      if (el.closest('[data-mhc-signed], .sig-box, .signature-grid, .signature-row, .sig-row, .signatures, .sig-container')) return;
      if (!el.textContent || !el.textContent.includes('ลงชื่อ')) return;
      if (el.querySelector('.teacher-sig-img, [data-mhc-signed]')) return;
      const hasChildWithSig = Array.from(el.children).some(c => c.textContent && c.textContent.includes('ลงชื่อ'));
      if (hasChildWithSig) return;

      const txt = el.textContent || '';
      const contextTxt = txt + ' ' + ((el.parentElement ? el.parentElement.textContent : '') || '');

      let targetSig = '';
      let targetName = '';
      if ((contextTxt.includes('ผู้อำนวยการ') || contextTxt.includes('อธิการ') || contextTxt.includes('สุขศรี')) && (multiState.director && multiState.director.enabled !== false)) {
        targetSig = dSig || generateDirectorSignatureSvg();
        targetName = dName;
      } else if ((contextTxt.includes('หัวหน้างาน') || contextTxt.includes('หัวหน้ากลุ่มสาระ') || contextTxt.includes('วัดผล') || contextTxt.includes('วิชาการ')) && (multiState.evaluator && multiState.evaluator.enabled)) {
        targetSig = eSig || generateEvaluatorSignatureSvg();
        targetName = eName;
      } else if (contextTxt.includes('ผู้ปกครอง') && (multiState.parent && multiState.parent.enabled)) {
        targetSig = pSig;
        targetName = pName;
      } else if (multiState.teacher && multiState.teacher.enabled !== false && tSig) {
        targetSig = tSig;
        targetName = tName;
      }

      if (targetSig) {
        const sigRegex = /(ลงชื่อ\s*[\.]{4,}|ลงชื่อ\s*…+|ลงชื่อ\s*_{4,}|\(ลงชื่อ\)\s*[\.]{4,})/g;
        if (sigRegex.test(el.innerHTML)) {
          el.innerHTML = el.innerHTML.replace(sigRegex, () => {
            return `<span class="mhc-sig-inline-wrap">` +
                     `<span style="font-size:inherit;">ลงชื่อ</span>` +
                     `<img src="${targetSig}" class="teacher-sig-img" alt="ลายเซ็น" />` +
                   `</span>`;
          });
          el.setAttribute('data-mhc-signed', 'true');
        }
        if (targetName) {
          const nextEl = el.nextElementSibling;
          if (nextEl && /^\(\s*[\.]{4,}\s*\)$/.test(nextEl.textContent.trim())) {
            nextEl.textContent = `( ${targetName} )`;
          }
        }
      }
    });

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  } catch (err) {
    console.error('Multi-signature injection error:', err);
    return html;
  }
}

// 6. ศูนย์จัดการและประทับลายเซ็นผู้ลงนามทางการ (Official Multi-Signatory Studio)
function showSignatureManagerModal(onSaved, initialRoleId) {
  let modal = document.getElementById('mhcSignatureManagerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mhcSignatureManagerModal';
    modal.className = 'fixed inset-0 z-[100000] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 transition-all duration-300';
    modal.style.display = 'none';
    document.body.appendChild(modal);
  }

  const multiState = getPrintMultiSignatureState();
  let currentRoleId = initialRoleId || 'teacher';
  let selectedGrade = null; // null = ค่าเริ่มต้น/ทั่วไป, 'ม.1' - 'ม.6' = เฉพาะระดับชั้น
  let penColor = '#002B9E';
  let penWidth = 2.4;

  const renderModalUI = () => {
    let curRole = null;
    const isGradeMode = (currentRoleId === 'teacher' && selectedGrade);
    if (isGradeMode) {
      if (!multiState.gradeTeachers) multiState.gradeTeachers = {};
      if (!multiState.gradeTeachers[selectedGrade]) {
        multiState.gradeTeachers[selectedGrade] = {
          grade: selectedGrade,
          roleId: 'grade_' + selectedGrade.replace('.', ''),
          title: `ครูประจำชั้น / หัวหน้าระดับชั้น ${selectedGrade}`,
          enabled: true,
          signature: '',
          name: ''
        };
      }
      curRole = multiState.gradeTeachers[selectedGrade];
    } else {
      curRole = multiState[currentRoleId];
    }

    const rolesList = [
      { id: 'teacher', icon: 'bx-edit', title: 'ครูประจำชั้น / ครูผู้สอน', color: 'indigo' },
      { id: 'evaluator', icon: 'bx-check-double', title: 'หัวหน้างานวัดผล', color: 'teal' },
      { id: 'director', icon: 'bxs-crown', title: 'ผอ. นายอธิการ สุขศรี', color: 'amber' },
      { id: 'parent', icon: 'bx-home-heart', title: 'ผู้ปกครองนักเรียน', color: 'rose' }
    ];

    const roleTabsHtml = rolesList.map(r => {
      const active = r.id === currentRoleId;
      const roleData = multiState[r.id];
      const hasSig = !!(roleData && roleData.signature);
      const isEnabled = !!(roleData && roleData.enabled);

      return `
        <button type="button" class="btn-role-tab flex-1 py-2 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 border text-xs cursor-pointer ${active ? 'bg-white shadow-xs font-bold text-slate-900 border-slate-300/80 ring-2 ring-indigo-500/20' : 'bg-transparent text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/60'}" data-role="${r.id}">
          <i class='bx ${r.icon} text-sm ${active ? 'text-indigo-600' : ''}'></i>
          <span class="truncate">${r.title.split(' ')[0]}</span>
          <span class="w-2 h-2 rounded-full flex-shrink-0 ${isEnabled && hasSig ? 'bg-emerald-500' : (hasSig ? 'bg-amber-400' : 'bg-slate-300')}"></span>
        </button>
      `;
    }).join('');

    const autoMap = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
    const gradeTeacherAuto = (selectedGrade && autoMap && autoMap.byGrade && autoMap.byGrade[selectedGrade]) ? autoMap.byGrade[selectedGrade] : null;

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh] border border-white/40 ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header with Aurora Dark Gradient -->
        <div class="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 relative overflow-hidden select-none">
          <div class="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
          <div class="flex items-center gap-3 relative z-10">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xl shadow-md border border-indigo-400/30 flex-shrink-0">
              <i class='bx bxs-badge-check'></i>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>ศูนย์จัดการลายเซ็นครบทุกตำแหน่ง</span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/20">ปพ.5 · ปพ.6 · 4 ฝ่าย</span>
              </h3>
              <p class="text-[11px] text-indigo-200/80 font-normal mt-0.5">กำหนดและประทับลายเซ็นครบทั้ง 4 ตำแหน่ง และแยกลายเซ็นครูประจำชั้น ม.1 - ม.6 ได้ในที่เดียว</p>
            </div>
          </div>
          <button id="btnCloseSigManager" type="button" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer relative z-10" title="ปิดหน้าต่าง">
            <i class='bx bx-x text-2xl leading-none'></i>
          </button>
        </div>

        <!-- 4 Role Selector Bar -->
        <div class="p-3 bg-slate-100 border-b border-slate-200/80">
          <div class="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
            <span>เลือกตำแหน่งผู้ลงนามที่ต้องการตั้งค่า:</span>
            <span class="text-[10px] text-indigo-600 font-medium">สลับตั้งค่าได้ครบทุกฝ่าย</span>
          </div>
          <div class="flex gap-1 bg-slate-200/70 p-1 rounded-2xl">
            ${roleTabsHtml}
          </div>
        </div>

        <!-- Sub Bar for Grade-Level Signatures (เมื่อเลือกครูประจำชั้น) -->
        ${currentRoleId === 'teacher' ? `
          <div class="px-5 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-col gap-1.5 animate-in fade-in duration-150">
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span class="flex items-center gap-1.5 text-indigo-900">
                <i class='bx bx-git-branch text-sm text-indigo-600'></i>
                <span>แยกลายเซ็นครูประจำชั้นตามระดับชั้น (ม.1 - ม.6):</span>
              </span>
              <label class="inline-flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-indigo-200/80 shadow-2xs" title="ตรวจจับห้องเรียน/ระดับชั้นของเอกสาร แล้วดึงลายเซ็นครูประจำชั้นห้องนั้นจากฐานข้อมูลให้อัตโนมัติ">
                <input id="chkAutoMatchClassroom" type="checkbox" class="sr-only peer" ${multiState.autoMatchClassroom !== false ? 'checked' : ''}>
                <div class="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span class="text-[10px] font-bold ${multiState.autoMatchClassroom !== false ? 'text-emerald-700' : 'text-slate-500'}">ดึงตามห้องอัตโนมัติ</span>
              </label>
            </div>
            
            <div class="grid grid-cols-7 gap-1 p-1 bg-white/80 rounded-xl border border-indigo-100/80 shadow-2xs select-none">
              <button type="button" class="btn-grade-tab py-1 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${selectedGrade === null ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}" data-grade="">
                🌐 ทั่วไป
              </button>
              ${['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'].map(g => {
                const gData = multiState.gradeTeachers && multiState.gradeTeachers[g];
                const hasCustomSig = !!(gData && gData.signature);
                const isAct = selectedGrade === g;
                return `
                  <button type="button" class="btn-grade-tab py-1 px-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${isAct ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}" data-grade="${g}">
                    <span>${g}</span>
                    ${hasCustomSig ? `<span class="w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-300' : 'bg-emerald-500'}"></span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>
            <div class="text-[10px] text-indigo-700/80 flex items-center justify-between px-1">
              <span>กำลังตั้งค่า: <b>${escapeHTML(curRole.title)}</b></span>
              ${selectedGrade ? `<span class="text-emerald-700 font-semibold">✨ กำหนดเฉพาะ ${selectedGrade}</span>` : `<span class="text-slate-500">ใช้เป็นค่าเริ่มต้นทั่วไป</span>`}
            </div>
          </div>
        ` : ''}

        <!-- Body -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          
          <!-- แถบเปิด/ปิดการใส่ลายเซ็นของตำแหน่งนี้ -->
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">
                <i class='bx bx-toggle-right'></i>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-800 block">ประทับลายเซ็นของตำแหน่งนี้ลงเอกสาร</span>
                <span class="text-[10px] text-slate-400">ตำแหน่ง: <b class="text-indigo-600">${curRole.title}</b></span>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input id="chkRoleEnabled" type="checkbox" class="sr-only peer" ${curRole.enabled ? 'checked' : ''}>
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <!-- ส่วนระบุชื่อ-นามสกุลผู้ลงนาม -->
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <i class='bx bxs-user-check text-indigo-600 text-sm'></i>
                <span>ชื่อ-นามสกุลผู้ลงนาม (พิมพ์ลงในวงเล็บ)</span>
              </label>
              ${currentRoleId === 'director' ? `<span class="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">ผู้อำนวยการโรงเรียน</span>` : ''}
              ${selectedGrade ? `<span class="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200">ระดับชั้น ${selectedGrade}</span>` : ''}
            </div>
            <div class="relative">
              <i class='bx bx-user absolute left-3.5 top-3 text-slate-400 text-base'></i>
              <input id="sigTeacherNameInput" type="text" class="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-800 transition-all outline-none" placeholder="ชื่อ-นามสกุล" value="${escapeHTML(curRole.name || '')}">
            </div>
            <!-- ปุ่มด่วนสำหรับแต่ละบทบาท -->
            <div class="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              <span class="text-[10px] text-slate-400 font-medium flex-shrink-0">เลือกด่วน:</span>
              ${selectedGrade && gradeTeacherAuto ? `
                <button id="btnQuickSyncGradeTeacher" type="button" class="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition-all cursor-pointer">
                  ⚡ ใช้ครูประจำชั้น ${selectedGrade} (${gradeTeacherAuto.name})
                </button>
              ` : ''}
              <button type="button" class="btn-quick-name flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200/60 transition-all cursor-pointer" data-name="ครูก้องนที อุ่นเจริญ">
                ✍️ ครูก้องนที อุ่นเจริญ
              </button>
              <button type="button" class="btn-quick-name flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200/60 transition-all cursor-pointer" data-name="นายอธิการ สุขศรี">
                👑 ผอ. นายอธิการ สุขศรี
              </button>
              ${currentRoleId === 'director' ? `
                <button id="btnQuickDirectorSig" type="button" class="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition-all cursor-pointer">
                  ⚡ ใช้ลายเซ็นทางการ ผอ. ทันที
                </button>
              ` : ''}
            </div>
          </div>

          <!-- แท็บสลับ 3 ช่องทาง -->
          <div class="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 flex gap-1.5 select-none">
            <button id="tabSigDraw" type="button" class="flex-1 py-2 rounded-xl transition-all text-center bg-white shadow-xs text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60">
              <i class='bx bx-pen text-sm'></i>
              <span>วาดลายเซ็นสด</span>
            </button>
            <button id="tabSigUpload" type="button" class="flex-1 py-2 rounded-xl transition-all text-center text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5">
              <i class='bx bx-cloud-upload text-sm'></i>
              <span>อัปโหลดรูป</span>
            </button>
            <button id="tabSigSelect" type="button" class="flex-1 py-2 rounded-xl transition-all text-center text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5">
              <i class='bx bxs-user-detail text-sm'></i>
              <span>เลือกครูในระบบ</span>
            </button>
          </div>

          <!-- PANE 1: วาดลายเซ็นสด -->
          <div id="paneSigDraw" class="space-y-2.5">
            <div class="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-semibold">สีหมึก:</span>
                <button id="btnColorBlue" type="button" class="w-7 h-7 rounded-full border-2 border-indigo-600 shadow-sm relative flex items-center justify-center transition-transform hover:scale-105" style="background:#002B9E;" title="สีน้ำเงินเข้มราชการ">
                  <i class='bx bx-check text-white text-xs'></i>
                </button>
                <button id="btnColorBlack" type="button" class="w-7 h-7 rounded-full border-2 border-transparent shadow-sm relative flex items-center justify-center transition-transform hover:scale-105" style="background:#0F172A;" title="สีดำ">
                </button>
              </div>

              <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button id="btnSizeThin" type="button" class="px-2.5 py-1 text-[11px] rounded-lg text-slate-600 hover:text-slate-900 font-medium transition-all">บาง</button>
                <button id="btnSizeNormal" type="button" class="px-2.5 py-1 text-[11px] rounded-lg bg-white text-indigo-700 shadow-2xs font-bold transition-all">ปกติ</button>
                <button id="btnSizeThick" type="button" class="px-2.5 py-1 text-[11px] rounded-lg text-slate-600 hover:text-slate-900 font-medium transition-all">หนา</button>
              </div>

              <button id="btnClearSigCanvas" type="button" class="px-2.5 py-1.5 rounded-xl text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold flex items-center gap-1 transition-all border border-rose-100">
                <i class='bx bx-trash text-sm'></i>
                <span>ล้าง</span>
              </button>
            </div>

            <div class="relative w-full border-2 border-dashed border-indigo-200/90 hover:border-indigo-400 rounded-2xl bg-white overflow-hidden shadow-inner flex items-center justify-center transition-all" style="touch-action:none; height:185px;">
              <canvas id="sigCanvas" class="w-full h-full cursor-crosshair relative z-10"></canvas>
              <div class="absolute bottom-9 left-1/2 -translate-x-1/2 w-4/5 border-b border-dashed border-slate-200 pointer-events-none z-0"></div>
              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-mono pointer-events-none z-0">
                เส้นกึ่งกลางระนาบการเซ็น
              </div>

              <div id="sigPlaceholderNote" class="absolute pointer-events-none text-center text-slate-400 text-xs ${curRole.signature ? 'hidden' : ''} z-0 px-4">
                <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-1.5 shadow-2xs">
                  <i class='bx bx-pen'></i>
                </div>
                <div class="font-semibold text-slate-600">วาดลายเซ็นของ ${curRole.title} ในกรอบนี้</div>
                <p class="text-[11px] text-slate-400 mt-0.5">รองรับปากกาสไตลัส, นิ้วสัมผัสบนจอ หรือเมาส์ลากเส้น</p>
              </div>
            </div>
          </div>

          <!-- PANE 2: อัปโหลดรูปภาพ -->
          <div id="paneSigUpload" class="hidden space-y-2.5">
            <div class="border-2 border-dashed border-indigo-200/90 hover:border-indigo-500 rounded-2xl p-7 text-center transition-all bg-white hover:bg-indigo-50/20 group cursor-pointer">
              <input id="sigFileInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden">
              <label for="sigFileInput" class="cursor-pointer flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-2xl transition-all shadow-xs">
                  <i class='bx bx-cloud-upload'></i>
                </div>
                <div>
                  <span class="text-xs sm:text-sm font-bold text-indigo-700 block">คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น</span>
                  <span class="text-[11px] text-slate-400 block mt-0.5">รองรับไฟล์ PNG, JPG หรือ WebP</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 mt-1">
                  <i class='bx bx-check-shield text-xs'></i>
                  <span>ระบบลบพื้นหลังกระดาษสีขาวให้เป็นลายเซ็นโปร่งแสงอัตโนมัติ</span>
                </div>
              </label>
            </div>
          </div>

          <!-- PANE 3: เลือกครูจากระบบ -->
          <div id="paneSigSelect" class="hidden space-y-2.5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <i class='bx bxs-user-account text-indigo-600'></i>
                <span>เลือกครูจากฐานข้อมูลบุคลากร MHC</span>
              </label>
              <span id="sigTeacherCountBadge" class="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">กำลังโหลด...</span>
            </div>
            <div class="relative">
              <i class='bx bx-search absolute left-3 top-2.5 text-slate-400 text-sm'></i>
              <input id="sigTeacherSearchInput" type="text" class="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none" placeholder="🔍 พิมพ์ชื่อ หรือ นามสกุล เพื่อค้นหาด่วน...">
            </div>
            <select id="sigTeacherSelect" size="5" class="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 focus:border-indigo-600 focus:bg-white outline-none overflow-y-auto" style="min-height:120px;">
              <option value="" disabled>กำลังโหลดรายชื่อครู...</option>
            </select>
          </div>

          <!-- Live Preview Card: การแสดงผลจริงบนเอกสาร -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <i class='bx bx-show text-indigo-600'></i>
                <span>ตัวอย่างลายเซ็นที่จะประทับลงในช่อง <b>${curRole.title}</b>:</span>
              </span>
              <span id="sigStatusBadge" class="text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${curRole.signature ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}">
                ${curRole.signature ? '✓ พร้อมประทับลงเอกสาร' : '○ รอการวาดหรือเลือก'}
              </span>
            </div>

            <!-- กล่องกระดาษจำลอง A4 -->
            <div class="h-24 w-full bg-slate-50/80 rounded-xl border border-slate-200/90 flex flex-col items-center justify-center p-2 relative overflow-hidden select-none">
              <div class="h-12 w-full flex items-center justify-center relative">
                <img id="sigCurrentPreviewImg" src="${curRole.signature || ''}" alt="ลายเซ็น" class="max-h-11 max-w-[180px] object-contain relative z-10 transition-all ${curRole.signature ? '' : 'hidden'}" style="mix-blend-mode:multiply;">
                <div id="sigCurrentPreviewEmpty" class="text-xs text-slate-400 flex items-center gap-1.5 ${curRole.signature ? 'hidden' : ''}">
                  <i class='bx bx-pencil text-slate-300 text-sm'></i>
                  <span>ยังไม่ได้กำหนดลายเซ็น</span>
                </div>
              </div>
              <div class="text-center font-serif text-[11px] text-slate-700 tracking-wide mt-1">
                <span class="text-slate-300">...................................................</span>
                <div id="sigPreviewNameText" class="font-bold text-slate-800 text-[11px] leading-tight">
                  ( ${escapeHTML(curRole.name || '...................................................')} )
                </div>
                <div class="text-[10px] text-slate-500">${curRole.title}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 select-none">
          <div class="flex items-center gap-1.5">
            <button id="btnEnableAllSignatures" type="button" class="text-xs px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all cursor-pointer" title="เปิดใช้งานลายเซ็นครู + วัดผล + ผอ. นายอธิการ สุขศรี พร้อมกันในคลิกเดียว">
              ⚡ เปิดลายเซ็นครบทุกฝ่าย (3 ฝ่าย)
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button id="btnCancelSigManager" type="button" class="btn px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-all cursor-pointer">
              ยกเลิก
            </button>
            <button id="btnSaveSigManager" type="button" class="btn px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-0">
              <i class='bx bx-check text-base'></i>
              <span>บันทึกและประทับลายเซ็น</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // ผูก Event การเปลี่ยนแท็บบทบาท (Role Tabs)
    modal.querySelectorAll('.btn-role-tab').forEach(btn => {
      btn.onclick = () => {
        const nextRole = btn.getAttribute('data-role');
        if (nextRole && nextRole !== currentRoleId) {
          const nameInp = modal.querySelector('#sigTeacherNameInput');
          if (nameInp) curRole.name = nameInp.value.trim();
          currentRoleId = nextRole;
          selectedGrade = null;
          renderModalUI();
        }
      };
    });

    // ผูก Event การเปลี่ยนแท็บระดับชั้นย่อย (Grade Tabs สำหรับครูประจำชั้น)
    modal.querySelectorAll('.btn-grade-tab').forEach(btn => {
      btn.onclick = () => {
        const g = btn.getAttribute('data-grade') || null;
        if (g !== selectedGrade) {
          const nameInp = modal.querySelector('#sigTeacherNameInput');
          if (nameInp) curRole.name = nameInp.value.trim();
          selectedGrade = g;
          renderModalUI();
        }
      };
    });

    // ผูกสวิตช์ Auto Match Classroom
    const chkAuto = modal.querySelector('#chkAutoMatchClassroom');
    if (chkAuto) {
      chkAuto.onchange = () => {
        multiState.autoMatchClassroom = chkAuto.checked;
        if (typeof showToast === 'function') {
          showToast(chkAuto.checked ? 'เปิดโหมดดึงลายเซ็นครูประจำชั้นอัตโนมัติแล้ว' : 'ปิดโหมดอัตโนมัติ (ใช้ตามที่กำหนด)', 'info');
        }
      };
    }

    // ผูกปุ่มซิงค์ครูประจำชั้นเฉพาะระดับชั้น
    const btnSyncGrade = modal.querySelector('#btnQuickSyncGradeTeacher');
    if (btnSyncGrade && selectedGrade) {
      btnSyncGrade.onclick = () => {
        const autoM = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
        const gInfo = autoM && autoM.byGrade && autoM.byGrade[selectedGrade];
        if (gInfo) {
          curRole.name = gInfo.name || curRole.name;
          curRole.signature = gInfo.signature || curRole.signature;
          curRole.enabled = true;
          renderModalUI();
          if (typeof showToast === 'function') {
            showToast(`ซิงค์ข้อมูลครูประจำชั้น ${selectedGrade} สำเร็จแล้ว`, 'success');
          }
        }
      };
    }

    // ผูกสวิตช์เปิด/ปิดบทบาท
    const chkRole = modal.querySelector('#chkRoleEnabled');
    if (chkRole) {
      chkRole.onchange = () => {
        curRole.enabled = chkRole.checked;
      };
    }

    // ผูกปุ่มลัด ผอ.
    const btnQuickDir = modal.querySelector('#btnQuickDirectorSig');
    if (btnQuickDir) {
      btnQuickDir.onclick = () => {
        const dirSig = generateDirectorSignatureSvg();
        multiState.director.signature = dirSig;
        multiState.director.name = 'นายอธิการ สุขศรี';
        multiState.director.enabled = true;
        renderModalUI();
      };
    }

    // ผูกปุ่มลัดเปิดครบทุกฝ่าย
    const btnAllSig = modal.querySelector('#btnEnableAllSignatures');
    if (btnAllSig) {
      btnAllSig.onclick = () => {
        multiState.masterEnabled = true;
        multiState.teacher.enabled = true;
        if (!multiState.teacher.signature) {
          multiState.teacher.signature = multiState.teacher.signature || '';
        }
        multiState.evaluator.enabled = true;
        if (!multiState.evaluator.signature) {
          multiState.evaluator.signature = generateEvaluatorSignatureSvg();
        }
        multiState.director.enabled = true;
        if (!multiState.director.signature) {
          multiState.director.signature = generateDirectorSignatureSvg();
        }
        renderModalUI();
        if (typeof showToast === 'function') {
          showToast('เปิดการประทับลายเซ็นครบ 3 ฝ่าย (ครู, วัดผล, ผอ.) เรียบร้อยแล้ว', 'success');
        }
      };
    }

    // Elements ของบทบาทปัจจุบัน
    const tabDraw = modal.querySelector('#tabSigDraw');
    const tabUpload = modal.querySelector('#tabSigUpload');
    const tabSelect = modal.querySelector('#tabSigSelect');
    const paneDraw = modal.querySelector('#paneSigDraw');
    const paneUpload = modal.querySelector('#paneSigUpload');
    const paneSelect = modal.querySelector('#paneSigSelect');

    const canvas = modal.querySelector('#sigCanvas');
    const note = modal.querySelector('#sigPlaceholderNote');
    const previewImg = modal.querySelector('#sigCurrentPreviewImg');
    const previewEmpty = modal.querySelector('#sigCurrentPreviewEmpty');
    const badge = modal.querySelector('#sigStatusBadge');
    const nameInput = modal.querySelector('#sigTeacherNameInput');
    const previewNameText = modal.querySelector('#sigPreviewNameText');

    nameInput.oninput = () => {
      curRole.name = nameInput.value.trim();
      if (previewNameText) {
        previewNameText.textContent = `( ${nameInput.value.trim() || '...................................................'} )`;
      }
    };

    modal.querySelectorAll('.btn-quick-name').forEach(btn => {
      btn.onclick = () => {
        const n = btn.getAttribute('data-name');
        if (n) {
          nameInput.value = n;
          curRole.name = n;
          if (previewNameText) previewNameText.textContent = `( ${n} )`;
          nameInput.focus();
        }
      };
    });

    const updatePreviewSig = (url) => {
      curRole.signature = url || '';
      if (url) {
        previewImg.src = url;
        previewImg.classList.remove('hidden');
        previewEmpty.classList.add('hidden');
        badge.textContent = '✓ พร้อมประทับลงเอกสาร';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all';
      } else {
        previewImg.src = '';
        previewImg.classList.add('hidden');
        previewEmpty.classList.remove('hidden');
        badge.textContent = '○ รอการวาดหรือเลือก';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 transition-all';
      }
    };

    // Canvas Setup
    let isDrawing = false;
    let hasStrokes = !!curRole.signature;
    const ctx = canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;

    const setupCanvas = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = (rect.width || 400) * dpr;
      canvas.height = (rect.height || 185) * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;

      if (curRole.signature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 20, 20, (rect.width - 40) || 300, (rect.height - 40) || 120);
        };
        img.src = curRole.signature;
      }
    };

    setTimeout(setupCanvas, 40);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDraw = (e) => {
      e.preventDefault();
      isDrawing = true;
      hasStrokes = true;
      if (note) note.classList.add('hidden');
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = () => {
      if (!isDrawing) return;
      isDrawing = false;
      const trimmed = trimCanvasWhitespace(canvas);
      if (trimmed) updatePreviewSig(trimmed);
    };

    if (canvas) {
      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDraw);
      canvas.addEventListener('mouseleave', stopDraw);
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDraw);
    }

    // Color buttons
    const btnBlue = modal.querySelector('#btnColorBlue');
    const btnBlack = modal.querySelector('#btnColorBlack');
    if (btnBlue && btnBlack) {
      btnBlue.onclick = () => {
        penColor = '#002B9E';
        if (ctx) ctx.strokeStyle = penColor;
        btnBlue.innerHTML = "<i class='bx bx-check text-white text-xs'></i>";
        btnBlue.className = "w-7 h-7 rounded-full border-2 border-indigo-600 shadow-sm relative flex items-center justify-center transition-transform hover:scale-105";
        btnBlack.innerHTML = "";
        btnBlack.className = "w-7 h-7 rounded-full border-2 border-transparent shadow-sm relative flex items-center justify-center transition-transform hover:scale-105";
      };
      btnBlack.onclick = () => {
        penColor = '#0F172A';
        if (ctx) ctx.strokeStyle = penColor;
        btnBlack.innerHTML = "<i class='bx bx-check text-white text-xs'></i>";
        btnBlack.className = "w-7 h-7 rounded-full border-2 border-indigo-600 shadow-sm relative flex items-center justify-center transition-transform hover:scale-105";
        btnBlue.innerHTML = "";
        btnBlue.className = "w-7 h-7 rounded-full border-2 border-transparent shadow-sm relative flex items-center justify-center transition-transform hover:scale-105";
      };
    }

    // Pen size buttons
    const btnThin = modal.querySelector('#btnSizeThin');
    const btnNormal = modal.querySelector('#btnSizeNormal');
    const btnThick = modal.querySelector('#btnSizeThick');
    const setSizeActive = (btn, size) => {
      penWidth = size;
      if (ctx) ctx.lineWidth = size;
      [btnThin, btnNormal, btnThick].forEach(b => {
        b.className = "px-2.5 py-1 text-[11px] rounded-lg text-slate-600 hover:text-slate-900 font-medium transition-all";
      });
      btn.className = "px-2.5 py-1 text-[11px] rounded-lg bg-white text-indigo-700 shadow-2xs font-bold transition-all";
    };
    if (btnThin) btnThin.onclick = () => setSizeActive(btnThin, 1.6);
    if (btnNormal) btnNormal.onclick = () => setSizeActive(btnNormal, 2.4);
    if (btnThick) btnThick.onclick = () => setSizeActive(btnThick, 3.8);

    // Clear Canvas
    const btnClear = modal.querySelector('#btnClearSigCanvas');
    if (btnClear) {
      btnClear.onclick = () => {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasStrokes = false;
        if (note) note.classList.remove('hidden');
        updatePreviewSig('');
      };
    }

    // Tabs switching
    const setTab = (target) => {
      [tabDraw, tabUpload, tabSelect].forEach(t => {
        t.className = "flex-1 py-2 rounded-xl transition-all text-center text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5";
      });
      [paneDraw, paneUpload, paneSelect].forEach(p => p.classList.add('hidden'));

      if (target === 'draw') {
        tabDraw.className = "flex-1 py-2 rounded-xl transition-all text-center bg-white shadow-xs text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60";
        paneDraw.classList.remove('hidden');
        setTimeout(setupCanvas, 20);
      } else if (target === 'upload') {
        tabUpload.className = "flex-1 py-2 rounded-xl transition-all text-center bg-white shadow-xs text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60";
        paneUpload.classList.remove('hidden');
      } else if (target === 'select') {
        tabSelect.className = "flex-1 py-2 rounded-xl transition-all text-center bg-white shadow-xs text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200/60";
        paneSelect.classList.remove('hidden');
        loadTeachersList();
      }
    };

    if (tabDraw) tabDraw.onclick = () => setTab('draw');
    if (tabUpload) tabUpload.onclick = () => setTab('upload');
    if (tabSelect) tabSelect.onclick = () => setTab('select');

    // File Upload
    const fileInput = modal.querySelector('#sigFileInput');
    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            processSignatureImage(img, (cleanDataUrl) => {
              updatePreviewSig(cleanDataUrl);
              setTab('draw');
              setupCanvas();
            });
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      };
    }

    // Teacher select loader
    let masterTeachersList = [];
    const selectEl = modal.querySelector('#sigTeacherSelect');
    const badgeCount = modal.querySelector('#sigTeacherCountBadge');
    const searchInput = modal.querySelector('#sigTeacherSearchInput');

    const renderTeacherOptions = (list) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      if (!list || list.length === 0) {
        selectEl.innerHTML = '<option value="" disabled class="p-2 text-slate-400">ไม่พบบุคลากรตามคำค้นหา</option>';
        return;
      }
      list.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id || t.name;
        opt.className = 'py-1.5 px-2.5 rounded-lg hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs';
        const hasS = !!(t.signature && t.signature.length > 20);
        opt.textContent = `${t.name || '-'} (${t.position || 'ครู'}) ${hasS ? '✍️ มีลายเซ็น' : '○ ยังไม่มีลายเซ็น'}`;
        opt.dataset.signature = t.signature || '';
        opt.dataset.name = t.name || '';
        selectEl.appendChild(opt);
      });
    };

    const loadTeachersList = () => {
      if (masterTeachersList.length > 0) return;
      const localTeachers = (typeof APP !== 'undefined' && APP.personnel)
        ? APP.personnel.filter(p => p.status === 'active' || !p.status)
        : [];
      if (localTeachers.length > 0) {
        masterTeachersList = localTeachers;
        renderTeacherOptions(masterTeachersList);
        if (badgeCount) badgeCount.textContent = `${masterTeachersList.length} ท่าน`;
      } else {
        if (badgeCount) badgeCount.textContent = 'พร้อมใช้งาน';
      }
    };

    if (selectEl) {
      selectEl.onchange = () => {
        const opt = selectEl.options[selectEl.selectedIndex];
        if (!opt) return;
        const sUrl = opt.dataset.signature;
        const sName = opt.dataset.name;
        if (sName) {
          nameInput.value = sName;
          curRole.name = sName;
          if (previewNameText) previewNameText.textContent = `( ${sName} )`;
        }
        if (sUrl && sUrl.length > 20) {
          updatePreviewSig(sUrl);
          setTab('draw');
          setupCanvas();
        }
      };
    }

    if (searchInput) {
      searchInput.oninput = () => {
        const q = searchInput.value.trim().toLowerCase();
        const filtered = masterTeachersList.filter(t => (t.name || '').toLowerCase().includes(q) || (t.position || '').toLowerCase().includes(q));
        renderTeacherOptions(filtered);
      };
    }

    // Modal Close and Save Handlers
    const closeModal = () => { modal.style.display = 'none'; };
    const btnClose = modal.querySelector('#btnCloseSigManager');
    const btnCancel = modal.querySelector('#btnCancelSigManager');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    // คลิกพื้นหลังสีเข้มภายนอกเพื่อปิดหน้าต่างได้
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    const escHandler = (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    const btnSave = modal.querySelector('#btnSaveSigManager');
    if (btnSave) {
      btnSave.onclick = () => {
        if (nameInput) curRole.name = nameInput.value.trim();
        multiState.masterEnabled = true;

        savePrintMultiSignatureState(multiState);

        if (typeof showToast === 'function') {
          showToast('บันทึกและเปิดใช้งานลายเซ็นผู้ลงนามเรียบร้อยแล้ว', 'success');
        }

        closeModal();
        if (typeof onSaved === 'function') onSaved(multiState);
      };
    }
  };

  try {
    renderModalUI();
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Error rendering signature manager modal:', err);
    modal.style.display = 'none';
  }

  // โหลดแคชข้อมูลห้องเรียนและครูประจำชั้นเตรียมไว้ (เมื่อพร้อมจะรีเฟรช UI ให้ทันที)
  ensureClassroomTeachersMap(() => {
    if (modal && modal.style.display !== 'none' && currentRoleId === 'teacher') {
      try {
        renderModalUI();
      } catch (e) {
        console.error('Error updating signature modal after map load:', e);
      }
    }
  });
}

// 7. หน้าต่างตัวอย่างเอกสารสำหรับพิมพ์ (Universal Executive Print Preview Modal)
function showPrintPreviewModal(html, docTitle, directUrl) {
  let modal = document.getElementById('printDocModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'printDocModal';
    modal.className = 'fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex flex-col';
    modal.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    modal.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    document.body.appendChild(modal);
  }

  // ฟังก์ชันวิเคราะห์ทิศทางหน้ากระดาษที่เหมาะสมที่สุดโดยอัตโนมัติ (Smart Auto-Orientation Detector)
  function detectDocOrientation(rawHtml, title) {
    if (!rawHtml) return 'portrait';
    const lower = rawHtml.toLowerCase();
    if (lower.includes('size: a4 landscape') || lower.includes('size:landscape') || lower.includes('size: landscape') || lower.includes('a4 landscape')) {
      return 'landscape';
    }
    if (lower.includes('size: a4 portrait') || lower.includes('size:portrait') || lower.includes('size: portrait') || lower.includes('a4 portrait')) {
      return 'portrait';
    }
    const tLower = (title || '').toLowerCase();
    if (tLower.includes('ตารางเรียน') || tLower.includes('ตารางสอน') || tLower.includes('ปฏิทิน') || 
        tLower.includes('ปพ.5') || tLower.includes('ปพ.๕') || tLower.includes('แบบบันทึกผลการเรียน') ||
        tLower.includes('เมทริกซ์') || tLower.includes('เปรียบเทียบทุกรายวิชา')) {
      return 'landscape';
    }
    return 'portrait';
  }

  modal._rawHtml = html;
  modal._currentTitle = docTitle || 'ตัวอย่างเอกสารสำหรับพิมพ์';
  modal._currentDirectUrl = directUrl || '';
  modal._currentOrientation = detectDocOrientation(html, docTitle);

  // สร้างและอัปเดต Toolbar ด้านบนให้สวยงาม คมชัด และรองรับ Responsive บนมือถือ 100%
  modal.innerHTML = `
    <!-- Universal Executive Print Toolbar (Responsive Header: Desktop 56px, Mobile 2-tier) -->
    <div class="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 py-2 shadow-2xs z-20 flex-shrink-0 select-none">
      <div class="flex items-center justify-between gap-2">
        <!-- Left: Document Information (Title & Status) -->
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center text-base sm:text-lg shadow-2xs flex-shrink-0">
            <i class='bx bxs-file-pdf'></i>
          </div>
          <div class="min-w-0">
            <span id="printDocModalTitle" class="text-xs sm:text-sm font-bold text-slate-800 truncate block">ตัวอย่างเอกสารสำหรับพิมพ์</span>
            <span class="text-[10px] text-slate-400 font-normal hidden md:block">ตรวจสอบความถูกต้อง ทิศทางหน้ากระดาษ และลายเซ็นทุกฝ่ายก่อนสั่งพิมพ์ (A4)</span>
          </div>
        </div>

        <!-- Right: Actions (Desktop Secondary Tools + Universal Print Button + Close Button) -->
        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <!-- Desktop Secondary Tools (Hidden on mobile via pure CSS .print-topbar-desktop-only) -->
          <div class="print-topbar-desktop-only">
            <!-- ปุ่มสลับทิศทางหน้ากระดาษ -->
            <button id="btnToggleOrientationAction" type="button" class="print-topbar-btn print-btn-secondary px-2.5 sm:px-3 text-xs" title="คลิกเพื่อสลับทิศทางหน้ากระดาษ">
              <i id="orientationIcon" class='bx bx-layout text-sm text-indigo-600'></i>
              <span id="orientationText">แนวนอน (A4)</span>
            </button>

            <!-- ปุ่มเปิด/ปิดลายเซ็น -->
            <button id="btnToggleSignatureAction" type="button" class="print-topbar-btn print-btn-secondary px-2.5 sm:px-3.5 text-xs" title="คลิกเพื่อเปิด/ปิดการใส่ลายเซ็น">
              <span id="sigToggleDot" class="sig-status-dot"></span>
              <i class='bx bx-edit-alt text-sm'></i>
              <span id="sigToggleText">ลายเซ็น: ปิดอยู่</span>
            </button>

            <!-- ปุ่มตั้งค่าลายเซ็นทุกฝ่าย -->
            <button id="btnConfigSignatureAction" type="button" class="print-topbar-btn print-topbar-btn-icon print-btn-secondary" title="ศูนย์จัดการลายเซ็นทุกฝ่าย">
              <i class='bx bx-slider-alt text-base leading-none'></i>
            </button>
          </div>

          <!-- UNIVERSAL PRIMARY PRINT BUTTON: Always visible in Row 1 on BOTH Mobile and Desktop! -->
          <button id="btnPrintModalAction" type="button" class="print-topbar-btn print-btn-primary" title="พิมพ์เอกสารออกทางเครื่องพิมพ์ หรือ AirPrint ทันที">
            <i class='bx bx-printer text-base sm:text-lg leading-none'></i>
            <span class="print-lbl-desktop">พิมพ์เอกสาร</span>
            <span class="print-lbl-mobile">พิมพ์</span>
          </button>

          <!-- Close Button (Always visible on BOTH Mobile and Desktop, fixed at top-right) -->
          <button id="btnClosePrintModalAction" type="button" class="print-topbar-btn print-topbar-btn-icon print-btn-close w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg" title="ปิดหน้าต่าง">
            <i class='bx bx-x text-2xl leading-none'></i>
          </button>
        </div>
      </div>

      <!-- Mobile Sub-Toolbar (Row 2, visible on <= 640px via pure CSS .print-topbar-mobile-subbar) -->
      <div class="print-topbar-mobile-subbar">
        <!-- ปุ่มพิมพ์เอกสารซ้ำใน Row 2 เพื่อความสะดวกพิเศษของผู้ใช้มือถือ -->
        <button id="btnPrintModalActionMobile" type="button" class="print-topbar-btn print-btn-primary print-btn-sm" title="พิมพ์เอกสาร / AirPrint">
          <i class='bx bx-printer text-sm'></i>
          <span>พิมพ์เอกสาร</span>
        </button>

        <!-- สลับทิศทางหน้ากระดาษ -->
        <button id="btnToggleOrientationActionMobile" type="button" class="print-topbar-btn print-btn-secondary print-btn-sm" title="สลับทิศทางหน้ากระดาษ">
          <i id="orientationIconMobile" class='bx bx-layout text-sm text-indigo-600'></i>
          <span id="orientationTextMobile">แนวนอน</span>
        </button>

        <!-- เปิด/ปิดลายเซ็น -->
        <button id="btnToggleSignatureActionMobile" type="button" class="print-topbar-btn print-btn-secondary print-btn-sm" title="เปิด/ปิดลายเซ็น">
          <span id="sigToggleDotMobile" class="sig-status-dot"></span>
          <span id="sigToggleTextMobile">ลายเซ็น</span>
        </button>

        <!-- ตั้งค่าลายเซ็น -->
        <button id="btnConfigSignatureActionMobile" type="button" class="print-topbar-btn print-topbar-btn-icon print-btn-secondary print-btn-sm" title="ตั้งค่าลายเซ็นทุกฝ่าย">
          <i class='bx bx-slider-alt text-base leading-none'></i>
        </button>
      </div>
    </div>
    <div class="flex-1 w-full bg-slate-200 overflow-auto relative flex flex-col p-0 sm:p-2" style="-webkit-overflow-scrolling: touch;">
      <iframe id="printDocIframe" class="w-full h-full border-0 bg-slate-100 sm:rounded-lg sm:shadow-lg" style="min-width:0; min-height:0; width:100%; height:100%; flex:1 1 0%;"></iframe>
    </div>
  `;

  const closeHandler = () => {
    modal.style.display = 'none';
    const printArea = document.getElementById('inAppPrintArea');
    if (printArea) printArea.innerHTML = '';
    document.body.classList.remove('is-printing-doc');
    const dynamicStyle = document.getElementById('mhcDynamicPrintPageStyle');
    if (dynamicStyle) dynamicStyle.textContent = '';
  };

  document.getElementById('btnClosePrintModalAction').onclick = closeHandler;

  const triggerPrintAction = () => {
    const env = getPrintEnv();
    // กรณีเปิดจากไอคอน Smart School บนหน้าจอโฮม iPhone (iOS Standalone WebClip ซึ่งระบบ iOS ปิดกั้น window.print()):
    // ให้เปิดเมนู AirPrint ผ่าน iOS Share Sheet ทันทีด้วยไฟล์ที่เตรียมไว้ล่วงหน้า
    if (env.isIOSStandalone) {
      triggerIOSStandaloneAirPrint(modal._currentHtml, modal._currentTitle);
      return;
    }
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
    if (!isMobileDevice) {
      const iframe = document.getElementById('printDocIframe');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          return;
        } catch (err) {
          console.warn('iframe print failed, fallback to in-app print:', err);
        }
      }
    }
    // บนอุปกรณ์มือถือ (Android / iOS / OPPO Reno) หรือเบราว์เซอร์ทั่วไป เรียกใช้งาน in-app print ทันที
    window.triggerInAppPrint();
  };

  const btnPrintDesktop = document.getElementById('btnPrintModalAction');
  const btnPrintMobile = document.getElementById('btnPrintModalActionMobile');
  if (btnPrintDesktop) btnPrintDesktop.onclick = triggerPrintAction;
  if (btnPrintMobile) btnPrintMobile.onclick = triggerPrintAction;

  // ป้องกันค้างสถานะ is-printing-doc เมื่อผู้ใช้พิมพ์เสร็จหรือปิดกล่องพิมพ์
  if (!window._mhcPrintCleanupInit) {
    window._mhcPrintCleanupInit = true;
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('is-printing-doc');
    });
    window.addEventListener('focus', () => {
      if (document.body.classList.contains('is-printing-doc')) {
        setTimeout(() => document.body.classList.remove('is-printing-doc'), 400);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeHandler();
    }
  });

  const titleEl = document.getElementById('printDocModalTitle');
  if (titleEl) titleEl.textContent = modal._currentTitle;

  const updateOrientationBtnUI = () => {
    const isLand = modal._currentOrientation === 'landscape';
    const icon = document.getElementById('orientationIcon');
    const txt = document.getElementById('orientationText');
    const btn = document.getElementById('btnToggleOrientationAction');
    const iconM = document.getElementById('orientationIconMobile');
    const txtM = document.getElementById('orientationTextMobile');
    const btnM = document.getElementById('btnToggleOrientationActionMobile');

    if (isLand) {
      if (btn) btn.className = 'print-topbar-btn print-btn-secondary px-2.5 sm:px-3 text-indigo-900 bg-indigo-50 border-indigo-300 font-bold text-xs';
      if (icon) icon.className = 'bx bx-layout text-sm text-indigo-600';
      if (txt) txt.textContent = 'แนวนอน (A4)';
      if (btnM) btnM.className = 'print-topbar-btn print-btn-secondary print-btn-sm text-indigo-900 bg-indigo-50 border-indigo-300 font-bold';
      if (iconM) iconM.className = 'bx bx-layout text-sm text-indigo-600';
      if (txtM) txtM.textContent = 'แนวนอน';
    } else {
      if (btn) btn.className = 'print-topbar-btn print-btn-secondary px-2.5 sm:px-3 text-slate-700 font-semibold text-xs';
      if (icon) icon.className = 'bx bx-file text-sm text-slate-500';
      if (txt) txt.textContent = 'แนวตั้ง (A4)';
      if (btnM) btnM.className = 'print-topbar-btn print-btn-secondary print-btn-sm text-slate-700 font-semibold';
      if (iconM) iconM.className = 'bx bx-file text-sm text-slate-500';
      if (txtM) txtM.textContent = 'แนวตั้ง';
    }
  };

  const updateToggleBtnUI = () => {
    const multi = getPrintMultiSignatureState();
    const dot = document.getElementById('sigToggleDot');
    const txt = document.getElementById('sigToggleText');
    const btn = document.getElementById('btnToggleSignatureAction');
    const dotM = document.getElementById('sigToggleDotMobile');
    const txtM = document.getElementById('sigToggleTextMobile');
    const btnM = document.getElementById('btnToggleSignatureActionMobile');

    const activeList = [];
    if (multi.teacher.enabled) activeList.push('ครู');
    if (multi.evaluator.enabled && multi.evaluator.signature) activeList.push('วัดผล');
    if (multi.director.enabled) activeList.push('ผอ.');
    if (multi.parent.enabled && multi.parent.signature) activeList.push('ผู้ปกครอง');

    const hasAnyActive = multi.masterEnabled && activeList.length > 0;

    if (hasAnyActive) {
      if (btn) btn.className = 'print-topbar-btn print-btn-secondary px-2.5 sm:px-3.5 border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs';
      if (dot) dot.className = 'sig-status-dot bg-emerald-500 animate-pulse';
      if (txt) txt.textContent = activeList.length >= 3 ? 'ลายเซ็น: ครบทุกฝ่าย (เปิด)' : `ลายเซ็น: เปิด (${activeList.join(', ')})`;
      if (btnM) btnM.className = 'print-topbar-btn print-btn-secondary print-btn-sm border-emerald-300 bg-emerald-50 text-emerald-800 font-bold';
      if (dotM) dotM.className = 'sig-status-dot bg-emerald-500 animate-pulse';
      if (txtM) txtM.textContent = `ลายเซ็น (${activeList.length} ฝ่าย)`;
    } else {
      if (btn) btn.className = 'print-topbar-btn print-btn-secondary px-2.5 sm:px-3.5 text-slate-600 font-semibold text-xs';
      if (dot) dot.className = 'sig-status-dot bg-slate-300';
      if (txt) txt.textContent = 'ลายเซ็น: ปิดอยู่';
      if (btnM) btnM.className = 'print-topbar-btn print-btn-secondary print-btn-sm text-slate-600 font-semibold';
      if (dotM) dotM.className = 'sig-status-dot bg-slate-300';
      if (txtM) txtM.textContent = 'ลายเซ็น: ปิด';
    }
  };

  const refreshPreview = () => {
    const multi = getPrintMultiSignatureState();
    const defaultLogo = window.OFFICIAL_SCHOOL_LOGO_DATA_URL || 'school-logo.png';
    let signedHtml = applySignatureToDocument(modal._rawHtml, multi);
    if (signedHtml && window.OFFICIAL_SCHOOL_LOGO_DATA_URL) {
      signedHtml = signedHtml
        .replace(/https:\/\/lh3\.googleusercontent\.com\/d\/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN/g, defaultLogo)
        .replace(/src=["']school-logo\.png["']/g, `src="${defaultLogo}"`);
    }
    modal._currentHtml = signedHtml;
    updateToggleBtnUI();
    updateOrientationBtnUI();

    const isLand = modal._currentOrientation === 'landscape';
    prepareInAppPrintArea(modal._currentHtml, isLand);

    // หากเปิดใช้งานจากไอคอน Smart School บนหน้าจอโฮม iPhone (isIOSStandalone):
    // ให้เรนเดอร์ไฟล์สำหรับ AirPrint เตรียมไว้ในหน่วยความจำแบบเงียบๆ ทันที เพื่อให้กดปุ่ม "พิมพ์เอกสาร" แล้วเด้งขึ้นทันทีในคลิกเดียว
    const env = getPrintEnv();
    if (env.isIOSStandalone) {
      modal._prebuiltPdfFile = null;
      if (modal._prebuiltTimer) clearTimeout(modal._prebuiltTimer);
      const snapHtml = modal._currentHtml;
      const snapTitle = modal._currentTitle;
      modal._prebuiltTimer = setTimeout(() => {
        const safeT = getSafePrintTitle(snapTitle);
        modal._prebuiltPdfPromise = generatePdfFromHtml(snapHtml, snapTitle, 'blob', { silent: true })
          .then(blob => {
            if (blob && modal._currentHtml === snapHtml) {
              modal._prebuiltPdfFile = new File([blob], `${safeT}.pdf`, { type: 'application/pdf' });
            }
            return blob;
          })
          .catch(() => null);
      }, 150);
    }

    const iframe = document.getElementById('printDocIframe');
    if (iframe) {
      const cleanOverride = `
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <style id="cleanPreviewOverride">
          @page {
            size: A4 ${isLand ? 'landscape' : 'portrait'} !important;
            margin: ${isLand ? '5mm 6mm 6mm 6mm' : '8mm 8mm 8mm 8mm'} !important;
          }
          .no-print, .no-print-bar { display: none !important; }
          html {
            width: 100% !important;
            min-width: 0 !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
          }
          body {
            background: #F1F5F9 !important;
            padding: 8px 4px !important;
            margin: 0 auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            box-sizing: border-box !important;
          }
          .print-page-wrapper, .print-doc, .pp6-container, .schedule-page, .calendar-container, .pp5-sheet {
            margin: 8px auto !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08) !important;
            padding: ${isLand ? '10px 14px' : '10px 12px'} !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            background: #FFFFFF !important;
          }
          table:not(.cal-table):not(.schedule-table) {
            max-width: 100% !important;
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          .schedule-page table, table.schedule-table {
            max-width: 100% !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            border: 2px solid #000000 !important;
          }
          .schedule-page table tr {
            min-height: 48px !important;
          }
          .schedule-page table th, .schedule-page table td {
            border: 1px solid #000000 !important;
            vertical-align: middle !important;
            box-sizing: border-box !important;
          }
          .schedule-page table th:nth-child(1), .schedule-page table td:nth-child(1) { width: 9% !important; }
          .schedule-page table th:nth-child(2), .schedule-page table td:nth-child(2) { width: 10% !important; }
          .schedule-page table th:nth-child(3), .schedule-page table td:nth-child(3) { width: 9.6% !important; }
          .schedule-page table th:nth-child(4), .schedule-page table td:nth-child(4) { width: 9.6% !important; }
          .schedule-page table th:nth-child(5), .schedule-page table td:nth-child(5) { width: 9.6% !important; }
          .schedule-page table th:nth-child(6), .schedule-page table td:nth-child(6) { width: 9.6% !important; }
          .schedule-page table th:nth-child(7), .schedule-page table td:nth-child(7) { width: 7.6% !important; }
          .schedule-page table th:nth-child(8), .schedule-page table td:nth-child(8) { width: 9.6% !important; }
          .schedule-page table th:nth-child(9), .schedule-page table td:nth-child(9) { width: 9.6% !important; }
          .schedule-page table th:nth-child(10), .schedule-page table td:nth-child(10) { width: 9.6% !important; }
          table.cal-table {
            max-width: 100% !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .cal-month-body {
            display: flex !important;
            flex-direction: row !important;
            gap: 10px !important;
            align-items: stretch !important;
            flex: 1 1 auto !important;
            margin: 3px 0 5px 0 !important;
            height: auto !important;
          }
          .cal-grid-col {
            flex: 0 0 64% !important;
            max-width: 64% !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .cal-events-col {
            flex: 0 0 36% !important;
            max-width: 36% !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .grid-month-page {
            height: 188mm !important;
            min-height: 188mm !important;
            max-height: 188mm !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .grid-month-page .sig-container {
            margin-top: auto !important;
            margin-bottom: 2px !important;
          }
          .grid-month-page .print-footer {
            margin-top: 4px !important;
            padding-top: 3px !important;
          }
          .sig-stamp-zone {
            height: 48px !important;
            min-height: 48px !important;
            max-height: 48px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-end !important;
            margin: 0 auto 3px auto !important;
          }
          .teacher-sig-img, .mhc-sig-img {
            max-height: 44px !important;
            max-width: 145px !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
            vertical-align: middle !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sig-line:empty {
            border-bottom: 1px dotted #64748B !important;
            width: 170px !important;
            margin: 0 auto 4px auto !important;
            padding-bottom: 0 !important;
            min-height: 0 !important;
          }
          .sig-line:not(:empty) {
            border-bottom: none !important;
            width: auto !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
          }
          .sig-row, .signature-row, .signatures, .sig-container {
            display: flex !important;
            justify-content: space-around !important;
            align-items: flex-start !important;
            margin-top: 20px !important;
            text-align: center !important;
            font-size: 11px !important;
            gap: 16px !important;
            flex-wrap: nowrap !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .sig-box {
            flex: 1 !important;
            min-width: 200px !important;
            max-width: 340px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .sig-dots {
            white-space: nowrap !important;
            font-size: 10.5px !important;
            color: #334155 !important;
          }
          .sig-name {
            font-weight: 600 !important;
            font-size: 11px !important;
            color: #0F172A !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
          }
          .sig-title, .sig-date {
            font-size: 10.5px !important;
            color: #334155 !important;
            margin-top: 2px !important;
            white-space: nowrap !important;
          }
          /* ป้องกันการทับซ้อนข้อความท้ายเอกสารกับชื่อผู้บริหาร */
          .footer, .print-footer {
            position: static !important;
            margin-top: 18px !important;
            padding-top: 6px !important;
            border-top: 1px solid #CBD5E1 !important;
            display: flex !important;
            justify-content: space-between !important;
            font-size: 7.5pt !important;
            color: #64748B !important;
            clear: both !important;
            page-break-inside: avoid !important;
          }
          @media print {
            @page {
              size: A4 ${isLand ? 'landscape' : 'portrait'} !important;
              margin: ${isLand ? '5mm 6mm 6mm 6mm' : '8mm 10mm 10mm 10mm'} !important;
            }
            html, body {
              background: #FFFFFF !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              zoom: 1 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page-wrapper, .print-doc, .pp6-container, .pp5-sheet, .schedule-page, .calendar-container, .receipt-box, div {
              overflow: visible !important;
              height: auto !important;
              max-height: none !important;
            }
            .print-page-wrapper, .print-doc, .pp6-container, .pp5-sheet, .schedule-page, .calendar-container, .receipt-box {
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              width: 100% !important;
              max-width: ${isLand ? '1020px' : '760px'} !important;
              min-width: 0 !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-page-wrapper:last-child, .schedule-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .workload {
              text-align: right !important;
              margin-bottom: 6px !important;
              font-size: 11px !important;
              color: #475569 !important;
            }
            table:not(.cal-table) {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              table-layout: auto !important;
              page-break-inside: auto !important;
              border-collapse: collapse !important;
              border-radius: 0 !important;
              overflow: visible !important;
            }
            .schedule-page table, table.schedule-table {
              border: 2px solid #000000 !important;
              table-layout: fixed !important;
              width: 100% !important;
            }
            .schedule-page table tr {
              min-height: 48px !important;
            }
            .schedule-page th,
            .schedule-page td {
              border: 1px solid #000000 !important;
              vertical-align: middle !important;
              box-sizing: border-box !important;
            }
            .schedule-page table th:nth-child(1), .schedule-page table td:nth-child(1) { width: 9% !important; }
            .schedule-page table th:nth-child(2), .schedule-page table td:nth-child(2) { width: 10% !important; }
            .schedule-page table th:nth-child(3), .schedule-page table td:nth-child(3) { width: 9.6% !important; }
            .schedule-page table th:nth-child(4), .schedule-page table td:nth-child(4) { width: 9.6% !important; }
            .schedule-page table th:nth-child(5), .schedule-page table td:nth-child(5) { width: 9.6% !important; }
            .schedule-page table th:nth-child(6), .schedule-page table td:nth-child(6) { width: 9.6% !important; }
            .schedule-page table th:nth-child(7), .schedule-page table td:nth-child(7) { width: 7.6% !important; }
            .schedule-page table th:nth-child(8), .schedule-page table td:nth-child(8) { width: 9.6% !important; }
            .schedule-page table th:nth-child(9), .schedule-page table td:nth-child(9) { width: 9.6% !important; }
            .schedule-page table th:nth-child(10), .schedule-page table td:nth-child(10) { width: 9.6% !important; }
            .sig-line:empty {
              border-bottom: 1px dotted #64748B !important;
              width: 170px !important;
              margin: 0 auto 4px auto !important;
            }
            table.cal-table {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              table-layout: fixed !important;
              page-break-inside: auto !important;
              border-collapse: collapse !important;
            }
            .cal-month-body {
              display: flex !important;
              flex-direction: row !important;
              gap: 10px !important;
              align-items: stretch !important;
              flex: 1 1 auto !important;
              margin: 3px 0 5px 0 !important;
              height: auto !important;
            }
            .cal-grid-col {
              flex: 0 0 64% !important;
              max-width: 64% !important;
              min-width: 0 !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .cal-events-col {
              flex: 0 0 36% !important;
              max-width: 36% !important;
              min-width: 0 !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .grid-month-page {
              width: 100% !important;
              max-width: 100% !important;
              height: 188mm !important;
              min-height: 188mm !important;
              max-height: 188mm !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              box-sizing: border-box !important;
            }
            .grid-month-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            thead { display: table-header-group !important; }
            tfoot { display: table-footer-group !important; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            th, td {
              min-width: 0 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              word-break: break-word !important;
              overflow-wrap: break-word !important;
            }
            .signatures, .sig-container, .signature-grid, .sig-row, .signature-row {
              display: flex !important;
              justify-content: space-around !important;
              flex-wrap: nowrap !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-top: auto !important;
              margin-bottom: 2px !important;
            }
            .footer, .print-footer {
              position: static !important;
              margin-top: 4px !important;
              padding-top: 3px !important;
              page-break-inside: avoid !important;
            }
            .no-print, .no-print-bar { display: none !important; }
          }
        </style>
        <script>
          (function() {
            function fitDocToScreen() {
              try {
                var isLand = ${isLand ? 'true' : 'false'};
                var targetWidth = isLand ? 1020 : 760;
                var availWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
                if (!availWidth || availWidth < 50) {
                  try {
                    if (window.parent && window.parent.innerWidth) {
                      availWidth = window.parent.innerWidth;
                    }
                  } catch(_) {}
                }
                if (!availWidth) availWidth = 375;

                if (availWidth > 0 && availWidth < targetWidth) {
                  var pad = availWidth < 480 ? 8 : 16;
                  var scale = (availWidth - pad) / targetWidth;
                  if (scale < 0.25) scale = 0.25;
                  if (scale > 1) scale = 1;

                  document.documentElement.style.overflowX = 'auto';
                  document.documentElement.style.webkitOverflowScrolling = 'touch';
                  document.body.style.overflowX = 'auto';
                  document.body.style.webkitOverflowScrolling = 'touch';
                  try { document.body.style.zoom = scale; } catch(_) {}
                  document.body.style.width = targetWidth + 'px';
                  document.body.style.maxWidth = targetWidth + 'px';
                  document.body.style.minWidth = '0';
                  document.body.style.margin = '4px auto';
                  document.body.style.boxSizing = 'border-box';
                } else {
                  document.documentElement.style.overflowX = 'auto';
                  document.documentElement.style.webkitOverflowScrolling = 'touch';
                  document.body.style.overflowX = 'auto';
                  document.body.style.webkitOverflowScrolling = 'touch';
                  try { document.body.style.zoom = '1'; } catch(_) {}
                  document.body.style.width = '100%';
                  document.body.style.maxWidth = isLand ? '285mm' : '205mm';
                  document.body.style.minWidth = '0';
                  document.body.style.margin = '0 auto';
                }
              } catch(err) {
                console.warn('fitDocToScreen err:', err);
              }
            }
            window.addEventListener('resize', fitDocToScreen);
            window.addEventListener('orientationchange', fitDocToScreen);
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', fitDocToScreen);
            } else {
              fitDocToScreen();
            }
            setTimeout(fitDocToScreen, 20);
            setTimeout(fitDocToScreen, 120);
            setTimeout(fitDocToScreen, 450);
          })();
        <\/script>
      `;
      iframe.style.minHeight = '0';
      iframe.srcdoc = modal._currentHtml.includes('</head>')
        ? modal._currentHtml.replace('</head>', cleanOverride + '</head>')
        : cleanOverride + modal._currentHtml;
    }
  };

  const toggleOrientationHandler = () => {
    modal._currentOrientation = (modal._currentOrientation === 'landscape') ? 'portrait' : 'landscape';
    updateOrientationBtnUI();
    refreshPreview();
    if (typeof showToast === 'function') {
      showToast(
        modal._currentOrientation === 'landscape'
          ? 'สลับเป็นหน้ากระดาษ "แนวนอน (Landscape)" แล้ว'
          : 'สลับเป็นหน้ากระดาษ "แนวตั้ง (Portrait)" แล้ว',
        'info'
      );
    }
  };

  const btnOriDesktop = document.getElementById('btnToggleOrientationAction');
  const btnOriMobile = document.getElementById('btnToggleOrientationActionMobile');
  if (btnOriDesktop) btnOriDesktop.onclick = toggleOrientationHandler;
  if (btnOriMobile) btnOriMobile.onclick = toggleOrientationHandler;

  const toggleSignatureHandler = () => {
    const multi = getPrintMultiSignatureState();
    multi.masterEnabled = !multi.masterEnabled;
    savePrintMultiSignatureState(multi);
    refreshPreview();
    if (typeof showToast === 'function') {
      showToast(multi.masterEnabled ? 'เปิดการประทับลายเซ็นแล้ว' : 'ปิดการประทับลายเซ็นแล้ว', 'info');
    }
  };

  const btnSigDesktop = document.getElementById('btnToggleSignatureAction');
  const btnSigMobile = document.getElementById('btnToggleSignatureActionMobile');
  if (btnSigDesktop) btnSigDesktop.onclick = toggleSignatureHandler;
  if (btnSigMobile) btnSigMobile.onclick = toggleSignatureHandler;

  const configSignatureHandler = () => {
    showSignatureManagerModal(() => {
      refreshPreview();
    });
  };

  const btnCfgDesktop = document.getElementById('btnConfigSignatureAction');
  const btnCfgMobile = document.getElementById('btnConfigSignatureActionMobile');
  if (btnCfgDesktop) btnCfgDesktop.onclick = configSignatureHandler;
  if (btnCfgMobile) btnCfgMobile.onclick = configSignatureHandler;

  refreshPreview();
  ensureClassroomTeachersMap(() => {
    refreshPreview();
  });
  modal.style.display = 'flex';
}
function openHTMLDocument(html, docTitle, directUrl) {
  if (!html) return;
  const title = docTitle || 'ตัวอย่างเอกสารสำหรับพิมพ์';
  showPrintPreviewModal(html, title, directUrl);
}


/* ============================================================
 *  ACADEMIC
 * ============================================================ */
function normalizeGradeLevel(str) {
  if (!str) return '';
  return String(str).trim().split('/')[0].trim();
}

const AcademicState = {
  tab: 'subjects',     // 'subjects' | 'grades' | 'gpa'
  sgsTab: 'S',         // 'S' (ผลการเรียน) | 'Q' (คุณลักษณะ) | 'L' (อ่านคิดวิเคราะห์) | 'ALL' (ตารางรวม)
  sgsMode: 'sgs5',     // 'sgs5' (10 ช่อง) | 'sgs3' (6 ช่อง) | 'sgs10' (20 ช่อง) | 'compact' (โหมดย่อ)
  page: 1,
  search: '',
  subject_group: '',
  grade_level: '',
  data: null,
  teachers: [],
  currentSubject: null,
  gradeRows: [],
  academic_year: '',
  semester: '',
  currentSubjectClassroom: '',
  allSubjects: []
};

function renderAcademic(container) {
  container.innerHTML = `
    ${pageHeader('งานวิชาการ', 'bxs-book-content', '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="tab-pill" style="max-width:520px;">
          <button id="acTabSubjects" class="active" onclick="switchAcademicTab('subjects')">
            <i class='bx bx-book-open'>\x3c/i> รายวิชา
          \x3c/button>
          <button id="acTabGrades" onclick="switchAcademicTab('grades')">
            <i class='bx bx-edit'>\x3c/i> บันทึก ปพ.5
          \x3c/button>
          <button id="acTabGPA" onclick="switchAcademicTab('gpa')">
            <i class='bx bx-trophy'>\x3c/i> GPA / ปพ.6
          \x3c/button>
        \x3c/div>

        <div id="acSubjects" class="mt-4">\x3c/div>
        <div id="acGrades"   class="mt-4" style="display:none;">\x3c/div>
        <div id="acGPA"      class="mt-4" style="display:none;">\x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  // โหลด teachers สำหรับ dropdown
  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success') AcademicState.teachers = res.data;
    })
    .getTeachersForDropdown(APP.token);

  renderAcademicSubjects();
}

function switchAcademicTab(tab) {
  AcademicState.tab = tab;
  ['Subjects','Grades','GPA'].forEach(t => {
    document.getElementById('acTab' + t).classList.toggle('active', t.toLowerCase() === tab);
    document.getElementById('ac' + t).style.display = (t.toLowerCase() === tab) ? '' : 'none';
  });
  if (tab === 'subjects' && !document.getElementById('subjectsTable')) renderAcademicSubjects();
  if (tab === 'grades'   && !document.getElementById('gradesArea'))    renderAcademicGrades();
  if (tab === 'gpa'      && !document.getElementById('gpaArea'))       renderAcademicGPA();
}


/* ----- Subjects ----- */
let _selectedSubjectIds = new Set();

function renderAcademicSubjects() {
  const el = document.getElementById('acSubjects');
  if (!el) return;
  el.innerHTML = `
    <div class="flex justify-between items-center flex-wrap gap-2 mb-3">
      <div class="text-base font-semibold text-slate-700 flex items-center gap-1.5">
        <i class='bx bx-book-open text-primary text-xl'>\x3c/i> รายวิชาที่เปิดสอน
      \x3c/div>
      <div class="flex flex-wrap items-center gap-2">
        ${APP.role !== 'teacher' ? `
        <button id="btnDeleteSelectedSubjects" class="btn" style="background:#dc2626; color:#ffffff; font-weight:600; display:none;" onclick="deleteSelectedSubjects()">
          <i class='bx bx-trash'>\x3c/i> ลบที่เลือก (<span id="selectedSubjectsCount">0</span>)
        \x3c/button>
        <button id="btnDeleteSemesterSubjects" class="btn btn-light" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2; display:none;" onclick="confirmDeleteCurrentSemesterSubjects()">
          <i class='bx bx-trash-alt'>\x3c/i> ลบทั้งหมดในเทอมนี้
        \x3c/button>
        <button class="btn btn-light" onclick="showImportSubjectsCSV()"><i class='bx bx-import'>\x3c/i> นำเข้า CSV\x3c/button>
        ` : ''}
        <button class="btn btn-blue" onclick="openSubjectForm()"><i class='bx bx-plus'>\x3c/i> เพิ่มรายวิชา\x3c/button>
      \x3c/div>
    \x3c/div>

    <!-- Filters row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 mb-3">
      <div class="sm:col-span-2 lg:col-span-4 relative">
        <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
        <input type="text" id="subSearch" placeholder="ค้นหา รหัสวิชา / ชื่อวิชา / ครูผู้สอน"
               class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
               oninput="onSubjectSearch()" value="${escapeHTML(AcademicState.search)}">
      \x3c/div>
      <div class="lg:col-span-2">
        <select id="subYear" onchange="onSubjectFilter()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">ทุกปีการศึกษา\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="lg:col-span-2">
        <select id="subSemester" onchange="onSubjectFilter()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
          <option value="">ทุกภาคเรียน (เทอม)\x3c/option>
          <option value="1" ${String(AcademicState.semester)==='1'?'selected':''}>ภาคเรียนที่ 1 (เทอม 1)\x3c/option>
          <option value="2" ${String(AcademicState.semester)==='2'?'selected':''}>ภาคเรียนที่ 2 (เทอม 2)\x3c/option>
          <option value="3" ${String(AcademicState.semester)==='3'?'selected':''}>ภาคฤดูร้อน\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="lg:col-span-2">
        <select id="subGroup" onchange="onSubjectFilter()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">ทุกกลุ่มสาระ\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="lg:col-span-2">
        <select id="subGrade" onchange="onSubjectFilter()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">ทุกระดับชั้น\x3c/option>
        \x3c/select>
      \x3c/div>
    \x3c/div>

    <!-- Selection Banner -->
    <div id="subjectSelectionBanner" class="p-2.5 mb-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between flex-wrap gap-2 text-sm text-rose-800" style="display:none;">
      <div class="flex items-center gap-2 font-medium">
        <i class='bx bx-check-square text-lg text-rose-600'>\x3c/i>
        <span>เลือกอยู่ <strong id="selectionBannerCount">0</strong> รายการ\x3c/span>
      \x3c/div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-sm btn-light border border-slate-300 text-slate-700" onclick="toggleSelectAllPage(true)">เลือกทั้งหมดในหน้านี้\x3c/button>
        <button type="button" class="btn btn-sm btn-light border border-slate-300 text-slate-700" onclick="clearSubjectSelection()">ยกเลิกการเลือก\x3c/button>
        <button type="button" class="btn btn-sm text-white" style="background:#dc2626;" onclick="deleteSelectedSubjects()"><i class='bx bx-trash'>\x3c/i> ลบที่เลือก\x3c/button>
      \x3c/div>
    \x3c/div>

    <div id="subjectsTable">
      <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
    \x3c/div>
  `;
  if (AcademicState.data && !AcademicState.search) {
    renderSubjectsTable(AcademicState.data);
    loadSubjects(true);
  } else {
    loadSubjects();
  }
}

let _subSearchTimer = null;
function onSubjectSearch() {
  AcademicState.search = document.getElementById('subSearch') ? document.getElementById('subSearch').value : '';
  AcademicState.page = 1;
  clearTimeout(_subSearchTimer);
  _subSearchTimer = setTimeout(loadSubjects, 300);
}

function onSubjectFilter() {
  AcademicState.search        = document.getElementById('subSearch') ? document.getElementById('subSearch').value : '';
  AcademicState.subject_group = document.getElementById('subGroup') ? document.getElementById('subGroup').value : '';
  AcademicState.grade_level   = document.getElementById('subGrade') ? document.getElementById('subGrade').value : '';
  AcademicState.semester      = document.getElementById('subSemester') ? document.getElementById('subSemester').value : '';
  AcademicState.academic_year = document.getElementById('subYear') ? document.getElementById('subYear').value : '';
  AcademicState.page = 1;
  loadSubjects();
}

function subjectsGoToPage(p) { 
  AcademicState.page = p; 
  loadSubjects(); 
}

function loadSubjects(silent) {
  const area = document.getElementById('subjectsTable');
  if (area && !silent && (!AcademicState.data || AcademicState.search)) {
    area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';
  }

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (!silent) showToast('error', res.message);
        return;
      }
      AcademicState.data = res;
      renderSubjectsTable(res);
    })
    .withFailureHandler(err => {
      if (!silent) showToast('error', err.message || err);
    })
    .getSubjects({
      page: AcademicState.page,
      search: AcademicState.search,
      subject_group: AcademicState.subject_group,
      grade_level: AcademicState.grade_level,
      semester: AcademicState.semester,
      academic_year: AcademicState.academic_year
    }, APP.token);
}

function renderSubjectsTable(res) {
  const gp = document.getElementById('subGroup');
  if (gp && res.distinct && res.distinct.groups) {
    const cur = AcademicState.subject_group;
    gp.innerHTML = '<option value="">ทุกกลุ่มสาระ\x3c/option>' +
      res.distinct.groups.map(g => `<option value="${escapeHTML(g)}" ${cur===g?'selected':''}>${escapeHTML(g)}\x3c/option>`).join('');
  }
  const gr = document.getElementById('subGrade');
  if (gr && res.distinct && res.distinct.grades) {
    const cur = AcademicState.grade_level;
    gr.innerHTML = '<option value="">ทุกระดับชั้น\x3c/option>' +
      res.distinct.grades.map(g => `<option value="${escapeHTML(g)}" ${cur===g?'selected':''}>${escapeHTML(g)}\x3c/option>`).join('');
  }
  const yr = document.getElementById('subYear');
  if (yr && res.distinct && res.distinct.years) {
    const cur = AcademicState.academic_year;
    yr.innerHTML = '<option value="">ทุกปีการศึกษา\x3c/option>' +
      res.distinct.years.map(y => `<option value="${escapeHTML(y)}" ${cur===String(y)?'selected':''}>${escapeHTML(y)}\x3c/option>`).join('');
  }
  const semSel = document.getElementById('subSemester');
  if (semSel && AcademicState.semester) {
    semSel.value = AcademicState.semester;
  }

  const semBtn = document.getElementById('btnDeleteSemesterSubjects');
  if (semBtn) {
    const hasSem = Boolean(AcademicState.semester && String(AcademicState.semester).trim() !== '');
    semBtn.style.display = (APP.role !== 'teacher' && hasSem) ? 'inline-flex' : 'none';
    if (hasSem) {
      const yrLabel = AcademicState.academic_year ? ` ปี ${escapeHTML(AcademicState.academic_year)}` : '';
      semBtn.innerHTML = `<i class='bx bx-trash-alt'>\x3c/i> ลบทั้งหมดในเทอม ${escapeHTML(AcademicState.semester)}${yrLabel}`;
    }
  }

  const area = document.getElementById('subjectsTable');
  if (!area) return;
  if (!res.data || res.data.length === 0) {
    const filterDesc = [
      AcademicState.academic_year ? `ปีการศึกษา ${AcademicState.academic_year}` : '',
      AcademicState.semester ? `เทอม ${AcademicState.semester}` : '',
      AcademicState.grade_level ? `ระดับชั้น ${AcademicState.grade_level}` : '',
      AcademicState.subject_group ? `กลุ่มสาระ ${AcademicState.subject_group}` : ''
    ].filter(Boolean).join(' · ');
    area.innerHTML = `<div class="empty-state"><i class='bx bx-folder-open'>\x3c/i>ไม่พบรายวิชา ${filterDesc ? `(${escapeHTML(filterDesc)})` : ''}\x3c/div>`;
    updateDeleteSelectedBtn();
    return;
  }

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            ${APP.role !== 'teacher' ? `<th class="px-3 py-2.5 rounded-l-lg w-10 text-center"><input type="checkbox" id="selectAllSubjects" onclick="toggleSelectAllSubjects(this)" style="cursor:pointer;" title="เลือกทั้งหมดในหน้านี้">\x3c/th>` : ''}
            <th class="px-3 py-2.5 text-left ${APP.role === 'teacher' ? 'rounded-l-lg' : ''}">รหัส\x3c/th>
            <th class="px-3 py-2.5 text-left">ชื่อวิชา\x3c/th>
            <th class="px-3 py-2.5 text-left">กลุ่มสาระ\x3c/th>
            <th class="px-3 py-2.5 text-left">ระดับชั้น\x3c/th>
            <th class="px-3 py-2.5 text-center">หน่วยกิต\x3c/th>
            <th class="px-3 py-2.5 text-left">ครูผู้สอน\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(s => {
            const isChecked = _selectedSubjectIds.has(s.id);
            return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 ${isChecked ? 'bg-rose-50/40' : ''}">
              ${APP.role !== 'teacher' ? `<td class="px-3 py-2.5 text-center"><input type="checkbox" class="subject-checkbox" value="${s.id}" ${isChecked ? 'checked' : ''} onchange="onSubjectCheckboxChange(this)" style="cursor:pointer;">\x3c/td>` : ''}
              <td class="px-3 py-2.5 font-mono text-xs font-semibold text-slate-700">${escapeHTML(s.subject_code || '-')}\x3c/td>
              <td class="px-3 py-2.5 font-semibold text-slate-800">${escapeHTML(s.subject_name || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.subject_group || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.grade_level || '-')} · เทอม ${escapeHTML(s.semester || '-')}\x3c/td>
              <td class="px-3 py-2.5 text-center font-semibold">${s.credit || 0}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.teacher_name || '-')}\x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  ${(APP.role !== 'teacher' || APP.user.username.toLowerCase() === (s.teacher_id||'').toLowerCase()) ? `
                  <button class="btn btn-light btn-icon text-primary" onclick="openSubjectForm('${s.id}')" title="แก้ไข"><i class='bx bx-edit'>\x3c/i>\x3c/button>
                  <button class="btn btn-light btn-icon text-danger" onclick="deleteSubjectConfirm('${s.id}')" title="ลบ"><i class='bx bx-trash'>\x3c/i>\x3c/button>
                  ` : '<span class="text-xs text-slate-400">วิชาของผู้อื่น\x3c/span>'}
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `;}).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'subjectsGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายวิชา\x3c/div>
  `;
  updateDeleteSelectedBtn();
}

function toggleSelectAllSubjects(el) {
  const checkboxes = document.querySelectorAll('.subject-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = el.checked;
    if (el.checked) {
      _selectedSubjectIds.add(cb.value);
    } else {
      _selectedSubjectIds.delete(cb.value);
    }
  });
  updateDeleteSelectedBtn();
}

function toggleSelectAllPage(select) {
  const checkboxes = document.querySelectorAll('.subject-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = select;
    if (select) _selectedSubjectIds.add(cb.value);
    else _selectedSubjectIds.delete(cb.value);
  });
  const selectAll = document.getElementById('selectAllSubjects');
  if (selectAll) selectAll.checked = select;
  updateDeleteSelectedBtn();
}

function onSubjectCheckboxChange(cb) {
  if (cb.checked) {
    _selectedSubjectIds.add(cb.value);
  } else {
    _selectedSubjectIds.delete(cb.value);
  }
  updateDeleteSelectedBtn();
}

function clearSubjectSelection() {
  _selectedSubjectIds.clear();
  const checkboxes = document.querySelectorAll('.subject-checkbox');
  checkboxes.forEach(cb => cb.checked = false);
  const selectAll = document.getElementById('selectAllSubjects');
  if (selectAll) selectAll.checked = false;
  updateDeleteSelectedBtn();
}

function updateDeleteSelectedBtn() {
  const count = _selectedSubjectIds.size;
  const btn = document.getElementById('btnDeleteSelectedSubjects');
  const countEl = document.getElementById('selectedSubjectsCount');
  const banner = document.getElementById('subjectSelectionBanner');
  const bannerCount = document.getElementById('selectionBannerCount');
  const selectAll = document.getElementById('selectAllSubjects');

  if (countEl) countEl.textContent = count;
  if (bannerCount) bannerCount.textContent = count;

  if (btn) btn.style.display = count > 0 ? 'inline-flex' : 'none';
  if (banner) banner.style.display = count > 0 ? 'flex' : 'none';

  const pageCheckboxes = document.querySelectorAll('.subject-checkbox');
  if (pageCheckboxes.length > 0) {
    const allChecked = Array.from(pageCheckboxes).every(cb => _selectedSubjectIds.has(cb.value));
    if (selectAll) selectAll.checked = allChecked && count > 0;
  }
}

function deleteSelectedSubjects() {
  const ids = Array.from(_selectedSubjectIds);
  if (ids.length === 0) return showToast('warning', 'กรุณาเลือกรายวิชาที่ต้องการลบ');

  Swal.fire({
    title: 'ยืนยันการลบรายวิชา?',
    html: `ต้องการลบรายวิชาที่เลือก <b>${ids.length} รายการ</b> ใช่หรือไม่?<br><span style="color:#dc2626; font-size:13px;">ข้อมูลเกรดและคะแนน ปพ.5 ที่เกี่ยวข้องจะถูกลบไปด้วย</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DC2626',
    confirmButtonText: `<i class='bx bx-trash'>\x3c/i> ใช่, ลบ ${ids.length} รายการ`,
    cancelButtonText: 'ยกเลิก'
  }).then((result) => {
    if (result.isConfirmed) {
      showLoading(`กำลังลบ ${ids.length} รายการ...`);
      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          if (res.status === 'success') {
            showToast('success', res.message);
            clearSubjectSelection();
            loadSubjects();
          } else {
            showToast('error', res.message);
          }
        })
        .withFailureHandler(err => { 
          hideLoading(); 
          showToast('error', err.message || err); 
        })
        .deleteSubjectsBulk(ids, APP.token);
    }
  });
}

function confirmDeleteCurrentSemesterSubjects() {
  const sem = AcademicState.semester;
  const year = AcademicState.academic_year;
  if (!sem) return showToast('warning', 'กรุณาเลือกภาคเรียน/เทอมที่ต้องการลบก่อน');

  const yearText = year ? ` ปีการศึกษา ${year}` : '';
  Swal.fire({
    title: `ลบรายวิชาทั้งหมดในเทอม ${sem}?`,
    html: `ต้องการลบ <b>รายวิชาทั้งหมดในภาคเรียนที่ ${escapeHTML(sem)}${escapeHTML(yearText)}</b> ใช่หรือไม่?<br><span style="color:#dc2626; font-size:13px;">คำเตือน: คะแนน ปพ.5 และข้อมูลวิชาในเทอมนี้ทั้งหมดจะถูกลบถาวร</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: '<i class="bx bx-trash">\x3c/i> ยืนยันลบทั้งหมดในเทอมนี้',
    cancelButtonText: 'ยกเลิก'
  }).then(res => {
    if (res.isConfirmed) {
      showLoading(`กำลังลบรายวิชาทั้งหมดในเทอม ${sem}...`);
      google.script.run
        .withSuccessHandler(r => {
          hideLoading();
          if (r.status === 'success') {
            showToast('success', r.message);
            clearSubjectSelection();
            loadSubjects();
          } else {
            showToast('error', r.message);
          }
        })
        .withFailureHandler(err => {
          hideLoading();
          showToast('error', err.message || err);
        })
        .deleteSubjectsBySemester({ semester: sem, academic_year: year }, APP.token);
    }
  });
}

let _csvImportSubjectRecords = [];

function showImportSubjectsCSV() {
  _csvImportSubjectRecords = [];
  if (!AcademicState.teachers || !AcademicState.teachers.length) {
    google.script.run
      .withSuccessHandler(res => {
        if (res.status === 'success') AcademicState.teachers = res.data;
      })
      .getTeachersForDropdown(APP.token);
  }

  Swal.fire({
    title: 'นำเข้ารายวิชาจาก CSV',
    width: 680,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-upload">\x3c/i> นำเข้า',
    cancelButtonText: 'ยกเลิก',
    showCloseButton: true,
    html: `
      <div style="text-align:left; font-size:14px;">
        <p class="text-sm text-slate-600 mb-2">
          ไฟล์ CSV ต้องมีหัวคอลัมน์ตามนี้ (UTF-8):
        \x3c/p>
        <code style="display:block; background:#F1F5F9; padding:8px 10px; border-radius:6px; font-size:11px; word-break:break-all;">
          subject_code,subject_name,subject_group,subject_type,credit,hours_per_week,grade_level,semester,academic_year,teacher_name
        \x3c/code>
        <div class="flex gap-2 mt-2">
          <button type="button" class="btn btn-outline" style="flex:1;" onclick="downloadSampleCSV('subjects')">
            <i class='bx bx-download'>\x3c/i> ดาวน์โหลดตัวอย่าง
          \x3c/button>
        \x3c/div>
        <div class="mt-3">
          <label class="form-label">เลือกไฟล์ CSV\x3c/label>
          <input type="file" accept=".csv,text/csv" class="form-input"
                 onchange="previewSubjectsCSV(this)">
        \x3c/div>
        <div id="csvSubjectPreviewBox" style="display:none; margin-top:12px;">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-slate-700">ตัวอย่างข้อมูล\x3c/span>
            <span id="csvSubjectPreviewCount" class="text-xs text-slate-500">\x3c/span>
          \x3c/div>
          <div style="max-height:260px; overflow:auto; border:1px solid #E2E8F0; border-radius:8px;">
            <table class="w-full text-xs" style="border-collapse:collapse;">
              <thead style="position:sticky; top:0; background:#F8FAFC;">
                <tr>
                  <th class="px-2 py-1.5 text-left font-semibold border-b" style="min-width:28px;">#\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">รหัสวิชา\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ชื่อวิชา\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">หน่วยกิต\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ชั้น\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ครูผู้สอน\x3c/th>
                \x3c/tr>
              \x3c/thead>
              <tbody id="csvSubjectPreviewBody">\x3c/tbody>
            \x3c/table>
          \x3c/div>
        \x3c/div>
        <style>
          .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
          .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; }
          #csvSubjectPreviewBody tr:nth-child(even) { background:#F8FAFC; }
          #csvSubjectPreviewBody td { padding:5px 8px; border-bottom:1px solid #F1F5F9; }
          #csvSubjectPreviewBody tr.warn td { background:#FEF2F2; color:#B91C1C; }
        \x3c/style>
      \x3c/div>
    `,
    preConfirm: () => {
      if (!_csvImportSubjectRecords.length) { Swal.showValidationMessage('กรุณาเลือกไฟล์ CSV ที่มีข้อมูล'); return false; }
      return _csvImportSubjectRecords;
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    confirmImportSubjectsCSV(r.value);
  });
}

function previewSubjectsCSV(input) {
  const file = input.files[0];
  const box = document.getElementById('csvSubjectPreviewBox');
  const body = document.getElementById('csvSubjectPreviewBody');
  const count = document.getElementById('csvSubjectPreviewCount');
  if (!file || !body) return;
  const reader = new FileReader();
  reader.onload = e => {
    const rows = parseCSV(e.target.result);
    if (rows.length < 2) { 
      body.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-3">ไม่พบข้อมูล\x3c/td>\x3c/tr>'; 
      box.style.display = 'block'; 
      return; 
    }
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
    const dataRows = rows.slice(1);

    const getVal = (rowMap, keys) => {
      for (let k of keys) {
        if (rowMap[k] !== undefined && rowMap[k] !== null && String(rowMap[k]).trim() !== '') {
          return String(rowMap[k]).trim();
        }
      }
      return '';
    };

    const normalizeName = str => {
      if (!str) return '';
      return String(str)
        .replace(/^(นาย|นางสาว|นาง|น\.ส\.|ดร\.|ว่าที่\s*ร\.ต\.|ว่าที่ร้อยตรี|ครู|อ\.|อาจารย์|ผอ\.)\s*/i, '')
        .replace(/[\s\.\-_]/g, '')
        .toLowerCase();
    };

    const records = dataRows.map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });

      const subject_code = getVal(obj, ['subject_code', 'code', 'รหัสวิชา', 'รหัส']);
      const subject_name = getVal(obj, ['subject_name', 'name', 'ชื่อวิชา', 'รายวิชา', 'ชื่อรายวิชา']);
      const subject_group = getVal(obj, ['subject_group', 'group', 'กลุ่มสาระ', 'กลุ่มสาระการเรียนรู้', 'หมวดวิชา']);
      const subject_type = getVal(obj, ['subject_type', 'type', 'ประเภทวิชา', 'ประเภท']) || 'basic';
      const credit = getVal(obj, ['credit', 'หน่วยกิต']) || '0';
      const hours_per_week = getVal(obj, ['hours_per_week', 'hours', 'ชั่วโมง', 'จำนวนชั่วโมง', 'คาบ']) || '0';
      const rawGrade = getVal(obj, ['grade_level', 'grade', 'ชั้น', 'ระดับชั้น']);
      const grade_level = normalizeGradeLevel(rawGrade);
      const semester = getVal(obj, ['semester', 'เทอม', 'ภาคเรียน']) || '1';
      const academic_year = getVal(obj, ['academic_year', 'year', 'ปีการศึกษา', 'ปี']) || '';
      const teacher_name_raw = getVal(obj, ['teacher_name', 'teacher', 'ครูผู้สอน', 'ครู', 'ผู้สอน', 'ชื่อครู']);

      let tId = '';
      let displayTeacherName = teacher_name_raw;

      if (teacher_name_raw && AcademicState.teachers && AcademicState.teachers.length) {
        const cleanInput = normalizeName(teacher_name_raw);
        const found = AcademicState.teachers.find(t => {
          const cleanT = normalizeName(t.name || '');
          return cleanT === cleanInput || 
                 (cleanInput.length >= 3 && (cleanT.includes(cleanInput) || cleanInput.includes(cleanT)));
        });
        if (found) {
          tId = found.id;
          displayTeacherName = found.name;
        }
      }

      return {
        subject_code,
        subject_name,
        subject_group,
        subject_type,
        credit,
        hours_per_week,
        grade_level,
        semester,
        academic_year,
        teacher_id: tId,
        teacher_name: displayTeacherName
      };
    }).filter(r => r.subject_name);

    // Deduplicate records by subject_code + grade_level + semester (merging rooms like ม.1/1, ม.1/2 into master grade ม.1)
    const dedupedRecords = [];
    const seenMap = new Map();
    records.forEach(r => {
      const codeKey = String(r.subject_code || r.subject_name).trim().toLowerCase();
      const key = `${codeKey}__${r.grade_level}__${r.semester}`;
      if (seenMap.has(key)) {
        const existing = seenMap.get(key);
        if (!existing.teacher_id && r.teacher_id) {
          existing.teacher_id = r.teacher_id;
          existing.teacher_name = r.teacher_name;
        }
      } else {
        seenMap.set(key, r);
        dedupedRecords.push(r);
      }
    });

    _csvImportSubjectRecords = dedupedRecords;

    body.innerHTML = dedupedRecords.map((r, i) => {
      const warn = !r.subject_code ? 'class="warn" title="รหัสวิชาว่างเปล่า"' : '';
      const teacherBadge = r.teacher_name 
        ? (r.teacher_id 
            ? `<span class="text-emerald-700 font-medium"><i class='bx bx-check-circle'>\x3c/i> ${escapeHTML(r.teacher_name)}\x3c/span>`
            : `<span class="text-amber-700 font-medium" title="จะจับคู่ชื่อครูกับฐานข้อมูลให้อัตโนมัติ"><i class='bx bx-user'>\x3c/i> ${escapeHTML(r.teacher_name)}\x3c/span>`)
        : '<span class="text-slate-400 italic">ไม่ระบุ\x3c/span>';

      return `
        <tr ${warn}>
          <td>${i+1}\x3c/td>
          <td class="font-mono">${escapeHTML(r.subject_code)}\x3c/td>
          <td>${escapeHTML(r.subject_name)}\x3c/td>
          <td>${escapeHTML(r.credit)}\x3c/td>
          <td>${escapeHTML(r.grade_level)}${r.academic_year ? ` (${escapeHTML(r.academic_year)})` : ' (ทุกปี)'}\x3c/td>
          <td>${teacherBadge}\x3c/td>
        \x3c/tr>
      `;
    }).join('');
    count.innerText = `พบ ${dedupedRecords.length} รายการ (ระดับชั้น)`;
    box.style.display = 'block';
  };
  reader.readAsText(file);
}

function confirmImportSubjectsCSV(records) {
  showLoading('กำลังนำเข้ารายวิชา...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      showToast('success', res.message);
      loadSubjects();
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .importSubjectsBulk(JSON.stringify(records), APP.token);
}

function openSubjectForm(id) {
  if (id) {
    showLoading('กำลังโหลด...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status !== 'success') return showToast('error', res.message);
        showSubjectForm(res.data);
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .getSubjectById(id, APP.token);
  } else {
    showSubjectForm(null);
  }
}

function showSubjectForm(data) {
  const s = data || {};
  const isEdit = !!s.id;
  const groups = ['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','สังคมศึกษาฯ','สุขศึกษาและพลศึกษา','ศิลปะ','การงานอาชีพ','ภาษาต่างประเทศ'];

  const curGrade = normalizeGradeLevel(s.grade_level || '');
  const stdGrades = ['ม.1','ม.2','ม.3','ม.4','ม.5','ม.6','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','อ.1','อ.2','อ.3'];
  const hasCustomGrade = curGrade && !stdGrades.includes(curGrade);

  Swal.fire({
    title: isEdit ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่',
    width: 680,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="sf_id" value="${escapeHTML(s.id || '')}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-4">
            <label class="form-label">รหัสวิชา\x3c/label>
            <input type="text" id="sf_subject_code" class="form-input" value="${escapeHTML(s.subject_code||'')}" placeholder="ค21101">
          \x3c/div>
          <div class="col-span-8">
            <label class="form-label">ชื่อวิชา <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="sf_subject_name" class="form-input" value="${escapeHTML(s.subject_name||'')}">
          \x3c/div>

          <div class="col-span-6">
            <label class="form-label">กลุ่มสาระ\x3c/label>
            <select id="sf_subject_group" class="form-input">
              <option value="">เลือก\x3c/option>
              ${groups.map(g => `<option value="${g}" ${s.subject_group===g?'selected':''}>${g}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ประเภทวิชา\x3c/label>
            <select id="sf_subject_type" class="form-input">
              <option value="basic"     ${(s.subject_type||'basic')==='basic'?'selected':''}>พื้นฐาน\x3c/option>
              <option value="additional"${s.subject_type==='additional'?'selected':''}>เพิ่มเติม\x3c/option>
              <option value="activity"  ${s.subject_type==='activity'?'selected':''}>กิจกรรม\x3c/option>
            \x3c/select>
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">ระดับชั้น <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="sf_grade_level" class="form-input font-medium">
              <option value="">-- เลือกระดับชั้น --\x3c/option>
              <optgroup label="มัธยมศึกษาตอนต้น">
                <option value="ม.1" ${curGrade==='ม.1'?'selected':''}>ม.1\x3c/option>
                <option value="ม.2" ${curGrade==='ม.2'?'selected':''}>ม.2\x3c/option>
                <option value="ม.3" ${curGrade==='ม.3'?'selected':''}>ม.3\x3c/option>
              </optgroup>
              <optgroup label="มัธยมศึกษาตอนปลาย">
                <option value="ม.4" ${curGrade==='ม.4'?'selected':''}>ม.4\x3c/option>
                <option value="ม.5" ${curGrade==='ม.5'?'selected':''}>ม.5\x3c/option>
                <option value="ม.6" ${curGrade==='ม.6'?'selected':''}>ม.6\x3c/option>
              </optgroup>
              <optgroup label="ประถมศึกษา">
                <option value="ป.1" ${curGrade==='ป.1'?'selected':''}>ป.1\x3c/option>
                <option value="ป.2" ${curGrade==='ป.2'?'selected':''}>ป.2\x3c/option>
                <option value="ป.3" ${curGrade==='ป.3'?'selected':''}>ป.3\x3c/option>
                <option value="ป.4" ${curGrade==='ป.4'?'selected':''}>ป.4\x3c/option>
                <option value="ป.5" ${curGrade==='ป.5'?'selected':''}>ป.5\x3c/option>
                <option value="ป.6" ${curGrade==='ป.6'?'selected':''}>ป.6\x3c/option>
              </optgroup>
              <optgroup label="ปฐมวัย / อนุบาล">
                <option value="อ.1" ${curGrade==='อ.1'?'selected':''}>อ.1\x3c/option>
                <option value="อ.2" ${curGrade==='อ.2'?'selected':''}>อ.2\x3c/option>
                <option value="อ.3" ${curGrade==='อ.3'?'selected':''}>อ.3\x3c/option>
              </optgroup>
              ${hasCustomGrade ? `<option value="${escapeHTML(curGrade)}" selected>${escapeHTML(curGrade)} (กำหนดเอง)\x3c/option>` : ''}
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เทอม (ภาคเรียน)\x3c/label>
            <select id="sf_semester" class="form-input font-medium">
              <option value="1" ${String(s.semester||'1')==='1'?'selected':''}>ภาคเรียนที่ 1 (เทอม 1)\x3c/option>
              <option value="2" ${String(s.semester)==='2'?'selected':''}>ภาคเรียนที่ 2 (เทอม 2)\x3c/option>
              <option value="3" ${String(s.semester)==='3'?'selected':''}>ภาคฤดูร้อน\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ปีการศึกษา <span class="text-xs text-slate-400 font-normal">(ไม่ระบุ = ใช้ทุกปี)</span>\x3c/label>
            <input type="text" id="sf_academic_year" class="form-input" placeholder="ใช้ได้ทุกปีการศึกษา" value="${escapeHTML(s.academic_year||'')}">
          \x3c/div>

          <div class="col-span-3">
            <label class="form-label">หน่วยกิต\x3c/label>
            <input type="number" step="0.5" id="sf_credit" class="form-input" value="${s.credit||1}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ชม./สัปดาห์\x3c/label>
            <input type="number" id="sf_hours_per_week" class="form-input" value="${s.hours_per_week||2}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">น.หนัก ระหว่างภาค\x3c/label>
            <input type="number" id="sf_midterm_weight" class="form-input" value="${s.midterm_weight||70}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">น.หนัก ปลายภาค\x3c/label>
            <input type="number" id="sf_final_weight" class="form-input" value="${s.final_weight||30}">
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ครูผู้สอน\x3c/label>
            <select id="sf_teacher_id" class="form-input" ${APP.role === 'teacher' ? 'disabled' : ''}>
              <option value="">เลือก\x3c/option>
              ${AcademicState.teachers.map(t => {
                const isSelected = (s.teacher_id === t.id) || (!s.id && APP.role === 'teacher' && APP.user.username.toLowerCase() === (t.id||'').toLowerCase());
                var deptStr = t.department ? '(' + escapeHTML(t.department) + ')' : '';
                return '<option value="' + t.id + '" ' + (isSelected ? 'selected' : '') + '>' + escapeHTML(t.name) + ' ' + deptStr + '\x3c/option>';
              }).join('')}
            \x3c/select>
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const name = document.getElementById('sf_subject_name').value.trim();
      if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อวิชา'); return false; }
      const grade = normalizeGradeLevel(document.getElementById('sf_grade_level').value);
      if (!grade) { Swal.showValidationMessage('กรุณาเลือกระดับชั้น'); return false; }
      return {
        id: document.getElementById('sf_id').value || null,
        subject_code  : document.getElementById('sf_subject_code').value,
        subject_name  : name,
        subject_group : document.getElementById('sf_subject_group').value,
        subject_type  : document.getElementById('sf_subject_type').value,
        grade_level   : grade,
        semester      : document.getElementById('sf_semester').value,
        academic_year : document.getElementById('sf_academic_year').value,
        credit        : document.getElementById('sf_credit').value,
        hours_per_week: document.getElementById('sf_hours_per_week').value,
        midterm_weight: document.getElementById('sf_midterm_weight').value,
        final_weight  : document.getElementById('sf_final_weight').value,
        teacher_id    : document.getElementById('sf_teacher_id').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadSubjects(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
      .saveSubject(r.value, APP.token);
  });
}

function deleteSubjectConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', text:'รวมถึงคะแนนทั้งหมดของวิชานี้',
    icon:'warning', showCancelButton:true,
    confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadSubjects(); }
        else showToast('error', res.message);
      })
      .deleteSubject(id, APP.token);
  });
}


/* ----- Grades (ปพ.5) ----- */
function renderAcademicGrades() {
  const el = document.getElementById('acGrades');
  if (!el) return;
  el.innerHTML = `
    <div class="text-base font-semibold text-slate-700 mb-3">
      <i class='bx bx-edit mr-1 text-primary' >\x3c/i> บันทึกคะแนน ปพ.5
    \x3c/div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 mb-3">
      <div class="md:col-span-2">
        <select id="grYear" onchange="onGradesFilterChange()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">เลือกปีการศึกษา\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="md:col-span-2">
        <select id="grSem" onchange="onGradesFilterChange()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">เลือกเทอม\x3c/option>
          <option value="1">เทอม 1\x3c/option>
          <option value="2">เทอม 2\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="md:col-span-5">
        <select id="grSubject" onchange="onGrSubjectChange()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">เลือกรายวิชา\x3c/option>
        \x3c/select>
      \x3c/div>
      <div class="md:col-span-3">
        <select id="grClassroom" onchange="loadGradeSheet()"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
          <option value="">ทุกห้องเรียน\x3c/option>
        \x3c/select>
      \x3c/div>
    \x3c/div>
    <div class="flex justify-end mb-3">
      <button class="btn btn-blue" onclick="loadGradeSheet()">
        <i class='bx bx-show'>\x3c/i> เปิดตารางคะแนน
      \x3c/button>
    \x3c/div>

    <div id="gradesArea">
      <div class="empty-state">
        <i class='bx bx-bookmark'>\x3c/i>
        เลือกปีการศึกษา → เทอม → รายวิชา เพื่อเริ่มบันทึก ปพ.5
      \x3c/div>
    \x3c/div>
  `;

  // ดึงรายวิชามาใส่ dropdown
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return;
      AcademicState.allSubjects = res.data || [];
      // สร้าง distinct years โดยมีปีปัจจุบันเป็นค่าตั้งต้นเสมอ
      const curYear = APP.dashboardData?.config?.academic_year || String(new Date().getFullYear() + 543);
      const curSem  = APP.dashboardData?.config?.semester || '1';
      
      const yearSet = new Set(AcademicState.allSubjects.map(s => String(s.academic_year || '').trim()).filter(Boolean));
      if (curYear) yearSet.add(curYear);
      const curYNum = parseInt(curYear, 10);
      if (!isNaN(curYNum)) {
        yearSet.add(String(curYNum - 1));
        yearSet.add(String(curYNum - 2));
      }
      const years = Array.from(yearSet).sort().reverse();
      
      const yrSel = document.getElementById('grYear');
      yrSel.innerHTML = '<option value="">เลือกปีการศึกษา\x3c/option>' +
        years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}\x3c/option>`).join('');
      
      if (curYear) yrSel.value = curYear;
      const semSel = document.getElementById('grSem');
      if (curSem) semSel.value = curSem;
      onGradesFilterChange();
    })
    .getSubjects({ per_page:1000 }, APP.token);
}

function onGrSubjectChange() {
  const roomSel = document.getElementById('grClassroom');
  if (roomSel) roomSel.innerHTML = '<option value="">ทุกห้องเรียน\x3c/option>';
  AcademicState.currentSubjectClassroom = '';
}

function onGradesFilterChange() {
  const year = document.getElementById('grYear').value;
  const sem  = document.getElementById('grSem').value;
  const sel  = document.getElementById('grSubject');
  const subjects = (AcademicState.allSubjects || []).filter(s => {
    const yMatch = !year || !s.academic_year || String(s.academic_year).trim() === '' || String(s.academic_year).trim() === String(year).trim();
    const sMatch = !sem  || !s.semester || String(s.semester).trim() === '' || String(s.semester).trim() === String(sem).trim();
    return yMatch && sMatch;
  });
  sel.innerHTML = '<option value="">เลือกรายวิชา\x3c/option>' +
    subjects.map(s =>
      `<option value="${s.id}">${escapeHTML(s.subject_code||'')} ${escapeHTML(s.subject_name||'')} · ${escapeHTML(s.grade_level||'')} (${s.semester ? `เทอม ${escapeHTML(s.semester)}` : 'ทุกเทอม'})\x3c/option>`
    ).join('');
  onGrSubjectChange();
}

function loadGradeSheet() {
  const subjectId = document.getElementById('grSubject').value;
  if (!subjectId) return showToast('warning', 'กรุณาเลือกวิชา');
  const year = document.getElementById('grYear').value || (APP.dashboardData?.config?.academic_year || '');
  const sem  = document.getElementById('grSem').value || '1';
  const classroom = document.getElementById('grClassroom') ? document.getElementById('grClassroom').value : '';

  AcademicState.currentSubjectYear = year;
  AcademicState.currentSubjectSem = sem;
  AcademicState.currentSubjectClassroom = classroom;

  const area = document.getElementById('gradesArea');
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(res.message)}\x3c/div>`;
        return;
      }
      AcademicState.currentSubject = res.subject;
      AcademicState.gradeRows = res.data;

      // Update classrooms dropdown if available
      const roomSel = document.getElementById('grClassroom');
      if (roomSel && res.classrooms) {
        const curRoom = classroom;
        roomSel.innerHTML = '<option value="">ทุกห้องเรียน\x3c/option>' +
          res.classrooms.map(c => `<option value="${escapeHTML(c)}" ${curRoom === c ? 'selected' : ''}>ห้อง ${escapeHTML(c)}\x3c/option>`).join('');
      }

      renderGradeSheetTable();
    })
    .withFailureHandler(err => { area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(err.message||err)}\x3c/div>`; })
    .getGradeSheet(subjectId, APP.token, year, sem, classroom);
}

function switchSgsGradeTab(tab) {
  AcademicState.sgsTab = tab;
  renderGradeSheetTable();
}

function switchSgsMode(mode) {
  AcademicState.sgsMode = mode || 'sgs5';
  renderGradeSheetTable();
}

function calculateAvgQL(scoresObj, count) {
  if (!scoresObj) return '';
  let sum = 0;
  let filled = 0;
  const prefix = count === 8 ? 'Q' : 'L';
  for (let i = 1; i <= count; i++) {
    const v = scoresObj[prefix + i];
    if (v !== '' && v != null && !isNaN(v)) {
      sum += Number(v);
      filled++;
    }
  }
  if (filled === 0) return '';
  const avg = sum / filled;
  if (avg >= 2.5) return '3';
  if (avg >= 1.5) return '2';
  if (avg >= 1.0) return '1';
  return '0';
}

function quickFillQ(val) {
  if (!AcademicState.gradeRows || AcademicState.gradeRows.length === 0) return;
  AcademicState.gradeRows.forEach((r, i) => {
    r.q_scores = r.q_scores || {};
    for (let q = 1; q <= 8; q++) {
      r.q_scores['Q' + q] = val === '' ? '' : Number(val);
      const inp = document.querySelector(`.g-q[data-row="${i}"][data-q="${q}"]`);
      if (inp) inp.value = val;
    }
    r.character_result = val === '' ? '' : String(val);
    const sumEl = document.querySelector(`.g-q-summary[data-row="${i}"]`);
    if (sumEl) sumEl.value = r.character_result;
  });
  if (val !== '') {
    const textMap = { 3: 'ดีเยี่ยม (3)', 2: 'ดี (2)', 1: 'ผ่าน (1)', 0: 'ไม่ผ่าน (0)' };
    showToast('success', `กรอกคุณลักษณะเป็น "${textMap[val] || val}" ให้ทุกคนเรียบร้อย`);
  } else {
    showToast('info', 'ล้างค่าคุณลักษณะทั้งหมดแล้ว');
  }
}

function quickFillL(val) {
  if (!AcademicState.gradeRows || AcademicState.gradeRows.length === 0) return;
  AcademicState.gradeRows.forEach((r, i) => {
    r.l_scores = r.l_scores || {};
    for (let l = 1; l <= 5; l++) {
      r.l_scores['L' + l] = val === '' ? '' : Number(val);
      const inp = document.querySelector(`.g-l[data-row="${i}"][data-q="${l}"]`);
      if (inp) inp.value = val;
    }
    r.reading_result = val === '' ? '' : String(val);
    const sumEl = document.querySelector(`.g-l-summary[data-row="${i}"]`);
    if (sumEl) sumEl.value = r.reading_result;
  });
  if (val !== '') {
    const textMap = { 3: 'ดีเยี่ยม (3)', 2: 'ดี (2)', 1: 'ผ่าน (1)', 0: 'ไม่ผ่าน (0)' };
    showToast('success', `กรอกการอ่าน คิดวิเคราะห์เป็น "${textMap[val] || val}" ให้ทุกคนเรียบร้อย`);
  } else {
    showToast('info', 'ล้างค่าอ่านคิดวิเคราะห์ทั้งหมดแล้ว');
  }
}

function quickFillAttendance(pct) {
  if (!AcademicState.gradeRows || AcademicState.gradeRows.length === 0) return;
  const defTot = AcademicState.currentSubject?.total_hours || 40;
  AcademicState.gradeRows.forEach((r, i) => {
    const tot = Number(r.total_hours) || defTot;
    const att = Math.round((tot * (pct / 100)) * 10) / 10;
    r.attendance_hours = att;
    r.total_hours = tot;
    const attInp = document.querySelector(`.g-att[data-row="${i}"]`);
    const totInp = document.querySelector(`.g-tot[data-row="${i}"]`);
    if (attInp) attInp.value = att;
    if (totInp) totInp.value = tot;
    recalcGradeRow(i);
  });
  showToast('success', `ตั้งค่าเวลาเรียน ${pct}% ให้ทุกคนเรียบร้อย`);
}

function recalcQRow(i) {
  const row = AcademicState.gradeRows[i];
  if (!row) return;
  row.q_scores = row.q_scores || {};
  for (let q = 1; q <= 8; q++) {
    const inp = document.querySelector(`.g-q[data-row="${i}"][data-q="${q}"]`);
    if (inp) {
      const val = inp.value.trim();
      row.q_scores['Q' + q] = val === '' ? '' : Number(val);
    }
  }
  const summaryEl = document.querySelector(`.g-q-summary[data-row="${i}"]`);
  const autoVal = calculateAvgQL(row.q_scores, 8);
  if (summaryEl) {
    if (summaryEl.dataset.manual !== 'true') {
      summaryEl.value = autoVal;
      row.character_result = autoVal;
    } else {
      row.character_result = summaryEl.value;
    }
  } else {
    row.character_result = autoVal;
  }
}

function recalcLRow(i) {
  const row = AcademicState.gradeRows[i];
  if (!row) return;
  row.l_scores = row.l_scores || {};
  for (let l = 1; l <= 5; l++) {
    const inp = document.querySelector(`.g-l[data-row="${i}"][data-q="${l}"]`);
    if (inp) {
      const val = inp.value.trim();
      row.l_scores['L' + l] = val === '' ? '' : Number(val);
    }
  }
  const summaryEl = document.querySelector(`.g-l-summary[data-row="${i}"]`);
  const autoVal = calculateAvgQL(row.l_scores, 5);
  if (summaryEl) {
    if (summaryEl.dataset.manual !== 'true') {
      summaryEl.value = autoVal;
      row.reading_result = autoVal;
    } else {
      row.reading_result = summaryEl.value;
    }
  } else {
    row.reading_result = autoVal;
  }
}

function recalcGradeRow(i) {
  const get = sel => document.querySelector(`#gradeTable .g-${sel}[data-row="${i}"]`);
  const row = AcademicState.gradeRows[i];
  if (!row) return;

  row.s_scores = row.s_scores || {};
  // อ่านค่าคะแนนเก็บย่อย S ที่แสดงอยู่ในตาราง ณ ปัจจุบัน
  document.querySelectorAll(`#gradeTable .g-s[data-row="${i}"]`).forEach(inp => {
    const sNum = inp.dataset.s;
    const sVal = inp.value.trim();
    row.s_scores['S' + sNum] = (sVal === '' ? '' : Number(sVal));
  });

  const mode = AcademicState.sgsMode || 'sgs5';
  let beforeRange = [];
  let afterRange = [];
  if (mode === 'sgs3') {
    beforeRange = [1, 2, 3];
    afterRange = [4, 5, 6];
  } else if (mode === 'sgs5') {
    beforeRange = [1, 2, 3, 4, 5];
    afterRange = [6, 7, 8, 9, 10];
  } else if (mode === 'sgs10') {
    beforeRange = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    afterRange = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  }

  let sumSBefore = 0;
  let hasSBefore = false;
  beforeRange.forEach(n => {
    const v = row.s_scores['S' + n];
    if (v !== '' && v != null && !isNaN(v)) {
      sumSBefore += Number(v);
      hasSBefore = true;
    }
  });

  let sumSAfter = 0;
  let hasSAfter = false;
  afterRange.forEach(n => {
    const v = row.s_scores['S' + n];
    if (v !== '' && v != null && !isNaN(v)) {
      sumSAfter += Number(v);
      hasSAfter = true;
    }
  });

  const midEl = get('midterm');
  const finEl = get('final');
  const attEl = get('att');
  const totEl = get('tot');
  const specialEl = get('special');

  const mid = midEl ? parseFloat(midEl.value) : (row.score_midterm !== '' && row.score_midterm != null ? parseFloat(row.score_midterm) : NaN);
  const fin = finEl ? parseFloat(finEl.value) : (row.score_final !== '' && row.score_final != null ? parseFloat(row.score_final) : NaN);
  const att = attEl ? parseFloat(attEl.value) : (row.attendance_hours !== '' && row.attendance_hours != null ? parseFloat(row.attendance_hours) : NaN);
  const tot = totEl ? parseFloat(totEl.value) : (row.total_hours !== '' && row.total_hours != null ? parseFloat(row.total_hours) : NaN);
  const special = specialEl ? specialEl.value : (row.grade_special || '');

  // อัปเดตตัวเลขแสดงผลในแต่ละช่องสรุปย่อย
  const sBeforeEl = get('s-before-sum');
  if (sBeforeEl) sBeforeEl.textContent = hasSBefore ? (Math.round(sumSBefore * 10) / 10) : '-';

  const betweenEl = get('between-sum');
  let between = null;
  if (hasSBefore) {
    between = sumSBefore + (!isNaN(mid) ? mid : 0);
  } else if (!isNaN(mid)) {
    between = mid;
  }
  if (betweenEl) betweenEl.textContent = (between !== null) ? (Math.round(between * 10) / 10) : '-';

  const sAfterEl = get('s-after-sum');
  if (sAfterEl) sAfterEl.textContent = hasSAfter ? (Math.round(sumSAfter * 10) / 10) : '-';

  // รวม 100 คะแนน
  let total = null;
  if (hasSBefore || hasSAfter) {
    total = (hasSBefore ? sumSBefore : 0) +
            (!isNaN(mid) ? mid : 0) +
            (hasSAfter ? sumSAfter : 0) +
            (!isNaN(fin) ? fin : 0);
  } else {
    if (!isNaN(mid) && !isNaN(fin)) total = mid + fin;
    else if (!isNaN(mid)) total = mid;
    else if (!isNaN(fin)) total = fin;
  }

  const totalEl = get('total');
  if (totalEl) totalEl.textContent = (total === null) ? '-' : Number(total).toFixed(total % 1 ? 1 : 0);

  // คำนวณ % เวลาเรียน
  let pct = null;
  if (!isNaN(att) && !isNaN(tot) && tot > 0) pct = Math.round((att / tot) * 1000) / 10;
  const pctEl = get('pct');
  if (pctEl) {
    pctEl.textContent = (pct === null) ? '-' : pct + '%';
    pctEl.className = 'grade-output g-pct ' + (pct === null ? '' : (pct < 80 ? 'grade-fail' : 'grade-pass'));
  }

  // คำนวณเกรด (0 - 4 หรือ มส / ผลพิเศษ)
  let grade = '-';
  if (special) {
    grade = special;
    const gEl = get('grade');
    if (gEl) {
      gEl.className = 'grade-output g-grade grade-fail';
      gEl.textContent = grade;
    }
  } else if (pct !== null && pct < 80) {
    grade = 'มส';
    const gEl = get('grade');
    if (gEl) {
      gEl.className = 'grade-output g-grade grade-fail';
      gEl.textContent = grade;
    }
  } else if (total !== null) {
    if (total >= 80) grade = '4';
    else if (total >= 75) grade = '3.5';
    else if (total >= 70) grade = '3';
    else if (total >= 65) grade = '2.5';
    else if (total >= 60) grade = '2';
    else if (total >= 55) grade = '1.5';
    else if (total >= 50) grade = '1';
    else grade = '0';
    const gEl = get('grade');
    if (gEl) {
      gEl.className = 'grade-output g-grade ' + (Number(grade) >= 1 ? 'grade-pass' : 'grade-fail');
      gEl.textContent = grade;
    }
  } else {
    const gEl = get('grade');
    if (gEl) {
      gEl.className = 'grade-output g-grade';
      gEl.textContent = '-';
    }
  }

  // ซิงค์ข้อมูลเข้า State
  if (midEl) row.score_midterm = isNaN(mid) ? '' : mid;
  if (finEl) row.score_final   = isNaN(fin) ? '' : fin;
  row.score_total              = total;
  if (attEl) row.attendance_hours = isNaN(att) ? '' : att;
  if (totEl) row.total_hours      = isNaN(tot) ? '' : tot;
  if (specialEl) row.grade_special = special;
}

function renderGradeSheetTable() {
  const area = document.getElementById('gradesArea');
  if (!area) return;
  const subj = AcademicState.currentSubject;
  const rows = AcademicState.gradeRows;

  if (!rows || rows.length === 0) {
    const classInfo = AcademicState.currentSubjectClassroom ? ` (ห้อง ${AcademicState.currentSubjectClassroom})` : '';
    area.innerHTML = `<div class="empty-state"><i class='bx bx-user-x'>\x3c/i>ไม่มีนักเรียนในระดับชั้น ${escapeHTML(subj.grade_level||'')}${escapeHTML(classInfo)}\x3c/div>`;
    return;
  }

  const currentTab = AcademicState.sgsTab || 'S';
  const currentMode = AcademicState.sgsMode || 'sgs5';
  const roomDisplay = AcademicState.currentSubjectClassroom 
    ? ` · ห้อง <b>${escapeHTML(AcademicState.currentSubjectClassroom)}</b>` 
    : ' · <b>ทุกห้องเรียน</b>';

  // กำหนดช่วงคะแนนเก็บย่อย S ตามโหมด
  let beforeRange = [];
  let afterRange = [];
  if (currentMode === 'sgs3') {
    beforeRange = [1, 2, 3];
    afterRange = [4, 5, 6];
  } else if (currentMode === 'sgs5') {
    beforeRange = [1, 2, 3, 4, 5];
    afterRange = [6, 7, 8, 9, 10];
  } else if (currentMode === 'sgs10') {
    beforeRange = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    afterRange = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  }

  // Quick toolbar HTML depending on active tab
  let quickToolbarHtml = '';
  if (currentTab === 'S') {
    quickToolbarHtml = `
      <div class="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl mb-3 text-xs text-blue-900 shadow-2xs">
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-1.5 font-bold text-blue-800">
            <i class='bx bx-grid-alt text-base text-blue-600'>\x3c/i>
            <span>รูปแบบตาราง SGS:</span>
          </div>
          <div class="inline-flex rounded-lg border border-blue-200 bg-white p-0.5 shadow-2xs">
            <button type="button" class="sgs-mode-pill ${currentMode==='sgs5'?'active':''}" onclick="switchSgsMode('sgs5')">SGS 10 ช่อง (S1-S5 / S6-S10)\x3c/button>
            <button type="button" class="sgs-mode-pill ${currentMode==='sgs3'?'active':''}" onclick="switchSgsMode('sgs3')">SGS 6 ช่อง (S1-S3 / S4-S6)\x3c/button>
            <button type="button" class="sgs-mode-pill ${currentMode==='sgs10'?'active':''}" onclick="switchSgsMode('sgs10')">SGS 20 ช่อง (เต็มพิกัด)\x3c/button>
            <button type="button" class="sgs-mode-pill ${currentMode==='compact'?'active':''}" onclick="switchSgsMode('compact')">โหมดย่อ (กลางภาค/ปลายภาค)\x3c/button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-slate-500 font-medium">เวลาเรียน:</span>
          <button type="button" class="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-300 rounded font-semibold text-blue-800 transition-colors shadow-2xs" onclick="quickFillAttendance(100)">
            ⚡ ตั้ง 100% ทั้งหมด
          </button>
          <button type="button" class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-600 transition-colors shadow-2xs" onclick="quickFillAttendance(80)">
            ⚡ 80% (เกณฑ์ผ่าน)
          </button>
        </div>
      </div>
    `;
  } else if (currentTab === 'Q') {
    quickToolbarHtml = `
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl mb-3 text-xs text-amber-900 shadow-2xs">
        <div class="flex items-center gap-1.5 font-medium">
          <i class='bx bx-star text-amber-600 text-base'>\x3c/i>
          <span><b>คุณลักษณะอันพึงประสงค์ (Q1 - Q8):</b> 0 = ไม่ผ่าน, 1 = ผ่าน, 2 = ดี, 3 = ดีเยี่ยม (รูปแบบตรงตามระบบ SGS และ SGS AutoGrade)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-500 font-medium">กรอกด่วน:</span>
          <button type="button" class="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded font-semibold text-amber-800 transition-colors shadow-2xs" onclick="quickFillQ(3)">
            ⚡ ให้ 3 (ดีเยี่ยม) ทั้งหมด
          </button>
          <button type="button" class="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded font-semibold text-amber-800 transition-colors shadow-2xs" onclick="quickFillQ(2)">
            ⚡ ให้ 2 (ดี) ทั้งหมด
          </button>
          <button type="button" class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-600 transition-colors shadow-2xs" onclick="quickFillQ('')">
            🧹 ล้างค่า
          </button>
        </div>
      </div>
    `;
  } else if (currentTab === 'L') {
    quickToolbarHtml = `
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl mb-3 text-xs text-indigo-900 shadow-2xs">
        <div class="flex items-center gap-1.5 font-medium">
          <i class='bx bx-book-reader text-indigo-600 text-base'>\x3c/i>
          <span><b>การอ่าน คิดวิเคราะห์ และเขียน (L1 - L5):</b> 0 = ไม่ผ่าน, 1 = ผ่าน, 2 = ดี, 3 = ดีเยี่ยม (รูปแบบตรงตามระบบ SGS และ SGS AutoGrade)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-slate-500 font-medium">กรอกด่วน:</span>
          <button type="button" class="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-semibold text-indigo-800 transition-colors shadow-2xs" onclick="quickFillL(3)">
            ⚡ ให้ 3 (ดีเยี่ยม) ทั้งหมด
          </button>
          <button type="button" class="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-semibold text-indigo-800 transition-colors shadow-2xs" onclick="quickFillL(2)">
            ⚡ ให้ 2 (ดี) ทั้งหมด
          </button>
          <button type="button" class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-600 transition-colors shadow-2xs" onclick="quickFillL('')">
            🧹 ล้างค่า
          </button>
        </div>
      </div>
    `;
  } else if (currentTab === 'ALL') {
    quickToolbarHtml = `
      <div class="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-3 text-xs text-emerald-900 shadow-2xs">
        <div class="flex items-center gap-1.5 font-medium">
          <i class='bx bx-grid-alt text-emerald-600 text-base'>\x3c/i>
          <span><b>ตารางรวมมาตรฐาน SGS:</b> แสดงคะแนนระหว่างภาค, ปลายภาค, คะแนนรวม, เกรด, คุณลักษณะ (Q) และอ่านคิดวิเคราะห์ (L) ในตารางเดียว</span>
        </div>
      </div>
    `;
  }

  // Header Table Columns HTML
  let theadColsHtml = '';
  if (currentTab === 'S') {
    if (currentMode === 'compact') {
      theadColsHtml = `
        <tr class="bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
          <th class="px-2 py-2 text-center" style="width:38px; min-width:38px;">ที่</th>
          <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">เลขประจำตัว</th>
          <th class="px-2.5 py-2 text-left" style="min-width:180px; width:180px;">ชื่อ - สกุล</th>
          <th class="px-2 py-2 text-center" style="width:55px; min-width:55px;">ห้อง</th>
          <th class="px-2 py-2 text-center bg-blue-50/90 text-blue-900" style="width:90px; min-width:90px;" title="คะแนนระหว่างภาค เต็ม ${subj.midterm_weight||70}">ระหว่างภาค (${subj.midterm_weight||70})</th>
          <th class="px-2 py-2 text-center bg-purple-50/90 text-purple-900" style="width:90px; min-width:90px;" title="คะแนนปลายภาค เต็ม ${subj.final_weight||30}">ปลายภาค (${subj.final_weight||30})</th>
          <th class="px-2 py-2 text-center" style="width:65px; min-width:65px;">รวม (100)</th>
          <th class="px-2 py-2 text-center" style="width:65px; min-width:65px;">ชม.เรียน</th>
          <th class="px-2 py-2 text-center" style="width:60px; min-width:60px;">ชม.รวม</th>
          <th class="px-2 py-2 text-center" style="width:60px; min-width:60px;">%</th>
          <th class="px-2 py-2 text-center" style="width:55px; min-width:55px;">เกรด</th>
          <th class="px-2 py-2 text-center" style="width:75px; min-width:75px;">ผลพิเศษ</th>
        </tr>
      `;
    } else {
      // โหมด SGS เต็มรูปแบบ (Two-Tier Header แบบกริดตารางสี่เหลี่ยมสมบูรณ์แบบ)
      const bSubCols = beforeRange.map(n => `<th class="px-1 py-1 text-center font-mono text-[11px] text-blue-800" style="width:48px; min-width:48px;">S${n}</th>`).join('');
      const aSubCols = afterRange.map(n => `<th class="px-1 py-1 text-center font-mono text-[11px] text-teal-800" style="width:48px; min-width:48px;">S${n}</th>`).join('');

      theadColsHtml = `
        <tr class="bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
          <th rowspan="2" class="px-2 py-2 text-center" style="width:38px; min-width:38px;">ที่</th>
          <th rowspan="2" class="px-2 py-2 text-center" style="width:85px; min-width:85px;">เลขประจำตัว</th>
          <th rowspan="2" class="px-2.5 py-2 text-left" style="min-width:180px; width:180px;">ชื่อ - สกุล</th>
          <th rowspan="2" class="px-2 py-2 text-center" style="width:55px; min-width:55px;">ห้อง</th>
          <th colspan="${beforeRange.length + 1}" class="px-1 py-1.5 text-center bg-blue-100/80 text-blue-900 font-bold">
            คะแนนก่อนสอบกลางภาค <span class="text-[10px] text-blue-600 font-normal">(${beforeRange.length} ช่อง)</span>
          </th>
          <th rowspan="2" class="px-1.5 py-2 text-center bg-amber-50/90 text-amber-900" style="width:72px; min-width:72px;" title="คะแนนสอบกลางภาค">สอบกลางภาค</th>
          <th rowspan="2" class="px-1.5 py-2 text-center bg-indigo-50/90 text-indigo-900" style="width:78px; min-width:78px;" title="รวมระหว่างภาค = รวมก่อนกลางภาค + สอบกลางภาค">รวมระหว่างภาค</th>
          <th colspan="${afterRange.length + 1}" class="px-1 py-1.5 text-center bg-teal-100/80 text-teal-900 font-bold">
            คะแนนหลังสอบกลางภาค <span class="text-[10px] text-teal-600 font-normal">(${afterRange.length} ช่อง)</span>
          </th>
          <th rowspan="2" class="px-1.5 py-2 text-center bg-purple-50/90 text-purple-900" style="width:72px; min-width:72px;" title="คะแนนสอบปลายภาค">สอบปลายภาค</th>
          <th colspan="4" class="px-1 py-1.5 text-center bg-slate-200 text-slate-800 font-bold">สรุปผลการเรียน</th>
        </tr>
        <tr class="bg-slate-50 text-slate-600 text-[11px] font-semibold">
          ${bSubCols}
          <th class="px-1 py-1 text-center bg-blue-100/90 text-blue-900 font-bold" style="width:58px; min-width:58px;">รวมก่อน</th>
          ${aSubCols}
          <th class="px-1 py-1 text-center bg-teal-100/90 text-teal-900 font-bold" style="width:58px; min-width:58px;">รวมหลัง</th>
          <th class="px-1 py-1 text-center bg-slate-100 text-slate-800 font-bold" style="width:65px; min-width:65px;">รวม 100</th>
          <th class="px-1 py-1 text-center bg-slate-100 text-slate-800 font-bold" style="width:52px; min-width:52px;">เกรด</th>
          <th class="px-1 py-1 text-center bg-slate-100 text-slate-800 font-bold" style="width:60px; min-width:60px;">เวลา %</th>
          <th class="px-1 py-1 text-center bg-slate-100 text-slate-800 font-bold" style="width:72px; min-width:72px;">ผลพิเศษ</th>
        </tr>
      `;
    }
  } else if (currentTab === 'Q') {
    theadColsHtml = `
      <tr class="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
        <th class="px-2 py-2 text-center" style="width:38px; min-width:38px;">ที่</th>
        <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">เลขประจำตัว</th>
        <th class="px-2.5 py-2 text-left" style="min-width:180px; width:180px;">นักเรียน</th>
        <th class="px-2 py-2 text-center" style="width:55px; min-width:55px;">ห้อง</th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="รักชาติ ศาสน์ กษัตริย์">Q1<div class="text-[9px] font-normal text-slate-400">รักชาติ</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="ซื่อสัตย์สุจริต">Q2<div class="text-[9px] font-normal text-slate-400">ซื่อสัตย์</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="มีวินัย">Q3<div class="text-[9px] font-normal text-slate-400">มีวินัย</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="ใฝ่เรียนรู้">Q4<div class="text-[9px] font-normal text-slate-400">ใฝ่รู้</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="อยู่อย่างพอเพียง">Q5<div class="text-[9px] font-normal text-slate-400">พอเพียง</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="มุ่งมั่นในการทำงาน">Q6<div class="text-[9px] font-normal text-slate-400">มุ่งมั่น</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="รักความเป็นไทย">Q7<div class="text-[9px] font-normal text-slate-400">รักไทย</div></th>
        <th class="px-1 py-2 text-center" style="width:54px; min-width:54px;" title="มีจิตสาธารณะ">Q8<div class="text-[9px] font-normal text-slate-400">สาธารณะ</div></th>
        <th class="px-2 py-2 text-center" style="width:110px; min-width:110px;" title="สรุปผลคุณลักษณะ (0-3)">สรุปผล Q</th>
      </tr>
    `;
  } else if (currentTab === 'L') {
    theadColsHtml = `
      <tr class="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
        <th class="px-2 py-2 text-center" style="width:38px; min-width:38px;">ที่</th>
        <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">เลขประจำตัว</th>
        <th class="px-2.5 py-2 text-left" style="min-width:180px; width:180px;">นักเรียน</th>
        <th class="px-2 py-2 text-center" style="width:55px; min-width:55px;">ห้อง</th>
        <th class="px-1.5 py-2 text-center" style="width:68px; min-width:68px;" title="การอ่านเพื่อค้นคว้า">L1<div class="text-[9px] font-normal text-slate-400">การอ่าน</div></th>
        <th class="px-1.5 py-2 text-center" style="width:68px; min-width:68px;" title="การคิดวิเคราะห์">L2<div class="text-[9px] font-normal text-slate-400">คิดวิเคราะห์</div></th>
        <th class="px-1.5 py-2 text-center" style="width:68px; min-width:68px;" title="การสังเคราะห์/จับประเด็น">L3<div class="text-[9px] font-normal text-slate-400">จับประเด็น</div></th>
        <th class="px-1.5 py-2 text-center" style="width:68px; min-width:68px;" title="การแสดงความคิดเห็น/วิจารณญาณ">L4<div class="text-[9px] font-normal text-slate-400">วิจารณญาณ</div></th>
        <th class="px-1.5 py-2 text-center" style="width:68px; min-width:68px;" title="การเขียนถ่ายทอด/สื่อความ">L5<div class="text-[9px] font-normal text-slate-400">สื่อความ</div></th>
        <th class="px-2 py-2 text-center" style="width:110px; min-width:110px;" title="สรุปผลการอ่านคิดวิเคราะห์ (0-3)">สรุปผล L</th>
      </tr>
    `;
  } else if (currentTab === 'ALL') {
    theadColsHtml = `
      <tr class="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
        <th class="px-2 py-2 text-center" style="width:38px; min-width:38px;">ที่</th>
        <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">เลขประจำตัว</th>
        <th class="px-2.5 py-2 text-left" style="min-width:180px; width:180px;">นักเรียน</th>
        <th class="px-2 py-2 text-center" style="width:55px; min-width:55px;">ห้อง</th>
        <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">ระหว่างภาค</th>
        <th class="px-2 py-2 text-center" style="width:85px; min-width:85px;">ปลายภาค</th>
        <th class="px-2 py-2 text-center" style="width:65px; min-width:65px;">รวม</th>
        <th class="px-2 py-2 text-center" style="width:60px; min-width:60px;">เกรด</th>
        <th class="px-2 py-2 text-center" style="width:105px; min-width:105px;">คุณลักษณะ (Q)</th>
        <th class="px-2 py-2 text-center" style="width:105px; min-width:105px;">อ่านวิเคราะห์ (L)</th>
        <th class="px-2 py-2 text-center" style="width:65px; min-width:65px;">% เวลา</th>
        <th class="px-2 py-2 text-center" style="width:75px; min-width:75px;">ผลพิเศษ</th>
      </tr>
    `;
  }

  // Row Generation HTML
  const rowsHtml = rows.map((r, i) => {
    const q = r.q_scores || {};
    const l = r.l_scores || {};
    const s = r.s_scores || {};
    const qSummary = r.character_result || (r.q_scores ? calculateAvgQL(r.q_scores, 8) : '');
    const lSummary = r.reading_result || (r.l_scores ? calculateAvgQL(r.l_scores, 5) : '');

    const commonCols = `
      <td class="px-1.5 py-1.5 text-center text-slate-600 font-semibold text-xs">${r.student_number || (i+1)}</td>
      <td class="ttc px-1.5 py-1.5 text-center font-mono text-xs font-semibold text-slate-700 bg-slate-50/70">${escapeHTML(r.student_code || r.student_id || '-')}</td>
      <td class="px-2.5 py-1.5 text-left">
        <div class="flex items-center gap-2">
          ${avatarHTML(r.photo, r.first_name, 24)}
          <div class="truncate">
            <span class="font-semibold text-slate-800 text-xs">
              ${escapeHTML((r.prefix||'')+(r.first_name||'')+' '+(r.last_name||''))}
            </span>
          </div>
        </div>
      </td>
      <td class="px-1.5 py-1.5 text-center text-xs text-slate-600 font-medium">${escapeHTML(r.classroom || '-')}</td>
    `;

    if (currentTab === 'S') {
      if (currentMode === 'compact') {
        return `
          <tr class="hover:bg-slate-50 transition-colors" data-row="${i}">
            ${commonCols}
            <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-midterm" data-row="${i}" value="${r.score_midterm===''||r.score_midterm==null?'':r.score_midterm}"></td>
            <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-final"   data-row="${i}" value="${r.score_final===''||r.score_final==null?'':r.score_final}"></td>
            <td class="px-1 py-1"><div class="grade-output g-total" data-row="${i}">-</div></td>
            <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-att" data-row="${i}" value="${r.attendance_hours===''||r.attendance_hours==null?'':r.attendance_hours}"></td>
            <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-tot" data-row="${i}" value="${r.total_hours===''||r.total_hours==null?'':r.total_hours}"></td>
            <td class="px-1 py-1"><div class="grade-output g-pct" data-row="${i}">-</div></td>
            <td class="px-1 py-1"><div class="grade-output g-grade" data-row="${i}">-</div></td>
            <td class="px-1 py-1">
              <select class="grade-input g-special" data-row="${i}">
                <option value="">-</option>
                <option value="มส" ${r.grade_special==='มส'?'selected':''}>มส</option>
                <option value="มผ" ${r.grade_special==='มผ'?'selected':''}>มผ</option>
                <option value="ร"  ${r.grade_special==='ร'?'selected':''}>ร</option>
              </select>
            </td>
          </tr>
        `;
      } else {
        // แถวตารางคะแนนแบบ SGS มาตรฐาน พร้อมช่องคะแนนเก็บย่อย S
        const sBeforeInputs = beforeRange.map(n => {
          const v = (s['S' + n] !== '' && s['S' + n] != null) ? s['S' + n] : '';
          return `<td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-s" data-row="${i}" data-s="${n}" value="${v}"></td>`;
        }).join('');

        const sAfterInputs = afterRange.map(n => {
          const v = (s['S' + n] !== '' && s['S' + n] != null) ? s['S' + n] : '';
          return `<td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-s" data-row="${i}" data-s="${n}" value="${v}"></td>`;
        }).join('');

        return `
          <tr class="hover:bg-slate-50 transition-colors" data-row="${i}">
            ${commonCols}
            ${sBeforeInputs}
            <td class="px-1 py-1 bg-blue-50/70"><div class="grade-output g-s-before-sum font-bold text-blue-900" data-row="${i}">-</div></td>
            <td class="px-1 py-1 bg-amber-50/50"><input type="number" min="0" max="100" step="0.5" class="grade-input g-midterm" data-row="${i}" value="${r.score_midterm===''||r.score_midterm==null?'':r.score_midterm}"></td>
            <td class="px-1 py-1 bg-indigo-50/70"><div class="grade-output g-between-sum font-bold text-indigo-900" data-row="${i}">-</div></td>
            ${sAfterInputs}
            <td class="px-1 py-1 bg-teal-50/70"><div class="grade-output g-s-after-sum font-bold text-teal-900" data-row="${i}">-</div></td>
            <td class="px-1 py-1 bg-purple-50/50"><input type="number" min="0" max="100" step="0.5" class="grade-input g-final" data-row="${i}" value="${r.score_final===''||r.score_final==null?'':r.score_final}"></td>
            <td class="px-1 py-1"><div class="grade-output g-total" data-row="${i}">-</div></td>
            <td class="px-1 py-1"><div class="grade-output g-grade" data-row="${i}">-</div></td>
            <td class="px-1 py-1"><div class="grade-output g-pct" data-row="${i}">-</div></td>
            <td class="px-1 py-1">
              <select class="grade-input g-special" data-row="${i}">
                <option value="">-</option>
                <option value="มส" ${r.grade_special==='มส'?'selected':''}>มส</option>
                <option value="มผ" ${r.grade_special==='มผ'?'selected':''}>มผ</option>
                <option value="ร"  ${r.grade_special==='ร'?'selected':''}>ร</option>
              </select>
              <input type="hidden" class="g-att" data-row="${i}" value="${r.attendance_hours===''||r.attendance_hours==null?'':r.attendance_hours}">
              <input type="hidden" class="g-tot" data-row="${i}" value="${r.total_hours===''||r.total_hours==null?'':r.total_hours}">
            </td>
          </tr>
        `;
      }
    } else if (currentTab === 'Q') {
      const qInputs = [1, 2, 3, 4, 5, 6, 7, 8].map(num => {
        const val = q['Q' + num] != null ? q['Q' + num] : (r.character_result || '');
        return `<td class="px-1 py-1"><input type="number" min="0" max="3" step="1" class="grade-input g-q" data-row="${i}" data-q="${num}" value="${val}"></td>`;
      }).join('');

      return `
        <tr class="hover:bg-slate-50 transition-colors" data-row="${i}">
          ${commonCols}
          ${qInputs}
          <td class="px-1 py-1">
            <select class="ql-select g-q-summary" data-row="${i}" onchange="this.dataset.manual='true'; AcademicState.gradeRows[${i}].character_result = this.value;">
              <option value="">-</option>
              <option value="3" ${qSummary==='3'?'selected':''}>3 (ดีเยี่ยม)</option>
              <option value="2" ${qSummary==='2'?'selected':''}>2 (ดี)</option>
              <option value="1" ${qSummary==='1'?'selected':''}>1 (ผ่าน)</option>
              <option value="0" ${qSummary==='0'?'selected':''}>0 (ไม่ผ่าน)</option>
            </select>
          </td>
        </tr>
      `;
    } else if (currentTab === 'L') {
      const lInputs = [1, 2, 3, 4, 5].map(num => {
        const val = l['L' + num] != null ? l['L' + num] : (r.reading_result || '');
        return `<td class="px-1 py-1"><input type="number" min="0" max="3" step="1" class="grade-input g-l" data-row="${i}" data-q="${num}" value="${val}"></td>`;
      }).join('');

      return `
        <tr class="hover:bg-slate-50 transition-colors" data-row="${i}">
          ${commonCols}
          ${lInputs}
          <td class="px-1 py-1">
            <select class="ql-select g-l-summary" data-row="${i}" onchange="this.dataset.manual='true'; AcademicState.gradeRows[${i}].reading_result = this.value;">
              <option value="">-</option>
              <option value="3" ${lSummary==='3'?'selected':''}>3 (ดีเยี่ยม)</option>
              <option value="2" ${lSummary==='2'?'selected':''}>2 (ดี)</option>
              <option value="1" ${lSummary==='1'?'selected':''}>1 (ผ่าน)</option>
              <option value="0" ${lSummary==='0'?'selected':''}>0 (ไม่ผ่าน)</option>
            </select>
          </td>
        </tr>
      `;
    } else if (currentTab === 'ALL') {
      return `
        <tr class="hover:bg-slate-50 transition-colors" data-row="${i}">
          ${commonCols}
          <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-midterm" data-row="${i}" value="${r.score_midterm===''||r.score_midterm==null?'':r.score_midterm}"></td>
          <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-final"   data-row="${i}" value="${r.score_final===''||r.score_final==null?'':r.score_final}"></td>
          <td class="px-1 py-1"><div class="grade-output g-total" data-row="${i}">-</div></td>
          <td class="px-1 py-1"><div class="grade-output g-grade" data-row="${i}">-</div></td>
          <td class="px-1 py-1">
            <select class="ql-select g-q-summary" data-row="${i}" onchange="this.dataset.manual='true'; AcademicState.gradeRows[${i}].character_result = this.value;">
              <option value="">-</option>
              <option value="3" ${qSummary==='3'?'selected':''}>3 (ดีเยี่ยม)</option>
              <option value="2" ${qSummary==='2'?'selected':''}>2 (ดี)</option>
              <option value="1" ${qSummary==='1'?'selected':''}>1 (ผ่าน)</option>
              <option value="0" ${qSummary==='0'?'selected':''}>0 (ไม่ผ่าน)</option>
            </select>
          </td>
          <td class="px-1 py-1">
            <select class="ql-select g-l-summary" data-row="${i}" onchange="this.dataset.manual='true'; AcademicState.gradeRows[${i}].reading_result = this.value;">
              <option value="">-</option>
              <option value="3" ${lSummary==='3'?'selected':''}>3 (ดีเยี่ยม)</option>
              <option value="2" ${lSummary==='2'?'selected':''}>2 (ดี)</option>
              <option value="1" ${lSummary==='1'?'selected':''}>1 (ผ่าน)</option>
              <option value="0" ${lSummary==='0'?'selected':''}>0 (ไม่ผ่าน)</option>
            </select>
          </td>
          <td class="px-1 py-1"><div class="grade-output g-pct" data-row="${i}">-</div></td>
          <td class="px-1 py-1">
            <select class="grade-input g-special" data-row="${i}">
              <option value="">-</option>
              <option value="มส" ${r.grade_special==='มส'?'selected':''}>มส</option>
              <option value="มผ" ${r.grade_special==='มผ'?'selected':''}>มผ</option>
              <option value="ร"  ${r.grade_special==='ร'?'selected':''}>ร</option>
            </select>
          </td>
        </tr>
      `;
    }
  }).join('');

  area.innerHTML = `
    <!-- หัวข้อมูลรายวิชา -->
    <div class="p-3 rounded-xl mb-3 shadow-2xs" style="background:#F0FDF4;border:1px solid #BBF7D0;">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="font-bold text-slate-800 text-sm md:text-base flex items-center gap-1.5">
            <i class='bx bx-book-bookmark text-emerald-600'></i>
            <span>${escapeHTML(subj.subject_code||'')} · ${escapeHTML(subj.subject_name||'')}</span>
          </div>
          <div class="text-xs text-slate-600 mt-1">
            ระดับชั้น <b>${escapeHTML(subj.grade_level||'-')}</b>${roomDisplay} · เทอม ${escapeHTML(subj.semester||'-')} · ปีการศึกษา ${escapeHTML(subj.academic_year||'-')}
            · ระหว่างภาค <b>${subj.midterm_weight||70}</b> · ปลายภาค <b>${subj.final_weight||30}</b> · รวม <b>100</b> คะแนน
          </div>
        </div>
        <div class="text-[11px] font-semibold text-emerald-800 bg-white/80 border border-emerald-300 px-2.5 py-1 rounded-lg">
          ⚡ รองรับโปรแกรม SGS AutoGrade 100%
        </div>
      </div>
    </div>

    <!-- แถบสลับแท็บ SGS + ปุ่ม Actions -->
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <!-- ตัวสลับแท็บ SGS -->
      <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button type="button" class="sgs-tab-btn ${currentTab==='S'?'active':''}" onclick="switchSgsGradeTab('S')">
          <i class='bx bx-edit-alt mr-1 text-blue-600'></i> 📝 ผลการเรียน (SGS)
        </button>
        <button type="button" class="sgs-tab-btn ${currentTab==='Q'?'active':''}" onclick="switchSgsGradeTab('Q')">
          <i class='bx bx-star mr-1 text-amber-500'></i> 🌟 คุณลักษณะ (Q1-Q8)
        </button>
        <button type="button" class="sgs-tab-btn ${currentTab==='L'?'active':''}" onclick="switchSgsGradeTab('L')">
          <i class='bx bx-book-reader mr-1 text-indigo-500'></i> 📚 อ่าน คิดวิเคราะห์ (L1-L5)
        </button>
        <button type="button" class="sgs-tab-btn ${currentTab==='ALL'?'active':''}" onclick="switchSgsGradeTab('ALL')">
          <i class='bx bx-grid-alt mr-1 text-emerald-600'></i> 📋 ตารางรวม
        </button>
      </div>

      <!-- ปุ่มดำเนินการหลัก -->
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-outline-success text-xs font-semibold shadow-2xs" onclick="exportPP5ToExcel()" title="ส่งออกไฟล์ Excel (.xlsx) ที่มีโครงสร้างตรงกับโปรแกรม SGS AutoGrade 100% และสรุป ปพ.5">
          <i class='bx bx-file mr-1 text-emerald-600'></i> โหลด Excel (AutoGrade .xlsx)
        </button>
        <button class="btn btn-light text-xs font-semibold shadow-2xs hover:border-indigo-300 hover:text-indigo-600" onclick="navigate('ext_sgs')" title="ดาวน์โหลดโปรแกรมช่วยกรอกคะแนน SGS (AutoGrade) สำหรับ Windows และ Mac">
          <i class='bx bx-laptop mr-1 text-indigo-600'></i> โปรแกรมช่วยกรอก SGS (Mac/Win)
        </button>
        <button class="btn btn-light text-xs font-semibold shadow-2xs" onclick="exportPP5ToCsv()" title="ส่งออกไฟล์ CSV (.csv) สำหรับระบบ SGS">
          <i class='bx bx-table mr-1 text-blue-600'></i> โหลด CSV (SGS .csv)
        </button>
        <button class="btn btn-light text-xs font-semibold shadow-2xs" onclick="printPP5()">
          <i class='bx bx-printer mr-1'></i> พิมพ์ ปพ.5
        </button>
        <button class="btn btn-blue text-xs font-semibold shadow-sm" onclick="saveGradeSheet()">
          <i class='bx bx-save mr-1'></i> บันทึกคะแนน
        </button>
      </div>
    </div>

    <!-- แถบเครื่องมือช่วยกรอกด่วนตามแท็บ -->
    ${quickToolbarHtml}

    <!-- ตารางคะแนนแบบกริดสี่เหลี่ยมมาตรฐาน SGS / ปพ.5 -->
    <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;" class="rounded-xl border border-slate-300 bg-white shadow-xs">
      <table class="w-full text-sm" id="gradeTable">
        <thead>
          ${theadColsHtml}
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <style>
      .sgs-tab-btn {
        padding: 6px 13px;
        font-size: 12.5px;
        font-weight: 500;
        border-radius: 8px;
        color: #475569;
        transition: all 0.15s ease;
        background: transparent;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
      }
      .sgs-tab-btn:hover {
        color: #0F172A;
        background: rgba(255, 255, 255, 0.6);
      }
      .sgs-tab-btn.active {
        background: #FFFFFF;
        color: #2563EB;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .sgs-mode-pill {
        padding: 3px 9px;
        font-size: 11px;
        border-radius: 6px;
        font-weight: 500;
        color: #475569;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .sgs-mode-pill:hover {
        color: #1E293B;
        background: #F1F5F9;
      }
      .sgs-mode-pill.active {
        background: #2563EB;
        color: #FFFFFF;
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(37,99,235,0.25);
      }
      #gradeTable {
        border-collapse: collapse !important;
        border: 1px solid #CBD5E1 !important;
        width: max-content !important;
        min-width: 100% !important;
        background: #FFFFFF !important;
      }
      #gradeTable th {
        border: 1px solid #CBD5E1 !important;
        vertical-align: middle !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      #gradeTable td {
        border: 1px solid #CBD5E1 !important;
        vertical-align: middle !important;
        text-align: center !important;
        box-sizing: border-box !important;
        padding: 3px 3px !important;
        background: #FFFFFF;
      }
      #gradeTable tr:hover td {
        background-color: #F8FAFC !important;
      }
      .grade-input {
        width: 100% !important;
        min-width: 40px !important;
        height: 32px !important;
        padding: 0 4px !important;
        border: 1px solid #94A3B8 !important;
        border-radius: 0px !important;
        font-family: inherit !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: #0F172A !important;
        background: #FFFFFF !important;
        text-align: center !important;
        box-sizing: border-box !important;
        line-height: 30px !important;
        -moz-appearance: textfield !important;
        appearance: textfield !important;
        transition: border-color 0.15s, box-shadow 0.15s !important;
      }
      .grade-input::-webkit-outer-spin-button,
      .grade-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .grade-input:focus {
        outline: none !important;
        border-color: #2563EB !important;
        box-shadow: 0 0 0 1.5px #2563EB !important;
        background: #FFFFFF !important;
      }
      .grade-output {
        width: 100% !important;
        height: 32px !important;
        line-height: 30px !important;
        padding: 0 4px !important;
        text-align: center !important;
        font-size: 12.5px !important;
        font-weight: 700 !important;
        background: #F1F5F9 !important;
        border: 1px solid #CBD5E1 !important;
        border-radius: 0px !important;
        color: #1E293B !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .grade-output.grade-fail {
        background: #FEE2E2 !important;
        color: #B91C1C !important;
        font-weight: 700 !important;
        border-color: #FCA5A5 !important;
      }
      .grade-output.grade-pass {
        background: #DCFCE7 !important;
        color: #15803D !important;
        border-color: #86EFAC !important;
      }
      .ql-select {
        width: 100% !important;
        height: 32px !important;
        padding: 0 4px !important;
        border: 1px solid #94A3B8 !important;
        border-radius: 0px !important;
        font-family: inherit !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        background: #FFFFFF !important;
        text-align: center !important;
        box-sizing: border-box !important;
        line-height: 30px !important;
      }
      .ql-select:focus {
        outline: none !important;
        border-color: #2563EB !important;
        box-shadow: 0 0 0 1.5px #2563EB !important;
      }
    </style>
  `;

  // ผูก Event การเปลี่ยนแปลงค่าของช่อง Input
  document.querySelectorAll('#gradeTable .grade-input').forEach(inp => {
    inp.addEventListener('input', e => {
      const rowIdx = +e.target.dataset.row;
      if (e.target.classList.contains('g-q')) recalcQRow(rowIdx);
      else if (e.target.classList.contains('g-l')) recalcLRow(rowIdx);
      else recalcGradeRow(rowIdx);
    });
    inp.addEventListener('change', e => {
      const rowIdx = +e.target.dataset.row;
      if (e.target.classList.contains('g-q')) recalcQRow(rowIdx);
      else if (e.target.classList.contains('g-l')) recalcLRow(rowIdx);
      else recalcGradeRow(rowIdx);
    });
  });

  // คำนวณค่ารอบแรกสำหรับทุกแถว
  rows.forEach((_, i) => {
    recalcGradeRow(i);
    if (currentTab === 'Q') recalcQRow(i);
    if (currentTab === 'L') recalcLRow(i);
  });
}

function exportPP5ToExcel() {
  if (!AcademicState.currentSubject || !AcademicState.gradeRows || AcademicState.gradeRows.length === 0) {
    showToast('warning', 'ไม่มีข้อมูลคะแนนที่จะส่งออก');
    return;
  }
  if (typeof XLSX === 'undefined') {
    showToast('error', 'ไม่พบไลบรารี SheetJS (XLSX) โปรดรีเฟรชหน้าเว็บ');
    return;
  }
  const subj = AcademicState.currentSubject;
  const rows = AcademicState.gradeRows;
  const year = AcademicState.currentSubjectYear || subj.academic_year || '';
  const sem  = AcademicState.currentSubjectSem || subj.semester || '1';
  const room = AcademicState.currentSubjectClassroom || '';

  // 1. Sheet 1: Template สำหรับระบบ SGS และโปรแกรม SGS AutoGrade 100%
  const sgsData = rows.map(r => {
    const fullName = `${r.prefix || ''}${r.first_name || ''} ${r.last_name || ''}`.trim();
    const q = r.q_scores || {};
    const l = r.l_scores || {};
    const s = r.s_scores || {};
    const charDef = r.character_result || '';
    const readDef = r.reading_result || '';

    const rec = {
      stdID: String(r.student_code || r.student_id || '').trim(),
      'student Name': fullName
    };

    // กำหนด S1 - S20 จากข้อมูลคะแนนเก็บย่อย
    for (let k = 1; k <= 20; k++) {
      const val = s['S' + k];
      rec['S' + k] = (val !== '' && val != null && !isNaN(val)) ? Number(val) : '';
    }

    rec.Midterm = (r.score_midterm !== '' && r.score_midterm != null && !isNaN(r.score_midterm)) ? Number(r.score_midterm) : '';
    rec.Final   = (r.score_final !== '' && r.score_final != null && !isNaN(r.score_final)) ? Number(r.score_final) : '';

    // Q1 - Q8
    for (let k = 1; k <= 8; k++) {
      const val = q['Q' + k] != null && q['Q' + k] !== '' ? q['Q' + k] : charDef;
      rec['Q' + k] = (val !== '' && val != null && !isNaN(val)) ? Number(val) : '';
    }

    // L1 - L5
    for (let k = 1; k <= 5; k++) {
      const val = l['L' + k] != null && l['L' + k] !== '' ? l['L' + k] : readDef;
      rec['L' + k] = (val !== '' && val != null && !isNaN(val)) ? Number(val) : '';
    }

    return rec;
  });

  // 2. Sheet 2: สรุปคะแนน_ปพ5 (แบบรายงานทางการภาษาไทยสำหรับโรงเรียนมหาชัยพิทยาคาร)
  const reportData = rows.map((r, idx) => {
    const fullName = `${r.prefix || ''}${r.first_name || ''} ${r.last_name || ''}`.trim();
    const s = r.s_scores || {};
    
    // ตรวจสอบว่ามีคะแนนเก็บย่อย S หรือไม่
    let sSum = 0;
    let hasS = false;
    Object.values(s).forEach(v => {
      if (v !== '' && v != null && !isNaN(v)) { sSum += Number(v); hasS = true; }
    });

    const mid = parseFloat(r.score_midterm);
    const fin = parseFloat(r.score_final);
    
    let betweenScore = '';
    if (hasS) {
      betweenScore = sSum + (!isNaN(mid) ? mid : 0);
    } else {
      betweenScore = !isNaN(mid) ? mid : '';
    }

    let total = r.score_total;
    if (total == null) {
      if (hasS) total = sSum + (!isNaN(mid) ? mid : 0) + (!isNaN(fin) ? fin : 0);
      else if (!isNaN(mid) && !isNaN(fin)) total = mid + fin;
      else if (!isNaN(mid)) total = mid;
      else if (!isNaN(fin)) total = fin;
      else total = '';
    }

    const att = parseFloat(r.attendance_hours);
    const tot = parseFloat(r.total_hours);
    let attPct = null;
    if (!isNaN(att) && !isNaN(tot) && tot > 0) attPct = Math.round((att / tot) * 1000) / 10;

    let grade = '-';
    if (r.grade_special) grade = r.grade_special;
    else if (attPct !== null && attPct < 80) grade = 'มส';
    else if (total !== '' && total != null) {
      const numTotal = Number(total);
      if (numTotal >= 80) grade = '4';
      else if (numTotal >= 75) grade = '3.5';
      else if (numTotal >= 70) grade = '3';
      else if (numTotal >= 65) grade = '2.5';
      else if (numTotal >= 60) grade = '2';
      else if (numTotal >= 55) grade = '1.5';
      else if (numTotal >= 50) grade = '1';
      else grade = '0';
    }

    const qSummary = r.character_result || (r.q_scores ? calculateAvgQL(r.q_scores, 8) : '');
    const lSummary = r.reading_result || (r.l_scores ? calculateAvgQL(r.l_scores, 5) : '');

    return {
      'ที่': r.student_number || (idx + 1),
      'เลขประจำตัว': String(r.student_code || r.student_id || '').trim(),
      'ชื่อ-สกุล': fullName,
      'ห้อง': r.classroom || room || '',
      ['ระหว่างภาค (เต็ม ' + (subj.midterm_weight || 70) + ')']: betweenScore,
      ['ปลายภาค (เต็ม ' + (subj.final_weight || 30) + ')']: (r.score_final !== '' && r.score_final != null) ? Number(r.score_final) : '',
      'รวม (100)': total !== '' && total != null ? Number(total) : '',
      'เวลาเรียน(%)': attPct !== null ? attPct + '%' : '',
      'ผลการเรียน': grade,
      'คุณลักษณะฯ (0-3)': qSummary,
      'อ่านคิดวิเคราะห์ฯ (0-3)': lSummary,
      'หมายเหตุ': r.grade_special || ''
    };
  });

  const wb = XLSX.utils.book_new();

  // Template Sheet (ตรงกับ SGS AutoGrade 100%)
  const wsSgs = XLSX.utils.json_to_sheet(sgsData);
  wsSgs['!cols'] = [
    { wch: 10 }, // stdID
    { wch: 28 }, // student Name
    ...Array(20).fill({ wch: 6 }), // S1-S20
    { wch: 10 }, // Midterm
    { wch: 10 }, // Final
    ...Array(8).fill({ wch: 6 }), // Q1-Q8
    ...Array(5).fill({ wch: 6 })  // L1-L5
  ];
  XLSX.utils.book_append_sheet(wb, wsSgs, 'Template');

  // Summary Report Sheet
  const wsReport = XLSX.utils.json_to_sheet(reportData);
  wsReport['!cols'] = [
    { wch: 6 },  // ที่
    { wch: 12 }, // เลขประจำตัว
    { wch: 28 }, // ชื่อ-สกุล
    { wch: 8 },  // ห้อง
    { wch: 20 }, // ระหว่างภาค
    { wch: 20 }, // ปลายภาค
    { wch: 12 }, // รวม
    { wch: 14 }, // เวลาเรียน
    { wch: 12 }, // ผลการเรียน
    { wch: 18 }, // คุณลักษณะ
    { wch: 22 }, // อ่านคิดวิเคราะห์
    { wch: 12 }  // หมายเหตุ
  ];
  XLSX.utils.book_append_sheet(wb, wsReport, 'สรุปคะแนน_ปพ5');

  const roomSuffix = room ? `_ห้อง${room}` : (subj.grade_level ? `_${subj.grade_level}` : '');
  const fileName = `SGS_คะแนน_${subj.subject_code || 'วิชา'}${roomSuffix}_ปี${year}_เทอม${sem}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast('success', `ส่งออกไฟล์ Excel (${fileName}) เรียบร้อยแล้ว`);
}

function exportPP5ToCsv() {
  if (!AcademicState.currentSubject || !AcademicState.gradeRows || AcademicState.gradeRows.length === 0) {
    showToast('warning', 'ไม่มีข้อมูลคะแนนที่จะส่งออก');
    return;
  }
  const subj = AcademicState.currentSubject;
  const rows = AcademicState.gradeRows;
  const year = AcademicState.currentSubjectYear || subj.academic_year || '';
  const sem  = AcademicState.currentSubjectSem || subj.semester || '1';
  const room = AcademicState.currentSubjectClassroom || '';

  const headers = [
    'stdID', 'student Name',
    'S1','S2','S3','S4','S5','S6','S7','S8','S9','S10',
    'S11','S12','S13','S14','S15','S16','S17','S18','S19','S20',
    'Midterm', 'Final',
    'Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8',
    'L1','L2','L3','L4','L5'
  ];

  const escapeCsv = val => {
    const s = String(val == null ? '' : val);
    return s.includes(',') || s.includes('"') || s.includes('\n') 
      ? `"${s.replace(/"/g, '""')}"` 
      : s;
  };

  const csvLines = [headers.join(',')];

  rows.forEach(r => {
    const fullName = `${r.prefix || ''}${r.first_name || ''} ${r.last_name || ''}`.trim();
    const q = r.q_scores || {};
    const l = r.l_scores || {};
    const s = r.s_scores || {};
    const charDef = r.character_result || '';
    const readDef = r.reading_result || '';

    const mid = (r.score_midterm !== '' && r.score_midterm != null) ? r.score_midterm : '';
    const fin = (r.score_final !== '' && r.score_final != null) ? r.score_final : '';

    const row = [
      escapeCsv(String(r.student_code || r.student_id || '').trim()),
      escapeCsv(fullName)
    ];

    // S1 - S20
    for (let k = 1; k <= 20; k++) {
      const val = s['S' + k];
      row.push(escapeCsv(val !== '' && val != null ? val : ''));
    }

    row.push(escapeCsv(mid));
    row.push(escapeCsv(fin));

    // Q1 - Q8
    for (let k = 1; k <= 8; k++) {
      const val = q['Q' + k] != null && q['Q' + k] !== '' ? q['Q' + k] : charDef;
      row.push(escapeCsv(val));
    }

    // L1 - L5
    for (let k = 1; k <= 5; k++) {
      const val = l['L' + k] != null && l['L' + k] !== '' ? l['L' + k] : readDef;
      row.push(escapeCsv(val));
    }

    csvLines.push(row.join(','));
  });

  const csvString = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const roomSuffix = room ? `_ห้อง${room}` : (subj.grade_level ? `_${subj.grade_level}` : '');
  const fileName = `SGS_คะแนน_${subj.subject_code || 'วิชา'}${roomSuffix}_ปี${year}_เทอม${sem}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  showToast('success', `ส่งออกไฟล์ CSV (${fileName}) เรียบร้อยแล้ว`);
}

function saveGradeSheet() {
  if (!AcademicState.currentSubject || !AcademicState.gradeRows) return;
  const year = AcademicState.currentSubjectYear || document.getElementById('grYear')?.value || (APP.dashboardData?.config?.academic_year || '');
  const sem  = AcademicState.currentSubjectSem || document.getElementById('grSem')?.value || '1';

  showLoading('กำลังบันทึกคะแนน...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกคะแนนเรียบร้อยแล้ว!',
          html: `
            <div style="font-size: 13px; color: #334155; line-height: 1.6; text-align: left; margin: 8px 0 14px 0;">
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; font-weight:600; color:#0F172A;">
                <i class='bx bx-check-circle' style="color:#10B981; font-size:18px;">\x3c/i>
                <span>${escapeHTML(res.message || 'บันทึกข้อมูลคะแนน ปพ.5 เรียบร้อยแล้ว')}\x3c/span>
              </div>
              <div style="padding: 10px 12px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; color: #065F46; font-size: 12px;">
                <div style="font-weight:700; display:flex; align-items:center; gap:5px; margin-bottom:3px;">
                  <i class='bx bxs-file-import'>\x3c/i>
                  <span>เชื่อมโยงโปรแกรม SGS AutoGrade สำเร็จ</span>
                </div>
                <span>ท่านสามารถดาวน์โหลดไฟล์ Excel หรือ CSV ด้านล่าง เพื่อนำไปเปิดในโปรแกรม <b>SGS AutoGrade</b> แล้วกดเริ่มกรอกคะแนนเข้าเว็บ SGS ได้ทันทีครับ</span>
              </div>
            </div>
          `,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: '<i class="bx bx-download mr-1">\x3c/i> โหลด Excel (AutoGrade .xlsx)',
          denyButtonText: '<i class="bx bx-file mr-1">\x3c/i> โหลด CSV (SGS .csv)',
          cancelButtonText: 'ปิดหน้าต่าง',
          confirmButtonColor: '#10B981',
          denyButtonColor: '#3B82F6',
          cancelButtonColor: '#94A3B8',
          reverseButtons: false,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'font-semibold text-xs py-2 px-3 rounded-lg shadow-sm',
            denyButton: 'font-semibold text-xs py-2 px-3 rounded-lg shadow-sm',
            cancelButton: 'text-xs py-2 px-3 rounded-lg'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            exportPP5ToExcel();
          } else if (result.isDenied) {
            exportPP5ToCsv();
          }
        });
      } else {
        showToast('error', res.message);
      }
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .saveGradeBulk(AcademicState.currentSubject.id, AcademicState.gradeRows, APP.token, year, sem);
}

function printPP5() {
  if (!AcademicState.currentSubject) return showToast('warning', 'เลือกวิชาก่อน');
  const year = AcademicState.currentSubjectYear || document.getElementById('grYear')?.value || '';
  const sem  = AcademicState.currentSubjectSem || document.getElementById('grSem')?.value || '';
  const classroom = document.getElementById('grClassroom') ? document.getElementById('grClassroom').value : '';
  const subjName = AcademicState.currentSubject.name || AcademicState.currentSubject.code || '';
  const directUrl = `${GAS_URL}?action=printPP5&subject_id=${encodeURIComponent(AcademicState.currentSubject.id)}&year=${encodeURIComponent(year)}&sem=${encodeURIComponent(sem)}&classroom=${encodeURIComponent(classroom)}&token=${encodeURIComponent(APP.token)}`;

  showLoading('กำลังเตรียมเอกสาร...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html, `แบบบันทึกผลการเรียน ปพ.5 - ${subjName}`, directUrl);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .generatePP5HTML(AcademicState.currentSubject.id, APP.token, year, sem, classroom);
}


/* ----- GPA / ปพ.6 ----- */
function renderAcademicGPA() {
  const el = document.getElementById('acGPA');
  if (!el) return;
  el.innerHTML = `
    <div class="text-base font-semibold text-slate-700 mb-3">
      <i class='bx bx-trophy mr-1 text-primary' >\x3c/i> ดู GPA และพิมพ์ ปพ.6
    \x3c/div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      <div class="md:col-span-2 relative">
        <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
        <input type="text" id="gpaSearch" placeholder="ค้นหานักเรียน (ชื่อ / รหัส)"
               class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
               oninput="onGpaSearch()">
      \x3c/div>
      <select id="gpaYear" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกปีการศึกษา\x3c/option>
      \x3c/select>
      <select id="gpaSem" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกเทอม\x3c/option>
        <option value="1">เทอม 1\x3c/option>
        <option value="2">เทอม 2\x3c/option>
      \x3c/select>
    \x3c/div>

    <div id="gpaArea">
      <div class="empty-state"><i class='bx bx-user'>\x3c/i>ค้นหานักเรียนเพื่อดู GPA\x3c/div>
    \x3c/div>
  `;
  loadGpaStudents();
}

let _gpaTimer = null;
function onGpaSearch() {
  clearTimeout(_gpaTimer);
  _gpaTimer = setTimeout(loadGpaStudents, 300);
}

function loadGpaStudents() {
  const q = document.getElementById('gpaSearch').value;
  const area = document.getElementById('gpaArea');
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return;
      const yr = document.getElementById('gpaYear');
      if (res.distinct && yr.options.length <= 1) {
        yr.innerHTML = '<option value="">ทุกปีการศึกษา\x3c/option>' +
          res.distinct.academic_years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}\x3c/option>`).join('');
      }
      renderGpaList(res.data);
    })
    .getStudents({ page:1, per_page:50, search: q, status:'active' }, APP.token);
}

function renderGpaList(students) {
  const area = document.getElementById('gpaArea');
  if (!area) return;
  if (!students || students.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-user-x'>\x3c/i>ไม่พบนักเรียน\x3c/div>`;
    return;
  }
  area.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${students.map(s => `
        <div class="gpa-card">
          <div class="flex items-center gap-3 mb-3">
            ${avatarHTML(s.photo, s.first_name, 50)}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 truncate">${escapeHTML((s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''))}\x3c/div>
              <div class="text-xs text-slate-500">${escapeHTML(s.student_id||'')} · ${escapeHTML(s.classroom||'')}\x3c/div>
            \x3c/div>
          \x3c/div>
          <div class="flex gap-2">
            <button class="btn btn-light flex-1" style="font-size:12px;padding:7px 10px;" onclick="viewGPA('${s.id}')">
              <i class='bx bx-bar-chart-alt-2'>\x3c/i> ดู GPA
            \x3c/button>
            <button class="btn btn-outline" style="font-size:12px;padding:7px 10px;" onclick="printPP6('${s.id}')">
              <i class='bx bx-printer'>\x3c/i> ปพ.6
            \x3c/button>
          \x3c/div>
        \x3c/div>
      `).join('')}
    \x3c/div>
    <style>
      .gpa-card {
        background:white; border:1px solid #F1F5F9; padding:14px;
        border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,.02);
      }
    \x3c/style>
  `;
}

function viewGPA(studentId) {
  const year = document.getElementById('gpaYear').value || null;
  showLoading('กำลังคำนวณ...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      Swal.fire({
        title: 'ผลการเรียน',
        width: 720,
        showCloseButton: true,
        showConfirmButton: false,
        html: `
          <div style="text-align:left;">
            <div class="text-center mb-4 p-4 rounded-xl" style="background:linear-gradient(135deg,#3730A3,#4F46E5); color:white;">
              <div class="text-xs opacity-80">เกรดเฉลี่ยสะสม (GPA)\x3c/div>
              <div style="font-size:42px; font-weight:800; line-height:1;">${res.gpa.toFixed(2)}\x3c/div>
              <div class="text-xs opacity-80 mt-2">หน่วยกิตรวม ${res.total_credits} หน่วยกิต\x3c/div>
            \x3c/div>
            <div style="max-height:380px; overflow-y:auto;">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
                    <th class="px-3 py-2 text-left">วิชา\x3c/th>
                    <th class="px-3 py-2 text-center">เทอม\x3c/th>
                    <th class="px-3 py-2 text-center">หน่วย\x3c/th>
                    <th class="px-3 py-2 text-center">คะแนน\x3c/th>
                    <th class="px-3 py-2 text-center">เกรด\x3c/th>
                  \x3c/tr>
                \x3c/thead>
                <tbody>
                  ${res.details.length === 0 ? `<tr><td colspan="5" class="text-center text-slate-400 py-4">ยังไม่มีคะแนน\x3c/td>\x3c/tr>` :
                    res.details.map(d => `
                      <tr class="border-b border-slate-100">
                        <td class="px-3 py-2">
                          <div class="font-mono text-xs text-slate-500">${escapeHTML(d.subject_code||'')}\x3c/div>
                          <div>${escapeHTML(d.subject_name||'')}\x3c/div>
                        \x3c/td>
                        <td class="px-3 py-2 text-center text-xs">${d.semester}/${d.academic_year}\x3c/td>
                        <td class="px-3 py-2 text-center">${d.credit}\x3c/td>
                        <td class="px-3 py-2 text-center">${d.score_total != null ? d.score_total : '-'}\x3c/td>
                        <td class="px-3 py-2 text-center font-semibold">${d.grade_special || (d.grade_level != null ? d.grade_level : '-')}\x3c/td>
                      \x3c/tr>`).join('')}
                \x3c/tbody>
              \x3c/table>
            \x3c/div>
          \x3c/div>
        `
      });
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .calculateGPA(studentId, year, APP.token);
}

function printPP6(studentId) {
  const year = document.getElementById('gpaYear')?.value || '';
  const sem  = document.getElementById('gpaSem')?.value || '';
  const directUrl = `${GAS_URL}?action=printPP6&student_id=${encodeURIComponent(studentId)}&year=${encodeURIComponent(year)}&sem=${encodeURIComponent(sem)}&token=${encodeURIComponent(APP.token)}`;

  showLoading('กำลังเตรียมเอกสาร...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html, 'แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล ปพ.6', directUrl);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .generatePP6HTML(studentId, sem, year, APP.token);
}


/* ============================================================
 *  FINANCE
 * ============================================================ */
const FinanceState = { page:1, search:'', type:'', start:'', end:'', data:null };

function renderFinance(container) {
  container.innerHTML = `
    ${pageHeader('งานการเงิน', 'bxs-wallet', (typeof canEditModule === 'function' ? canEditModule('finance') : true) ? `
      <button class="btn btn-light" onclick="openTransactionForm('expense')">
        <i class='bx bx-minus-circle text-danger' >\x3c/i> รายจ่าย
      \x3c/button>
      <button class="btn btn-blue" onclick="openTransactionForm('income')">
        <i class='bx bx-plus-circle'>\x3c/i> รายรับ
      \x3c/button>
    ` : '')}

    <div class="page-card mb-3">
      <div class="page-card-body">
        <div id="financeStats">\x3c/div>
      \x3c/div>
    \x3c/div>

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="finSearch" placeholder="ค้นหา เลขใบเสร็จ / รายการ"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onFinanceSearch()">
          \x3c/div>
          <select id="finType" onchange="onFinanceFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทั้งหมด\x3c/option>
            <option value="income">รายรับ\x3c/option>
            <option value="expense">รายจ่าย\x3c/option>
          \x3c/select>
          <input type="date" id="finStart" onchange="onFinanceFilter()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <input type="date" id="finEnd"   onchange="onFinanceFilter()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        \x3c/div>
        </div>

        <div id="finTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'></i>กำลังโหลด...</div>
        </div>
      </div>
    </div>
  `;

  loadFinanceSummary();
  loadFinanceTable();
}

function loadFinanceSummary() {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return;
      const fs = document.getElementById('financeStats');
      if (fs) {
        fs.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rpt-card-mini" style="background:#DCFCE7;color:#15803D;">
            <div><i class='bx bx-trending-up' style="font-size:24px;"></i></div>
            <div>
              <div class="lbl">รายรับรวม</div>
              <div class="val">${formatMoney(res.income)}</div>
            </div>
          </div>
          <div class="rpt-card-mini" style="background:#FEE2E2;color:#B91C1C;">
            <div><i class='bx bx-trending-down' style="font-size:24px;"></i></div>
            <div>
              <div class="lbl">รายจ่ายรวม</div>
              <div class="val">${formatMoney(res.expense)}</div>
            </div>
          </div>
          <div class="rpt-card-mini" style="background:#F2D5DA;color:#3730A3;">
            <div><i class='bx bx-wallet' style="font-size:24px;"></i></div>
            <div>
              <div class="lbl">คงเหลือสุทธิ</div>
              <div class="val">${formatMoney(res.balance)}</div>
            </div>
          </div>
        </div>
        <style>
          .rpt-card-mini {
            padding:14px 18px; border-radius:14px;
            display:flex; align-items:center; gap:14px;
          }
          .rpt-card-mini .lbl { font-size:12px; font-weight:600; opacity:.85; }
          .rpt-card-mini .val { font-size:20px; font-weight:700; line-height:1.1; margin-top:2px; }
        </style>
      `;
      }
    })
    .getFinanceSummary(null, null, APP.token);
}

let _finSearchTimer = null;
function onFinanceSearch() {
  FinanceState.search = document.getElementById('finSearch').value;
  FinanceState.page = 1;
  clearTimeout(_finSearchTimer);
  _finSearchTimer = setTimeout(loadFinanceTable, 300);
}
function onFinanceFilter() {
  FinanceState.type  = document.getElementById('finType').value;
  FinanceState.start = document.getElementById('finStart').value;
  FinanceState.end   = document.getElementById('finEnd').value;
  FinanceState.page = 1;
  loadFinanceTable();
}
function financeGoToPage(p) { FinanceState.page = p; loadFinanceTable(); }

function loadFinanceTable() {
  const area = document.getElementById('finTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      FinanceState.data = res;
      renderFinanceTable(res);
    })
    .getTransactions({
      page: FinanceState.page, search: FinanceState.search,
      type: FinanceState.type, start: FinanceState.start, end: FinanceState.end
    }, APP.token);
}

function renderFinanceTable(res) {
  const area = document.getElementById('finTable');
  if (!area) return;
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-receipt'>\x3c/i>ยังไม่มีรายการ\x3c/div>`;
    return;
  }
  const methodLabel = { cash:'เงินสด', transfer:'โอน', cheque:'เช็ค' };
  const canEdit = typeof canEditModule === 'function' ? canEditModule('finance') : true;
  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">วันที่\x3c/th>
            <th class="px-3 py-2.5 text-left">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">รายการ\x3c/th>
            <th class="px-3 py-2.5 text-left">หมวด\x3c/th>
            <th class="px-3 py-2.5 text-left">วิธีชำระ\x3c/th>
            <th class="px-3 py-2.5 text-right">จำนวนเงิน\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(t => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5 whitespace-nowrap">${formatThaiDateShort(t.date)}\x3c/td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(t.receipt_number || t.transaction_id || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(t.description || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(t.category || '-')}\x3c/td>
              <td class="px-3 py-2.5">${methodLabel[t.payment_method] || t.payment_method}\x3c/td>
              <td class="px-3 py-2.5 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount).replace('฿','')}
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  ${t.type === 'income' && t.receipt_number ? `
                    <button class="btn btn-light btn-icon text-success" onclick="printReceipt('${t.id}')" title="พิมพ์ใบเสร็จ" >
                      <i class='bx bx-printer'>\x3c/i>
                    \x3c/button>` : ''}
                  ${canEdit ? `
                  <button class="btn btn-light btn-icon text-primary" onclick="openTransactionForm('${t.type}','${t.id}')" title="แก้ไข" >
                    <i class='bx bx-edit'>\x3c/i>
                  \x3c/button>
                  <button class="btn btn-light btn-icon text-danger" onclick="deleteTransactionConfirm('${t.id}')" title="ลบ" >
                    <i class='bx bx-trash'>\x3c/i>
                  \x3c/button>
                  ` : ''}
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'financeGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายการ\x3c/div>
  `;
}

function openTransactionForm(type, id) {
  // ดึง student list สำหรับ reference
  google.script.run
    .withSuccessHandler(sRes => {
      const students = (sRes.status === 'success') ? sRes.data : [];
      if (id) {
        // load tx existing
        const tx = FinanceState.data.data.find(x => x.id === id);
        showTransactionForm(tx || { type }, students);
      } else {
        showTransactionForm({ type, date: new Date().toISOString().slice(0,10), payment_method:'cash' }, students);
      }
    })
    .withFailureHandler(() => showTransactionForm({ type, date: new Date().toISOString().slice(0,10), payment_method:'cash' }, []))
    .getStudents({ page:1, per_page:500, status:'active' }, APP.token);
}

function showTransactionForm(data, students) {
  const t = data || {};
  const isIncome = t.type === 'income';
  const cats = isIncome
    ? ['ค่าเทอม','ค่าบำรุง','ค่ากิจกรรม','เงินบริจาค','อื่นๆ']
    : ['ค่าวัสดุ','ค่าน้ำค่าไฟ','ค่าจ้าง','ค่าซ่อมบำรุง','อื่นๆ'];

  Swal.fire({
    title: (t.id ? 'แก้ไข' : 'เพิ่ม') + (isIncome ? 'รายรับ' : 'รายจ่าย'),
    width: 600,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="tf_id" value="${escapeHTML(t.id || '')}">
        <input type="hidden" id="tf_type" value="${t.type}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-6">
            <label class="form-label">วันที่\x3c/label>
            <input type="date" id="tf_date" class="form-input" value="${escapeHTML((t.date||'').slice(0,10))}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">วิธีชำระ\x3c/label>
            <select id="tf_payment_method" class="form-input">
              <option value="cash"     ${(t.payment_method||'cash')==='cash'?'selected':''}>เงินสด\x3c/option>
              <option value="transfer" ${t.payment_method==='transfer'?'selected':''}>โอนเงิน\x3c/option>
              <option value="cheque"   ${t.payment_method==='cheque'?'selected':''}>เช็ค\x3c/option>
            \x3c/select>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">หมวดหมู่\x3c/label>
            <select id="tf_category" class="form-input">
              <option value="">เลือก\x3c/option>
              ${cats.map(c => `<option value="${c}" ${t.category===c?'selected':''}>${c}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>

          ${isIncome ? `
            <div class="col-span-12">
              <label class="form-label">นักเรียน (ถ้ามี)\x3c/label>
              <select id="tf_reference_id" class="form-input">
                <option value="">— ไม่ระบุ —\x3c/option>
                ${students.map(s =>
                  `<option value="${s.id}" ${t.reference_id===s.id?'selected':''}>${escapeHTML((s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''))} (${escapeHTML(s.classroom||'-')})\x3c/option>`
                ).join('')}
              \x3c/select>
            \x3c/div>` : ''}

          <div class="col-span-12">
            <label class="form-label">รายการ / รายละเอียด\x3c/label>
            <textarea id="tf_description" class="form-input" rows="2">${escapeHTML(t.description||'')}\x3c/textarea>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">จำนวนเงิน (บาท) <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="number" min="0" step="0.01" id="tf_amount" class="form-input"
                   style="font-size:18px; font-weight:700; text-align:right;"
                   value="${t.amount||''}">
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const amt = parseFloat(document.getElementById('tf_amount').value);
      if (!amt || amt <= 0) { Swal.showValidationMessage('กรุณากรอกจำนวนเงิน'); return false; }
      return {
        id            : document.getElementById('tf_id').value || null,
        type          : document.getElementById('tf_type').value,
        date          : document.getElementById('tf_date').value,
        payment_method: document.getElementById('tf_payment_method').value,
        category      : document.getElementById('tf_category').value,
        reference_id  : isIncome && document.getElementById('tf_reference_id') ? document.getElementById('tf_reference_id').value : '',
        description   : document.getElementById('tf_description').value,
        amount        : amt
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          loadFinanceSummary();
          loadFinanceTable();
          if (isIncome && res.data && res.data.receipt_number) {
            setTimeout(() => {
              Swal.fire({
                icon:'success', title:'บันทึกแล้ว',
                text:'พิมพ์ใบเสร็จเลยไหม?',
                showCancelButton: true,
                confirmButtonText:'<i class="bx bx-printer">\x3c/i> พิมพ์',
                cancelButtonText:'ทีหลัง'
              }).then(rp => {
                if (rp.isConfirmed) printReceipt(res.data.id);
              });
            }, 300);
          }
        } else {
          if (res.message === 'session_invalid') return handleLogout(false);
          Swal.fire({ icon:'error', text:res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
      .saveTransaction(r.value, APP.token);
  });
}

function deleteTransactionConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', icon:'warning',
    showCancelButton: true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadFinanceSummary(); loadFinanceTable(); }
        else showToast('error', res.message);
      })
      .deleteTransaction(id, APP.token);
  });
}

function printReceipt(transactionId) {
  const directUrl = `${GAS_URL}?action=printReceipt&transaction_id=${encodeURIComponent(transactionId)}&token=${encodeURIComponent(APP.token)}`;
  showLoading('กำลังเตรียมใบเสร็จ...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html, 'ใบเสร็จรับเงิน', directUrl);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .generateReceiptHTML(transactionId, APP.token);
}


/* ============================================================
 *  DOCUMENTS (สารบรรณ)
 * ============================================================ */
const DocsState = { page:1, search:'', doc_type:'', status:'', data:null, teachers:null, users:null };

const DOC_TYPES = {
  receive : { label:'หนังสือรับ',     color:'#10B981', icon:'bx-envelope-open' },
  send    : { label:'หนังสือส่ง',     color:'#4F46E5', icon:'bx-send' },
  order   : { label:'คำสั่ง',         color:'#8B5CF6', icon:'bx-clipboard' },
  memo    : { label:'บันทึกข้อความ',  color:'#F59E0B', icon:'bx-note' },
  announce: { label:'ประกาศ',         color:'#DC2626', icon:'bx-volume-full' },
  form    : { label:'แบบฟอร์มเอกสาร', color:'#06B6D4', icon:'bx-file' }
};

function renderDocuments(container) {
  container.innerHTML = `
    ${pageHeader('สารบรรณโรงเรียน', 'bxs-envelope', (typeof canEditModule === 'function' ? canEditModule('documents') : true) ? `
      <button class="btn btn-blue" onclick="openDocumentForm()">
        <i class='bx bx-plus'>\x3c/i> เพิ่มเอกสาร
      \x3c/button>
    ` : '')}

    <div class="page-card mb-3">
      <div class="page-card-body">
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2" id="docTypeCards">\x3c/div>
      \x3c/div>
    \x3c/div>

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="docSearch" placeholder="ค้นหา เลขที่ / เรื่อง"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onDocSearch()">
          \x3c/div>
          <select id="docType" onchange="onDocFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกประเภท\x3c/option>
            ${Object.keys(DOC_TYPES).map(k => `<option value="${k}">${DOC_TYPES[k].label}\x3c/option>`).join('')}
          \x3c/select>
          <select id="docStatus" onchange="onDocFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="draft">ร่าง\x3c/option>
            <option value="active">ใช้งาน\x3c/option>
            <option value="archived">เก็บถาวร\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="docTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  renderDocTypeCards();
  loadDocuments();
}

function renderDocTypeCards() {
  const el = document.getElementById('docTypeCards');
  if (!el) return;
  el.innerHTML = Object.keys(DOC_TYPES).map(k => {
    const t = DOC_TYPES[k];
    return `
      <div class="doc-type-card" onclick="DocsState.doc_type='${k}'; DocsState.page=1; document.getElementById('docType').value='${k}'; loadDocuments();"
           style="cursor:pointer; padding:14px; border-radius:12px; background:white; border:1px solid #F1F5F9; text-align:center; transition:all .15s;">
        <div style="width:46px; height:46px; margin:0 auto 8px; border-radius:12px; background:${t.color}1A; color:${t.color}; display:flex; align-items:center; justify-content:center; font-size:24px;">
          <i class='bx ${t.icon}'>\x3c/i>
        \x3c/div>
        <div class="text-xs font-semibold text-slate-700">${t.label}\x3c/div>
      \x3c/div>`;
  }).join('') + `
    <style>
      .doc-type-card:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.06); }
    \x3c/style>
  `;
}

let _docSearchTimer = null;
function onDocSearch() {
  DocsState.search = document.getElementById('docSearch').value;
  DocsState.page = 1;
  clearTimeout(_docSearchTimer);
  _docSearchTimer = setTimeout(loadDocuments, 300);
}
function onDocFilter() {
  DocsState.doc_type = document.getElementById('docType').value;
  DocsState.status   = document.getElementById('docStatus').value;
  DocsState.page = 1;
  loadDocuments();
}
function docsGoToPage(p) { DocsState.page = p; loadDocuments(); }

function loadDocuments() {
  const area = document.getElementById('docTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  if (!DocsState.teachers) {
    google.script.run.withSuccessHandler(res => {
      if (res.status === 'success') {
        DocsState.teachers = res.teachers || [];
        DocsState.users = res.users || [];
        if (DocsState.data) renderDocumentsTable(DocsState.data);
      }
    }).getUsersAndTeachers(APP.token);
  }

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      DocsState.data = res;
      renderDocumentsTable(res);
    })
    .getDocuments({
      page: DocsState.page, search: DocsState.search,
      doc_type: DocsState.doc_type, status: DocsState.status
    }, APP.token);
}

function renderDocumentsTable(res) {
  const area = document.getElementById('docTable');
  if (!area) return;
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-folder-open'>\x3c/i>ไม่มีเอกสาร\x3c/div>`;
    return;
  }
  const statusLabel = { draft:'ร่าง', active:'ใช้งาน', archived:'เก็บถาวร' };
  const statusClass = { draft:'status-pending', active:'status-active', archived:'status-inactive' };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-left">เรื่อง\x3c/th>
            <th class="px-3 py-2.5 text-left">จาก/ถึง\x3c/th>
            <th class="px-3 py-2.5 text-left">ผู้รับผิดชอบ\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(d => {
            const t = DOC_TYPES[d.doc_type] || { label:d.doc_type, color:'#64748B', icon:'bx-file' };
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(d.doc_number || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:${t.color};font-weight:600;">
                    <i class='bx ${t.icon}'>\x3c/i> ${t.label}
                  \x3c/span>
                \x3c/td>
                <td class="px-3 py-2.5 font-semibold text-slate-800">${escapeHTML(d.subject || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <div class="text-xs text-slate-600">จาก: ${escapeHTML(d.from || '-')}\x3c/div>
                  <div class="text-xs text-slate-600">ถึง: ${escapeHTML(d.to || '-')}\x3c/div>
                \x3c/td>
                <td class="px-3 py-2.5">
                  ${(d.assigned_to && (Array.isArray(d.assigned_to) ? d.assigned_to : [d.assigned_to]).filter(Boolean).length > 0)
                    ? (Array.isArray(d.assigned_to) ? d.assigned_to : [d.assigned_to]).filter(Boolean).map(tid => 
                        `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold inline-block mr-1 mb-1"><i class='bx bx-user'>\x3c/i> ${escapeHTML(DocsState.teachers ? (DocsState.teachers.find(t=>t.id===tid)?.name || tid) : 'กำลังโหลด...')}\x3c/span>`
                      ).join('')
                    : '-'}
                \x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap">${formatThaiDateShort(d.date)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <span class="status-badge ${statusClass[d.status]||'status-pending'}">${statusLabel[d.status]||d.status}\x3c/span>
                \x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewDocument('${d.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    ${(typeof canEditModule === 'function' ? canEditModule('documents') : true) ? `
                    <button class="btn btn-light btn-icon text-primary" onclick="openDocumentForm('${d.id}')" title="แก้ไข" >
                      <i class='bx bx-edit'>\x3c/i>
                    \x3c/button>
                    <button class="btn btn-light btn-icon text-danger" onclick="deleteDocumentConfirm('${d.id}')" title="ลบ" >
                      <i class='bx bx-trash'>\x3c/i>
                    \x3c/button>
                    ` : ''}
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'docsGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} เอกสาร\x3c/div>
  `;
}

function openDocumentForm(id) {
  if (id) {
    const d = DocsState.data && DocsState.data.data.find(x => x.id === id);
    if (d) showDocumentForm(d);
    else showToast('error', 'ไม่พบเอกสาร');
  } else {
    showDocumentForm(null);
  }
}

function showDocumentForm(data) {
  const d = data || {};

  Swal.fire({
    title: d.id ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่',
    width: 720,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="df_id" value="${escapeHTML(d.id || '')}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-4">
            <label class="form-label">ประเภท <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="df_doc_type" class="form-input">
              ${Object.keys(DOC_TYPES).map(k => `<option value="${k}" ${d.doc_type===k?'selected':''}>${DOC_TYPES[k].label}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันที่\x3c/label>
            <input type="date" id="df_date" class="form-input" value="${escapeHTML((d.date||new Date().toISOString().slice(0,10)).slice(0,10))}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เลขที่เอกสาร\x3c/label>
            <input type="text" id="df_doc_number" class="form-input" value="${escapeHTML(d.doc_number||'')}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">สถานะ\x3c/label>
            <select id="df_status" class="form-input">
              <option value="draft"   ${(d.status||'draft')==='draft'?'selected':''}>ร่าง\x3c/option>
              <option value="active"  ${d.status==='active'?'selected':''}>ใช้งาน\x3c/option>
              <option value="archived"${d.status==='archived'?'selected':''}>เก็บถาวร\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">มอบหมายให้ (ครูผู้รับผิดชอบ)\x3c/label>
            <div class="form-input" style="max-height: 150px; overflow-y: auto; padding: 10px;">
              ${(DocsState.teachers||[]).map(t => {
                const isChecked = (d.assigned_to || []).includes(t.id);
                return `<label style="display:flex; align-items:center; gap:8px; margin-bottom:5px; cursor:pointer;">
                  <input type="checkbox" name="df_assigned_to" value="${t.id}" ${isChecked ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px;">
                  <span style="font-size:13px;">${escapeHTML(t.name)}\x3c/span>
                \x3c/label>`;
              }).join('')}
            \x3c/div>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">เรื่อง <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="df_subject" class="form-input" value="${escapeHTML(d.subject||'')}">
          \x3c/div>

          <div class="col-span-6">
            <label class="form-label">จาก\x3c/label>
            <input type="text" id="df_from" class="form-input" value="${escapeHTML(d.from||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ถึง\x3c/label>
            <input type="text" id="df_to" class="form-input" value="${escapeHTML(d.to||'')}">
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">เนื้อหา\x3c/label>
            <textarea id="df_content" class="form-input" rows="5">${escapeHTML(d.content||'')}\x3c/textarea>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ไฟล์แนบ\x3c/label>
            <div class="flex items-center gap-2">
              <input type="file" id="df_file_input" style="display:none;"
                     onchange="handleImageUpload(this,'documents',(url)=>{
                       document.getElementById('df_attachment').value=url;
                       document.getElementById('df_attachment_label').textContent='แนบไฟล์แล้ว';
                     })">
              <button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:12px;"
                      onclick="document.getElementById('df_file_input').click()">
                <i class='bx bx-paperclip'>\x3c/i> เลือกไฟล์
              \x3c/button>
              <span id="df_attachment_label" class="text-xs text-slate-500">
                ${d.attachment ? 'แนบไฟล์แล้ว' : 'ยังไม่ได้แนบ'}
              \x3c/span>
              ${d.attachment ? `<a href="${escapeHTML(d.attachment)}" target="_blank" class="text-xs text-blue-600 hover:underline ml-2">ดูไฟล์\x3c/a>` : ''}
              <input type="hidden" id="df_attachment" value="${escapeHTML(d.attachment||'')}">
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
      \x3c/style>
    `,
    didOpen: () => {
      const typeEl = document.getElementById('df_doc_type');
      const numEl = document.getElementById('df_doc_number');
      const fetchNextNum = () => {
        if (!numEl) return;
        numEl.value = 'กำลังคำนวณ...';
        google.script.run.withSuccessHandler(res => {
          if (res.status === 'success') numEl.value = res.data;
          else numEl.value = '';
        }).getNextDocNumber(typeEl.value, APP.token);
      };
      
      if (!d.id) {
        fetchNextNum();
        typeEl.addEventListener('change', fetchNextNum);
      }
    },
    preConfirm: () => {
      const subject = document.getElementById('df_subject').value.trim();
      if (!subject) { Swal.showValidationMessage('กรุณากรอกเรื่อง'); return false; }
      return {
        id        : document.getElementById('df_id').value || null,
        doc_type  : document.getElementById('df_doc_type').value,
        doc_number: document.getElementById('df_doc_number').value,
        date      : document.getElementById('df_date').value,
        status    : document.getElementById('df_status').value,
        assigned_to: Array.from(document.querySelectorAll('input[name="df_assigned_to"]:checked')).map(cb => cb.value),
        subject   : subject,
        from      : document.getElementById('df_from').value,
        to        : document.getElementById('df_to').value,
        content   : document.getElementById('df_content').value,
        attachment: document.getElementById('df_attachment').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadDocuments(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
      .saveDocument(r.value, APP.token);
  });
}

function viewDocument(id) {
  const d = DocsState.data && DocsState.data.data.find(x => x.id === id);
  if (!d) return showToast('error', 'ไม่พบเอกสาร');
  const t = DOC_TYPES[d.doc_type] || { label:d.doc_type, color:'#64748B' };

  Swal.fire({
    title: t.label,
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div style="background:${t.color}1A; color:${t.color}; padding:10px 16px; border-radius:10px; margin-bottom:14px;">
          <div class="text-xs font-semibold opacity-80">เลขที่\x3c/div>
          <div class="font-mono text-lg font-bold">${escapeHTML(d.doc_number || '-')}\x3c/div>
        \x3c/div>
        <h3 style="color:#0F172A; font-size:17px; margin:0 0 12px;">${escapeHTML(d.subject || '-')}\x3c/h3>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px; margin-bottom:14px;">
          <span class="text-slate-500">วันที่:\x3c/span>  <span>${formatThaiDate(d.date)}\x3c/span>
          <span class="text-slate-500">จาก:\x3c/span>     <span>${escapeHTML(d.from || '-')}\x3c/span>
          <span class="text-slate-500">ถึง:\x3c/span>     <span>${escapeHTML(d.to || '-')}\x3c/span>
        \x3c/div>
        ${d.content ? `<div style="background:#F8FAFC; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:13px;">${escapeHTML(d.content)}\x3c/div>` : ''}
        ${d.attachment ? `<div class="mt-3"><a href="${escapeHTML(d.attachment)}" target="_blank" class="btn btn-outline" style="font-size:12px;"><i class='bx bx-paperclip'>\x3c/i> เปิดไฟล์แนบ\x3c/a>\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function deleteDocumentConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', icon:'warning',
    showCancelButton: true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadDocuments(); }
        else showToast('error', res.message);
      })
      .deleteDocument(id, APP.token);
  });
}


/* ============================================================
 *  APPROVALS
 * ============================================================ */
const ApprovalsState = { page:1, search:'', type:'', status:'', data:null };

const APPROVAL_TYPES = {
  leave   : { label:'ใบลา',           icon:'bx-calendar-x' },
  budget  : { label:'งบประมาณ',       icon:'bx-money' },
  purchase: { label:'จัดซื้อ',         icon:'bx-cart' },
  trip    : { label:'ไปราชการ',       icon:'bx-trip' },
  other   : { label:'อื่นๆ',           icon:'bx-file' }
};

function renderApprovals(container) {
  container.innerHTML = `
    ${pageHeader('ระบบอนุมัติ', 'bxs-badge-check', `
      <button class="btn btn-blue" onclick="openApprovalForm()">
        <i class='bx bx-plus'>\x3c/i> ส่งคำขออนุมัติ
      \x3c/button>
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="aprSearch" placeholder="ค้นหา"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onAprSearch()">
          \x3c/div>
          <select id="aprType" onchange="onAprFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกประเภท\x3c/option>
            ${Object.keys(APPROVAL_TYPES).map(k => `<option value="${k}">${APPROVAL_TYPES[k].label}\x3c/option>`).join('')}
          \x3c/select>
          <select id="aprStatus" onchange="onAprFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="pending"  selected>รอพิจารณา\x3c/option>
            <option value="approved">อนุมัติแล้ว\x3c/option>
            <option value="rejected">ปฏิเสธ\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="aprTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  ApprovalsState.status = 'pending';
  loadApprovals();
}

let _aprSearchTimer = null;
function onAprSearch() {
  ApprovalsState.search = document.getElementById('aprSearch').value;
  ApprovalsState.page = 1;
  clearTimeout(_aprSearchTimer);
  _aprSearchTimer = setTimeout(loadApprovals, 300);
}
function onAprFilter() {
  ApprovalsState.type   = document.getElementById('aprType').value;
  ApprovalsState.status = document.getElementById('aprStatus').value;
  ApprovalsState.page = 1;
  loadApprovals();
}
function aprGoToPage(p) { ApprovalsState.page = p; loadApprovals(); }

function loadApprovals() {
  const area = document.getElementById('aprTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      ApprovalsState.data = res;
      renderApprovalsTable(res);
      refreshBadges();
    })
    .getApprovals({
      page: ApprovalsState.page, search: ApprovalsState.search,
      type: ApprovalsState.type, status: ApprovalsState.status
    }, APP.token);
}

function renderApprovalsTable(res) {
  const area = document.getElementById('aprTable');
  if (!area) return;
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-task'>\x3c/i>ไม่มีคำขอ\x3c/div>`;
    return;
  }
  const canApprove = (APP.user.permissions || []).includes('approve');
  const statusBadge = (s) => {
    if (s === 'approved') return '<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>';
    if (s === 'rejected') return '<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>';
    return '<span class="status-badge status-pending">รอพิจารณา\x3c/span>';
  };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-left">เรื่อง\x3c/th>
            <th class="px-3 py-2.5 text-left">ผู้ขอ\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่ขอ\x3c/th>
            <th class="px-3 py-2.5 text-right">จำนวนเงิน\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(a => {
            const t = APPROVAL_TYPES[a.type] || { label:a.type, icon:'bx-file' };
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(a.request_id || '-')}\x3c/td>
                <td class="px-3 py-2.5"><i class='bx ${t.icon} mr-1 text-primary' >\x3c/i> ${t.label}\x3c/td>
                <td class="px-3 py-2.5 font-semibold">${escapeHTML(a.subject || '-')}\x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(a.requester_name || '-')}\x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap text-xs">${formatThaiDateShort(a.requested_at)}\x3c/td>
                <td class="px-3 py-2.5 text-right font-semibold">${a.amount > 0 ? formatMoney(a.amount).replace('฿','') : '-'}\x3c/td>
                <td class="px-3 py-2.5 text-center">${statusBadge(a.status)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewApproval('${a.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    ${canApprove && a.status === 'pending' ? `
                      <button class="btn btn-light btn-icon text-success" onclick="reviewApprovalDlg('${a.id}','approve')" title="อนุมัติ" >
                        <i class='bx bx-check'>\x3c/i>
                      \x3c/button>
                      <button class="btn btn-light btn-icon text-danger" onclick="reviewApprovalDlg('${a.id}','reject')" title="ปฏิเสธ" >
                        <i class='bx bx-x'>\x3c/i>
                      \x3c/button>` : ''}
                    ${(canApprove || (APP.user.permissions || []).includes('delete') || a.requester_id === APP.user.id) ? `
                    <button class="btn btn-light btn-icon text-danger" onclick="deleteApproval('${a.id}')" title="ลบ" >
                      <i class='bx bx-trash'>\x3c/i>
                    \x3c/button>` : ''}
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'aprGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} คำขอ\x3c/div>
  `;
}

function openApprovalForm() {
  Swal.fire({
    title: 'ส่งคำขออนุมัติ',
    width: 600,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-send">\x3c/i> ส่งคำขอ',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-12">
            <label class="form-label">ประเภทคำขอ <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="af_type" class="form-input">
              ${Object.keys(APPROVAL_TYPES).map(k => `<option value="${k}">${APPROVAL_TYPES[k].label}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">เรื่อง <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="af_subject" class="form-input">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">รายละเอียด\x3c/label>
            <textarea id="af_detail" class="form-input" rows="4">\x3c/textarea>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">จำนวนเงิน (ถ้ามี)\x3c/label>
            <input type="number" min="0" step="0.01" id="af_amount" class="form-input" placeholder="0.00">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ไฟล์แนบ\x3c/label>
            <div class="flex items-center gap-2">
              <input type="file" id="af_file_input" style="display:none;"
                     onchange="handleImageUpload(this,'approvals',(url)=>{
                       document.getElementById('af_attachment').value=url;
                       document.getElementById('af_attachment_label').textContent='แนบไฟล์แล้ว';
                     })">
              <button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:12px;"
                      onclick="document.getElementById('af_file_input').click()">
                <i class='bx bx-paperclip'>\x3c/i> เลือกไฟล์
              \x3c/button>
              <span id="af_attachment_label" class="text-xs text-slate-500">ยังไม่ได้แนบ\x3c/span>
              <input type="hidden" id="af_attachment">
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const subject = document.getElementById('af_subject').value.trim();
      if (!subject) { Swal.showValidationMessage('กรุณากรอกเรื่อง'); return false; }
      return {
        type      : document.getElementById('af_type').value,
        subject   : subject,
        detail    : document.getElementById('af_detail').value,
        amount    : document.getElementById('af_amount').value,
        attachment: document.getElementById('af_attachment').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังส่งคำขอ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadApprovals(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
      .saveApproval(r.value, APP.token);
  });
}

function viewApproval(id) {
  const a = ApprovalsState.data && ApprovalsState.data.data.find(x => x.id === id);
  if (!a) return showToast('error', 'ไม่พบคำขอ');
  const t = APPROVAL_TYPES[a.type] || { label:a.type };

  Swal.fire({
    title: t.label,
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div style="background:#FAF0F2; padding:14px; border-radius:10px; margin-bottom:14px;">
          <div class="text-xs text-slate-500">เลขที่\x3c/div>
          <div class="font-mono text-lg font-bold">${escapeHTML(a.request_id || '-')}\x3c/div>
        \x3c/div>
        <h3 style="font-size:16px; margin:0 0 12px;">${escapeHTML(a.subject || '-')}\x3c/h3>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px; margin-bottom:14px;">
          <span class="text-slate-500">ผู้ขอ:\x3c/span>      <span>${escapeHTML(a.requester_name || '-')}\x3c/span>
          <span class="text-slate-500">วันที่ขอ:\x3c/span>   <span>${formatThaiDate(a.requested_at)}\x3c/span>
          ${a.amount > 0 ? `<span class="text-slate-500">จำนวนเงิน:\x3c/span> <span style="font-weight:700;color:#3730A3;">${formatMoney(a.amount)}\x3c/span>` : ''}
          <span class="text-slate-500">สถานะ:\x3c/span>      <span>${a.status==='approved'?'<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>':a.status==='rejected'?'<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>':'<span class="status-badge status-pending">รอพิจารณา\x3c/span>'}\x3c/span>
          ${a.reviewer_name ? `<span class="text-slate-500">ผู้พิจารณา:\x3c/span> <span>${escapeHTML(a.reviewer_name)}\x3c/span>` : ''}
          ${a.reviewed_at   ? `<span class="text-slate-500">วันที่:\x3c/span>    <span>${formatThaiDate(a.reviewed_at)}\x3c/span>` : ''}
        \x3c/div>
        ${a.detail ? `<div style="background:#F8FAFC; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:13px;">${escapeHTML(a.detail)}\x3c/div>` : ''}
        ${a.comment ? `<div class="mt-3"><div class="text-xs text-slate-500 mb-1">ความเห็นผู้พิจารณา:\x3c/div><div style="background:#FEF3C7; padding:10px; border-radius:8px; font-size:13px;">${escapeHTML(a.comment)}\x3c/div>\x3c/div>` : ''}
        ${a.attachment ? `<div class="mt-3"><a href="${escapeHTML(a.attachment)}" target="_blank" class="btn btn-outline" style="font-size:12px;"><i class='bx bx-paperclip'>\x3c/i> เปิดไฟล์แนบ\x3c/a>\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function reviewApprovalDlg(id, action) {
  Swal.fire({
    title: action === 'approve' ? 'อนุมัติคำขอ' : 'ปฏิเสธคำขอ',
    icon: action === 'approve' ? 'success' : 'warning',
    input: 'textarea',
    inputLabel: 'ความเห็น (ถ้ามี)',
    inputPlaceholder: '...',
    showCancelButton: true,
    confirmButtonText: action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: action === 'approve' ? '#10B981' : '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadApprovals(); }
        else showToast('error', res.message);
      })
      .reviewApproval(id, action, r.value || '', APP.token);
  });
}

function deleteApproval(id) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: 'คุณแน่ใจหรือไม่ว่าต้องการลบคำขอนี้? (ไม่สามารถกู้คืนได้)',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบข้อมูล',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (r.isConfirmed) {
      showLoading('กำลังลบ...');
      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          if (res.status === 'success') {
            Swal.fire('สำเร็จ', res.message, 'success');
            loadApprovals();
          } else {
            Swal.fire('ผิดพลาด', res.message, 'error');
          }
        })
        .withFailureHandler(err => {
          hideLoading();
          Swal.fire('ผิดพลาด', err.message, 'error');
        })
        .deleteApproval(id, APP.token);
    }
  });
}


/* ============================================================
 *  REGISTRATION
 * ============================================================ */
const RegState = { page:1, search:'', status:'', data:null };

function renderRegistration(container) {
  container.innerHTML = `
    ${pageHeader('งานทะเบียน', 'bxs-id-card', (typeof canEditModule === 'function' ? canEditModule('registration') : true) ? `
      <button class="btn btn-blue" onclick="openRegistrationForm()">
        <i class='bx bx-plus'>\x3c/i> รับสมัครใหม่
      \x3c/button>
    ` : '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="regSearch" placeholder="ค้นหา รหัสใบสมัคร / ชื่อ"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onRegSearch()">
          \x3c/div>
          <select id="regStatus" onchange="onRegFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="pending"  selected>รอพิจารณา\x3c/option>
            <option value="approved">อนุมัติแล้ว\x3c/option>
            <option value="rejected">ปฏิเสธ\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="regTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  RegState.status = 'pending';
  loadRegistrations();
}

let _regSearchTimer = null;
function onRegSearch() {
  RegState.search = document.getElementById('regSearch').value;
  RegState.page = 1;
  clearTimeout(_regSearchTimer);
  _regSearchTimer = setTimeout(loadRegistrations, 300);
}
function onRegFilter() {
  RegState.status = document.getElementById('regStatus').value;
  RegState.page = 1;
  loadRegistrations();
}
function regGoToPage(p) { RegState.page = p; loadRegistrations(); }

function loadRegistrations() {
  const area = document.getElementById('regTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      RegState.data = res;
      renderRegistrationsTable(res);
    })
    .getRegistrations({ page: RegState.page, search: RegState.search, status: RegState.status }, APP.token);
}

function renderRegistrationsTable(res) {
  const area = document.getElementById('regTable');
  if (!area) return;
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-clipboard'>\x3c/i>ไม่มีใบสมัคร\x3c/div>`;
    return;
  }
  const canApprove = (APP.user.permissions || []).includes('approve');
  const statusBadge = (s) => {
    if (s === 'approved') return '<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>';
    if (s === 'rejected') return '<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>';
    return '<span class="status-badge status-pending">รอพิจารณา\x3c/span>';
  };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่ใบสมัคร\x3c/th>
            <th class="px-3 py-2.5 text-left">ชื่อนักเรียน\x3c/th>
            <th class="px-3 py-2.5 text-left">ชั้นที่สมัคร\x3c/th>
            <th class="px-3 py-2.5 text-left">ปีการศึกษา\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่สมัคร\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(r => {
            const sd = r.student_data || {};
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(r.application_id || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2">
                    ${avatarHTML(sd.photo, sd.first_name, 32)}
                    <div>
                      <div class="font-semibold text-slate-800">${escapeHTML((sd.prefix||'')+(sd.first_name||'')+' '+(sd.last_name||''))}\x3c/div>
                      <div class="text-xs text-slate-500">${escapeHTML(sd.national_id || '-')}\x3c/div>
                    \x3c/div>
                  \x3c/div>
                \x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(r.grade_applying || '-')}\x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(r.academic_year || '-')}\x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap text-xs">${formatThaiDateShort(r.created_at)}\x3c/td>
                <td class="px-3 py-2.5 text-center">${statusBadge(r.status)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewRegistration('${r.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    ${canApprove && r.status === 'pending' ? `
                      <button class="btn btn-light btn-icon text-success" onclick="approveRegConfirm('${r.id}')" title="อนุมัติ" >
                        <i class='bx bx-check'>\x3c/i>
                      \x3c/button>
                      <button class="btn btn-light btn-icon text-danger" onclick="rejectRegConfirm('${r.id}')" title="ปฏิเสธ" >
                        <i class='bx bx-x'>\x3c/i>
                      \x3c/button>` : ''}
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'regGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} ใบสมัคร\x3c/div>
  `;
}

function openRegistrationForm() {
  Swal.fire({
    title: 'รับสมัครนักเรียนใหม่',
    width: 760,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    showCloseButton: true,
    html: `
      <div style="text-align:left; font-size:14px;">

        <!-- Photo -->
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <div id="regPhotoBox" class="avatar-circle" style="width:70px;height:70px;border-radius:50%;font-size:24px;">?\x3c/div>
          <div>
            <button type="button" class="btn btn-outline" onclick="document.getElementById('regPhotoInput').click()">
              <i class='bx bx-upload'>\x3c/i> รูปนักเรียน
            \x3c/button>
            <input type="file" id="regPhotoInput" accept="image/*" style="display:none;"
                   onchange="handleImageUpload(this,'students',(url)=>{
                     document.getElementById('rf_photo').value=url;
                     document.getElementById('regPhotoBox').style.backgroundImage='url('+url+')';
                     document.getElementById('regPhotoBox').textContent='';
                   })">
            <input type="hidden" id="rf_photo">
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลใบสมัคร\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-6">
            <label class="form-label">ชั้นที่สมัคร <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_grade_applying" class="form-input" placeholder="ม.1/1">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ปีการศึกษา\x3c/label>
            <input type="text" id="rf_academic_year" class="form-input" value="${escapeHTML(APP.dashboardData?.config?.academic_year || (new Date().getFullYear()+543))}">
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลนักเรียน\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-3">
            <label class="form-label">คำนำหน้า\x3c/label>
            <select id="rf_prefix" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="เด็กชาย">เด็กชาย\x3c/option>
              <option value="เด็กหญิง">เด็กหญิง\x3c/option>
              <option value="นาย">นาย\x3c/option>
              <option value="นางสาว">นางสาว\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ชื่อ <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_first_name" class="form-input">
          \x3c/div>
          <div class="col-span-5">
            <label class="form-label">นามสกุล <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_last_name" class="form-input">
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">เลขบัตรประชาชน\x3c/label>
            <input type="text" id="rf_national_id" class="form-input" maxlength="13">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันเกิด\x3c/label>
            <input type="date" id="rf_birth_date" class="form-input">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เพศ\x3c/label>
            <select id="rf_gender" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="male">ชาย\x3c/option>
              <option value="female">หญิง\x3c/option>
            \x3c/select>
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ผู้ปกครอง\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-5">
            <label class="form-label">ชื่อผู้ปกครอง\x3c/label>
            <input type="text" id="rf_parent_name" class="form-input">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เบอร์โทร\x3c/label>
            <input type="tel" id="rf_parent_phone" class="form-input">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ความสัมพันธ์\x3c/label>
            <select id="rf_parent_relation" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="บิดา">บิดา\x3c/option>
              <option value="มารดา">มารดา\x3c/option>
              <option value="ผู้ปกครอง">ผู้ปกครอง\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ที่อยู่\x3c/label>
            <textarea id="rf_address" class="form-input" rows="2">\x3c/textarea>
          \x3c/div>
        \x3c/div>

        <div>
          <label class="form-label">หมายเหตุ\x3c/label>
          <textarea id="rf_note" class="form-input" rows="2" placeholder="เอกสารที่ยื่น, ข้อสังเกต ...">\x3c/textarea>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const fn = document.getElementById('rf_first_name').value.trim();
      const ln = document.getElementById('rf_last_name').value.trim();
      const gd = document.getElementById('rf_grade_applying').value.trim();
      if (!fn || !ln) { Swal.showValidationMessage('กรุณากรอกชื่อและนามสกุล'); return false; }
      if (!gd) { Swal.showValidationMessage('กรุณากรอกชั้นที่สมัคร'); return false; }

      return {
        academic_year : document.getElementById('rf_academic_year').value,
        grade_applying: gd,
        student_data: {
          prefix         : document.getElementById('rf_prefix').value,
          first_name     : fn,
          last_name      : ln,
          national_id    : document.getElementById('rf_national_id').value,
          birth_date     : document.getElementById('rf_birth_date').value,
          gender         : document.getElementById('rf_gender').value,
          parent_name    : document.getElementById('rf_parent_name').value,
          parent_phone   : document.getElementById('rf_parent_phone').value,
          parent_relation: document.getElementById('rf_parent_relation').value,
          address        : document.getElementById('rf_address').value,
          photo          : document.getElementById('rf_photo').value
        },
        note: document.getElementById('rf_note').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadRegistrations(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
      .saveRegistration(r.value, APP.token);
  });
}

function viewRegistration(id) {
  const r = RegState.data && RegState.data.data.find(x => x.id === id);
  if (!r) return showToast('error', 'ไม่พบ');
  const sd = r.student_data || {};

  Swal.fire({
    title: 'ใบสมัคร',
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div class="text-center mb-4 pb-4 border-b border-slate-200">
          ${avatarHTML(sd.photo, sd.first_name, 80)}
          <div style="font-size:17px; font-weight:700; margin-top:8px;">
            ${escapeHTML((sd.prefix||'')+(sd.first_name||'')+' '+(sd.last_name||''))}
          \x3c/div>
          <div class="text-xs text-slate-500">${escapeHTML(r.application_id || '')}\x3c/div>
        \x3c/div>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px;">
          <span class="text-slate-500">ชั้นที่สมัคร:\x3c/span>  <span>${escapeHTML(r.grade_applying || '-')}\x3c/span>
          <span class="text-slate-500">ปีการศึกษา:\x3c/span>    <span>${escapeHTML(r.academic_year || '-')}\x3c/span>
          <span class="text-slate-500">เลขบัตร:\x3c/span>       <span>${escapeHTML(sd.national_id || '-')}\x3c/span>
          <span class="text-slate-500">วันเกิด:\x3c/span>       <span>${sd.birth_date ? formatThaiDate(sd.birth_date) : '-'}\x3c/span>
          <span class="text-slate-500">เพศ:\x3c/span>           <span>${sd.gender==='male'?'ชาย':sd.gender==='female'?'หญิง':'-'}\x3c/span>
          <span class="text-slate-500">ผู้ปกครอง:\x3c/span>     <span>${escapeHTML(sd.parent_name || '-')} (${escapeHTML(sd.parent_relation || '-')})\x3c/span>
          <span class="text-slate-500">โทร:\x3c/span>           <span>${escapeHTML(sd.parent_phone || '-')}\x3c/span>
          <span class="text-slate-500">ที่อยู่:\x3c/span>        <span>${escapeHTML(sd.address || '-')}\x3c/span>
          <span class="text-slate-500">วันที่สมัคร:\x3c/span>   <span>${formatThaiDate(r.created_at)}\x3c/span>
          <span class="text-slate-500">สถานะ:\x3c/span>         <span>${r.status==='approved'?'<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>':r.status==='rejected'?'<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>':'<span class="status-badge status-pending">รอพิจารณา\x3c/span>'}\x3c/span>
        \x3c/div>
        ${r.note ? `<div class="mt-3 p-3 rounded-lg bg-slate-50 text-sm">${escapeHTML(r.note)}\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function approveRegConfirm(id) {
  Swal.fire({
    title: 'อนุมัติใบสมัครและสร้างข้อมูลนักเรียน?',
    text: 'ระบบจะสร้างข้อมูลในรายการนักเรียนทันที',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#10B981'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังประมวลผล...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message, timer:2000 }); loadRegistrations(); }
        else showToast('error', res.message);
      })
      .approveRegistration(id, APP.token);
  });
}

function rejectRegConfirm(id) {
  Swal.fire({
    title: 'ปฏิเสธใบสมัคร?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ปฏิเสธ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadRegistrations(); }
        else showToast('error', res.message);
      })
      .rejectRegistration(id, APP.token);
  });
}
