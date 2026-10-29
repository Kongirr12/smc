/* ============================================================
 *  Smart School Office — js2
 *  Part 2: Students | Personnel | Attendance
 * ============================================================ */


/* ============================================================
 *  Shared UI Helpers ของ Part 2
 * ============================================================ */
function pageHeader(title, icon, actions) {
  return `
    <div class="welcome-row">
      <div>
        <h1><i class='bx ${icon} text-primary' >\x3c/i> ${escapeHTML(title)}\x3c/h1>
        <div class="sub"><i class='bx bx-chevron-right'>\x3c/i> ${escapeHTML(title)}\x3c/div>
      \x3c/div>
      <div class="flex gap-2 flex-wrap">${actions || ''}\x3c/div>
    \x3c/div>`;
}

function paginationHTML(page, totalPages, fnName) {
  if (totalPages <= 1) return '';
  const btn = (n, label, disabled) => `
    <button class="btn btn-light btn-icon"
            ${disabled ? 'disabled style="opacity:.4;cursor:not-allowed;"' : ''}
            onclick="${fnName}(${n})" title="${label}">
      ${label}
    \x3c/button>`;
  const pageBtn = n => `
    <button class="btn ${n === page ? 'btn-blue' : 'btn-light'}"
            style="min-width:34px; padding:6px 10px;"
            onclick="${fnName}(${n})">${n}\x3c/button>`;
  let nums = '';
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  if (start > 1)   nums += pageBtn(1) + (start > 2 ? '<span style="color:#94A3B8;">…\x3c/span>' : '');
  for (let i = start; i <= end; i++) nums += pageBtn(i);
  if (end < totalPages) nums += (end < totalPages - 1 ? '<span style="color:#94A3B8;">…\x3c/span>' : '') + pageBtn(totalPages);
  return `
    <div class="flex items-center justify-between flex-wrap gap-2 mt-3">
      <div class="text-sm text-slate-500">หน้า <b>${page}\x3c/b> จาก <b>${totalPages}\x3c/b>\x3c/div>
      <div class="flex items-center gap-1">
        ${btn(page - 1, '‹', page <= 1)}
        ${nums}
        ${btn(page + 1, '›', page >= totalPages)}
      \x3c/div>
    \x3c/div>`;
}

function avatarHTML(url, name, size) {
  size = size || 36;
  const fontSize = Math.round(size * 0.4);
  const initial  = escapeHTML((name || 'N').charAt(0).toUpperCase());
  const baseStyle = `width:${size}px;height:${size}px;border-radius:50%;flex-shrink:0;`;

  if (url) {
    // ใช้ <img> แทน background-image เพื่อหลีกเลี่ยงปัญหา CORS/redirect ของ Google Drive
    // onerror: ถ้าโหลดรูปไม่ได้ → ซ่อน img แล้วแสดง fallback ตัวอักษรแทน
    return `
      <div class="avatar-circle" style="${baseStyle}overflow:hidden;padding:0;position:relative;">
        <img src="${escapeHTML(url)}"
             alt="${initial}"
             loading="lazy"
             style="width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;width:100%;height:100%;position:absolute;top:0;left:0;
                    align-items:center;justify-content:center;
                    font-size:${fontSize}px;font-weight:700;color:white;">
          ${initial}
        </div>
      \x3c/div>`;
  }

  return `<div class="avatar-circle"
               style="${baseStyle}font-size:${fontSize}px;">
            ${initial}
          \x3c/div>`;
}

function exportToExcel(headers, rows, filename) {
  // Simple HTML table export — Excel เปิดได้
  let table = '<table border="1"><thead><tr>';
  headers.forEach(h => table += '<th>' + escapeHTML(h) + '\x3c/th>');
  table += '\x3c/tr>\x3c/thead><tbody>';
  rows.forEach(row => {
    table += '<tr>';
    row.forEach(c => table += '<td>' + escapeHTML(c == null ? '' : String(c)) + '\x3c/td>');
    table += '\x3c/tr>';
  });
  table += '\x3c/tbody>\x3c/table>';
  const html = '<html><head><meta charset="UTF-8">\x3c/head><body>' + table + '\x3c/body>\x3c/html>';
  const blob = new Blob(["\ufeff", html], { type: 'application/vnd.ms-excel' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


/* ============================================================
 *  STUDENTS
 * ============================================================ */
const StudentsState = {
  page: 1,
  search: '',
  classroom: '',
  academic_year: '',
  status: '',
  data: null,
  selected: []
};

function formatStudentFullName(s) {
  if (!s) return '';
  let prefix = (s.prefix || '').trim();
  let first = (s.first_name || '').trim();
  let last = (s.last_name || '').trim();

  // Strip duplicate prefix if first starts with prefix
  while (prefix && first.startsWith(prefix)) {
    first = first.substring(prefix.length).trim();
  }
  // Strip known prefix repetitions inside first
  const known = ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.', 'น.ส.'];
  for (const k of known) {
    if (first.startsWith(k)) {
      if (!prefix) prefix = k;
      while (first.startsWith(k)) {
        first = first.substring(k.length).trim();
      }
    }
  }
  return (prefix || '') + first + (last ? ' ' + last : '');
}

function renderStudents(container) {
  container.innerHTML = `
    ${pageHeader('ข้อมูลนักเรียน', 'bxs-user-detail', `
      <button class="btn btn-light" onclick="exportStudents()">
        <i class='bx bx-download'>\x3c/i> Export
      \x3c/button>
      ${APP.role !== 'teacher' ? `
      <button class="btn btn-purple" onclick="openPromotionWizard()">
        <i class='bx bx-up-arrow-circle'></i> ระบบเลื่อนชั้นเรียน
      </button>
      <button class="btn btn-light" onclick="cleanStudentDataConfirm()" title="ลบข้อมูลนักเรียนที่ซ้ำกัน และแก้ไขคำนำหน้าที่ซ้ำ เช่น เด็กชายเด็กชาย">
        <i class='bx bx-check-double text-blue-600'>\x3c/i> จัดการชื่อ/ลบข้อมูลซ้ำ
      \x3c/button>
      <button class="btn btn-light" onclick="showImportStudentsCSV()">
        <i class='bx bx-upload'><\/i> นำเข้า CSV
      <\/button>
      <button class="btn btn-blue" onclick="openStudentForm()">
        <i class='bx bx-plus'><\/i> เพิ่มนักเรียน
      <\/button>
      ` : ''}
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="stSearch" placeholder="ค้นหา ชื่อ / รหัส / เลขบัตร"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onStudentSearch()" value="${escapeHTML(StudentsState.search)}">
          \x3c/div>
          <select id="stClassroom" onchange="onStudentFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกชั้น\x3c/option>
          \x3c/select>
          <select id="stYear" onchange="onStudentFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกปีการศึกษา\x3c/option>
          \x3c/select>
          <select id="stStatus" onchange="onStudentFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="active">กำลังศึกษา\x3c/option>
            <option value="graduate">จบการศึกษา\x3c/option>
            <option value="transfer">ย้าย\x3c/option>
            <option value="inactive">ไม่ใช้งาน\x3c/option>
          \x3c/select>
        \x3c/div>

        <!-- Filter Active Bar -->
        <div id="stFilterActiveBar" class="mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl items-center justify-between text-xs text-slate-600 gap-2 shadow-sm transition-all" style="display:none;">
          <div class="flex items-center gap-2 flex-wrap" id="stFilterSummaryText">
            <!-- dynamic chips -->
          \x3c/div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-sm btn-light text-xs text-slate-600 hover:text-slate-800" onclick="clearStudentFilters()">
              <i class='bx bx-x'>\x3c/i> ล้างตัวกรอง
            \x3c/button>
            ${APP.role !== 'teacher' ? `
            <button type="button" id="btnDeleteByFilter" class="btn btn-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium flex items-center gap-1 shadow-sm transition" onclick="deleteStudentsByFilterConfirm()" title="ลบข้อมูลนักเรียนทั้งหมดที่ตรงตามเงื่อนไขตัวกรองนี้">
              <i class='bx bx-trash text-sm'>\x3c/i> ลบตามตัวกรอง
            \x3c/button>
            ` : ''}
          \x3c/div>
        \x3c/div>

        <!-- Batch Action Toolbar -->
        <div id="stBatchBar" class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl items-center justify-between gap-3 shadow-sm transition-all" style="display:${StudentsState.selected && StudentsState.selected.length > 0 ? 'flex' : 'none'};">
          <div class="flex items-center flex-wrap gap-2">
            <span class="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-bold" id="stBatchCount">
              ${StudentsState.selected ? StudentsState.selected.length : 0}
            \x3c/span>
            <span class="text-sm font-medium text-slate-700">เลือกอยู่ <strong id="stBatchCountText" class="text-blue-700 font-bold">${StudentsState.selected ? StudentsState.selected.length : 0}</strong> คน\x3c/span>
            <button type="button" class="btn btn-sm btn-light text-xs text-slate-500 hover:text-slate-800 ml-1" onclick="clearSelectedStudents()">
              <i class='bx bx-x'>\x3c/i> ยกเลิกการเลือก
            \x3c/button>
            <span id="stSelectAllMatchingWrap" style="display:none;" class="text-xs text-blue-600">
              <span class="text-slate-300 mx-1">|\x3c/span>
              <button type="button" class="underline hover:text-blue-800 font-medium" onclick="selectAllMatchingStudents()">
                เลือกทั้งหมด <span id="stTotalMatchingCount">0\x3c/span> คนตามตัวกรองนี้
              \x3c/button>
            \x3c/span>
          \x3c/div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-sm" onclick="openBatchClassroomModal()">
              <i class='bx bx-transfer text-base'>\x3c/i> กำหนดชั้นเรียนให้นักเรียนที่เลือก
            \x3c/button>
            ${APP.role !== 'teacher' ? `
            <button type="button" class="btn btn-sm bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1.5 shadow-sm" onclick="deleteSelectedStudentsConfirm()">
              <i class='bx bx-trash text-base'>\x3c/i> ลบที่เลือก (<span id="stBatchDeleteCount">${StudentsState.selected ? StudentsState.selected.length : 0}\x3c/span>)
            \x3c/button>
            ` : ''}
          \x3c/div>
        \x3c/div>

        <div id="stTableArea">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  if (StudentsState.data && !StudentsState.search) {
    renderStudentsTable(StudentsState.data);
    loadStudents(true);
  } else {
    loadStudents();
  }
}

let _stSearchTimer = null;
function onStudentSearch() {
  StudentsState.search = document.getElementById('stSearch').value;
  StudentsState.page = 1;
  clearTimeout(_stSearchTimer);
  _stSearchTimer = setTimeout(() => {
    StudentsState.selected = [];
    updateStudentBatchBar();
    loadStudents();
  }, 300);
}
function onStudentFilter() {
  StudentsState.classroom    = document.getElementById('stClassroom').value;
  StudentsState.academic_year= document.getElementById('stYear').value;
  StudentsState.status       = document.getElementById('stStatus').value;
  StudentsState.page = 1;
  StudentsState.selected = [];
  updateStudentBatchBar();
  loadStudents();
}
function studentsGoToPage(p) { StudentsState.page = p; loadStudents(); }

function loadStudents(silent) {
  const area = document.getElementById('stTableArea');
  if (area && !silent && (!StudentsState.data || StudentsState.search)) {
    area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';
  }

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (!silent) showToast('error', res.message);
        return;
      }
      StudentsState.data = res;
      renderStudentsTable(res);
    })
    .withFailureHandler(err => {
      if (!silent) showToast('error', err.message || err);
    })
    .getStudents({
      page: StudentsState.page,
      search: StudentsState.search,
      classroom: StudentsState.classroom,
      academic_year: StudentsState.academic_year,
      status: StudentsState.status
    }, APP.token);
}

function renderStudentsTable(res) {
  // populate filters
  const cls = document.getElementById('stClassroom');
  if (cls && res.distinct) {
    const cur = StudentsState.classroom;
    cls.innerHTML = '<option value="">ทุกชั้น\x3c/option>' +
      res.distinct.classrooms.map(c => `<option value="${escapeHTML(c)}" ${cur===c?'selected':''}>ชั้น ${escapeHTML(c)}\x3c/option>`).join('');
  }
  const yr = document.getElementById('stYear');
  if (yr && res.distinct) {
    const cur = StudentsState.academic_year;
    yr.innerHTML = '<option value="">ทุกปีการศึกษา\x3c/option>' +
      res.distinct.academic_years.map(y => `<option value="${escapeHTML(y)}" ${cur===y?'selected':''}>${escapeHTML(y)}\x3c/option>`).join('');
  }

  const area = document.getElementById('stTableArea');
  if (!area) return;
  updateStudentFilterActiveBar(res);
  if (res.data.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-user-x'>\x3c/i>
        ไม่พบข้อมูลนักเรียน — ลองเปลี่ยนคำค้นหา หรือเพิ่มนักเรียนใหม่
      \x3c/div>`;
    return;
  }

  const statusMap = {
    active: 'status-active', graduate:'status-active',
    transfer:'status-pending', inactive:'status-inactive'
  };
  const statusLabel = {
    active:'กำลังศึกษา', graduate:'จบการศึกษา', transfer:'ย้าย', inactive:'ไม่ใช้งาน'
  };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-center rounded-l-lg" style="width:44px;">
              <input type="checkbox" id="stSelectAll" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" onchange="toggleSelectAllStudents(this)" title="เลือกทั้งหมดในหน้านี้">
            </th>
            <th class="px-3 py-2.5 text-left">นักเรียน\x3c/th>
            <th class="px-3 py-2.5 text-left">รหัส\x3c/th>
            <th class="px-3 py-2.5 text-left">ชั้น\x3c/th>
            <th class="px-3 py-2.5 text-left">เพศ\x3c/th>
            <th class="px-3 py-2.5 text-left">ผู้ปกครอง\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(s => {
            const isChecked = Array.isArray(StudentsState.selected) && StudentsState.selected.includes(s.id);
            return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition ${isChecked ? 'bg-blue-50/50' : ''}">
              <td class="px-3 py-2.5 text-center">
                <input type="checkbox" class="st-chk rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" value="${s.id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectStudent('${s.id}', this)">
              </td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-3">
                  ${avatarHTML(s.photo, s.first_name, 36)}
                  <div>
                    <div class="font-semibold text-slate-800">
                      ${s.student_number ? `<span class="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-1.5 py-0.5 rounded font-bold mr-1">เลขที่ ${s.student_number}</span>` : ''}${escapeHTML(formatStudentFullName(s))}
                    </div>
                    <div class="text-xs text-slate-500">${escapeHTML(s.national_id || '-')}</div>
                  </div>
                </div>
              \x3c/td>
              <td class="px-3 py-2.5 font-mono text-xs">
                <span class="inline-flex items-center gap-1 cursor-pointer hover:text-blue-600 hover:underline group"
                      onclick="quickEditStudentId('${s.id}', '${escapeHTML(s.student_id || '')}', '${escapeHTML(formatStudentFullName(s))}')"
                      title="คลิกเพื่อแก้ไขเลขประจำตัว">
                  <span>${escapeHTML(s.student_id || '-')}</span>
                  <i class='bx bx-edit text-slate-300 group-hover:text-blue-600 text-xs transition'></i>
                </span>
              \x3c/td>
              <td class="px-3 py-2.5"><span class="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">${escapeHTML(s.classroom || '-')}\x3c/span>\x3c/td>
              <td class="px-3 py-2.5">${s.gender === 'male' ? 'ชาย' : s.gender === 'female' ? 'หญิง' : '-'}\x3c/td>
              <td class="px-3 py-2.5">
                <div class="text-slate-700">${escapeHTML(s.parent_name || '-')}\x3c/div>
                <div class="text-xs text-slate-500">${escapeHTML(s.parent_phone || '')}\x3c/div>
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <span class="status-badge ${statusMap[s.status] || 'status-pending'}">${statusLabel[s.status] || s.status}\x3c/span>
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  <button class="btn btn-light btn-icon" onclick="viewStudent('${s.id}')" title="ดูข้อมูล">
                    <i class='bx bx-show'>\x3c/i>
                  </button>
                  ${APP.role !== 'teacher' ? `
                  <button class="btn btn-light btn-icon text-primary" onclick="openStudentForm('${s.id}')" title="แก้ไข" ><i class='bx bx-edit'><\/i><\/button>
                  <button class="btn btn-light btn-icon text-danger" onclick="deleteStudent('${s.id}')" title="ลบ" ><i class='bx bx-trash'><\/i><\/button>
                  ` : ''}
                </div>
              \x3c/td>
            \x3c/tr>
          `;}).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'studentsGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายการ\x3c/div>
  `;
  updateStudentBatchBar();
}

/* ---------- Batch Selection & Classroom Update ---------- */
function toggleSelectStudent(id, el) {
  if (!Array.isArray(StudentsState.selected)) StudentsState.selected = [];
  if (el.checked) {
    if (!StudentsState.selected.includes(id)) StudentsState.selected.push(id);
  } else {
    StudentsState.selected = StudentsState.selected.filter(x => x !== id);
  }
  updateStudentBatchBar();
}

function toggleSelectAllStudents(masterEl) {
  if (!Array.isArray(StudentsState.selected)) StudentsState.selected = [];
  const pageIds = (StudentsState.data && StudentsState.data.data) ? StudentsState.data.data.map(s => s.id) : [];
  if (masterEl.checked) {
    pageIds.forEach(id => {
      if (!StudentsState.selected.includes(id)) StudentsState.selected.push(id);
    });
  } else {
    StudentsState.selected = StudentsState.selected.filter(id => !pageIds.includes(id));
  }
  document.querySelectorAll('.st-chk').forEach(chk => {
    chk.checked = StudentsState.selected.includes(chk.value);
  });
  updateStudentBatchBar();
}

function clearSelectedStudents() {
  StudentsState.selected = [];
  document.querySelectorAll('.st-chk').forEach(c => c.checked = false);
  const master = document.getElementById('stSelectAll');
  if (master) { master.checked = false; master.indeterminate = false; }
  updateStudentBatchBar();
}

function selectAllMatchingStudents() {
  showLoading('กำลังเลือกนักเรียนทั้งหมด...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res && res.status === 'success' && res.data) {
        StudentsState.selected = res.data.map(s => s.id);
        document.querySelectorAll('.st-chk').forEach(c => c.checked = true);
        const selAll = document.getElementById('stSelectAll');
        if (selAll) selAll.checked = true;
        updateStudentBatchBar();
        showToast('info', 'เลือกนักเรียนทั้งหมด ' + StudentsState.selected.length + ' คนแล้ว');
      } else {
        showToast('error', (res && res.message) || 'ไม่สามารถโหลดรายชื่อทั้งหมดได้');
      }
    })
    .withFailureHandler(err => {
      hideLoading();
      showToast('error', err.message || err);
    })
    .getStudents({
      page: 1,
      per_page: 5000,
      search: StudentsState.search,
      classroom: StudentsState.classroom,
      academic_year: StudentsState.academic_year,
      status: StudentsState.status
    }, APP.token);
}

function updateStudentBatchBar() {
  const bar = document.getElementById('stBatchBar');
  const count = (StudentsState.selected || []).length;
  const badge = document.getElementById('stBatchCount');
  const countText = document.getElementById('stBatchCountText');
  const matchWrap = document.getElementById('stSelectAllMatchingWrap');
  const totalMatching = document.getElementById('stTotalMatchingCount');
  const master = document.getElementById('stSelectAll');

  if (bar) {
    bar.style.display = count > 0 ? 'flex' : 'none';
  }
  if (badge) badge.textContent = count;
  if (countText) countText.textContent = count;
  const delCount = document.getElementById('stBatchDeleteCount');
  if (delCount) delCount.textContent = count;

  const totalResults = (StudentsState.data && StudentsState.data.total) || 0;
  if (matchWrap && totalMatching) {
    if (count > 0 && totalResults > count) {
      matchWrap.style.display = 'inline';
      totalMatching.textContent = totalResults;
    } else {
      matchWrap.style.display = 'none';
    }
  }

  if (master) {
    const chks = Array.from(document.querySelectorAll('.st-chk'));
    if (chks.length > 0) {
      const allChecked = chks.every(c => c.checked);
      const someChecked = chks.some(c => c.checked);
      master.checked = allChecked;
      master.indeterminate = !allChecked && someChecked;
    } else {
      master.checked = false;
      master.indeterminate = false;
    }
  }
}

function updateStudentFilterActiveBar(res) {
  const bar = document.getElementById('stFilterActiveBar');
  const sumWrap = document.getElementById('stFilterSummaryText');
  if (!bar || !sumWrap) return;

  const cls = StudentsState.classroom;
  const yr = StudentsState.academic_year;
  const st = StudentsState.status;
  const q = StudentsState.search;
  const hasFilter = Boolean(cls || yr || st || q);

  if (!hasFilter) {
    bar.style.display = 'none';
    return;
  }

  const total = (res && typeof res.total === 'number') ? res.total : ((StudentsState.data && StudentsState.data.total) || 0);

  const chips = [];
  if (q) chips.push(`<span class="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">ค้นหา: <strong>${escapeHTML(q)}</strong></span>`);
  if (cls) chips.push(`<span class="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">ชั้น: <strong>${escapeHTML(cls)}</strong></span>`);
  if (yr) chips.push(`<span class="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">ปีการศึกษา: <strong>${escapeHTML(yr)}</strong></span>`);
  if (st) {
    const stLabel = { active:'กำลังศึกษา', graduate:'จบการศึกษา', transfer:'ย้าย', inactive:'ไม่ใช้งาน' }[st] || st;
    chips.push(`<span class="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">สถานะ: <strong>${escapeHTML(stLabel)}</strong></span>`);
  }

  sumWrap.innerHTML = `
    <span class="font-medium text-slate-500">ตัวกรองปัจจุบัน:</span>
    ${chips.join(' ')}
    <span class="text-blue-700 font-semibold ml-1">(พบ ${total} คน)</span>
  `;

  const btnDel = document.getElementById('btnDeleteByFilter');
  if (btnDel) {
    btnDel.innerHTML = `<i class='bx bx-trash text-sm'></i> ลบตามตัวกรอง (${total})`;
    btnDel.style.display = (APP.role !== 'teacher' && total > 0) ? 'inline-flex' : 'none';
  }

  bar.style.display = 'flex';
}

function clearStudentFilters() {
  StudentsState.search = '';
  StudentsState.classroom = '';
  StudentsState.academic_year = '';
  StudentsState.status = '';
  StudentsState.page = 1;
  StudentsState.selected = [];

  const sInput = document.getElementById('stSearch');
  if (sInput) sInput.value = '';
  const cSelect = document.getElementById('stClassroom');
  if (cSelect) cSelect.value = '';
  const ySelect = document.getElementById('stYear');
  if (ySelect) ySelect.value = '';
  const stSelect = document.getElementById('stStatus');
  if (stSelect) stSelect.value = '';

  updateStudentBatchBar();
  loadStudents();
}

function openBatchClassroomModal() {
  const count = (StudentsState.selected || []).length;
  if (count === 0) {
    showToast('warning', 'กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
    return;
  }

  showLoading('กำลังโหลดข้อมูลห้องเรียน...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      const roomsFromBackend = (res && res.status === 'success' && Array.isArray(res.data)) ? res.data : [];
      const roomsFromState = (StudentsState.data && StudentsState.data.distinct && StudentsState.data.distinct.classrooms) || [];
      const allRooms = Array.from(new Set([...roomsFromBackend, ...roomsFromState])).filter(Boolean).sort();
      _showBatchClassroomDialog(allRooms);
    })
    .withFailureHandler(() => {
      hideLoading();
      const roomsFromState = (StudentsState.data && StudentsState.data.distinct && StudentsState.data.distinct.classrooms) || [];
      _showBatchClassroomDialog(roomsFromState);
    })
    .getClassroomsForDropdown(APP.token);
}

function _showBatchClassroomDialog(rooms) {
  const count = (StudentsState.selected || []).length;
  const currentYear = APP.dashboardData?.config?.academic_year || String(new Date().getFullYear() + 543);
  const roomOptions = rooms.map(r => `<option value="${escapeHTML(r)}">ชั้น ${escapeHTML(r)}\x3c/option>`).join('');

  Swal.fire({
    title: `กำหนดชั้นเรียน (${count} คน)`,
    width: 480,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-check">\x3c/i> ยืนยันเปลี่ยนชั้นเรียน',
    cancelButtonText: 'ยกเลิก',
    focusConfirm: false,
    html: `
      <div style="text-align:left; font-size:14px;">
        <div class="p-3 bg-blue-50 text-blue-900 rounded-lg mb-3 text-sm flex items-center gap-2.5">
          <i class='bx bx-user-check text-2xl text-blue-600'>\x3c/i>
          <div>
            <div class="font-semibold">เลือกนักเรียนอยู่ ${count} คน\x3c/div>
            <div class="text-xs text-blue-700">ระบบจะกำหนดห้องเรียนและปีการศึกษาให้นักเรียนที่เลือกทั้งหมดพร้อมกัน\x3c/div>
          \x3c/div>
        \x3c/div>

        <div class="mb-3">
          <label class="block text-xs font-semibold text-slate-700 mb-1">ชั้น/ห้องเรียนเป้าหมาย <span class="text-red-500">*\x3c/span>\x3c/label>
          <select id="batch_target_room" class="form-input w-full p-2 border border-slate-300 rounded-lg text-sm" onchange="const custom = document.getElementById('batch_custom_room_wrap'); if (custom) { custom.style.display = this.value === '__custom__' ? 'block' : 'none'; if(this.value === '__custom__') document.getElementById('batch_custom_room').focus(); }">
            <option value="">-- เลือกห้องเรียน --\x3c/option>
            ${roomOptions}
            <option value="__custom__">➕ ระบุชื่อชั้น/ห้องเรียนใหม่เอง...\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="batch_custom_room_wrap" class="mb-3" style="display:none;">
          <label class="block text-xs font-semibold text-slate-700 mb-1">ระบุชื่อชั้น/ห้องเรียนใหม่ <span class="text-red-500">*\x3c/span>\x3c/label>
          <input type="text" id="batch_custom_room" class="form-input w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="เช่น ม.1/1, ป.2/3, อนุบาล 1">
        \x3c/div>

        <div class="mb-3">
          <label class="block text-xs font-semibold text-slate-700 mb-1">ปีการศึกษา (ไม่บังคับ)\x3c/label>
          <input type="text" id="batch_target_year" class="form-input w-full p-2 border border-slate-300 rounded-lg text-sm" value="${escapeHTML(currentYear)}" placeholder="เช่น 2567 (เว้นว่างไว้เพื่อคงเดิม)">
          <div class="text-[11px] text-slate-500 mt-1">ใส่อัปเดตเมื่อเลื่อนชั้นขึ้นปีการศึกษาใหม่ หรือเว้นว่างเพื่อคงเดิม\x3c/div>
        \x3c/div>
      \x3c/div>
    `,
    preConfirm: () => {
      const sel = document.getElementById('batch_target_room').value;
      let room = sel;
      if (sel === '__custom__') {
        room = (document.getElementById('batch_custom_room').value || '').trim();
      }
      if (!room) {
        Swal.showValidationMessage('กรุณาเลือกหรือระบุชั้นเรียนเป้าหมาย');
        return false;
      }
      const year = (document.getElementById('batch_target_year').value || '').trim();
      return { targetClassroom: room, targetYear: year };
    }
  }).then(result => {
    if (!result.isConfirmed || !result.value) return;
    const { targetClassroom, targetYear } = result.value;

    showLoading(`กำลังเปลี่ยนชั้นเรียนให้นักเรียน ${count} คน...`);
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res && res.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: res.message || `เปลี่ยนชั้นเรียนเป็น ${targetClassroom} สำเร็จ`,
            timer: 2000,
            showConfirmButton: false
          });
          StudentsState.selected = [];
          loadStudents();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: (res && res.message) || 'ไม่สามารถย้ายชั้นเรียนได้'
          });
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: err.message || err
        });
      })
      .transferStudents(StudentsState.selected, targetClassroom, APP.token, targetYear);
  });
}

function openStudentForm(id) {
  // โหลด classroom list ก่อนเปิดฟอร์มเสมอ
  google.script.run
    .withSuccessHandler(res => {
      window._classroomOptions = (res.status === 'success') ? res.data : [];
      _openStudentFormAfterLoad(id);
    })
    .withFailureHandler(() => {
      window._classroomOptions = [];
      _openStudentFormAfterLoad(id);
    })
    .getClassroomsForDropdown(APP.token);
}

function _openStudentFormAfterLoad(id) {
  if (id) {
    showLoading('กำลังโหลดข้อมูล...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status !== 'success') return showToast('error', res.message);
        showStudentForm(res.data);
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .getStudentById(id, APP.token);
  } else {
    showStudentForm(null);
  }
}

function showStudentForm(data) {
  const s = data || {};
  const isEdit = !!s.id;

  // ============================================================
  // ✅ RELIABLE FIX: Closure variable + bridge function
  //
  // ปัญหาเดิม: preConfirm ต้องอ่าน photo จาก DOM (f_photo.value)
  //   → ถ้า SweetAlert toast destroy dialog → DOM หาย → ได้ ""
  //
  // วิธีแก้: เก็บ URL ใน closure variable `_photoUrl`
  //   → preConfirm อ่านจาก closure ได้โดยตรง ไม่ผ่าน DOM เลย
  //   → ไม่มีปัญหาไม่ว่า dialog จะถูก destroy หรือไม่
  //
  // Bridge: inline onchange ใช้ window.__setStudentPhoto() เพื่อ
  //   อัปเดต closure variable ข้ามขอบเขต string template ได้
  // ============================================================
  let _photoUrl = s.photo || '';
  window.__setStudentPhoto = (url) => {
    _photoUrl = url;
    console.log('[photo] captured →', url);
  };

  Swal.fire({
    title: isEdit ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่',
    width: 760,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText : 'ยกเลิก',
    showCloseButton  : true,
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="f_id" value="${escapeHTML(s.id || '')}">

        <!-- Photo Upload -->
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <div id="photoPreviewBox" class="avatar-circle"
               style="width:80px;height:80px;border-radius:50%;font-size:28px; ${s.photo ? `background-image:url('${escapeHTML(s.photo)}');` : ''}">
            ${s.photo ? '' : (s.first_name || 'N').charAt(0).toUpperCase()}
          \x3c/div>
          <div>
            <button id="photoUploadBtn" type="button" class="btn btn-outline" onclick="document.getElementById('photoInput').click()">
              <i class='bx bx-upload'>\x3c/i> อัพโหลดรูป
            \x3c/button>
            <input type="file" id="photoInput" accept="image/*" style="display:none;"
                   onchange="handleImageUpload(this,'students', (url)=>{
                     window.__setStudentPhoto(url);
                     var prev = document.getElementById('photoPreviewBox');
                     if (prev) {
                       prev.style.backgroundImage='url('+url+')';
                       prev.textContent='';
                       prev.style.backgroundSize='cover';
                       prev.style.backgroundPosition='center';
                     }
                     var btn = document.getElementById('photoUploadBtn');
                     if (btn) {
                       btn.innerHTML='<i class=\\'bx bx-check\\'></i> อัพโหลดแล้ว';
                       btn.style.color='#10B981';
                       btn.style.borderColor='#10B981';
                     }
                   })">
            <input type="hidden" id="f_photo" value="${escapeHTML(s.photo || '')}">
            <div class="text-xs text-slate-500 mt-1">JPG/PNG ≤ 8MB\x3c/div>
          \x3c/div>
        \x3c/div>

        <!-- Personal Info -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลส่วนตัว\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-3">
            <label class="form-label">คำนำหน้า\x3c/label>
            <select id="f_prefix" class="form-input">
              <option value="">เลือก\x3c/option>
              ${['เด็กชาย','เด็กหญิง','นาย','นางสาว'].map(p => `<option value="${p}" ${s.prefix===p?'selected':''}>${p}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ชื่อ <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="f_first_name" class="form-input" value="${escapeHTML(s.first_name||'')}" required>
          \x3c/div>
          <div class="col-span-5">
            <label class="form-label">นามสกุล <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="f_last_name" class="form-input" value="${escapeHTML(s.last_name||'')}">
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">เลขบัตรประชาชน\x3c/label>
            <input type="text" id="f_national_id" class="form-input" maxlength="13" value="${escapeHTML(s.national_id||'')}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">เพศ\x3c/label>
            <select id="f_gender" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="male"   ${s.gender==='male'?'selected':''}>ชาย\x3c/option>
              <option value="female" ${s.gender==='female'?'selected':''}>หญิง\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">วันเกิด\x3c/label>
            <input type="date" id="f_birth_date" class="form-input" value="${escapeHTML((s.birth_date||'').slice(0,10))}">
          \x3c/div>
          <div class="col-span-2">
            <label class="form-label">เลือด\x3c/label>
            <select id="f_blood_type" class="form-input">
              ${['','A','B','AB','O'].map(b => `<option value="${b}" ${s.blood_type===b?'selected':''}>${b||'-'}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
        \x3c/div>

        <!-- Academic Info -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลการศึกษา\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-3">
            <label class="form-label">เลขที่\x3c/label>
            <input type="number" id="f_student_number" class="form-input font-mono" min="1" max="999" placeholder="เช่น 1" value="${escapeHTML(s.student_number !== undefined && s.student_number !== null ? String(s.student_number) : '')}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">เลขประจำตัวนักเรียน\x3c/label>
            <input type="text" id="f_student_id" class="form-input font-mono" placeholder="เช่น 32415 (ว่างไว้สร้างอัตโนมัติ)" value="${escapeHTML(s.student_id || '')}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ชั้น\x3c/label>
            <select id="f_classroom" class="form-input">
              <option value="">-- เลือก --\x3c/option>
              ${(window._classroomOptions || []).map(c =>
                `<option value="${escapeHTML(c)}" ${s.classroom===c?'selected':''}>${escapeHTML(c)}\x3c/option>`
              ).join('')}
              ${(s.classroom && !(window._classroomOptions||[]).includes(s.classroom))
                ? `<option value="${escapeHTML(s.classroom)}" selected>${escapeHTML(s.classroom)}\x3c/option>` : ''}
            \x3c/select>
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ปีการศึกษา\x3c/label>
            <input type="text" id="f_academic_year" class="form-input" value="${escapeHTML(s.academic_year || APP.dashboardData?.config?.academic_year || '')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">สัญชาติ\x3c/label>
            <input type="text" id="f_nationality" class="form-input" value="${escapeHTML(s.nationality||'ไทย')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ศาสนา\x3c/label>
            <input type="text" id="f_religion" class="form-input" value="${escapeHTML(s.religion||'พุทธ')}">
          \x3c/div>
        \x3c/div>

        <!-- Parent Info -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลผู้ปกครอง\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-5">
            <label class="form-label">ชื่อผู้ปกครอง\x3c/label>
            <input type="text" id="f_parent_name" class="form-input" value="${escapeHTML(s.parent_name||'')}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เบอร์โทร\x3c/label>
            <input type="tel" id="f_parent_phone" class="form-input" value="${escapeHTML(s.parent_phone||'')}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ความสัมพันธ์\x3c/label>
            <select id="f_parent_relation" class="form-input">
              ${['','บิดา','มารดา','ผู้ปกครอง'].map(p => `<option value="${p}" ${s.parent_relation===p?'selected':''}>${p||'เลือก'}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ที่อยู่\x3c/label>
            <textarea id="f_address" class="form-input" rows="2">${escapeHTML(s.address||'')}\x3c/textarea>
          \x3c/div>
        \x3c/div>

        <div>
          <label class="form-label">สถานะ\x3c/label>
          <select id="f_status" class="form-input">
            ${[['active','กำลังศึกษา'],['graduate','จบการศึกษา'],['transfer','ย้าย'],['inactive','ไม่ใช้งาน']]
              .map(([v,l]) => `<option value="${v}" ${(s.status||'active')===v?'selected':''}>${l}\x3c/option>`).join('')}
          \x3c/select>
        \x3c/div>
      \x3c/div>

      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input {
          width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px;
          font-family:inherit; font-size:13px; background:#F8FAFC;
          font-weight:400; box-sizing:border-box;
        }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
        textarea.form-input { resize:vertical; }
      \x3c/style>
    `,
    preConfirm: () => {
      const fn = document.getElementById('f_first_name').value.trim();
      const ln = document.getElementById('f_last_name').value.trim();
      if (!fn || !ln) { Swal.showValidationMessage('กรุณากรอกชื่อและนามสกุล'); return false; }

      const nid = document.getElementById('f_national_id').value.trim();
      if (nid && nid.length !== 13) { Swal.showValidationMessage('เลขบัตรประชาชนต้อง 13 หลัก'); return false; }

      return {
        id            : document.getElementById('f_id').value || null,
        student_id    : (document.getElementById('f_student_id').value || '').trim(),
        student_number: (document.getElementById('f_student_number').value || '').trim(),
        prefix        : document.getElementById('f_prefix').value,
        first_name   : fn,
        last_name    : ln,
        national_id  : nid,
        gender       : document.getElementById('f_gender').value,
        birth_date   : document.getElementById('f_birth_date').value,
        blood_type   : document.getElementById('f_blood_type').value,
        nationality  : document.getElementById('f_nationality').value,
        religion     : document.getElementById('f_religion').value,
        photo        : _photoUrl,
        classroom    : document.getElementById('f_classroom').value,
        academic_year: document.getElementById('f_academic_year').value,
        address      : document.getElementById('f_address').value,
        parent_name  : document.getElementById('f_parent_name').value,
        parent_phone : document.getElementById('f_parent_phone').value,
        parent_relation: document.getElementById('f_parent_relation').value,
        status       : document.getElementById('f_status').value
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
          loadStudents();
        } else {
          Swal.fire({ icon:'error', title:'ผิดพลาด', text: res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message || err }); })
      .saveStudent(r.value, APP.token);
  });
}

function viewStudent(id) {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      const s = res.data;
      Swal.fire({
        title: 'ข้อมูลนักเรียน',
        width: 600,
        html: `
          <div style="text-align:left;">
            <div class="flex items-center gap-4 pb-4 mb-4 border-b border-slate-200">
              ${avatarHTML(s.photo, s.first_name, 80)}
              <div>
                <div class="text-xl font-bold">${escapeHTML(formatStudentFullName(s))}</div>
                <div class="text-sm text-slate-500">รหัส: ${escapeHTML(s.student_id || '-')} ${s.student_number ? `(เลขที่ ${escapeHTML(String(s.student_number))})` : ''}\x3c/div>
                <div class="mt-1"><span class="status-badge status-active">${({active:'กำลังศึกษา',graduate:'จบการศึกษา',transfer:'ย้าย',inactive:'ไม่ใช้งาน'})[s.status]||s.status}\x3c/span>\x3c/div>
              \x3c/div>
            \x3c/div>
            <div style="display:grid; grid-template-columns:auto 1fr; gap:8px 16px; font-size:14px; line-height:1.6;">
              <span class="text-slate-500">เลขบัตร:\x3c/span>      <span>${escapeHTML(s.national_id || '-')}\x3c/span>
              <span class="text-slate-500">เพศ:\x3c/span>          <span>${s.gender==='male'?'ชาย':s.gender==='female'?'หญิง':'-'}\x3c/span>
              <span class="text-slate-500">วันเกิด:\x3c/span>      <span>${s.birth_date ? formatThaiDate(s.birth_date) : '-'}\x3c/span>
              <span class="text-slate-500">เลือด:\x3c/span>        <span>${escapeHTML(s.blood_type || '-')}\x3c/span>
              <span class="text-slate-500">สัญชาติ/ศาสนา:\x3c/span><span>${escapeHTML((s.nationality||'-')+' / '+(s.religion||'-'))}\x3c/span>
              <span class="text-slate-500">ชั้น/ปี:\x3c/span>      <span>${escapeHTML((s.classroom||'-')+' / '+(s.academic_year||'-'))}\x3c/span>
              <span class="text-slate-500">ผู้ปกครอง:\x3c/span>    <span>${escapeHTML(s.parent_name || '-')} (${escapeHTML(s.parent_relation || '-')})\x3c/span>
              <span class="text-slate-500">โทรผู้ปกครอง:\x3c/span> <span>${escapeHTML(s.parent_phone || '-')}\x3c/span>
              <span class="text-slate-500">ที่อยู่:\x3c/span>      <span>${escapeHTML(s.address || '-')}\x3c/span>
            \x3c/div>
          \x3c/div>
        `,
        showCloseButton: true,
        showConfirmButton: false
      });
    })
    .withFailureHandler(err => showToast('error', err.message || err))
    .getStudentById(id, APP.token);
}

function quickEditStudentId(id, currentId, studentName) {
  Swal.fire({
    title: 'แก้ไขเลขประจำตัวนักเรียน',
    html: `
      <div style="text-align:left;font-size:13px;line-height:1.6;">
        <div style="margin-bottom:8px;color:#475569;">นักเรียน: <b>${escapeHTML(studentName)}</b>\x3c/div>
        <label class="form-label" style="font-weight:600;margin-bottom:4px;display:block;">เลขประจำตัวนักเรียน (SGS / รหัสโรงเรียน):\x3c/label>
        <input type="text" id="swal_quick_student_id" class="form-input font-mono"
               style="width:100%;padding:8px 10px;border:1.5px solid #CBD5E1;border-radius:8px;font-size:14px;box-sizing:border-box;"
               value="${escapeHTML(currentId)}" placeholder="เช่น 32415 (หรือเว้นว่างไว้เพื่อสร้างอัตโนมัติ)">
        <div style="font-size:11px;color:#94A3B8;margin-top:6px;">
          * หากเว้นว่างไว้ ระบบจะสร้างเลขประจำตัวให้อัตโนมัติ<br>
          * สามารถระบุรหัสประจำตัวตามระบบ SGS ได้โดยตรง
        \x3c/div>
      \x3c/div>
    `,
    width: 440,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      return (document.getElementById('swal_quick_student_id').value || '').trim();
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message || 'แก้ไขเลขประจำตัวสำเร็จ');
          const updatedId = res.data ? res.data.student_id : r.value;
          if (StudentsState.data && StudentsState.data.data) {
            const st = StudentsState.data.data.find(x => x.id === id);
            if (st) st.student_id = updatedId;
            renderStudentsTable(StudentsState.data);
          } else {
            loadStudents();
          }
        } else {
          showToast('error', res.message);
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        showToast('error', err.message || err);
      })
      .quickUpdateStudentId(id, r.value, APP.token);
  });
}

function deleteStudent(id) {
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'ข้อมูลนักเรียนจะถูกลบถาวร',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText : 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          loadStudents();
        } else {
          showToast('error', res.message);
        }
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .deleteStudent(id, APP.token);
  });
}

function deleteSelectedStudentsConfirm() {
  const count = (StudentsState.selected || []).length;
  if (count === 0) {
    showToast('warning', 'กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
    return;
  }

  Swal.fire({
    title: `ยืนยันลบนักเรียนที่เลือก?`,
    html: `
      <div class="text-left text-sm text-slate-700 space-y-2">
        <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800">
          คุณกำลังจะลบข้อมูลนักเรียนที่เลือกจำนวน <strong class="text-red-700 font-bold text-base">${count}</strong> คน
          <br>ข้อมูลจะถูกลบถาวรออกจากระบบและไม่สามารถกู้คืนได้
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `ยืนยันลบ (${count} คน)`,
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626',
    focusCancel: true
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading(`กำลังลบข้อมูลนักเรียน ${count} คน...`);
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res && res.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            text: res.message || `ลบข้อมูลสำเร็จ ${count} รายการ`,
            timer: 2000,
            showConfirmButton: false
          });
          StudentsState.selected = [];
          updateStudentBatchBar();
          loadStudents();
        } else {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: (res && res.message) || 'ไม่สามารถลบข้อมูลได้' });
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || err });
      })
      .deleteStudentsBulk(StudentsState.selected, APP.token);
  });
}

function deleteStudentsByFilterConfirm() {
  const cls = StudentsState.classroom;
  const yr = StudentsState.academic_year;
  const st = StudentsState.status;
  const q = StudentsState.search;
  const total = (StudentsState.data && typeof StudentsState.data.total === 'number') ? StudentsState.data.total : 0;

  if (!cls && !yr && !st && !q) {
    Swal.fire({
      icon: 'info',
      title: 'กรุณาเลือกตัวกรอง',
      text: 'กรุณาระบุตัวกรอง (เช่น ชั้นเรียน หรือ ปีการศึกษา) ก่อนสั่งลบตามตัวกรอง เพื่อป้องกันการลบข้อมูลทั้งหมด'
    });
    return;
  }

  if (total === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่พบนักเรียน',
      text: 'ไม่มีข้อมูลนักเรียนที่ตรงตามเงื่อนไขตัวกรองในขณะนี้'
    });
    return;
  }

  const stLabel = { active:'กำลังศึกษา', graduate:'จบการศึกษา', transfer:'ย้าย', inactive:'ไม่ใช้งาน' }[st] || st;

  const html = `
    <div class="text-left text-sm text-slate-700 space-y-3">
      <div class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <div class="font-bold flex items-center gap-1.5 mb-1">
          <i class='bx bx-error-circle text-lg text-red-600'></i> คำเตือนสำคัญ
        </div>
        <div>ระบบจะลบข้อมูลนักเรียนทั้งหมดที่ตรงตามเงื่อนไขนี้ <strong>ถาวร</strong> ไม่สามารถกู้คืนได้</div>
      </div>
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div class="font-semibold text-slate-800 mb-1.5">เงื่อนไขตัวกรองที่จะลบ:</div>
        <ul class="space-y-1 text-slate-600 pl-4 list-disc">
          ${cls ? `<li>ชั้นเรียน: <strong class="text-slate-900">${escapeHTML(cls)}</strong></li>` : ''}
          ${yr ? `<li>ปีการศึกษา: <strong class="text-slate-900">${escapeHTML(yr)}</strong></li>` : ''}
          ${st ? `<li>สถานะ: <strong class="text-slate-900">${escapeHTML(stLabel)}</strong></li>` : ''}
          ${q ? `<li>คำค้นหา: <strong class="text-slate-900">${escapeHTML(q)}</strong></li>` : ''}
        </ul>
        <div class="mt-2.5 pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
          <span class="font-medium text-slate-700">จำนวนที่จะถูกลบทั้งหมด:</span>
          <span class="text-red-600 font-bold text-base">${total} คน</span>
        </div>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'ยืนยันลบนักเรียนตามตัวกรอง?',
    html: html,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `ยืนยันลบทั้งหมด (${total} คน)`,
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626',
    focusCancel: true
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading(`กำลังลบข้อมูลนักเรียนตามตัวกรอง ${total} คน...`);
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res && res.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ลบข้อมูลสำเร็จ',
            text: res.message || `ลบข้อมูลเรียบร้อยแล้ว`,
            timer: 2000,
            showConfirmButton: false
          });
          StudentsState.selected = [];
          updateStudentBatchBar();
          loadStudents();
        } else {
          Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: (res && res.message) || 'ไม่สามารถลบข้อมูลได้' });
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || err });
      })
      .deleteStudentsByFilter({
        classroom: cls,
        academic_year: yr,
        status: st,
        search: q
      }, APP.token);
  });
}

function exportStudents() {
  showLoading('กำลังเตรียมไฟล์...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      exportToExcel(res.headers, res.rows, 'นักเรียน_' + new Date().toISOString().slice(0,10) + '.xls');
      showToast('success', 'ดาวน์โหลดสำเร็จ');
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .exportData('students', APP.token);
}


/* ============================================================
 *  PERSONNEL
 * ============================================================ */
const PersonnelState = {
  page: 1, search: '', department: '', type: '', status: '', data: null
};

function renderPersonnel(container) {
  container.innerHTML = `
    ${pageHeader('ครูและบุคลากร', 'bxs-group', (typeof canEditModule === 'function' ? canEditModule('personnel') : true) ? `
      <button class="btn btn-light" onclick="exportPersonnel()">
        <i class='bx bx-download'>\x3c/i> Export
      <\/button>
      <button class="btn btn-light" onclick="showImportPersonnelCSV()">
        <i class='bx bx-upload'>\x3c/i> นำเข้า CSV
      <\/button>
      <button class="btn btn-light" class="text-success border-success" onclick="bulkCreateUsersFromPersonnel()">
        <i class='bx bx-user-check'>\x3c/i> สร้างบัญชีทั้งหมด
      <\/button>
      <button class="btn btn-blue" onclick="openPersonnelForm()">
        <i class='bx bx-plus'>\x3c/i> เพิ่มบุคลากร
      <\/button>
    ` : '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="pSearch" placeholder="ค้นหา ชื่อ / รหัส / ตำแหน่ง"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onPersonnelSearch()" value="${escapeHTML(PersonnelState.search)}">
          \x3c/div>
          <select id="pDepartment" onchange="onPersonnelFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกฝ่าย/กลุ่มสาระ\x3c/option>
          \x3c/select>
          <select id="pType" onchange="onPersonnelFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกประเภท\x3c/option>
            <option value="admin">ฝ่ายบริหาร\x3c/option>
            <option value="teacher">ครูผู้สอน\x3c/option>
            <option value="support">สายสนับสนุน\x3c/option>
          \x3c/select>
          <select id="pStatus" onchange="onPersonnelFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="active">ปฏิบัติงาน\x3c/option>
            <option value="inactive">ไม่ปฏิบัติงาน\x3c/option>
            <option value="retired">เกษียณ\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="pTableArea">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  if (PersonnelState.data && !PersonnelState.search) {
    renderPersonnelTable(PersonnelState.data);
    loadPersonnel(true);
  } else {
    loadPersonnel();
  }
}

let _pSearchTimer = null;
function onPersonnelSearch() {
  PersonnelState.search = document.getElementById('pSearch').value;
  PersonnelState.page = 1;
  clearTimeout(_pSearchTimer);
  _pSearchTimer = setTimeout(loadPersonnel, 300);
}
function onPersonnelFilter() {
  PersonnelState.department = document.getElementById('pDepartment').value;
  PersonnelState.type       = document.getElementById('pType').value;
  PersonnelState.status     = document.getElementById('pStatus').value;
  PersonnelState.page = 1;
  loadPersonnel();
}
function personnelGoToPage(p) { PersonnelState.page = p; loadPersonnel(); }

function loadPersonnel(silent) {
  const area = document.getElementById('pTableArea');
  if (area && !silent && (!PersonnelState.data || PersonnelState.search)) {
    area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';
  }

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (!silent) showToast('error', res.message);
        return;
      }
      PersonnelState.data = res;
      renderPersonnelTable(res);
    })
    .withFailureHandler(err => {
      if (!silent) showToast('error', err.message || err);
    })
    .getPersonnel({
      page: PersonnelState.page,
      search: PersonnelState.search,
      department: PersonnelState.department,
      type: PersonnelState.type,
      status: PersonnelState.status
    }, APP.token);
}

function renderPersonnelTable(res) {
  const dep = document.getElementById('pDepartment');
  if (dep && res.distinct) {
    const cur = PersonnelState.department;
    dep.innerHTML = '<option value="">ทุกฝ่าย/กลุ่มสาระ\x3c/option>' +
      res.distinct.departments.map(d => `<option value="${escapeHTML(d)}" ${cur===d?'selected':''}>${escapeHTML(d)}\x3c/option>`).join('');
  }

  const area = document.getElementById('pTableArea');
  if (!area) return;
  if (res.data.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-user-x'>\x3c/i>
        ไม่พบข้อมูลบุคลากร
      \x3c/div>`;
    return;
  }

  const typeLabel = { teacher:'ครู', support:'สนับสนุน', admin:'ฝ่ายบริหาร' };
  const statusMap = { active:'status-active', inactive:'status-inactive', retired:'status-pending' };
  const statusLabel = { active:'ปฏิบัติงาน', inactive:'ไม่ปฏิบัติงาน', retired:'เกษียณ' };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">บุคลากร\x3c/th>
            <th class="px-3 py-2.5 text-left">รหัส\x3c/th>
            <th class="px-3 py-2.5 text-left">ตำแหน่ง\x3c/th>
            <th class="px-3 py-2.5 text-left">ฝ่าย/กลุ่มสาระ\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(p => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-3">
                  ${avatarHTML(p.photo, p.first_name, 36)}
                  <div>
                    <div class="font-semibold text-slate-800">${escapeHTML((p.prefix||'') + (p.first_name||'') + ' ' + (p.last_name||''))}\x3c/div>
                    <div class="text-xs text-slate-500">${escapeHTML(p.email || p.phone || '-')}\x3c/div>
                  \x3c/div>
                \x3c/div>
              \x3c/td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(p.personnel_id || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(p.position || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(p.department || '-')}\x3c/td>
              <td class="px-3 py-2.5">${typeLabel[p.type] || p.type || '-'}\x3c/td>
              <td class="px-3 py-2.5 text-center">
                <span class="status-badge ${statusMap[p.status]||'status-pending'}">${statusLabel[p.status]||p.status}\x3c/span>
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  <button class="btn btn-light btn-icon" onclick="viewPersonnel('${p.id}')" title="ดูข้อมูล">
                    <i class='bx bx-show'>\x3c/i>
                  \x3c/button>
                  ${(typeof canEditModule === 'function' ? canEditModule('personnel') : true) ? `
                  <button class="btn btn-light btn-icon text-primary" onclick="openPersonnelForm('${p.id}')" title="แก้ไข" >
                    <i class='bx bx-edit'><\/i>
                  <\/button>
                  ` : ''}
                  ${(typeof canEditModule === 'function' ? canEditModule('personnel') : true) ? `
                  <button class="btn btn-light btn-icon text-success" onclick="createUserFromPersonnel('${p.id}','${escapeHTML(p.personnel_id||'')}','${escapeHTML((p.prefix||'')+(p.first_name||'')+' '+(p.last_name||''))}')" title="สร้างบัญชีผู้ใช้" >
                    <i class='bx bx-user-plus'><\/i>
                  <\/button>
                  <button class="btn btn-light btn-icon text-danger" onclick="deletePersonnelConfirm('${p.id}')" title="ลบ" >
                    <i class='bx bx-trash'><\/i>
                  <\/button>
                  ` : ''}
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'personnelGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายการ\x3c/div>
  `;
}

function openPersonnelForm(id) {
  if (id) {
    showLoading('กำลังโหลดข้อมูล...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status !== 'success') return showToast('error', res.message);
        showPersonnelForm(res.data);
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .getPersonnelById(id, APP.token);
  } else {
    showPersonnelForm(null);
  }
}

function showPersonnelForm(data) {
  const p = data || {};
  const isEdit = !!p.id;

  Swal.fire({
    title: isEdit ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่',
    width: 760,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText : 'ยกเลิก',
    showCloseButton  : true,
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="pf_id" value="${escapeHTML(p.id || '')}">

        <!-- Photo + Signature -->
        <div class="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200">
          <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div id="pPhotoPreview" class="avatar-circle"
                 style="width:60px;height:60px;border-radius:50%;font-size:22px; ${p.photo ? `background-image:url('${escapeHTML(p.photo)}');` : ''}">
              ${p.photo ? '' : (p.first_name || 'P').charAt(0).toUpperCase()}
            \x3c/div>
            <div>
              <button type="button" class="btn btn-outline" style="padding:6px 10px;font-size:12px;" onclick="document.getElementById('pPhotoInput').click()">
                <i class='bx bx-camera'>\x3c/i> รูปโปรไฟล์
              \x3c/button>
              <input type="file" id="pPhotoInput" accept="image/*" style="display:none;"
                     onchange="handleImageUpload(this,'personnel',(url)=>{
                       document.getElementById('pf_photo').value=url;
                       document.getElementById('pPhotoPreview').style.backgroundImage='url('+url+')';
                       document.getElementById('pPhotoPreview').textContent='';
                     })">
              <input type="hidden" id="pf_photo" value="${escapeHTML(p.photo||'')}">
              <div class="text-xs text-slate-500 mt-1">JPG/PNG\x3c/div>
            \x3c/div>
          \x3c/div>
          <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div id="pSigPreview" style="width:80px;height:60px;border:1px dashed #CBD5E1;border-radius:8px;background-size:contain;background-repeat:no-repeat;background-position:center;background-color:white; ${p.signature ? `background-image:url('${escapeHTML(p.signature)}');` : ''}">
              ${p.signature ? '' : '<div style="text-align:center;font-size:11px;color:#94A3B8;padding-top:20px;">ลายเซ็น\x3c/div>'}
            \x3c/div>
            <div>
              <button type="button" class="btn btn-outline" style="padding:6px 10px;font-size:12px;" onclick="document.getElementById('pSigInput').click()">
                <i class='bx bx-edit-alt'>\x3c/i> ลายเซ็น
              \x3c/button>
              <input type="file" id="pSigInput" accept="image/*" style="display:none;"
                     onchange="handleImageUpload(this,'signatures',(url)=>{
                       document.getElementById('pf_signature').value=url;
                       document.getElementById('pSigPreview').style.backgroundImage='url('+url+')';
                       document.getElementById('pSigPreview').innerHTML='';
                     })">
              <input type="hidden" id="pf_signature" value="${escapeHTML(p.signature||'')}">
              <div class="text-xs text-slate-500 mt-1">PNG พื้นโปร่งใส\x3c/div>
            \x3c/div>
          \x3c/div>
        \x3c/div>

        <!-- Personal Info -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลส่วนตัว\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-3">
            <label class="form-label">คำนำหน้า\x3c/label>
            <select id="pf_prefix" class="form-input">
              <option value="">เลือก\x3c/option>
              ${['นาย','นาง','นางสาว'].map(x => `<option value="${x}" ${p.prefix===x?'selected':''}>${x}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ชื่อ <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="pf_first_name" class="form-input" value="${escapeHTML(p.first_name||'')}">
          \x3c/div>
          <div class="col-span-5">
            <label class="form-label">นามสกุล <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="pf_last_name" class="form-input" value="${escapeHTML(p.last_name||'')}">
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">เลขบัตรประชาชน\x3c/label>
            <input type="text" id="pf_national_id" class="form-input" maxlength="13" value="${escapeHTML(p.national_id||'')}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันเกิด\x3c/label>
            <input type="date" id="pf_birth_date" class="form-input" value="${escapeHTML((p.birth_date||'').slice(0,10))}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เพศ\x3c/label>
            <select id="pf_gender" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="male"   ${p.gender==='male'?'selected':''}>ชาย\x3c/option>
              <option value="female" ${p.gender==='female'?'selected':''}>หญิง\x3c/option>
            \x3c/select>
          \x3c/div>
        \x3c/div>

        <!-- Job Info -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลตำแหน่ง\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-6">
            <label class="form-label">ตำแหน่ง\x3c/label>
            <input type="text" id="pf_position" class="form-input" value="${escapeHTML(p.position||'')}" placeholder="ครูชำนาญการ, เจ้าหน้าที่ธุรการ ...">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ฝ่าย / กลุ่มสาระ\x3c/label>
            <input type="text" id="pf_department" class="form-input" value="${escapeHTML(p.department||'')}" placeholder="คณิตศาสตร์, ฝ่ายปกครอง ...">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ประเภท\x3c/label>
            <select id="pf_type" class="form-input">
              <option value="admin"   ${p.type==='admin'?'selected':''}>ฝ่ายบริหาร\x3c/option>
              <option value="teacher" ${p.type==='teacher'?'selected':''}>ครูผู้สอน\x3c/option>
              <option value="support" ${p.type==='support'?'selected':''}>สายสนับสนุน\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วิทยฐานะ\x3c/label>
            <input type="text" id="pf_academic_level" class="form-input" value="${escapeHTML(p.academic_level||'')}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันเริ่มงาน\x3c/label>
            <input type="date" id="pf_start_date" class="form-input" value="${escapeHTML((p.start_date||'').slice(0,10))}">
          \x3c/div>
        \x3c/div>

        <!-- Contact -->
        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">การติดต่อ\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-4">
            <label class="form-label">โทรศัพท์\x3c/label>
            <input type="tel" id="pf_phone" class="form-input" value="${escapeHTML(p.phone||'')}">
          \x3c/div>
          <div class="col-span-8">
            <label class="form-label">อีเมล\x3c/label>
            <input type="email" id="pf_email" class="form-input" value="${escapeHTML(p.email||'')}">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ที่อยู่\x3c/label>
            <textarea id="pf_address" class="form-input" rows="2">${escapeHTML(p.address||'')}\x3c/textarea>
          \x3c/div>
        \x3c/div>

        <div>
          <label class="form-label">สถานะ\x3c/label>
          <select id="pf_status" class="form-input">
            ${[['active','ปฏิบัติงาน'],['inactive','ไม่ปฏิบัติงาน'],['retired','เกษียณ']]
              .map(([v,l]) => `<option value="${v}" ${(p.status||'active')===v?'selected':''}>${l}\x3c/option>`).join('')}
          \x3c/select>
        \x3c/div>
      \x3c/div>

      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input {
          width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px;
          font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box;
        }
        .form-input:focus { outline:none; border-color:#4F46E5; background:white; }
        textarea.form-input { resize:vertical; }
      \x3c/style>
    `,
    preConfirm: () => {
      const fn = document.getElementById('pf_first_name').value.trim();
      const ln = document.getElementById('pf_last_name').value.trim();
      if (!fn || !ln) { Swal.showValidationMessage('กรุณากรอกชื่อและนามสกุล'); return false; }

      const nid = document.getElementById('pf_national_id').value.trim();
      if (nid && nid.length !== 13) { Swal.showValidationMessage('เลขบัตรประชาชนต้อง 13 หลัก'); return false; }

      return {
        id            : document.getElementById('pf_id').value || null,
        prefix        : document.getElementById('pf_prefix').value,
        first_name    : fn,
        last_name     : ln,
        national_id   : nid,
        birth_date    : document.getElementById('pf_birth_date').value,
        gender        : document.getElementById('pf_gender').value,
        position      : document.getElementById('pf_position').value,
        department    : document.getElementById('pf_department').value,
        type          : document.getElementById('pf_type').value,
        academic_level: document.getElementById('pf_academic_level').value,
        start_date    : document.getElementById('pf_start_date').value,
        phone         : document.getElementById('pf_phone').value,
        email         : document.getElementById('pf_email').value,
        address       : document.getElementById('pf_address').value,
        photo         : document.getElementById('pf_photo').value,
        signature     : document.getElementById('pf_signature').value,
        status        : document.getElementById('pf_status').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    const isNew = !r.value.id;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          loadPersonnel();
          if (isNew && res.data && res.data.personnel_id) {
            const pid  = res.data.personnel_id;
            const pw   = pid.length >= 6 ? pid : pid.padEnd(6, '0');
            const name = (r.value.prefix||'') + r.value.first_name + ' ' + r.value.last_name;
            google.script.run
              .withSuccessHandler(ur => {
                if (ur.status === 'success') {
                  Swal.fire({ icon:'success', title:'\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e41\u0e25\u0e30\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08',
                    html: `\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e1a\u0e38\u0e04\u0e25\u0e32\u0e01\u0e23 <strong>${escapeHTML(name)}<\/strong> \u0e41\u0e25\u0e49\u0e27<br><br>
                           \u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34:<br>
                           Username: <strong>${escapeHTML(pid)}<\/strong><br>
                           \u0e23\u0e2b\u0e31\u0e2a\u0e1c\u0e48\u0e32\u0e19: <strong>${escapeHTML(pw)}<\/strong>` });
                } else {
                  showToast('success', res.message + ' (\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49: ' + ur.message + ')');
                }
              })
              .withFailureHandler(() => showToast('success', res.message))
              .saveUser({ username: pid, name, role:'teacher', new_password: pw,
                          active: true, id: null, email: r.value.email||'',
                          phone: r.value.phone||'', department: r.value.department||'', avatar: '' },
                        APP.token);
          } else {
            showToast('success', res.message);
          }
        } else {
          Swal.fire({ icon:'error', title:'\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14', text: res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message || err }); })
      .savePersonnel(r.value, APP.token);
  });
}

function viewPersonnel(id) {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      const p = res.data;
      const typeLabel = { teacher:'ครู', support:'สนับสนุน', admin:'ฝ่ายบริหาร' };
      Swal.fire({
        title: 'ข้อมูลบุคลากร',
        width: 600,
        html: `
          <div style="text-align:left;">
            <div class="flex items-center gap-4 pb-4 mb-4 border-b border-slate-200">
              ${avatarHTML(p.photo, p.first_name, 80)}
              <div>
                <div class="text-xl font-bold">${escapeHTML((p.prefix||'') + (p.first_name||'') + ' ' + (p.last_name||''))}\x3c/div>
                <div class="text-sm text-slate-500">${escapeHTML(p.position || '-')} · ${escapeHTML(p.department || '-')}\x3c/div>
                <div class="text-xs text-slate-400">${escapeHTML(p.personnel_id || '-')}\x3c/div>
              \x3c/div>
            \x3c/div>
            <div style="display:grid; grid-template-columns:auto 1fr; gap:8px 16px; font-size:14px;">
              <span class="text-slate-500">ประเภท:\x3c/span>     <span>${typeLabel[p.type]||p.type||'-'}\x3c/span>
              <span class="text-slate-500">วิทยฐานะ:\x3c/span>   <span>${escapeHTML(p.academic_level || '-')}\x3c/span>
              <span class="text-slate-500">เลขบัตร:\x3c/span>     <span>${escapeHTML(p.national_id || '-')}\x3c/span>
              <span class="text-slate-500">วันเกิด:\x3c/span>     <span>${p.birth_date ? formatThaiDate(p.birth_date) : '-'}\x3c/span>
              <span class="text-slate-500">วันเริ่มงาน:\x3c/span> <span>${p.start_date ? formatThaiDate(p.start_date) : '-'}\x3c/span>
              <span class="text-slate-500">โทร:\x3c/span>         <span>${escapeHTML(p.phone || '-')}\x3c/span>
              <span class="text-slate-500">อีเมล:\x3c/span>       <span>${escapeHTML(p.email || '-')}\x3c/span>
              <span class="text-slate-500">ที่อยู่:\x3c/span>      <span>${escapeHTML(p.address || '-')}\x3c/span>
            \x3c/div>
            ${p.signature ? `
              <div class="mt-4 pt-4 border-t border-slate-200">
                <div class="text-xs text-slate-500 mb-2">ลายเซ็น:\x3c/div>
                <img src="${escapeHTML(p.signature)}" alt="signature" loading="lazy" style="max-height:80px;background:white;padding:8px;border:1px solid #E2E8F0;border-radius:8px;">
              \x3c/div>
            ` : ''}
          \x3c/div>
        `,
        showCloseButton: true,
        showConfirmButton: false
      });
    })
    .withFailureHandler(err => showToast('error', err.message || err))
    .getPersonnelById(id, APP.token);
}

function deletePersonnelConfirm(id) {
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'ข้อมูลบุคลากรจะถูกลบถาวร',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText : 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          loadPersonnel();
        } else {
          showToast('error', res.message);
        }
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .deletePersonnel(id, APP.token);
  });
}

function exportPersonnel() {
  showLoading('กำลังเตรียมไฟล์...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      exportToExcel(res.headers, res.rows, 'บุคลากร_' + new Date().toISOString().slice(0,10) + '.xls');
      showToast('success', 'ดาวน์โหลดสำเร็จ');
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .exportData('personnel', APP.token);
}


/* ============================================================
 *  ATTENDANCE
 * ============================================================ */
const AttendanceState = {
  tab: 'record',  // 'record' | 'report'
  mode: 'subject', // 'subject' | 'class'
  classroom: '',
  subject_id: '',
  date: new Date().toISOString().slice(0, 10),
  records: [],
  reportMode: 'class',
  classrooms: [],
  subjects: [],  // loaded subjects (filtered for teacher role)
  periods: [],    // loaded period config
  scheduleCache: [], // schedule cache
  reportScope: 'monthly',
  reportView: 'summary',
  filterOptions: null,
  reportLastData: null,
  tableClassroom: ''
};

function renderAttendance(container) {
  const currentTab = AttendanceState.tab || 'record';

  container.innerHTML = `
    ${pageHeader('การเข้าเรียน', 'bxs-check-square', '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="tab-pill" style="max-width:540px;">
          <button id="tabAttOverview" class="${currentTab==='overview'?'active':''}" onclick="switchAttendanceTab('overview')">
            <i class='bx bx-pie-chart-alt-2'></i> ภาพรวมแดชบอร์ด
          </button>
          <button id="tabRecord" class="${currentTab==='record'?'active':''}" onclick="switchAttendanceTab('record')">
            <i class='bx bx-edit-alt'></i> บันทึกรายวัน
          </button>
          <button id="tabReport" class="${currentTab==='report'?'active':''}" onclick="switchAttendanceTab('report')">
            <i class='bx bx-bar-chart-alt-2'></i> รายงาน
          </button>
        </div>

        <div id="attOverview" class="mt-4" style="${currentTab==='overview'?'':'display:none;'}"></div>
        <div id="attRecord" class="mt-4" style="${currentTab==='record'?'':'display:none;'}"></div>
        <div id="attReport" class="mt-4" style="${currentTab==='report'?'':'display:none;'}"></div>
      </div>
    </div>
  `;

  // ตั้งค่า mode เริ่มต้น: หากยังไม่ได้เลือก ให้เริ่มต้นที่หน้าเสาธง/โฮมรูม หรือคงค่าเดิมที่เลือกไว้
  if (!AttendanceState.mode) {
    AttendanceState.mode = 'class';
  }

  const renderActiveAttTab = () => {
    if (AttendanceState.tab === 'overview') {
      renderAttendanceOverviewTab();
    } else if (AttendanceState.tab === 'report') {
      renderAttendanceReport();
    } else {
      renderAttendanceRecord();
    }
  };

  // หากมีข้อมูลใน State แล้ว ให้แสดงผลทันที 0ms แล้วค่อยอัปเดตเบื้องหลัง
  const hasCachedState = Array.isArray(AttendanceState.classrooms) && AttendanceState.classrooms.length > 0 &&
                         Array.isArray(AttendanceState.periods) && AttendanceState.periods.length > 0;
  if (hasCachedState) {
    renderActiveAttTab();
  }

  google.script.run
    .withSuccessHandler(res => {
      if (res && res.status === 'success') {
        AttendanceState.classrooms = res.data || [];
        if (Array.isArray(res.subjects)) {
          AttendanceState.subjects = res.subjects;
        }
        if (Array.isArray(res.periods)) {
          AttendanceState.periods = res.periods;
        }
        if (Array.isArray(res.subjects) && Array.isArray(res.periods)) {
          if (!hasCachedState) renderActiveAttTab();
          return;
        }
      }
      // Fallback if backend did not bundle subjects/periods
      let pending = 2;
      const doneFallback = () => { if (--pending <= 0 && !hasCachedState) renderActiveAttTab(); };
      google.script.run
        .withSuccessHandler(r => { if (r && r.status === 'success') AttendanceState.subjects = r.data || []; doneFallback(); })
        .withFailureHandler(doneFallback)
        .getSubjects({}, APP.token);
      google.script.run
        .withSuccessHandler(r => { if (r && r.status === 'success' && r.data) AttendanceState.periods = r.data.periods || []; doneFallback(); })
        .withFailureHandler(doneFallback)
        .getPeriodConfig(APP.dashboardData?.config?.academic_year || '', APP.dashboardData?.config?.semester || '', APP.token);
    })
    .withFailureHandler(() => { if (!hasCachedState) renderActiveAttTab(); })
    .getClassrooms(APP.token);
}

function switchAttendanceTab(tab) {
  AttendanceState.tab = tab;
  const tOver = document.getElementById('tabAttOverview');
  const tRec = document.getElementById('tabRecord');
  const tRep = document.getElementById('tabReport');
  if (tOver) tOver.classList.toggle('active', tab === 'overview');
  if (tRec) tRec.classList.toggle('active', tab === 'record');
  if (tRep) tRep.classList.toggle('active', tab === 'report');

  const elOver = document.getElementById('attOverview');
  const elRec = document.getElementById('attRecord');
  const elRep = document.getElementById('attReport');
  if (elOver) elOver.style.display = (tab === 'overview') ? '' : 'none';
  if (elRec) elRec.style.display = (tab === 'record') ? '' : 'none';
  if (elRep) elRep.style.display = (tab === 'report') ? '' : 'none';

  if (tab === 'overview') {
    renderAttendanceOverviewTab();
  } else if (tab === 'record') {
    renderAttendanceRecord();
  } else {
    renderAttendanceReport();
  }
}

function renderAttendanceOverviewTab() {
  const container = document.getElementById('attOverview');
  if (!container) return;

  container.innerHTML = `
    <div class="att-dash-section mb-0">
      <div class="att-section-header">
        <div class="att-section-title">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-800"><i class="bx bxs-check-shield text-indigo-600 mr-1.5"></i> ภาพรวมการเข้าเรียนประจำวัน</h2>
            <p class="text-xs text-slate-500">สถิติเช็คชื่อหน้าเสาธง/โฮมรูม ประจำวันที่ <span id="attMod_attTodayLabel" class="font-semibold text-slate-700">—</span></p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-light border border-slate-200 flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3 hover:bg-slate-50" onclick="printAttendanceDashboardOverview()" title="พิมพ์รายงานสรุปภาพรวม A4">
            <i class="bx bx-printer text-indigo-600"></i> พิมพ์สรุปภาพรวม
          </button>
          <button class="btn btn-blue flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3" onclick="switchAttendanceTab('record')">
            <i class="bx bx-edit-alt"></i> ไปที่หน้าบันทึกรายวัน
          </button>
        </div>
      </div>

      <!-- Scope Switcher: วันนี้ / รายเดือน / ตลอดภาคเรียน -->
      <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div class="att-scope-container">
          <button class="att-scope-pill active" id="attMod_attScope_daily" onclick="switchAttendanceDashboardPeriod('daily', 'attMod')">
            <i class="bx bx-calendar"></i> ประจำวัน (วันนี้)
          </button>
          <button class="att-scope-pill" id="attMod_attScope_monthly" onclick="switchAttendanceDashboardPeriod('monthly', 'attMod')">
            <i class="bx bx-calendar-event"></i> สรุปรายเดือน
          </button>
          <button class="att-scope-pill" id="attMod_attScope_semester" onclick="switchAttendanceDashboardPeriod('semester', 'attMod')">
            <i class="bx bx-calendar-star"></i> สรุปตลอดภาคเรียน
          </button>
        </div>
        <div id="attMod_attDashPeriodWrap" class="flex items-center gap-2" style="display:none;">
          <select id="attMod_attDashPeriodSelect" onchange="onAttDashPeriodChange('attMod')" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white font-semibold text-slate-700">
          </select>
        </div>
      </div>

      <!-- 4 KPI Attendance Cards -->
      <div class="att-kpi-grid">
        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">อัตราการมาเรียนเฉลี่ย</span>
            <span class="att-kpi-badge att-badge-green" id="attMod_attRateBadge">ปกติ</span>
          </div>
          <div class="att-kpi-num" id="attMod_attRateNum">—%</div>
          <div class="att-kpi-sub">เป้าหมายสถานศึกษา ≥ 95.0%</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">มาเรียนตามเวลาปกติ</span>
            <span class="att-kpi-badge att-badge-green" id="attMod_attPresentPct">—%</span>
          </div>
          <div class="att-kpi-num text-emerald-600" id="attMod_attPresentNum">— คน</div>
          <div class="att-kpi-sub" id="attMod_attPresentSub">จากนักเรียนทั้งหมด — คน</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">มาสาย (หลัง 08:15 น.)</span>
            <span class="att-kpi-badge att-badge-amber">สาย</span>
          </div>
          <div class="att-kpi-num text-amber-600" id="attMod_attLateNum">— คน</div>
          <div class="att-kpi-sub">บันทึกเวลามาสายหน้าเสาธง</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">ขาดเรียน / ลา</span>
            <span class="att-kpi-badge att-badge-rose">ขาด / ลา</span>
          </div>
          <div class="att-kpi-num text-rose-600" id="attMod_attAbsentNum">— คน</div>
          <div class="att-kpi-sub" id="attMod_attAbsentSub">มีใบลา / ขาดเรียน</div>
        </div>
      </div>

      <!-- Split Row: 7-Day Chart & Classroom Queue -->
      <div class="att-split-grid">
        <!-- Left: Trend Chart -->
        <div class="dash-card mb-0">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-base font-bold text-slate-800 m-0">
                <i class="bx bx-trending-up text-primary mr-1"></i> แนวโน้มการมาเรียน 7 วันทำการ
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">เปรียบเทียบร้อยละการมาเรียนย้อนหลัง</p>
            </div>
          </div>
          <div class="chart-box" style="height:220px;"><canvas id="attMod_chartAttendance"></canvas></div>
        </div>

        <!-- Right: Classroom Queue -->
        <div class="dash-card mb-0 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h3 class="text-base font-bold text-slate-800 m-0">
                <i class="bx bxs-school text-primary mr-1"></i> สถานะการส่งยอดรายห้อง
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">คลิกเพื่อเข้าบันทึกรายห้องทันที</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="room-chip room-chip-pending" id="attMod_chipPendingCount">รอส่ง: 0</span>
              <span class="room-chip room-chip-submitted" id="attMod_chipSubmittedCount">ส่งแล้ว: 0</span>
            </div>
          </div>
          <div class="room-queue-container flex-1" id="attMod_classroomQueueArea">
            <div class="text-center py-8 text-slate-400 text-xs"><i class="bx bx-loader-alt bx-spin text-lg"></i> กำลังโหลด...</div>
          </div>
        </div>
      </div>

      <!-- Bottom Card: Risk Students Table -->
      <div class="page-card mt-4 mb-0">
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div class="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <i class="bx bxs-error-circle text-rose-500 text-lg"></i> รายชื่อนักเรียนกลุ่มเฝ้าระวัง (ขาดเรียนสะสม)
              </div>
              <div class="text-xs text-slate-500">ระบบติดตามและประสานงานผู้ปกครองอย่างใกล้ชิด</div>
            </div>
            <span class="text-xs text-slate-500 font-medium" id="attMod_riskCountBadge">แสดงสูงสุด 10 อันดับแรก</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="risk-table">
              <thead>
                <tr>
                  <th>นักเรียน</th>
                  <th style="width:110px;">รหัส</th>
                  <th style="width:90px; text-align:center;">ห้องเรียน</th>
                  <th style="width:100px; text-align:center;">ขาดสะสม</th>
                  <th style="width:110px; text-align:center;">สถานะวันนี้</th>
                  <th style="width:140px; text-align:center;">ติดต่อผู้ปกครอง</th>
                </tr>
              </thead>
              <tbody id="attMod_riskStudentsTableBody">
                <tr><td colspan="6" class="text-center py-6 text-slate-400 text-xs">กำลังตรวจสอบข้อมูล...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  const renderData = d => {
    if (d && d.attendance_dashboard) {
      if (typeof renderAttendanceDashboardPanel === 'function') {
        renderAttendanceDashboardPanel(d.attendance_dashboard, 'attMod');
      }
    }
    const ctx = document.getElementById('chartAttendanceMod');
    if (ctx && d && d.week_chart) {
      if (APP.charts && APP.charts.attendanceMod) {
        try { APP.charts.attendanceMod.destroy(); } catch (_) {}
        delete APP.charts.attendanceMod;
      }
      const isDark = document.documentElement.classList.contains('dark-mode');
      if (!APP.charts) APP.charts = {};
      APP.charts.attendanceMod = new Chart(ctx, {
        type: 'line',
        data: {
          labels: d.week_chart.map(x => x.label),
          datasets: [{
            label: 'อัตราการเข้าเรียน (%)',
            data: d.week_chart.map(x => x.pct),
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79,70,229,.15)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#3730A3', pointRadius: 4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, ticks: { color: isDark ? '#94A3B8' : '#64748B', stepSize: 25, callback: v => v + '%' }, grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' } },
            x: { ticks: { color: isDark ? '#94A3B8' : '#64748B' }, grid: { display: false } }
          }
        }
      });
    }
  };

  if (APP.dashboardData) {
    renderData(APP.dashboardData);
    if (!APP._dashboardTs || Date.now() - APP._dashboardTs > 30000) {
      google.script.run
        .withSuccessHandler(res => {
          if (res.status === 'success' && res.data) {
            APP.dashboardData = res.data;
            APP._dashboardTs = Date.now();
            renderData(res.data);
          }
        })
        .getDashboardData(APP.token);
    }
  } else {
    google.script.run
      .withSuccessHandler(res => {
        if (res.status === 'success' && res.data) {
          APP.dashboardData = res.data;
          APP._dashboardTs = Date.now();
          renderData(res.data);
        }
      })
      .getDashboardData(APP.token);
  }
}

function renderAttendanceRecord() {
  const c = document.getElementById('attRecord');
  if (!c) return;
  const mode = AttendanceState.mode;
  const subjects = AttendanceState.subjects || [];
  const classrooms = AttendanceState.classrooms || [];

  c.innerHTML = `
    <div class="flex gap-2 mb-3 flex-wrap items-center">
      <div class="flex rounded-lg overflow-hidden border border-slate-200 w-full sm:w-auto" style="font-size:13px;">
        <button id="attModeSubject" onclick="switchAttMode('subject')"
          class="flex-1 sm:flex-none px-3 py-1.5 font-semibold transition-colors ${mode==='subject'?'bg-blue-500 text-white':'bg-white text-slate-600 hover:bg-slate-50'}">
          <i class='bx bx-book-open'>\x3c/i> รายวิชา
        </button>
        <button id="attModeClass" onclick="switchAttMode('class')"
          class="flex-1 sm:flex-none px-3 py-1.5 font-semibold transition-colors ${mode==='class'?'bg-blue-500 text-white':'bg-white text-slate-600 hover:bg-slate-50'}">
          <i class='bx bxs-building'>\x3c/i> หน้าเสาธง / โฮมรูม
        </button>
      </div>

      <select id="attClassroom" onchange="onAttClassroomChange()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[120px]">
        <option value="">เลือกชั้น\x3c/option>
        ${classrooms.map(r => `<option value="${escapeHTML(r)}" ${AttendanceState.classroom===r?'selected':''}>${escapeHTML(r)}\x3c/option>`).join('')}
      </select>

      <input type="date" id="attDate" onchange="onAttDateChange()"
             class="rounded-lg border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[130px]" value="${AttendanceState.date}">

      ${mode === 'subject' ? `
      <div class="flex items-center gap-2 w-full mt-2">
        <span class="text-sm font-semibold text-slate-600 min-w-max">คาบที่:\x3c/span>
        <div class="flex flex-wrap gap-1">
          ${(AttendanceState.periods && AttendanceState.periods.length > 0
              ? AttendanceState.periods.filter(p => !p.is_break && !p.is_homeroom)
              : [{ no: 1, label: '1' }, { no: 2, label: '2' }, { no: 3, label: '3' }, { no: 4, label: '4' }, { no: 5, label: '5' }, { no: 6, label: '6' }, { no: 7, label: '7' }]
            ).map((p, idx) => {
              const labelText = p.label ? p.label.replace('คาบ', '').trim() : p.no;
              return `
                <label class="cursor-pointer select-none">
                  <input type="checkbox" name="att_period" value="${p.no}" onchange="onPeriodCheckboxChange(this)" class="hidden peer">
                  <div class="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-500 peer-checked:bg-blue-500 peer-checked:text-white peer-checked:border-blue-500 transition-colors">
                    ${labelText}
                  \x3c/div>
                </label>
              `;
            }).join('')}
        </div>
      </div>

      <div id="attSubjectDisplay" class="w-full mt-2 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2" style="background:#EFF6FF; border:1.5px solid #BFDBFE; color:#1E40AF; min-height:40px;">
        <i class='bx bx-book-alt' style="font-size:16px;"></i>
        <span id="attSubjectName" style="flex:1;">${AttendanceState.subject_id && subjects.find(s=>s.id===AttendanceState.subject_id) ? (() => { const s = subjects.find(x=>x.id===AttendanceState.subject_id); return escapeHTML(s.subject_name) + (s.teacher_name ? ' • ' + escapeHTML(s.teacher_name) : ''); })() : 'กรุณาเลือกคาบเรียนด้านบน'}</span>
      </div>
      ` : ''}

      <button id="attSaveBtn" style="display:none;"></button>
    </div>

    <div id="attRecordArea">
      <div class="empty-state">
        <i class='bx bx-calendar-check'>\x3c/i>
        ${mode==='subject' ? 'กรุณาเลือกวิชาและวันที่เพื่อเริ่มบันทึก' : 'กรุณาเลือกชั้นเรียนและวันที่เพื่อเริ่มบันทึก'}
      </div>
    </div>
  `;
}

function onAttClassroomChange() {
  const c = document.getElementById('attClassroom');
  if (c) AttendanceState.classroom = c.value;
  
  if (AttendanceState.mode === 'subject') {
    AttendanceState.subject_id = '';
    const subjectDropdown = document.getElementById('attSubject');
    if (subjectDropdown) subjectDropdown.value = '';
    
    document.querySelectorAll('input[name="att_period"]').forEach(cb => {
      cb.checked = false;
    });

    renderAttendanceRecord();
    loadScheduleForSync();
  } else {
    loadAttendanceRecord();
  }
}

function onAttDateChange() {
  const d = document.getElementById('attDate');
  if (d) AttendanceState.date = d.value;
  
  if (AttendanceState.mode === 'subject') {
    AttendanceState.subject_id = '';
    const subjectDropdown = document.getElementById('attSubject');
    if (subjectDropdown) subjectDropdown.value = '';
    
    document.querySelectorAll('input[name="att_period"]').forEach(cb => {
      cb.checked = false;
    });

    loadScheduleForSync();
  } else {
    loadAttendanceRecord();
  }
}

function loadScheduleForSync() {
  if (!AttendanceState.classroom) return;
  const ay = APP.dashboardData?.config?.academic_year || '';
  const sem = APP.dashboardData?.config?.semester || '';
  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success') {
        AttendanceState.scheduleCache = res.data || [];
        updateSubjectDropdownUI();
        syncSubjectFromSchedule();
      }
    })
    .getSchedule({ classroom: AttendanceState.classroom, academic_year: ay, semester: sem }, APP.token);
}

function updateSubjectDropdownUI() {
  const select = document.getElementById('attSubject');
  if (!select) return;
  
  if (!AttendanceState.date || !AttendanceState.scheduleCache) return;
  
  const parts = AttendanceState.date.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = d.getDay();
  
  let todaySubjects = [];
  AttendanceState.scheduleCache.forEach(e => {
    if (Number(e.day) === dayOfWeek && e.subject_id) {
      if (!todaySubjects.some(x => x.id === e.subject_id)) {
        todaySubjects.push({
          id: e.subject_id,
          subject_code: e.subject_code,
          subject_name: e.subject_name,
          teacher_name: e.teacher_name
        });
      }
    }
  });
  
  let html = `<option value="">เลือกวิชา\x3c/option>`;
  if (todaySubjects.length > 0) {
    html += todaySubjects.map(s => 
      `<option value="${escapeHTML(s.id)}" ${AttendanceState.subject_id===s.id?'selected':''}>${escapeHTML(s.subject_code||'')} ${escapeHTML(s.subject_name)} - ${escapeHTML(s.teacher_name||'')}\x3c/option>`
    ).join('');
  } else {
    html += `<option value="" disabled>ไม่มีวิชาเรียนในวันนี้\x3c/option>`;
  }
  select.innerHTML = html;
}

function onPeriodCheckboxChange(el) {
  if (AttendanceState.mode !== 'subject') return;
  if (!AttendanceState.scheduleCache || !AttendanceState.date) return;

  const parts = AttendanceState.date.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = d.getDay();

  if (el.checked) {
    const periodNo = Number(el.value);
    const entry = AttendanceState.scheduleCache.find(e => 
      Number(e.day) === dayOfWeek && Number(e.period_no) === periodNo && e.subject_id
    );

    if (entry) {
      // If another subject is already selected, reject the click
      if (AttendanceState.subject_id && AttendanceState.subject_id !== entry.subject_id) {
        showToast('error', 'ไม่สามารถเลือกคาบเรียนที่มีรายวิชาแตกต่างกันพร้อมกันได้');
        el.checked = false;
        return;
      }

      AttendanceState.subject_id = entry.subject_id;
      updateSubjectBadge(entry.subject_name || entry.subject_id, entry.teacher_name);

      const matchingPeriods = AttendanceState.scheduleCache
        .filter(e => Number(e.day) === dayOfWeek && e.subject_id === entry.subject_id)
        .map(e => Number(e.period_no));

      document.querySelectorAll('input[name="att_period"]').forEach(cb => {
        if (matchingPeriods.includes(Number(cb.value))) {
          cb.checked = true;
        }
      });
    } else {
      showToast('warning', 'คาบเรียนนี้ไม่มีการสอนวิชาใดๆ');
      el.checked = false;
      return;
    }
  } else {
    // Check if any checkboxes are still checked. If none, clear badge
    let checkedCount = document.querySelectorAll('input[name="att_period"]:checked').length;
    if (checkedCount === 0) {
      AttendanceState.subject_id = '';
      updateSubjectBadge('');
    }
  }
  loadAttendanceRecord();
}

function onAttSubjectChange() {
  // No-op: subject is now read-only, driven by period checkboxes only
}

function updateSubjectBadge(name, teacherName) {
  const span = document.getElementById('attSubjectName');
  if (!span) return;
  if (name) {
    span.textContent = name + (teacherName ? ' \u2022 ' + teacherName : '');
    span.style.color = '#1E40AF';
    span.style.fontStyle = 'normal';
  } else {
    span.textContent = 'กรุณาเลือกคาบเรียนด้านบน';
    span.style.color = '#94A3B8';
    span.style.fontStyle = 'italic';
  }
}

function syncSubjectFromSchedule() {
  if (AttendanceState.mode !== 'subject') return;
  if (!AttendanceState.classroom || !AttendanceState.date || !AttendanceState.scheduleCache) {
    loadAttendanceRecord();
    return;
  }

  const parts = AttendanceState.date.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayOfWeek = d.getDay();

  if (AttendanceState.subject_id) {
    // Already have a subject — just sync period checkboxes
    const matchingPeriods = AttendanceState.scheduleCache
      .filter(e => Number(e.day) === dayOfWeek && e.subject_id === AttendanceState.subject_id)
      .map(e => Number(e.period_no));

    document.querySelectorAll('input[name="att_period"]').forEach(cb => {
      cb.checked = matchingPeriods.includes(Number(cb.value));
    });

    // Update badge from cache
    const subEntry = AttendanceState.scheduleCache.find(e => e.subject_id === AttendanceState.subject_id);
    if (subEntry) updateSubjectBadge(subEntry.subject_name, subEntry.teacher_name);
  } else {
    // Reset — clear checkboxes and badge
    AttendanceState.subject_id = '';
    updateSubjectBadge('');
    document.querySelectorAll('input[name="att_period"]').forEach(cb => {
      cb.checked = false;
    });
  }

  loadAttendanceRecord();
}

function switchAttMode(mode) {
  AttendanceState.mode = mode;
  AttendanceState.subject_id = '';
  AttendanceState.classroom  = '';
  renderAttendanceRecord();
}

function loadAttendanceRecord() {
  const dateEl = document.getElementById('attDate');
  if (!dateEl) return; // User navigated away
  const date = dateEl.value;
  AttendanceState.date = date;
  const area = document.getElementById('attRecordArea');
  const fail = err => { area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(err.message||err)}\x3c/div>`; };

  if (AttendanceState.mode === 'subject') {
    // subject_id is now driven by period checkbox sync (badge display, no dropdown)
    const subject_id = AttendanceState.subject_id;
    if (!subject_id || !date) return;
    area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';
    google.script.run
      .withSuccessHandler(res => {
        if (res.status !== 'success') { fail({ message: res.message }); return; }
        AttendanceState.records = res.data;
        AttendanceState._subject_id_save = subject_id;
        renderAttendanceList();
      })
      .withFailureHandler(fail)
      .getAttendanceBySubjectDate(subject_id, date, APP.token);
  } else {
    const classEl = document.getElementById('attClassroom');
    const classroom = classEl ? classEl.value : AttendanceState.classroom;
    AttendanceState.classroom = classroom;
    if (!classroom || !date) return;
    area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';
    google.script.run
      .withSuccessHandler(res => {
        if (res.status !== 'success') { fail({ message: res.message }); return; }
        AttendanceState.records = res.data;
        AttendanceState._subject_id_save = null;
        renderAttendanceList();
      })
      .withFailureHandler(fail)
      .getAttendanceByClassDate(classroom, date, APP.token);
  }
}

function renderAttendanceList() {
  const area = document.getElementById('attRecordArea');
  if (!AttendanceState.records || AttendanceState.records.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-user-x'>\x3c/i>
        ไม่มีนักเรียนในชั้นนี้ — กรุณาเพิ่มนักเรียนก่อน
      </div>`;
    document.getElementById('attSaveBtn').style.display = 'none';
    return;
  }

  document.getElementById('attSaveBtn').style.display = '';

  area.innerHTML = `
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <div class="text-xs sm:text-sm font-bold text-slate-800">รายชื่อนักเรียน</div>
        <button type="button" class="btn btn-light border border-slate-200 text-xs px-2.5 py-1 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer" onclick="printDailyAttendanceRecord()" title="พิมพ์ใบเช็คชื่อประจำวัน A4">
          <i class="bx bx-printer text-indigo-600"></i> พิมพ์ใบเช็คชื่อ
        </button>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-500">เช็คด่วนทั้งหมด:</span>
        <button class="btn btn-light text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2 py-1 text-[10px] sm:text-xs" onclick="setAllAttendance('present')">มา</button>
        <button class="btn btn-light text-rose-600 border-rose-200 hover:bg-rose-50 px-2 py-1 text-[10px] sm:text-xs" onclick="setAllAttendance('absent')">ขาด</button>
        <button class="btn btn-light text-amber-600 border-amber-200 hover:bg-amber-50 px-2 py-1 text-[10px] sm:text-xs" onclick="setAllAttendance('leave')">ลา</button>
        <button class="btn btn-light text-red-800 border-red-200 hover:bg-red-50 px-2 py-1 text-[10px] sm:text-xs" onclick="setAllAttendance('late')">สาย</button>
      </div>
    </div>

    <div class="att-list-wrap">
      <table class="min-w-full text-sm att-desktop-table">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-center rounded-l-lg" style="width:60px;">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">นักเรียน\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg" style="width:280px;">สถานะ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${AttendanceState.records.map((r, i) => `
            <tr class="border-b border-slate-100" data-row="${i}">
              <td class="px-3 py-2 text-center text-slate-700 font-bold">${r.student_number ? r.student_number : (i+1)}\x3c/td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-2">
                  <div>
                    <div class="font-semibold text-slate-800 text-sm">${escapeHTML((r.prefix||'') + (r.first_name||'') + ' ' + (r.last_name||''))}\x3c/div>
                    ${r.student_code ? `<div class="text-[11px] text-slate-400 font-mono">รหัส ${escapeHTML(r.student_code)}\x3c/div>` : ''}
                  </div>
                </div>
              \x3c/td>
              <td class="px-3 py-2 text-center">
                <div class="att-status-group">
                  ${attStatusButton(i, 'present', r.status, '#10B981', 'มา')}
                  ${attStatusButton(i, 'absent',  r.status, '#DC2626', 'ขาด')}
                  ${attStatusButton(i, 'leave',   r.status, '#F59E0B', 'ลา')}
                  ${attStatusButton(i, 'late',    r.status, '#4F46E5', 'สาย')}
                </div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>

      <div class="att-mobile-list">
        ${AttendanceState.records.map((r, i) => `
          <div class="att-mobile-row" data-row="${i}">
            <div class="att-mobile-name"><span class="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-bold mr-1">เลขที่ ${r.student_number || (i+1)}\x3c/span> ${escapeHTML((r.prefix||'') + (r.first_name||'') + ' ' + (r.last_name||''))}\x3c/div>
            <div class="att-status-group">
              ${attStatusButton(i, 'present', r.status, '#10B981', 'มา')}
              ${attStatusButton(i, 'absent',  r.status, '#DC2626', 'ขาด')}
              ${attStatusButton(i, 'leave',   r.status, '#F59E0B', 'ลา')}
              ${attStatusButton(i, 'late',    r.status, '#4F46E5', 'สาย')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="flex justify-between items-center gap-3 mt-4 pt-3 border-t border-slate-100 flex-wrap">
      <div class="flex flex-wrap gap-1.5 text-xs text-slate-600">
        <div class="att-summary-pill" style="background:#DCFCE7;color:#15803D;">
          <span>มา</span> <b id="cntPresent">0</b>
        </div>
        <div class="att-summary-pill" style="background:#FEE2E2;color:#B91C1C;">
          <span>ขาด</span> <b id="cntAbsent">0</b>
        </div>
        <div class="att-summary-pill" style="background:#FEF3C7;color:#B45309;">
          <span>ลา</span> <b id="cntLeave">0</b>
        </div>
        <div class="att-summary-pill" style="background:#F2D5DA;color:#3730A3;">
          <span>สาย</span> <b id="cntLate">0</b>
        </div>
        <div class="att-summary-pill" style="background:#F1F5F9;color:#334155;">
          <span>รวม</span> <b>${AttendanceState.records.length}</b>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-light border border-slate-200 text-xs sm:text-sm px-3 py-1.5 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer" onclick="printDailyAttendanceRecord()" title="พิมพ์แบบบันทึกการเช็คชื่อประจำวัน A4">
          <i class="bx bx-printer text-indigo-600"></i> พิมพ์ใบเช็คชื่อ
        </button>
        <button class="btn btn-blue" onclick="saveAttendance()" style="padding:6px 16px; font-size:13px; box-shadow: 0 2px 8px rgba(128, 0, 32, 0.2);">
          <i class='bx bx-save'></i> บันทึก
        </button>
      </div>
    </div>

    <style>
      /* ===== Common ===== */
      .att-status-group { display:inline-flex; gap:4px; flex-shrink:0; }
      .att-status-btn {
        padding:5px 10px; border-radius:6px; border:1.5px solid #E2E8F0;
        background:white; font-family:inherit; font-size:12px; font-weight:700;
        cursor:pointer; color:#64748B; transition:all .1s;
        white-space:nowrap;
      }
      .att-status-btn.active { color:white; }
      .att-summary-pill {
        display:inline-flex; gap:6px; padding:4px 12px; border-radius:999px;
        font-weight:600; align-items:center;
      }

      /* ===== Desktop: show table, hide mobile cards ===== */
      .att-list-wrap     { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .att-desktop-table { display: table; width: 100%; }
      .att-mobile-list   { display: none; }

      /* ===== Mobile (<= 640px): hide table, show cards ===== */
      @media (max-width: 640px) {
        .att-desktop-table { display: none !important; }
        .att-mobile-list   { display: block !important; }

        .att-mobile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 8px;
          border-bottom: 1px solid #F1F5F9;
          gap: 8px;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }
        .att-mobile-name {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
        }
        .att-status-group {
          flex-shrink: 0;
          gap: 3px !important;
        }
        .att-status-btn {
          padding: 5px 8px !important;
          font-size: 11px !important;
        }
      }
    </style>
  `;

  updateAttendanceSummary();
}

function attStatusButton(rowIdx, status, currentStatus, color, label) {
  const active = currentStatus === status;
  return `
    <button class="att-status-btn ${active ? 'active' : ''}"
            data-status="${status}" data-color="${color}"
            style="${active ? `background:${color}; border-color:${color};` : ''}"
            onclick="setAttendanceStatus(${rowIdx}, '${status}')">
      ${label}
    \x3c/button>`;
}

function setAttendanceStatus(rowIdx, status) {
  if (!AttendanceState.records || !AttendanceState.records[rowIdx]) return;
  AttendanceState.records[rowIdx].status = status;
  if (status === 'leave' && !AttendanceState.records[rowIdx].leave_type) {
    AttendanceState.records[rowIdx].leave_type = 'ลาป่วย';
  }

  // High-speed direct DOM update (0.5ms response, no full-table re-render, no flicker)
  const rows = document.querySelectorAll(`[data-row="${rowIdx}"]`);
  rows.forEach(r => {
    r.querySelectorAll('.att-status-btn').forEach(btn => {
      const bStatus = btn.getAttribute('data-status');
      const bColor = btn.getAttribute('data-color');
      const isActive = bStatus === status;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.style.background = bColor;
        btn.style.borderColor = bColor;
      } else {
        btn.style.background = '';
        btn.style.borderColor = '';
      }
    });
  });
  updateAttendanceSummary();
}

function setAllAttendance(status) {
  if (!AttendanceState.records) return;
  AttendanceState.records.forEach(r => {
    r.status = status;
    if (status === 'leave' && !r.leave_type) r.leave_type = 'ลาป่วย';
  });

  // Fast batch DOM update
  document.querySelectorAll('.att-status-btn').forEach(btn => {
    const bStatus = btn.getAttribute('data-status');
    const bColor = btn.getAttribute('data-color');
    const isActive = bStatus === status;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.style.background = bColor;
      btn.style.borderColor = bColor;
    } else {
      btn.style.background = '';
      btn.style.borderColor = '';
    }
  });
  updateAttendanceSummary();
}

function updateAttendanceSummary() {
  let p = 0, a = 0, l = 0, lt = 0;
  AttendanceState.records.forEach(r => {
    if (r.status === 'present') p++;
    if (r.status === 'absent')  a++;
    if (r.status === 'leave')   l++;
    if (r.status === 'late')    lt++;
  });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cntPresent', p); set('cntAbsent', a); set('cntLeave', l); set('cntLate', lt);
}

function saveAttendance() {
  const isSubjectMode = AttendanceState.mode === 'subject';
  const subjectId = AttendanceState._subject_id_save || AttendanceState.subject_id;

  if (isSubjectMode && !subjectId) return showToast('warning', 'กรุณาเลือกวิชา');
  if (!isSubjectMode && !AttendanceState.classroom) return showToast('warning', 'กรุณาเลือกชั้นเรียน');
  if (!AttendanceState.date) return showToast('warning', 'กรุณาเลือกวันที่');
  if (!AttendanceState.records || AttendanceState.records.length === 0) return showToast('warning', 'ไม่มีรายการให้บันทึก');

  showLoading('กำลังบันทึก...');
  
  let selectedPeriods = [];
  if (isSubjectMode) {
    document.querySelectorAll('input[name="att_period"]:checked').forEach(el => selectedPeriods.push(el.value));
    if (selectedPeriods.length === 0) {
      hideLoading();
      return showToast('warning', 'กรุณาเลือกคาบเรียนอย่างน้อย 1 คาบ');
    }
  }

  const payload = {
    date      : AttendanceState.date,
    subject_id: isSubjectMode ? subjectId : '',
    periods   : isSubjectMode ? selectedPeriods : ['homeroom'],
    records   : AttendanceState.records.map(r => ({
      student_id : r.student_id,
      status     : r.status,
      leave_type : r.leave_type || '',
      note       : r.note || ''
    }))
  };
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message, timer:1800 });
      else showToast('error', res.message);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .saveAttendanceBulk(payload, APP.token);
}


/* ----- Attendance Report (Monthly & Semester & Custom) ----- */

function renderMonthOptionsHtml(monthsList, selectedYM) {
  if (!monthsList || monthsList.length === 0) return '';
  const curYM = selectedYM || (monthsList.find(m => m.is_current)?.ym) || (new Date().toISOString().slice(0, 7));
  const curFuture = monthsList.filter(m => !m.is_past);
  const past = monthsList.filter(m => m.is_past);

  if (past.length > 0 && curFuture.length > 0) {
    return `
      <optgroup label="📌 เดือนปัจจุบัน & ถัดไป (ปัจจุบัน ➔ อนาคต)">
        ${curFuture.map(m => `<option value="${m.ym}" ${m.ym === curYM ? 'selected' : ''}>${escapeHTML(m.label)}</option>`).join('')}
      </optgroup>
      <optgroup label="🕒 เดือนย้อนหลัง">
        ${past.map(m => `<option value="${m.ym}" ${m.ym === curYM ? 'selected' : ''}>${escapeHTML(m.label)}</option>`).join('')}
      </optgroup>
    `;
  }
  return monthsList.map(m => `<option value="${m.ym}" ${m.ym === curYM ? 'selected' : ''}>${escapeHTML(m.label)}</option>`).join('');
}
window.renderMonthOptionsHtml = renderMonthOptionsHtml;

function renderAttendanceReport() {
  const c = document.getElementById('attReport');
  if (!c) return;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const todayStr = today.toISOString().slice(0,10);

  AttendanceState.reportScope = AttendanceState.reportScope || 'monthly';
  AttendanceState.reportView  = AttendanceState.reportView  || 'summary';

  c.innerHTML = `
    <!-- Header with Scope Selector -->
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div class="att-scope-container">
        <button id="scopeMonthly" class="att-scope-pill ${AttendanceState.reportScope==='monthly'?'active':''}" onclick="switchReportScope('monthly')">
          <i class='bx bx-calendar-event'></i> สรุปรายเดือน
        </button>
        <button id="scopeSemester" class="att-scope-pill ${AttendanceState.reportScope==='semester'?'active':''}" onclick="switchReportScope('semester')">
          <i class='bx bx-calendar-star'></i> สรุปตลอดภาคเรียน
        </button>
        <button id="scopeCustom" class="att-scope-pill ${AttendanceState.reportScope==='custom'?'active':''}" onclick="switchReportScope('custom')">
          <i class='bx bx-calendar'></i> กำหนดช่วงวันเอง
        </button>
      </div>

      <!-- View Switcher for Monthly Matrix -->
      <div id="viewToggleWrap" class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg" style="${AttendanceState.reportScope==='monthly'?'':'display:none;'}">
        <button id="btnViewSummary" class="px-2.5 py-1 text-xs font-semibold rounded ${AttendanceState.reportView==='summary'?'bg-white text-indigo-600 shadow-xs':'text-slate-600 hover:text-slate-900'}" onclick="switchReportView('summary')">
          <i class='bx bx-list-ul'></i> สรุปยอด
        </button>
        <button id="btnViewMatrix" class="px-2.5 py-1 text-xs font-semibold rounded ${AttendanceState.reportView==='matrix'?'bg-white text-indigo-600 shadow-xs':'text-slate-600 hover:text-slate-900'}" onclick="switchReportView('matrix')">
          <i class='bx bx-grid-alt'></i> ตาราง ปพ.5 รายวัน
        </button>
      </div>
    </div>

    <!-- Filter Form -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 mb-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl items-end">
      <!-- Classroom -->
      <div class="sm:col-span-1 lg:col-span-3">
        <label class="text-[11px] font-bold text-slate-500 mb-1 block">ระดับชั้นเรียน</label>
        <select id="rptClassroom" onchange="updateReportSubjects(); loadAttendanceReport();" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="">ทุกระดับชั้น (ทั้งโรงเรียน)</option>
          ${AttendanceState.classrooms.map(cls => `<option value="${escapeHTML(cls)}" ${AttendanceState.classroom===cls?'selected':''}>ชั้น ${escapeHTML(cls)}</option>`).join('')}
        </select>
      </div>

      <!-- Report Type -->
      <div class="sm:col-span-1 lg:col-span-3">
        <label class="text-[11px] font-bold text-slate-500 mb-1 block">ประเภทการเช็คชื่อ</label>
        <select id="rptType" onchange="onReportTypeChange()" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
          <option value="homeroom">🚩 เช็คแถวหน้าเสาธง / โฮมรูม</option>
          <option value="all_subjects">📚 สรุปภาพรวมทุกรายวิชา (All Subjects Matrix)</option>
          <optgroup label="📖 แยกตามรายวิชา" id="rptSubjectGroup"></optgroup>
        </select>
      </div>

      <!-- Scope: Monthly -->
      <div id="rptMonthWrap" class="sm:col-span-1 lg:col-span-3" style="${AttendanceState.reportScope==='monthly'?'':'display:none;'}">
        <label class="text-[11px] font-bold text-slate-500 mb-1 block">ประจำเดือน</label>
        <select id="rptMonth" onchange="loadAttendanceReport()" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
          ${renderMonthOptionsHtml(AttendanceState.filterOptions?.months, AttendanceState.filterOptions?.current_ym)}
        </select>
      </div>

      <!-- Scope: Semester -->
      <div id="rptSemesterWrap" class="sm:col-span-1 lg:col-span-3" style="${AttendanceState.reportScope==='semester'?'':'display:none;'}">
        <label class="text-[11px] font-bold text-slate-500 mb-1 block">ภาคเรียน / ปีการศึกษา</label>
        <select id="rptSemester" onchange="loadAttendanceReport()" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
          ${(AttendanceState.filterOptions?.semesters || [
            { id:'1', label:'ภาคเรียนที่ 1/2569 (พ.ค. - ต.ค.)' },
            { id:'2', label:'ภาคเรียนที่ 2/2569 (พ.ย. - มี.ค.)' }
          ]).map(s => `<option value="${s.id}">${escapeHTML(s.label)}</option>`).join('')}
        </select>
      </div>

      <!-- Scope: Custom Dates -->
      <div id="rptCustomDatesWrap" class="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-2" style="${AttendanceState.reportScope==='custom'?'':'display:none;'}">
        <div>
          <label class="text-[11px] font-bold text-slate-500 mb-1 block">ตั้งแต่วันที่</label>
          <input type="date" id="rptStart" class="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs sm:text-sm bg-white" value="${monthStart}">
        </div>
        <div>
          <label class="text-[11px] font-bold text-slate-500 mb-1 block">ถึงวันที่</label>
          <input type="date" id="rptEnd" class="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs sm:text-sm bg-white" value="${todayStr}">
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="sm:col-span-2 lg:col-span-3 flex items-center justify-start sm:justify-end gap-1.5 flex-nowrap">
        <button type="button" class="btn btn-blue px-3 py-2 text-xs sm:text-sm font-semibold flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs" onclick="loadAttendanceReport()">
          <i class='bx bx-search text-base'></i> <span>ดูรายงาน</span>
        </button>
        <button type="button" class="btn btn-light px-3 py-2 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap border border-slate-200 hover:bg-slate-100 shadow-xs" onclick="printAttendanceReport()" title="พิมพ์ PDF A4">
          <i class='bx bx-printer text-indigo-600 text-base'></i> <span>พิมพ์</span>
        </button>
        <button type="button" class="btn btn-light px-3 py-2 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap border border-slate-200 hover:bg-slate-100 shadow-xs" onclick="exportReportCSV()" title="ดาวน์โหลด Excel/CSV">
          <i class='bx bx-spreadsheet text-emerald-600 text-base'></i> <span>CSV</span>
        </button>
      </div>
    </div>

    <!-- Report Area -->
    <div id="rptArea">
      <div class="empty-state">
        <i class='bx bx-bar-chart-alt-2'></i>
        กด "ดูรายงาน" เพื่อประมวลผลสถิติ
      </div>
    </div>
  `;

  // Pre-load filter options if not yet cached
  if (!AttendanceState.filterOptions) {
    google.script.run
      .withSuccessHandler(res => {
        if (res.status === 'success' && res.data) {
          AttendanceState.filterOptions = res.data;
          // Populate months dropdown
          const mSel = document.getElementById('rptMonth');
          if (mSel && res.data.months && res.data.months.length > 0) {
            mSel.innerHTML = renderMonthOptionsHtml(res.data.months, res.data.current_ym);
            if (res.data.current_ym) mSel.value = res.data.current_ym;
          }
          // Populate semesters dropdown
          const sSel = document.getElementById('rptSemester');
          if (sSel && res.data.semesters && res.data.semesters.length > 0) {
            sSel.innerHTML = res.data.semesters.map(s => `<option value="${s.id}">${escapeHTML(s.label)}</option>`).join('');
          }
          updateReportSubjects();
          loadAttendanceReport();
        } else {
          updateReportSubjects();
          loadAttendanceReport();
        }
      })
      .withFailureHandler(() => {
        updateReportSubjects();
        loadAttendanceReport();
      })
      .getAttendanceFilterOptions(APP.token);
  } else {
    updateReportSubjects();
    loadAttendanceReport();
  }
}

function switchReportScope(scope) {
  AttendanceState.reportScope = scope;
  ['Monthly', 'Semester', 'Custom'].forEach(s => {
    const el = document.getElementById('scope' + s);
    if (el) el.classList.toggle('active', s.toLowerCase() === scope);
  });

  const mWrap = document.getElementById('rptMonthWrap');
  const sWrap = document.getElementById('rptSemesterWrap');
  const cWrap = document.getElementById('rptCustomDatesWrap');
  const vWrap = document.getElementById('viewToggleWrap');

  if (mWrap) mWrap.style.display = (scope === 'monthly') ? '' : 'none';
  if (sWrap) sWrap.style.display = (scope === 'semester') ? '' : 'none';
  if (cWrap) cWrap.style.display = (scope === 'custom') ? '' : 'none';
  if (vWrap) vWrap.style.display = (scope === 'monthly') ? '' : 'none';

  loadAttendanceReport();
}

function switchReportView(view) {
  AttendanceState.reportView = view;
  const btnSum = document.getElementById('btnViewSummary');
  const btnMat = document.getElementById('btnViewMatrix');

  if (btnSum) {
    btnSum.className = (view === 'summary')
      ? 'px-2.5 py-1 text-xs font-semibold rounded bg-white text-indigo-600 shadow-xs'
      : 'px-2.5 py-1 text-xs font-semibold rounded text-slate-600 hover:text-slate-900';
  }
  if (btnMat) {
    btnMat.className = (view === 'matrix')
      ? 'px-2.5 py-1 text-xs font-semibold rounded bg-white text-indigo-600 shadow-xs'
      : 'px-2.5 py-1 text-xs font-semibold rounded text-slate-600 hover:text-slate-900';
  }

  if (AttendanceState.reportLastData && AttendanceState.reportLastData.res) {
    renderAttendanceReportData(AttendanceState.reportLastData.res);
  } else {
    loadAttendanceReport();
  }
}

function onReportTypeChange() {
  const t = document.getElementById('rptType')?.value;
  const vWrap = document.getElementById('viewToggleWrap');
  if (vWrap) {
    vWrap.style.display = (AttendanceState.reportScope === 'monthly' && t !== 'all_subjects') ? '' : 'none';
  }
  loadAttendanceReport();
}

function getCleanSubjectHeader(s) {
  if (!s) return { code: 'วิชา', name: 'วิชาเรียน' };
  let code = String(s.subject_code || '').trim();
  let name = String(s.subject_name || '').trim();
  const uuidRx = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
  if (uuidRx.test(code)) code = '';
  if (uuidRx.test(name)) name = '';
  if (!code && !name) { code = 'วิชาเรียน'; name = 'วิชาเรียน'; }
  else if (!code) code = name;
  else if (!name) name = code;
  return { code, name };
}

function filterValidReportSubjects(list) {
  if (!list || !Array.isArray(list)) return [];
  const uuidRx = /^[0-9a-f]{8}-[0-9a-f]{4}/i;
  return list.filter(s => {
    if (!s) return false;
    const c = String(s.subject_code || '').trim();
    const n = String(s.subject_name || '').trim();
    if (!c && !n) return false;
    if (uuidRx.test(c) && (!n || uuidRx.test(n))) return false;
    return true;
  });
}

function updateReportSubjects() {
  const cls = document.getElementById('rptClassroom')?.value || '';
  const grp = document.getElementById('rptSubjectGroup');
  if (!grp) return;

  const rawList = (AttendanceState.filterOptions && AttendanceState.filterOptions.subjects && AttendanceState.filterOptions.subjects.length > 0)
    ? AttendanceState.filterOptions.subjects
    : (AttendanceState.subjects || []);
  const subjectsList = filterValidReportSubjects(rawList);

  let filtered = subjectsList;
  if (cls) {
    const clsClean = cls.replace(/^ชั้น\s*/, '').trim(); // e.g. "ม.1/1"
    const gradePrefix = clsClean.split('/')[0].trim();   // e.g. "ม.1"

    filtered = subjectsList.filter(s => {
      const gl = String(s.grade_level || '').trim();
      if (!gl) return true; // วิชาที่เปิดกว้าง
      const glClean = gl.replace(/^ชั้น\s*/, '').trim();
      const glPrefix = glClean.split('/')[0].trim();
      return glClean === clsClean || glPrefix === gradePrefix || clsClean.startsWith(glClean) || glClean.startsWith(gradePrefix);
    });
  }

  if (filtered.length === 0) {
    grp.innerHTML = '<option value="" disabled>-- ไม่พบรายวิชาในระดับชั้นนี้ --</option>';
  } else {
    grp.innerHTML = filtered.map(s => {
      const clean = getCleanSubjectHeader(s);
      const code = clean.code ? (escapeHTML(clean.code) + ' ') : '';
      const name = escapeHTML(clean.name);
      const teacher = s.teacher_name ? (' - ' + escapeHTML(s.teacher_name)) : '';
      const gl = (!cls && s.grade_level) ? (' [' + escapeHTML(s.grade_level) + ']') : '';
      return `<option value="${escapeHTML(s.id)}">${code}${name}${gl}${teacher}</option>`;
    }).join('');
  }
}

function filterAttendanceTableRoom(room) {
  AttendanceState.tableClassroom = room || '';
  if (AttendanceState.reportLastData && AttendanceState.reportLastData.res) {
    renderAttendanceReportData(AttendanceState.reportLastData.res);
    const el = document.getElementById('reportStudentTableCard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function loadAttendanceReport() {
  const scope = AttendanceState.reportScope || 'monthly';
  const classroom = document.getElementById('rptClassroom')?.value || '';
  const rptType   = document.getElementById('rptType')?.value || 'homeroom';

  // Synchronize or reset table classroom filter
  AttendanceState.tableClassroom = classroom || '';

  const params = {
    mode: 'class',
    scope: scope,
    classroom: classroom,
    report_type: rptType
  };

  if (scope === 'monthly') {
    const ym = document.getElementById('rptMonth')?.value || new Date().toISOString().slice(0, 7);
    const parts = ym.split('-');
    params.year = parseInt(parts[0], 10);
    params.month = parseInt(parts[1], 10);
  } else if (scope === 'semester') {
    params.semester = document.getElementById('rptSemester')?.value || '1';
    params.academic_year = APP.dashboardData?.config?.academic_year || '2569';
  } else {
    params.start_date = document.getElementById('rptStart')?.value || '';
    params.end_date   = document.getElementById('rptEnd')?.value || '';
  }

  const area = document.getElementById('rptArea');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i>กำลังประมวลผลรายงาน...</div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (area) area.innerHTML = `<div class="empty-state"><i class='bx bx-error text-rose-500'></i>${escapeHTML(res.message || 'เกิดข้อผิดพลาด')}\x3c/div>`;
        return;
      }
      AttendanceState.reportLastData = {
        res: res,
        scope: scope,
        classroom: classroom,
        rptType: rptType
      };
      renderAttendanceReportData(res);
    })
    .withFailureHandler(err => {
      if (area) area.innerHTML = `<div class="empty-state"><i class='bx bx-error text-rose-500'></i>${escapeHTML(err.message || err)}\x3c/div>`;
    })
    .getAttendanceReport(params, APP.token);
}

function renderAttendanceReportData(res) {
  const area = document.getElementById('rptArea');
  if (!area) return;

  if (!res.data || res.data.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-info-circle'>\x3c/i>
        ไม่พบข้อมูลในช่วงเวลานี้
      \x3c/div>`;
    return;
  }

  const scope = res.scope || AttendanceState.reportScope || 'monthly';
  const rptType = res.report_type || 'homeroom';
  const classroom = res.classroom && res.classroom !== 'all' ? ('ชั้น ' + res.classroom) : 'ทุกระดับชั้น (ทั้งโรงเรียน)';
  const targetSub = res.target_subject;
  const isSubjectMode = !!targetSub || (rptType !== 'homeroom' && rptType !== 'all_subjects');

  let titleText = 'รายงานการเข้าเรียน';
  let dateDesc = '';
  const mOpt = document.getElementById('rptMonth');
  const mLabel = mOpt?.options[mOpt.selectedIndex]?.text || '';
  const sem = res.semester || document.getElementById('rptSemester')?.value || '1';
  const ay = res.academic_year || '2569';

  if (isSubjectMode) {
    const sName = targetSub ? ((targetSub.subject_code ? targetSub.subject_code + ' ' : '') + targetSub.subject_name) : ('รายวิชา ' + rptType);
    if (scope === 'monthly') {
      titleText = 'รายงานเวลาเรียน วิชา ' + sName + ' ประจำเดือน ' + mLabel;
    } else if (scope === 'semester') {
      titleText = 'รายงานเวลาเรียน วิชา ' + sName + ' ภาคเรียนที่ ' + sem + '/' + ay;
    } else {
      titleText = 'รายงานเวลาเรียน วิชา ' + sName;
    }
    const teacherStr = targetSub?.teacher_name ? ('ครูผู้สอน: ' + targetSub.teacher_name + ' | ') : '';
    dateDesc = teacherStr + classroom + ' | วันทำการเช็คชื่อ ' + (res.summary?.active_days || 0) + ' วัน (' + (res.summary?.total || 0) + ' คาบ) | นักเรียน ' + res.data.length + ' คน';
  } else if (rptType === 'all_subjects') {
    if (scope === 'monthly') {
      titleText = 'รายงานเวลาเรียนภาพรวมทุกรายวิชา ประจำเดือน ' + mLabel;
    } else if (scope === 'semester') {
      titleText = 'รายงานเวลาเรียนภาพรวมทุกรายวิชา ภาคเรียนที่ ' + sem + '/' + ay;
    } else {
      titleText = 'รายงานเวลาเรียนภาพรวมทุกรายวิชา';
    }
    dateDesc = classroom + ' | บันทึกการเช็คชื่อทั้งหมด ' + (res.summary?.active_days || 0) + ' วัน | นักเรียน ' + res.data.length + ' คน';
  } else {
    // homeroom
    if (scope === 'monthly') {
      titleText = 'รายงานสรุปการมาเรียนและเช็คแถวหน้าเสาธง ประจำเดือน ' + mLabel;
      dateDesc = 'บันทึกการเช็คชื่อทั้งหมด ' + (res.summary?.active_days || 0) + ' วันทำการ | นักเรียน ' + res.data.length + ' คน';
    } else if (scope === 'semester') {
      titleText = 'รายงานสรุปการมาเรียนและเช็คแถวหน้าเสาธง ภาคเรียนที่ ' + sem + '/' + ay;
      dateDesc = 'บันทึกการเช็คชื่อสะสม ' + (res.summary?.active_days || 0) + ' วันทำการ | นักเรียน ' + res.data.length + ' คน';
    } else {
      titleText = 'รายงานสรุปการมาเรียนและเช็คแถวหน้าเสาธง';
      dateDesc = res.start_date && res.end_date
        ? ('ข้อมูลระหว่างวันที่ ' + formatThaiDate(new Date(res.start_date + 'T00:00:00')) + ' ถึง ' + formatThaiDate(new Date(res.end_date + 'T00:00:00')))
        : '';
    }
  }

  // 1. Metric Cards
  const sum = res.summary || {};
  const rate = typeof sum.attendance_pct === 'number' ? sum.attendance_pct : 0;
  const rateBadge = rate >= 95 ? 'att-badge-green' : (rate >= 90 ? 'att-badge-amber' : 'att-badge-rose');
  const rateText  = rate >= 95 ? 'ปกติ' : (rate >= 90 ? 'ควรเฝ้าระวัง' : 'ต่ำกว่าเกณฑ์');
  const unitLabel = isSubjectMode ? 'คาบ' : 'คน-วัน';

  const metricCardsHtml = `
    <div class="att-kpi-grid mb-4">
      <div class="att-kpi-card">
        <div class="att-kpi-top">
          <span class="att-kpi-label">${isSubjectMode ? 'เวลาเรียนเฉลี่ยในวิชานี้' : 'อัตราการมาเรียนเฉลี่ย'}</span>
          <span class="att-kpi-badge ${rateBadge}">${rateText}</span>
        </div>
        <div class="att-kpi-num">${rate.toFixed(1)}%</div>
        <div class="att-kpi-sub">${isSubjectMode ? 'เกณฑ์เวลาเรียนผ่านชั้น ≥ 80.0%' : 'เกณฑ์สถานศึกษา ≥ 95.0%'}</div>
      </div>

      <div class="att-kpi-card">
        <div class="att-kpi-top">
          <span class="att-kpi-label">มาเรียนปกติ</span>
          <span class="att-kpi-badge att-badge-green">มาเรียน</span>
        </div>
        <div class="att-kpi-num text-emerald-600">${formatNumber(sum.present || 0)} <span class="text-xs font-normal text-slate-500">${unitLabel}</span></div>
        <div class="att-kpi-sub">${isSubjectMode ? 'บันทึกเข้าชั้นเรียนตามเวลา' : 'เช็คชื่อเข้าชั้นเรียน / หน้าเสาธง'}</div>
      </div>

      <div class="att-kpi-card">
        <div class="att-kpi-top">
          <span class="att-kpi-label">มาสาย</span>
          <span class="att-kpi-badge att-badge-amber">สาย</span>
        </div>
        <div class="att-kpi-num text-amber-600">${formatNumber(sum.late || 0)} <span class="text-xs font-normal text-slate-500">${unitLabel}</span></div>
        <div class="att-kpi-sub">บันทึกเวลามาสาย</div>
      </div>

      <div class="att-kpi-card">
        <div class="att-kpi-top">
          <span class="att-kpi-label">ขาดเรียน / ลา</span>
          <span class="att-kpi-badge att-badge-rose">ขาด/ลา</span>
        </div>
        <div class="att-kpi-num text-rose-600">${formatNumber((sum.absent || 0) + (sum.leave || 0))} <span class="text-xs font-normal text-slate-500">${unitLabel}</span></div>
        <div class="att-kpi-sub">ขาด ${formatNumber(sum.absent || 0)} / ลา ${formatNumber(sum.leave || 0)} ${unitLabel}</div>
      </div>
    </div>
  `;

  // Notice if no records yet
  let noticeHtml = '';
  if (sum.total === 0) {
    noticeHtml = `
      <div class="p-3.5 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
        <i class='bx bx-info-circle text-lg text-amber-600 flex-shrink-0'>\x3c/i>
        <span>ยังไม่พบประวัติการเช็คชื่อสำหรับช่วงเวลานี้ (สามารถเข้าสู่แท็บ <b>"บันทึกรายวัน"</b> ด้านบน เพื่อเริ่มบันทึกเวลาเรียนได้ทันที)</span>
      </div>
    `;
  }

  // 2. Classroom Comparison Table (if multiple rooms or whole school)
  let classroomTableHtml = '';
  if (res.classrooms && res.classrooms.length > 1 && (!res.classroom || res.classroom === 'all')) {
    classroomTableHtml = `
      <div class="page-card mb-4">
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
              <i class="bx bxs-school text-indigo-600">\x3c/i> สรุปสถิติแยกตามระดับชั้นเรียน (${res.classrooms.length} ห้อง)
            </h4>
            <span class="text-xs text-slate-500 flex items-center gap-1"><i class='bx bx-pointer'></i> คลิกที่ห้องเรียนเพื่อกรองดูรายชื่อ</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="risk-table">
              <thead>
                <tr>
                  <th style="width:45px; text-align:center;">ที่</th>
                  <th>ระดับชั้นเรียน</th>
                  <th>ครูประจำชั้น</th>
                  <th style="width:85px; text-align:center;">นักเรียน</th>
                  <th style="width:75px; text-align:center;" class="text-emerald-700">มา</th>
                  <th style="width:75px; text-align:center;" class="text-rose-700">ขาด</th>
                  <th style="width:75px; text-align:center;" class="text-amber-700">ลา</th>
                  <th style="width:75px; text-align:center;" class="text-blue-700">สาย</th>
                  <th style="width:110px; text-align:center;">% มาเรียน</th>
                </tr>
              </thead>
              <tbody>
                ${res.classrooms.map((c, i) => {
                  const isCur = (AttendanceState.tableClassroom === c.classroom);
                  return `
                    <tr onclick="filterAttendanceTableRoom('${escapeHTML(c.classroom)}')" class="cursor-pointer transition-colors ${isCur ? 'bg-indigo-50/80 font-semibold' : 'hover:bg-indigo-50/40'}" title="คลิกเพื่อเลือกดูชั้น ${escapeHTML(c.classroom)}">
                      <td style="text-align:center;" class="text-slate-400">${i + 1}</td>
                      <td class="font-bold text-slate-800">
                        <div class="flex items-center gap-1.5">
                          <span>ชั้น ${escapeHTML(c.classroom)}</span>
                          ${isCur ? '<span class="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-normal">กำลังแสดง</span>' : '<span class="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-normal hover:bg-indigo-600 hover:text-white transition-colors">ดูรายชื่อ</span>'}
                        </div>
                      </td>
                      <td class="text-slate-600 text-xs">${escapeHTML(c.teacher || 'ครูประจำชั้น')}</td>
                      <td style="text-align:center;">${c.students_count} คน</td>
                      <td style="text-align:center;" class="text-emerald-600 font-semibold">${c.present}</td>
                      <td style="text-align:center;" class="text-rose-600 font-semibold">${c.absent}</td>
                      <td style="text-align:center;" class="text-amber-600 font-semibold">${c.leave}</td>
                      <td style="text-align:center;" class="text-blue-600 font-semibold">${c.late}</td>
                      <td style="text-align:center;">
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold ${c.attendance_pct >= 95 ? 'bg-emerald-100 text-emerald-800' : (c.attendance_pct >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                          ${c.attendance_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Filter Students by Table Classroom Selection
  const allStudents = res.data || [];
  const roomCounts = {};
  const availableRooms = [];
  allStudents.forEach(r => {
    const rm = (r.classroom || '').trim();
    if (rm) {
      if (!roomCounts[rm]) {
        roomCounts[rm] = 0;
        availableRooms.push(rm);
      }
      roomCounts[rm]++;
    }
  });
  availableRooms.sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));

  let activeRoom = AttendanceState.tableClassroom || '';
  if (activeRoom && !availableRooms.includes(activeRoom)) {
    activeRoom = '';
    AttendanceState.tableClassroom = '';
  }

  const displayStudents = activeRoom
    ? allStudents.filter(r => (r.classroom || '').trim() === activeRoom)
    : allStudents;

  // Classroom quick selector bar (rendered above the student table)
  let roomSelectorHtml = '';
  if (availableRooms.length > 1) {
    roomSelectorHtml = `
      <div class="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
            <i class='bx bxs-school text-indigo-600 text-base'></i> เลือกดูทีละห้อง:
          </span>
          <button type="button" onclick="filterAttendanceTableRoom('')" 
            class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!activeRoom ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
            ทั้งหมด (${allStudents.length} คน)
          </button>
          ${availableRooms.map(rm => `
            <button type="button" onclick="filterAttendanceTableRoom('${escapeHTML(rm)}')" 
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeRoom === rm ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
              ชั้น ${escapeHTML(rm)} (${roomCounts[rm]} คน)
            </button>
          `).join('')}
        </div>
        <div class="sm:hidden w-full mt-1 flex items-center gap-2">
          <label class="text-[11px] text-slate-500 font-bold whitespace-nowrap">ห้องเรียน:</label>
          <select onchange="filterAttendanceTableRoom(this.value)" class="flex-1 text-xs rounded-lg border border-slate-200 py-1.5 px-2 bg-white font-medium">
            <option value="">ทั้งหมด (${allStudents.length} คน)</option>
            ${availableRooms.map(rm => `<option value="${escapeHTML(rm)}" ${activeRoom === rm ? 'selected' : ''}>ชั้น ${escapeHTML(rm)} (${roomCounts[rm]} คน)</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }

  // 4. Main Content (wrapped in a clean card with room selector)
  let mainContentHtml = '';

  if (scope === 'monthly' && AttendanceState.reportView === 'matrix' && (rptType === 'homeroom' || isSubjectMode)) {
    // Daily Matrix (Day 1 - 31) View
    const ym = document.getElementById('rptMonth')?.value || res.start_date?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    const parts = ym.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayHeaders = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      const dayOfWeek = dt.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const thDay = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][dayOfWeek];
      dayHeaders.push({ day: d, isWeekend: isWeekend, thDay: thDay, ds: ym + '-' + String(d).padStart(2, '0') });
    }

    mainContentHtml = `
      <div id="reportStudentTableCard" class="page-card overflow-hidden">
        ${roomSelectorHtml}
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
                <i class="bx bx-calendar-check text-indigo-600">\x3c/i> ${isSubjectMode ? 'แบบบันทึกเวลาเรียนรายวิชาประจำวัน (ปพ.5)' : 'แบบบันทึกเวลาเรียนและเช็คแถวรายวัน (ปพ.5)'} ${activeRoom ? ('ชั้น ' + escapeHTML(activeRoom) + ' ') : ''}(${displayStudents.length} คน)
              </h4>
              <p class="text-xs text-slate-500 m-0 mt-0.5">แสดงสัญลักษณ์: <b class="text-emerald-600">✓</b> มาเรียน | <b class="text-rose-600">ข</b> ขาด | <b class="text-amber-600">ล</b> ลา | <b class="text-indigo-600">ส</b> สาย</p>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th style="width:35px;">ที่</th>
                  <th style="width:75px;">เลขประจำตัว</th>
                  <th style="min-width:140px; text-align:left;">ชื่อ - นามสกุล</th>
                  ${dayHeaders.map(h => `
                    <th style="min-width:26px; ${h.isWeekend ? 'background:#F1F5F9; color:#94A3B8;' : ''}">
                      <div style="font-size:10px;">${h.thDay}</div>
                      <div style="font-size:11px; font-weight:800;">${h.day}</div>
                    </th>
                  `).join('')}
                  <th style="width:36px;" class="text-emerald-700">มา</th>
                  <th style="width:36px;" class="text-rose-700">ขาด</th>
                  <th style="width:36px;" class="text-amber-700">ลา</th>
                  <th style="width:36px;" class="text-blue-700">สาย</th>
                  <th style="width:40px;">รวม</th>
                  <th style="width:58px;">%</th>
                </tr>
              </thead>
              <tbody>
                ${displayStudents.length === 0 ? `
                  <tr><td colspan="${dayHeaders.length + 9}" class="text-center py-6 text-slate-400">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                ` : displayStudents.map((r, idx) => `
                  <tr>
                    <td class="text-slate-400 font-medium">${idx + 1}</td>
                    <td class="font-mono text-xs text-slate-600">${escapeHTML(r.student_code || '-')}</td>
                    <td style="text-align:left; font-weight:600; white-space:nowrap;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
                    ${dayHeaders.map(h => {
                      const st = r.dates ? r.dates[h.ds] : null;
                      if (!st) {
                        return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-none">-</span></td>`;
                      }
                      if (st === 'present') return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-present">✓</span></td>`;
                      if (st === 'absent')  return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-absent">ข</span></td>`;
                      if (st === 'leave')   return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-leave">ล</span></td>`;
                      if (st === 'late')    return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-late">ส</span></td>`;
                      return `<td style="${h.isWeekend ? 'background:#F8FAFC;' : ''}"><span class="matrix-mark-none">-</span></td>`;
                    }).join('')}
                    <td class="text-emerald-700 font-bold">${r.present}</td>
                    <td class="text-rose-700 font-bold">${r.absent}</td>
                    <td class="text-amber-700 font-bold">${r.leave}</td>
                    <td class="text-blue-700 font-bold">${r.late}</td>
                    <td class="font-bold">${r.total}</td>
                    <td>
                      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${r.total === 0 ? 'bg-slate-100 text-slate-500' : (r.attendance_pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}">
                        ${r.total === 0 ? '-' : r.attendance_pct.toFixed(0) + '%'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (rptType === 'all_subjects') {
    // All Subjects Matrix Table
    const rawSubs = (res.subjects && res.subjects.length > 0)
      ? res.subjects
      : (AttendanceState.filterOptions?.subjects || []);
    const activeSubjects = filterValidReportSubjects(rawSubs);

    mainContentHtml = `
      <div id="reportStudentTableCard" class="page-card overflow-hidden">
        ${roomSelectorHtml}
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
                <i class="bx bxs-book-content text-indigo-600">\x3c/i> ตารางเวลาเรียนเปรียบเทียบทุกรายวิชา (${activeSubjects.length} วิชา) ${activeRoom ? ('ชั้น ' + escapeHTML(activeRoom) + ' ') : ''}(${displayStudents.length} คน)
              </h4>
              <p class="text-xs text-slate-500 m-0 mt-0.5">แสดงร้อยละเวลาเรียนของนักเรียนแต่ละคนในแต่ละรายวิชา</p>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="risk-table">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">ที่</th>
                  <th style="width:75px; text-align:center;">รหัสนักเรียน</th>
                  <th style="min-width:140px;">ชื่อ - นามสกุล</th>
                  <th style="width:75px; text-align:center;">ระดับชั้น</th>
                  ${activeSubjects.map(s => {
                    const clean = getCleanSubjectHeader(s);
                    return `
                    <th style="min-width:75px; text-align:center;" title="${escapeHTML(clean.name)} (${s.periods_count || 0} คาบ)">
                      <div class="text-[11px] font-bold text-slate-800">${escapeHTML(clean.code)}</div>
                      <div class="text-[10px] text-slate-500 font-normal truncate max-w-[85px] mx-auto" title="${escapeHTML(clean.name)}">${escapeHTML(clean.name)}</div>
                      <div class="text-[9px] text-slate-400 font-normal mt-0.5">${s.periods_count || 0} คาบ</div>
                    </th>
                    `;
                  }).join('')}
                  <th style="width:85px; text-align:center;">% รวมทุกวิชา</th>
                  <th style="width:80px; text-align:center;">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${displayStudents.length === 0 ? `
                  <tr><td colspan="${activeSubjects.length + 6}" class="text-center py-6 text-slate-400">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                ` : displayStudents.map((r, idx) => {
                  const bad = r.total > 0 && r.attendance_pct < 80;
                  return `
                    <tr>
                      <td style="text-align:center;" class="text-slate-400 font-medium">${idx + 1}</td>
                      <td style="text-align:center;" class="font-mono text-xs text-slate-600">${escapeHTML(r.student_code || '-')}</td>
                      <td class="font-semibold text-slate-800 white-space-nowrap">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
                      <td style="text-align:center;" class="text-slate-600 text-xs">ชั้น ${escapeHTML(r.classroom)}</td>
                      ${activeSubjects.map(s => {
                        const subData = r.by_subject ? r.by_subject[s.id] : null;
                        if (!subData || subData.total === 0) {
                          return '<td style="text-align:center;" class="text-slate-300">-</td>';
                        }
                        const p = subData.attendance_pct || 0;
                        const low = p < 80;
                        return `
                          <td style="text-align:center;">
                            <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${low ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'}" title="มา ${subData.present}, ขาด ${subData.absent}, ลา ${subData.leave}">
                              ${p.toFixed(0)}%
                            </span>
                          </td>
                        `;
                      }).join('')}
                      <td style="text-align:center;">
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold ${r.total === 0 ? 'bg-slate-100 text-slate-500' : (bad ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white')}">
                          ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
                        </span>
                      </td>
                      <td style="text-align:center;">
                        ${r.total === 0 ? '<span class="text-xs text-slate-400">-</span>' : (bad ? '<span class="status-pill status-absent">เสี่ยง มส.</span>' : '<span class="status-pill status-present">ปกติ</span>')}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else if (scope === 'semester' && res.months && res.months.length > 0 && !isSubjectMode) {
    // Semester View with Monthly Breakdown Columns
    mainContentHtml = `
      <div id="reportStudentTableCard" class="page-card overflow-hidden">
        ${roomSelectorHtml}
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
                <i class="bx bx-calendar-star text-indigo-600">\x3c/i> ตารางสรุปเวลาเรียนรายบุคคลแยกตามรายเดือนตลอดภาคเรียน ${activeRoom ? ('ชั้น ' + escapeHTML(activeRoom) + ' ') : ''}(${displayStudents.length} คน)
              </h4>
              <p class="text-xs text-slate-500 m-0 mt-0.5">สรุปร้อยละเวลาเรียนของแต่ละเดือน และยอดสะสมตลอดทั้งภาคเรียน</p>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="risk-table">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">ที่</th>
                  <th style="width:75px; text-align:center;">รหัสนักเรียน</th>
                  <th style="min-width:150px;">ชื่อ - นามสกุล</th>
                  <th style="width:75px; text-align:center;">ระดับชั้น</th>
                  ${res.months.map(m => `
                    <th style="min-width:68px; text-align:center;">${m.label}</th>
                  `).join('')}
                  <th style="width:75px; text-align:center;">รวม (วัน)</th>
                  <th style="width:90px; text-align:center;">% ตลอดเทอม</th>
                  <th style="width:85px; text-align:center;">การประเมิน</th>
                </tr>
              </thead>
              <tbody>
                ${displayStudents.length === 0 ? `
                  <tr><td colspan="${res.months.length + 7}" class="text-center py-6 text-slate-400">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                ` : displayStudents.map((r, idx) => {
                  const isRisk = (r.total > 0 && r.attendance_pct < 80);
                  return `
                    <tr>
                      <td style="text-align:center;" class="text-slate-400 font-medium">${idx + 1}</td>
                      <td style="text-align:center;" class="font-mono text-xs text-slate-600">${escapeHTML(r.student_code || '-')}</td>
                      <td class="font-semibold text-slate-800 white-space-nowrap">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
                      <td style="text-align:center;" class="text-slate-600 text-xs">ชั้น ${escapeHTML(r.classroom)}</td>
                      ${res.months.map(m => {
                        const mData = r.by_month ? r.by_month[m.ym] : null;
                        if (!mData || mData.total === 0) {
                          return '<td style="text-align:center;" class="text-slate-300">-</td>';
                        }
                        const p = mData.attendance_pct || 0;
                        const low = p < 80;
                        return `
                          <td style="text-align:center;">
                            <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${low ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'}" title="มา ${mData.present}, ขาด ${mData.absent}, ลา ${mData.leave}, สาย ${mData.late}">
                              ${p.toFixed(0)}%
                            </span>
                          </td>
                        `;
                      }).join('')}
                      <td style="text-align:center;" class="font-bold text-slate-700">${r.total}</td>
                      <td style="text-align:center;">
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-extrabold ${r.total === 0 ? 'bg-slate-100 text-slate-500' : (isRisk ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white')}">
                          ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
                        </span>
                      </td>
                      <td style="text-align:center;">
                        ${r.total === 0 
                          ? '<span class="text-xs text-slate-400">-</span>'
                          : (isRisk 
                            ? '<span class="status-pill status-absent">เสี่ยง มส.</span>'
                            : '<span class="status-pill status-present">ปกติ</span>')
                        }
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } else {
    // Default Student Summary Table (supports both individual subject and general attendance)
    const countUnit = isSubjectMode ? 'คาบ' : 'วัน';
    mainContentHtml = `
      <div id="reportStudentTableCard" class="page-card overflow-hidden">
        ${roomSelectorHtml}
        <div class="page-card-body">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5 m-0">
                <i class="bx bx-list-check text-indigo-600">\x3c/i> ${isSubjectMode ? 'ตารางสรุปเวลาเรียนรายวิชารายบุคคล' : 'ตารางสรุปเวลาเรียนรายบุคคล'} ${activeRoom ? ('ชั้น ' + escapeHTML(activeRoom) + ' ') : ''}(${displayStudents.length} คน)
              </h4>
              <p class="text-xs text-slate-500 m-0 mt-0.5">สรุปจำนวน${countUnit}มา ขาด ลา มาสาย และคิดเป็นร้อยละเวลาเรียน${isSubjectMode ? 'ของวิชานี้' : ''}</p>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="risk-table">
              <thead>
                <tr>
                  <th style="width:40px; text-align:center;">ที่</th>
                  <th style="width:80px; text-align:center;">รหัสนักเรียน</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style="width:80px; text-align:center;">ระดับชั้น</th>
                  <th style="width:65px; text-align:center;" class="text-emerald-700">มา (${countUnit})</th>
                  <th style="width:65px; text-align:center;" class="text-rose-700">ขาด (${countUnit})</th>
                  <th style="width:65px; text-align:center;" class="text-amber-700">ลา (${countUnit})</th>
                  <th style="width:65px; text-align:center;" class="text-blue-700">สาย (${countUnit})</th>
                  <th style="width:75px; text-align:center;">รวม${countUnit}</th>
                  <th style="width:85px; text-align:center;">% เข้าเรียน</th>
                  <th style="width:85px; text-align:center;">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${displayStudents.length === 0 ? `
                  <tr><td colspan="11" class="text-center py-6 text-slate-400">ไม่พบข้อมูลนักเรียนในห้องนี้</td></tr>
                ` : displayStudents.map((r, idx) => {
                  const bad = r.total > 0 && r.attendance_pct < 80;
                  return `
                    <tr>
                      <td style="text-align:center;" class="text-slate-400 font-medium">${idx + 1}</td>
                      <td style="text-align:center;" class="font-mono text-xs text-slate-600">${escapeHTML(r.student_code || '-')}</td>
                      <td class="font-semibold text-slate-800">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
                      <td style="text-align:center;" class="text-slate-600 text-xs">ชั้น ${escapeHTML(r.classroom)}</td>
                      <td style="text-align:center;" class="text-emerald-700 font-semibold">${r.present}</td>
                      <td style="text-align:center;" class="text-rose-600 font-semibold">${r.absent}</td>
                      <td style="text-align:center;" class="text-amber-700 font-semibold">${r.leave}</td>
                      <td style="text-align:center;" class="text-blue-600 font-semibold">${r.late}</td>
                      <td style="text-align:center;" class="font-bold text-slate-700">${r.total}</td>
                      <td style="text-align:center;">
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-bold ${r.total === 0 ? 'bg-slate-100 text-slate-500' : (bad ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}">
                          ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
                        </span>
                      </td>
                      <td style="text-align:center;">
                        ${r.total === 0 
                          ? '<span class="text-xs text-slate-400 font-medium">ยังไม่มีข้อมูล</span>'
                          : (bad 
                            ? '<span class="status-pill status-absent">เสี่ยง มส.</span>'
                            : '<span class="status-pill status-present">ปกติ</span>')
                        }
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // Combine full report view
  area.innerHTML = `
    <div class="mb-4">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <h3 class="text-lg font-bold text-slate-900 m-0">${escapeHTML(titleText)}</h3>
          <p class="text-xs text-slate-500 m-0 mt-0.5">${escapeHTML(dateDesc)}</p>
        </div>
      </div>
      ${noticeHtml}
      ${metricCardsHtml}
      ${classroomTableHtml}
      ${mainContentHtml}
    </div>
  `;
}

function printAttendanceDashboardOverview() {
  const d = APP.dashboardData;
  const config = d?.config || {};
  const ay = config.academic_year || '2569';
  const sem = config.semester || '1';

  const todayLabel = document.getElementById('attMod_attTodayLabel')?.textContent || formatThaiDate(new Date());
  const rateNum = document.getElementById('attMod_attRateNum')?.textContent || '—%';
  const presentNum = document.getElementById('attMod_attPresentNum')?.textContent || '0 คน';
  const lateNum = document.getElementById('attMod_attLateNum')?.textContent || '0 คน';
  const absentNum = document.getElementById('attMod_attAbsentNum')?.textContent || '0 คน';
  const pendingChip = document.getElementById('attMod_chipPendingCount')?.textContent || '';
  const submittedChip = document.getElementById('attMod_chipSubmittedCount')?.textContent || '';

  const docTitle = 'รายงานสรุปภาพรวมการเข้าเรียนประจำวัน';
  const subTitle = `ข้อมูลประจำวันที่ ${todayLabel} | ภาคเรียนที่ ${sem}/${ay}`;
  const schoolLogoUrl = (typeof window !== 'undefined' && window.OFFICIAL_SCHOOL_LOGO_DATA_URL)
    || (typeof APP !== 'undefined' && APP.dashboardData?.config?.school_logo) 
    || localStorage.getItem('cached_school_logo') 
    || 'school-logo.png';

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(docTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 8mm 10mm 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Sarabun', 'Prompt', sans-serif; font-size: 10pt; color: #0F172A; margin: 0; padding: 0; background: #F8FAFC; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-print { position: sticky; top: 0; background: #1E293B; color: white; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .print-page-wrapper { max-width: 195mm; margin: 15px auto; padding: 10mm 12mm; background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-radius: 4px; overflow-x: auto; box-sizing: border-box; }
    .header { text-align: center; margin-bottom: 12px; }
    .logo { width: 52px; height: 52px; object-fit: contain; margin: 0 auto 4px auto; display: block; }
    .title { font-size: 13.5pt; font-weight: bold; margin: 0; color: #1E293B; }
    .subtitle { font-size: 10pt; color: #334155; margin: 2px 0 0 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
    .kpi-box { background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 10px 8px; text-align: center; }
    .kpi-title { font-size: 9pt; color: #64748B; font-weight: bold; margin-bottom: 3px; }
    .kpi-val { font-size: 14pt; font-weight: 800; }
    .signatures { margin-top: 30px; display: flex; justify-content: space-around; page-break-inside: avoid; gap: 16px; flex-wrap: nowrap; }
    .sig-box { text-align: center; min-width: 210px; max-width: 340px; flex: 1; font-size: 9pt; }
    .sig-stamp-zone { min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
    .sig-line { border-bottom: 1px dotted #64748B; width: 170px; margin: 0 auto 3px auto; }
    .sig-dots { font-size: 9pt; color: #334155; white-space: nowrap; }
    .sig-name, .sig-title, .sig-date { margin-top: 3px; color: #334155; font-size: 9pt; white-space: nowrap; }
    .footer { margin-top: 24px; padding-top: 6px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 8pt; color: #64748B; page-break-inside: avoid; clear: both; }
    @media print {
      .no-print { display: none !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; overflow: visible !important; }
      .print-page-wrapper { max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; overflow: visible !important; height: auto !important; }
      .signatures { flex-wrap: nowrap !important; page-break-inside: avoid !important; break-inside: avoid !important; }
      table { width: 100% !important; max-width: 100% !important; min-width: 0 !important; table-layout: auto !important; border-collapse: collapse !important; }
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      thead { display: table-header-group !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="display:flex; align-items:center; gap:8px;">
      <strong style="font-size:13px;">ตัวอย่างก่อนพิมพ์: ${escapeHTML(docTitle)}</strong>
      <span style="font-size:11px; opacity:0.85; background:rgba(255,255,255,0.15); padding:2px 8px; border-radius:4px;">A4 แนวตั้ง</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button onclick="try{if(window.parent&&window.parent.triggerInAppPrint){window.parent.triggerInAppPrint();}else{window.print();}}catch(_){window.print();}" style="background:#4F46E5; color:white; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
        🖨 พิมพ์เอกสาร
      </button>
      <button onclick="window.close()" style="background:#475569; color:white; border:none; padding:7px 12px; border-radius:6px; cursor:pointer; font-size:12px;">
        ปิด
      </button>
    </div>
  </div>

  <div class="print-page-wrapper">
    <div class="header">
      <img src="${schoolLogoUrl}" class="logo" alt="ตราโรงเรียน" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN';">
      <div class="title">${escapeHTML(docTitle)}</div>
      <div class="subtitle">${escapeHTML(subTitle)}</div>
      <div style="font-size:9pt; color:#475569; margin-top:2px;">โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-title">อัตราการมาเรียนเฉลี่ย</div>
        <div class="kpi-val" style="color:#2563EB;">${escapeHTML(rateNum)}</div>
        <div style="font-size:8pt; color:#64748B; margin-top:2px;">เป้าหมาย ≥ 95.0%</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">มาเรียนตามปกติ</div>
        <div class="kpi-val" style="color:#15803D;">${escapeHTML(presentNum)}</div>
        <div style="font-size:8pt; color:#64748B; margin-top:2px;">เช็คชื่อเข้าชั้นเรียน / เสาธง</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">มาสาย</div>
        <div class="kpi-val" style="color:#B45309;">${escapeHTML(lateNum)}</div>
        <div style="font-size:8pt; color:#64748B; margin-top:2px;">บันทึกเวลามาสาย</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-title">ขาดเรียน / ลา</div>
        <div class="kpi-val" style="color:#B91C1C;">${escapeHTML(absentNum)}</div>
        <div style="font-size:8pt; color:#64748B; margin-top:2px;">ขาดและมีใบลา</div>
      </div>
    </div>

    <div style="margin-top:12px; background:#F8FAFC; border:1px solid #CBD5E1; padding:8px 12px; border-radius:6px; font-size:9pt; display:flex; justify-content:space-between; align-items:center;">
      <div><b>สถานะการส่งยอดเช็คชื่อหน้าเสาธง:</b> ${escapeHTML(submittedChip)} | ${escapeHTML(pendingChip)}</div>
      <div style="color:#64748B; font-size:8.5pt;">ระบบบริหารจัดการ MHC Smart School</div>
    </div>

    <div class="signatures">
      <div class="sig-box" data-sig-role="teacher">
        <div>&nbsp;</div>
        <div class="sig-stamp-zone"></div>
        <div class="sig-line"></div>
        <div class="sig-dots">ลงชื่อ ........................................ ผู้สรุปรายงาน</div>
        <div class="sig-name">( ........................................ )</div>
        <div class="sig-title">ตำแหน่ง หัวหน้างานระดับชั้น / ผู้รับผิดชอบ</div>
        <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
      </div>
      <div class="sig-box" data-sig-role="director">
        <div>ทราบ / อนุมัติ</div>
        <div class="sig-stamp-zone"></div>
        <div class="sig-line"></div>
        <div class="sig-dots">ลงชื่อ ........................................</div>
        <div class="sig-name">( นายอธิการ สุขศรี )</div>
        <div class="sig-title">ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</div>
        <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
      </div>
    </div>

    <div class="footer">
      <span>ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ</span>
      <span>พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</span>
    </div>
  </div>

  <script>
    if (window.self === window.top) {
      window.addEventListener('load', function() {
        setTimeout(function() {
          try { window.focus(); window.print(); } catch(e){}
        }, 400);
      });
    }
  </script>
</body>
</html>`;

  if (typeof openHTMLDocument === 'function') {
    openHTMLDocument(html, docTitle);
  } else if (typeof window.openHTMLDocument === 'function') {
    window.openHTMLDocument(html, docTitle);
  } else {
    window.print();
  }
}

// Helper to determine Grade Level from Classroom string (e.g. 'ม.1/1' -> 'ม.1')
function getGradeLevelFromClass(cls) {
  if (!cls) return 'ไม่ระบุชั้น';
  const str = String(cls).trim();
  const m = str.match(/^(ม\.[1-6]|ป\.[1-6]|อ\.[1-3])/i);
  if (m) return m[1];
  return str.split('/')[0].trim() || str;
}

function getGradeLevelFullThai(gLevel) {
  if (!gLevel || gLevel === 'ทุกระดับชั้น') return 'ทุกระดับชั้น';
  if (gLevel === 'ม.1') return 'ระดับชั้นมัธยมศึกษาปีที่ 1 (ม.1)';
  if (gLevel === 'ม.2') return 'ระดับชั้นมัธยมศึกษาปีที่ 2 (ม.2)';
  if (gLevel === 'ม.3') return 'ระดับชั้นมัธยมศึกษาปีที่ 3 (ม.3)';
  if (gLevel === 'ม.4') return 'ระดับชั้นมัธยมศึกษาปีที่ 4 (ม.4)';
  if (gLevel === 'ม.5') return 'ระดับชั้นมัธยมศึกษาปีที่ 5 (ม.5)';
  if (gLevel === 'ม.6') return 'ระดับชั้นมัธยมศึกษาปีที่ 6 (ม.6)';
  if (gLevel.startsWith('ม.')) return 'ระดับชั้นมัธยมศึกษาปีที่ ' + gLevel.replace('ม.', '') + ` (${gLevel})`;
  return 'ระดับชั้น ' + gLevel;
}
if (typeof window !== 'undefined') {
  window.getGradeLevelFromClass = getGradeLevelFromClass;
  window.getGradeLevelFullThai = getGradeLevelFullThai;
}

function printDailyAttendanceRecord() {
  try {
    if (!AttendanceState.records || AttendanceState.records.length === 0) {
      if (typeof showToast === 'function') {
        return showToast('warning', 'กรุณาเลือกชั้นเรียนและวันที่ให้มีรายชื่อนักเรียนก่อนพิมพ์');
      } else {
        alert('กรุณาเลือกชั้นเรียนและวันที่ให้มีรายชื่อนักเรียนก่อนพิมพ์');
        return;
      }
    }

    const dateInput = document.getElementById('attDate');
    const dateStr = AttendanceState.date || (dateInput ? dateInput.value : '') || new Date().toISOString().slice(0, 10);
    let y = 2026, m = 1, d = 1;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else {
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        y = parseInt(parts[2], 10);
      }
    }
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      const today = new Date();
      y = today.getFullYear();
      m = today.getMonth() + 1;
      d = today.getDate();
    }
    const dt = new Date(y, m - 1, d);
    const thDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const thMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const dateThaiFull = `${thDays[dt.getDay()]}ที่ ${d} ${thMonths[m] || ''} พ.ศ. ${y > 2400 ? y : y + 543}`;

    const mode = AttendanceState.mode;
    const isSubject = (mode === 'subject');
    const classroom = AttendanceState.classroom || (document.getElementById('attClassroom')?.value) || '';
  const schoolLogoUrl = (typeof window !== 'undefined' && window.OFFICIAL_SCHOOL_LOGO_DATA_URL)
    || (typeof APP !== 'undefined' && APP.dashboardData?.config?.school_logo) 
    || localStorage.getItem('cached_school_logo') 
    || 'school-logo.png';
  
  let docTitle = isSubject ? 'แบบบันทึกการเข้าเรียนรายวิชาประจำวัน' : 'แบบบันทึกการเช็คแถวหน้าเสาธงและโฮมรูมประจำวัน';
  let subTitle = '';
  
  if (isSubject) {
    const subjects = AttendanceState.subjects || [];
    const sub = subjects.find(s => s.id === AttendanceState.subject_id);
    const cachedEntry = (AttendanceState.scheduleCache || []).find(e => e.subject_id === AttendanceState.subject_id);
    const subjectName = (sub && sub.subject_name) 
      || (cachedEntry && cachedEntry.subject_name) 
      || document.getElementById('attSubjectName')?.textContent?.split('•')[0]?.trim() 
      || 'รายวิชา';
    const subjectCode = (sub && sub.subject_code) || (cachedEntry && cachedEntry.subject_code) || '';
    const sName = (subjectCode ? subjectCode + ' ' : '') + subjectName;
    const teacher = (sub && sub.teacher_name) 
      || (cachedEntry && cachedEntry.teacher_name) 
      || document.getElementById('attSubjectName')?.textContent?.split('•')[1]?.trim() 
      || '';
    const checkedPeriods = Array.from(document.querySelectorAll('input[name="att_period"]:checked')).map(cb => cb.value).join(', ');
    const periodStr = checkedPeriods ? (`คาบที่ ${checkedPeriods}`) : '';
    subTitle = `วิชา: ${sName} | ${periodStr ? periodStr + ' | ' : ''}${teacher ? 'ครูผู้สอน: ' + teacher + ' | ' : ''}ชั้น ${classroom}`;
  } else {
    subTitle = `ระดับชั้น: ชั้น ${classroom || '-'} | เช็คแถวหน้าเสาธงและกิจกรรมโฮมรูม`;
  }

  const uniqueRooms = Array.from(new Set(AttendanceState.records.map(r => r.classroom).filter(Boolean)))
    .sort((a,b) => String(a).localeCompare(String(b), 'th', { numeric: true }));

  let pagesHtml = '';

  if (uniqueRooms.length > 1) {
    // แยกพิมพ์ตัดตามห้อง / ระดับชั้น เมื่อมีหลายห้อง
    pagesHtml = uniqueRooms.map((rm, rIdx) => {
      const isLast = (rIdx === uniqueRooms.length - 1);
      const roomRecords = AttendanceState.records.filter(r => r.classroom === rm);
      let pCnt = 0, aCnt = 0, lCnt = 0, ltCnt = 0;
      roomRecords.forEach(r => {
        if (r.status === 'present') pCnt++;
        else if (r.status === 'absent') aCnt++;
        else if (r.status === 'leave') lCnt++;
        else if (r.status === 'late') ltCnt++;
      });
      const checkedTotal = pCnt + aCnt + lCnt + ltCnt;
      const pct = checkedTotal > 0 ? (((pCnt + ltCnt) / checkedTotal) * 100).toFixed(1) : '-';

      const rowsHtml = roomRecords.map((r, idx) => {
        let stText = '<span style="color:#94A3B8;">[ &nbsp; ] ยังไม่ระบุ</span>';
        if (r.status === 'present') stText = isSubject ? '<span style="color:#15803D; font-weight:bold;">✓ มาเรียน</span>' : '<span style="color:#15803D; font-weight:bold;">✓ มา</span>';
        else if (r.status === 'absent') stText = isSubject ? '<span style="color:#B91C1C; font-weight:bold;">✗ ขาดเรียน</span>' : '<span style="color:#B91C1C; font-weight:bold;">✗ ขาด</span>';
        else if (r.status === 'leave') stText = '<span style="color:#B45309; font-weight:bold;">∆ ลา</span>';
        else if (r.status === 'late') stText = isSubject ? '<span style="color:#1D4ED8; font-weight:bold;">⏱ มาสาย</span>' : '<span style="color:#1D4ED8; font-weight:bold;">⏱ มาสาย</span>';

        return `
          <tr>
            <td style="text-align:center; padding:4px 2px;">${r.student_number || (idx + 1)}</td>
            <td style="text-align:center; font-family:'Courier New', monospace; font-size:8.5pt; padding:4px 2px; white-space:nowrap;">${escapeHTML(r.student_code || '-')}</td>
            <td style="text-align:left; font-weight:600; padding:4px 6px; word-break:break-word;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
            <td style="text-align:center; padding:4px 2px; white-space:nowrap;">${escapeHTML(r.classroom || rm || '-')}</td>
            <td style="text-align:center; padding:4px 2px; white-space:nowrap;">${stText}</td>
            <td style="text-align:center; color:#94A3B8; font-size:8pt; padding:4px 2px;">..........................</td>
          </tr>
        `;
      }).join('');

      const roomSubTitle = isSubject
        ? `${subTitle} (ห้อง ${rm})`
        : `ระดับชั้น: ชั้น ${rm} | เช็คแถวหน้าเสาธงและกิจกรรมโฮมรูม`;

      const pageBreakStyle = isLast ? '' : 'page-break-after: always; break-after: page;';
      const autoMap = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
      const rmTeacherInfo = (autoMap && autoMap.byClassroom && autoMap.byClassroom[rm]) || null;
      const rmTeacherName = rmTeacherInfo?.name || '';
      const rmTeacherSig = rmTeacherInfo?.signature || '';
      const rmGLevel = getGradeLevelFromClass(rm);

      return `
        <div class="print-page-wrapper" data-classroom="${escapeHTML(rm)}" data-grade-level="${escapeHTML(rmGLevel)}" style="${pageBreakStyle}">
          <div class="header">
            <img src="${schoolLogoUrl}" class="logo" alt="ตราโรงเรียน" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN';">
            <div class="title">${escapeHTML(docTitle)}</div>
            <div class="subtitle">${escapeHTML(roomSubTitle)}</div>
            <div style="font-size:9pt; color:#475569; margin-top:2px;">โรงเรียนมหาชัยพิทยาคาร | ประจำ${escapeHTML(dateThaiFull)}</div>
          </div>

          <div class="summary-bar">
            <div><b>ชั้นเรียน:</b> ${escapeHTML(rm)} (${roomRecords.length} คน)</div>
            <div style="color:#15803D;"><b>มา:</b> ${pCnt} คน</div>
            <div style="color:#B91C1C;"><b>ขาด:</b> ${aCnt} คน</div>
            <div style="color:#B45309;"><b>ลา:</b> ${lCnt} คน</div>
            <div style="color:#1D4ED8;"><b>สาย:</b> ${ltCnt} คน</div>
            <div><b>ร้อยละ:</b> ${pct}%</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:7%; text-align:center;">เลขที่</th>
                <th style="width:14%; text-align:center;">รหัสนักเรียน</th>
                <th style="width:35%; text-align:left; padding-left:8px;">ชื่อ - นามสกุล</th>
                <th style="width:12%; text-align:center;">ระดับชั้น</th>
                <th style="width:14%; text-align:center;">สถานะ</th>
                <th style="width:18%; text-align:center;">หมายเหตุ / ลายมือชื่อ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box" data-sig-role="teacher" data-classroom="${escapeHTML(rm)}" data-grade-level="${escapeHTML(rmGLevel)}">
              <div>&nbsp;</div>
              <div class="sig-stamp-zone">
                ${rmTeacherSig ? `<img class="teacher-sig-img" src="${rmTeacherSig}" alt="ลายเซ็น" style="max-height:44px; max-width:145px; object-fit:contain; pointer-events:none; display:inline-block;" />` : ''}
              </div>
              <div class="sig-line"></div>
              <div class="sig-dots" style="${rmTeacherSig ? 'display:none;' : ''}">ลงชื่อ ........................................ ผู้ตรวจเช็ค</div>
              <div class="sig-name">( ${escapeHTML(rmTeacherName || '........................................')} )</div>
              <div class="sig-title">ตำแหน่ง ${isSubject ? 'ครูผู้สอน' : 'ครูประจำชั้น ' + escapeHTML(rm)}</div>
              <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
            </div>
            <div class="sig-box" data-sig-role="director">
              <div>ทราบ / อนุมัติ</div>
              <div class="sig-stamp-zone"></div>
              <div class="sig-line"></div>
              <div class="sig-dots">ลงชื่อ ........................................</div>
              <div class="sig-name">( นายอธิการ สุขศรี )</div>
              <div class="sig-title">ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</div>
              <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
            </div>
          </div>

          <div class="footer">
            <span>ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ</span>
            <span>พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // ห้องเดียวปกติ
    let pCnt = 0, aCnt = 0, lCnt = 0, ltCnt = 0;
    AttendanceState.records.forEach(r => {
      if (r.status === 'present') pCnt++;
      else if (r.status === 'absent') aCnt++;
      else if (r.status === 'leave') lCnt++;
      else if (r.status === 'late') ltCnt++;
    });
    const total = AttendanceState.records.length;
    const checkedTotal = pCnt + aCnt + lCnt + ltCnt;
    const pct = checkedTotal > 0 ? (((pCnt + ltCnt) / checkedTotal) * 100).toFixed(1) : '-';

    const rowsHtml = AttendanceState.records.map((r, idx) => {
      let stText = '<span style="color:#94A3B8;">[ &nbsp; ] ยังไม่ระบุ</span>';
      if (r.status === 'present') stText = isSubject ? '<span style="color:#15803D; font-weight:bold;">✓ มาเรียน</span>' : '<span style="color:#15803D; font-weight:bold;">✓ มา</span>';
      else if (r.status === 'absent') stText = isSubject ? '<span style="color:#B91C1C; font-weight:bold;">✗ ขาดเรียน</span>' : '<span style="color:#B91C1C; font-weight:bold;">✗ ขาด</span>';
      else if (r.status === 'leave') stText = '<span style="color:#B45309; font-weight:bold;">∆ ลา</span>';
      else if (r.status === 'late') stText = isSubject ? '<span style="color:#1D4ED8; font-weight:bold;">⏱ มาสาย</span>' : '<span style="color:#1D4ED8; font-weight:bold;">⏱ มาสาย</span>';

      return `
        <tr>
          <td style="text-align:center; padding:4px 2px;">${r.student_number || (idx + 1)}</td>
          <td style="text-align:center; font-family:'Courier New', monospace; font-size:8.5pt; padding:4px 2px; white-space:nowrap;">${escapeHTML(r.student_code || '-')}</td>
          <td style="text-align:left; font-weight:600; padding:4px 6px; word-break:break-word;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
          <td style="text-align:center; padding:4px 2px; white-space:nowrap;">${escapeHTML(r.classroom || classroom || '-')}</td>
          <td style="text-align:center; padding:4px 2px; white-space:nowrap;">${stText}</td>
          <td style="text-align:center; color:#94A3B8; font-size:8pt; padding:4px 2px;">..........................</td>
        </tr>
      `;
    }).join('');

    const autoMap = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
    const singleGLevel = getGradeLevelFromClass(classroom);
    const singleTeacherInfo = (classroom && autoMap && autoMap.byClassroom && autoMap.byClassroom[classroom]) ||
                              (singleGLevel && autoMap && autoMap.byGrade && autoMap.byGrade[singleGLevel]) || null;
    const singleTeacherName = singleTeacherInfo?.name || '';
    const singleTeacherSig = singleTeacherInfo?.signature || '';

    pagesHtml = `
      <div class="print-page-wrapper" data-classroom="${escapeHTML(classroom)}" data-grade-level="${escapeHTML(singleGLevel)}">
        <div class="header">
          <img src="${schoolLogoUrl}" class="logo" alt="ตราโรงเรียน" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN';">
          <div class="title">${escapeHTML(docTitle)}</div>
          <div class="subtitle">${escapeHTML(subTitle)}</div>
          <div style="font-size:9pt; color:#475569; margin-top:2px;">โรงเรียนมหาชัยพิทยาคาร | ประจำ${escapeHTML(dateThaiFull)}</div>
        </div>

        <div class="summary-bar">
          <div><b>นักเรียนทั้งหมด:</b> ${total} คน</div>
          <div style="color:#15803D;"><b>มา:</b> ${pCnt} คน</div>
          <div style="color:#B91C1C;"><b>ขาด:</b> ${aCnt} คน</div>
          <div style="color:#B45309;"><b>ลา:</b> ${lCnt} คน</div>
          <div style="color:#1D4ED8;"><b>สาย:</b> ${ltCnt} คน</div>
          <div><b>ร้อยละ:</b> ${pct}%</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:7%; text-align:center;">เลขที่</th>
              <th style="width:14%; text-align:center;">รหัสนักเรียน</th>
              <th style="width:35%; text-align:left; padding-left:8px;">ชื่อ - นามสกุล</th>
              <th style="width:12%; text-align:center;">ระดับชั้น</th>
              <th style="width:14%; text-align:center;">สถานะ</th>
              <th style="width:18%; text-align:center;">หมายเหตุ / ลายมือชื่อ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box" data-sig-role="teacher" data-classroom="${escapeHTML(classroom)}" data-grade-level="${escapeHTML(singleGLevel)}">
            <div>&nbsp;</div>
            <div class="sig-stamp-zone">
              ${singleTeacherSig ? `<img class="teacher-sig-img" src="${singleTeacherSig}" alt="ลายเซ็น" style="max-height:44px; max-width:145px; object-fit:contain; pointer-events:none; display:inline-block;" />` : ''}
            </div>
            <div class="sig-line"></div>
            <div class="sig-dots" style="${singleTeacherSig ? 'display:none;' : ''}">ลงชื่อ ........................................ ${isSubject ? 'ผู้ตรวจเช็ค' : 'ครูประจำชั้น'}</div>
            <div class="sig-name">( ${escapeHTML(singleTeacherName || '........................................')} )</div>
            <div class="sig-title">ตำแหน่ง ${isSubject ? 'ครูผู้สอน' : 'ครูประจำชั้น ' + (classroom ? escapeHTML(classroom) : '')}</div>
            <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
          </div>
          <div class="sig-box" data-sig-role="director">
            <div>ทราบ / อนุมัติ</div>
            <div class="sig-stamp-zone"></div>
            <div class="sig-line"></div>
            <div class="sig-dots">ลงชื่อ ........................................</div>
            <div class="sig-name">( นายอธิการ สุขศรี )</div>
            <div class="sig-title">ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</div>
            <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
          </div>
        </div>

        <div class="footer">
          <span>ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ</span>
          <span>พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</span>
        </div>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(docTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 8mm 10mm 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Sarabun', 'Prompt', sans-serif; font-size: 9.5pt; color: #0F172A; margin: 0; padding: 0; background: #F8FAFC; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-print { position: sticky; top: 0; background: #1E293B; color: white; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .print-page-wrapper { max-width: 195mm; width: 100%; margin: 12px auto; padding: 8mm 10mm; background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-radius: 4px; overflow-x: auto; box-sizing: border-box; }
    .header { text-align: center; margin-bottom: 10px; }
    .logo { width: 50px; height: 50px; object-fit: contain; margin: 0 auto 3px auto; display: block; }
    .title { font-size: 13pt; font-weight: bold; margin: 0; color: #1E293B; }
    .subtitle { font-size: 9.5pt; color: #334155; margin: 2px 0 0 0; }
    .summary-bar { display: flex; justify-content: space-between; background: #F8FAFC; border: 1px solid #CBD5E1; padding: 5px 10px; border-radius: 6px; margin: 8px 0; font-size: 9pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9pt; table-layout: auto; }
    th { background: #F1F5F9; border: 1px solid #94A3B8; padding: 5px 3px; text-align: center; font-weight: bold; font-size: 8.5pt; }
    td { border: 1px solid #CBD5E1; padding: 4px 4px; line-height: 1.3; font-size: 8.5pt; vertical-align: middle; }
    tr:nth-child(even) { background: #FAFAFA; }
    .signatures { margin-top: 24px; display: flex; justify-content: space-around; page-break-inside: avoid; gap: 16px; flex-wrap: nowrap; }
    .sig-box { text-align: center; min-width: 210px; max-width: 340px; flex: 1; font-size: 9pt; }
    .sig-stamp-zone { min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
    .sig-line { border-bottom: 1px dotted #64748B; width: 170px; margin: 0 auto 3px auto; }
    .sig-dots { font-size: 9pt; color: #334155; white-space: nowrap; }
    .sig-name, .sig-title, .sig-date { margin-top: 3px; color: #334155; font-size: 9pt; white-space: nowrap; }
    .footer { margin-top: 24px; padding-top: 6px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 8pt; color: #64748B; page-break-inside: avoid; clear: both; }
    @media print {
      .no-print { display: none !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; overflow: visible !important; }
      .print-page-wrapper { max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; overflow: visible !important; height: auto !important; }
      table { width: 100% !important; max-width: 100% !important; min-width: 0 !important; page-break-inside: auto !important; table-layout: auto !important; border-collapse: collapse !important; }
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      th, td { min-width: 0 !important; page-break-inside: avoid !important; break-inside: avoid !important; word-break: break-word !important; }
      thead { display: table-header-group !important; }
      .signatures { page-break-inside: avoid !important; break-inside: avoid !important; flex-wrap: nowrap !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="display:flex; align-items:center; gap:8px;">
      <strong style="font-size:13px;">ตัวอย่างก่อนพิมพ์: ${escapeHTML(docTitle)}</strong>
      <span style="font-size:11px; opacity:0.85; background:rgba(255,255,255,0.15); padding:2px 8px; border-radius:4px;">A4 แนวตั้ง</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button onclick="try{if(window.parent&&window.parent.triggerInAppPrint){window.parent.triggerInAppPrint();}else{window.print();}}catch(_){window.print();}" style="background:#4F46E5; color:white; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
        🖨 พิมพ์เอกสาร
      </button>
      <button onclick="window.close()" style="background:#475569; color:white; border:none; padding:7px 12px; border-radius:6px; cursor:pointer; font-size:12px;">
        ปิด
      </button>
    </div>
  </div>

  ${pagesHtml}

  <script>
    if (window.self === window.top) {
      window.addEventListener('load', function() {
        setTimeout(function() {
          try { window.focus(); window.print(); } catch(e){}
        }, 400);
      });
    }
  </script>
</body>
</html>`;

  if (typeof openHTMLDocument === 'function') {
    openHTMLDocument(html, docTitle);
  } else if (typeof window.openHTMLDocument === 'function') {
    window.openHTMLDocument(html, docTitle);
  } else {
    window.print();
  }
} catch (err) {
  console.error('Error in printDailyAttendanceRecord:', err);
  if (typeof showToast === 'function') {
    showToast('error', 'เกิดข้อผิดพลาดในการเปิดแบบพิมพ์: ' + (err.message || err));
  } else {
    alert('เกิดข้อผิดพลาดในการเปิดแบบพิมพ์: ' + (err.message || err));
  }
}
}
if (typeof window !== 'undefined') {
  window.printDailyAttendanceRecord = printDailyAttendanceRecord;
}

function printAttendanceReport() {
  const last = AttendanceState.reportLastData;
  if (!last || !last.res || !last.res.data) {
    return showToast('warning', 'กรุณากดดูรายงานก่อนพิมพ์');
  }

  const { res, scope, classroom, rptType } = last;
  const activeRoom = AttendanceState.tableClassroom || '';
  const printStudents = activeRoom
    ? res.data.filter(r => (r.classroom || '').trim() === activeRoom)
    : res.data;

  if (printStudents.length === 0) {
    return showToast('warning', 'ไม่พบข้อมูลนักเรียนสำหรับพิมพ์');
  }

  const now = new Date();
  const printTimestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543} เวลา ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;

  const mOpt = document.getElementById('rptMonth');
  const mLabel = mOpt?.options[mOpt.selectedIndex]?.text || '';
  const sem = res.semester || '1';
  const ay = res.academic_year || '2569';

  const schoolLogoUrl = (typeof window !== 'undefined' && window.OFFICIAL_SCHOOL_LOGO_DATA_URL)
    || (typeof APP !== 'undefined' && APP.dashboardData?.config?.school_logo) 
    || localStorage.getItem('cached_school_logo') 
    || 'school-logo.png';

  const targetSub = res.target_subject;
  const isSubjectMode = !!targetSub || (rptType !== 'homeroom' && rptType !== 'all_subjects');
  const isMatrixMode = (scope === 'monthly' && AttendanceState.reportView === 'matrix' && (rptType === 'homeroom' || isSubjectMode));
  const isAllSubjectsMode = (rptType === 'all_subjects');
  const isSemesterMode = (scope === 'semester' && res.months && res.months.length > 0 && !isSubjectMode && !isAllSubjectsMode);

  const rawPrintSubs = (res.subjects && res.subjects.length > 0)
    ? res.subjects
    : (AttendanceState.filterOptions?.subjects || []);
  const printSubjects = filterValidReportSubjects(rawPrintSubs);

  const isLandscape = (isMatrixMode || isSemesterMode || isAllSubjectsMode);

  let reportTitle = 'รายงานการเข้าเรียน';
  let subTitle = activeRoom
    ? ('ระดับชั้น ' + activeRoom + ` (${printStudents.length} คน)`)
    : (classroom && classroom !== 'all' ? ('ระดับชั้น ' + classroom + ` (${printStudents.length} คน)`) : `ทุกระดับชั้น (ภาพรวมทั้งโรงเรียน ${printStudents.length} คน)`);

  if (isSubjectMode) {
    const sName = targetSub ? ((targetSub.subject_code ? targetSub.subject_code + ' ' : '') + targetSub.subject_name) : ('รายวิชา ' + rptType);
    reportTitle = (isMatrixMode ? 'แบบบันทึกเวลาเรียนรายวิชาประจำวัน (ปพ.5) ' : 'รายงานเวลาเรียน ') + 'วิชา ' + sName;
    if (targetSub?.teacher_name) subTitle = 'ครูผู้สอน: ' + targetSub.teacher_name + ' | ' + subTitle;
    if (scope === 'monthly') reportTitle += ' ประจำเดือน ' + mLabel;
    else if (scope === 'semester') reportTitle += ' ภาคเรียนที่ ' + sem + '/' + ay;
  } else if (isAllSubjectsMode) {
    reportTitle = 'รายงานเวลาเรียนเปรียบเทียบทุกรายวิชา';
    if (scope === 'monthly') reportTitle += ' ประจำเดือน ' + mLabel;
    else if (scope === 'semester') reportTitle += ' ภาคเรียนที่ ' + sem + '/' + ay;
  } else {
    if (isMatrixMode) {
      reportTitle = 'แบบบันทึกเวลาเรียนและเช็คแถวรายวัน (ปพ.5) ประจำเดือน ' + mLabel;
    } else if (isSemesterMode) {
      reportTitle = 'แบบสรุปเวลาเรียนรายบุคคลแยกตามรายเดือนตลอดภาคเรียนที่ ' + sem + '/' + ay;
    } else if (scope === 'monthly') {
      reportTitle = 'รายงานสรุปการมาเรียนและเช็คแถวหน้าเสาธง ประจำเดือน ' + mLabel;
    } else {
      reportTitle = 'รายงานสรุปการมาเรียนและเช็คแถวหน้าเสาธง';
    }
  }

  // Determine distinct grade levels
  const GRADE_ORDER = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
  const uniqueGradeLevels = Array.from(new Set(printStudents.map(s => getGradeLevelFromClass(s.classroom)).filter(Boolean)));
  uniqueGradeLevels.sort((a, b) => {
    const ia = GRADE_ORDER.indexOf(a);
    const ib = GRADE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return String(a).localeCompare(String(b), 'th', { numeric: true });
  });

  const isMultiGrade = uniqueGradeLevels.length > 1;

  // Render each grade level section
  const gradeSectionsHtml = uniqueGradeLevels.map((gLevel, gIdx) => {
    const isLastGrade = (gIdx === uniqueGradeLevels.length - 1);
    const gStudents = printStudents
      .filter(s => getGradeLevelFromClass(s.classroom) === gLevel)
      .sort((a, b) => {
        const ca = String(a.classroom || '').localeCompare(String(b.classroom || ''), 'th', { numeric: true });
        if (ca !== 0) return ca;
        const na = Number(a.student_number || a.student_no || 0);
        const nb = Number(b.student_number || b.student_no || 0);
        if (na && nb) return na - nb;
        return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th');
      });

    if (gStudents.length === 0) return '';

    // Calculate Grade-level Attendance Average
    let gTotalAttendPct = 0;
    let gStudentsWithTotal = 0;
    gStudents.forEach(s => {
      if (s.total > 0) {
        gTotalAttendPct += (s.attendance_pct || 0);
        gStudentsWithTotal++;
      }
    });
    const gAvgPct = gStudentsWithTotal > 0 ? (gTotalAttendPct / gStudentsWithTotal) : (res.summary?.attendance_pct || 0);

    const gLevelName = getGradeLevelFullThai(gLevel);
    let gSubTitle = isMultiGrade
      ? `${gLevelName} (${gStudents.length} คน) | ภาคเรียนที่ ${sem}/${ay}`
      : (activeRoom ? ('ระดับชั้น ' + activeRoom + ` (${gStudents.length} คน)`) : `${gLevelName} (${gStudents.length} คน)`);

    if (isSubjectMode) {
      if (targetSub?.teacher_name) gSubTitle = 'ครูผู้สอน: ' + targetSub.teacher_name + ' | ' + gSubTitle;
    }

    let gTableHeaderHtml = '';
    let gTableBodyHtml = '';
    let gExtraLegendHtml = '';

    if (isMatrixMode) {
      // 1. Matrix View (Day 1 - 31)
      const ym = document.getElementById('rptMonth')?.value || res.start_date?.slice(0, 7) || new Date().toISOString().slice(0, 7);
      const parts = ym.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const daysInMonth = new Date(year, month, 0).getDate();

      const dayHeaders = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month - 1, d);
        const dayOfWeek = dt.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const thDay = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][dayOfWeek];
        dayHeaders.push({ day: d, isWeekend: isWeekend, thDay: thDay, ds: ym + '-' + String(d).padStart(2, '0') });
      }

      gTableHeaderHtml = `
        <tr>
          <th style="width:26px;">ที่</th>
          <th style="width:60px;">เลขประจำตัว</th>
          <th style="text-align:left; padding-left:5px; white-space:nowrap;">ชื่อ - นามสกุล</th>
          <th style="width:45px; text-align:center;">ห้อง</th>
          ${dayHeaders.map(h => `
            <th style="width:18px; padding:2px 0px; ${h.isWeekend ? 'background:#F1F5F9; color:#94A3B8;' : ''}">
              <div style="font-size:7pt; line-height:1;">${h.day}</div>
              <div style="font-size:6pt; font-weight:normal; opacity:0.8;">${h.thDay}</div>
            </th>
          `).join('')}
          <th style="width:28px; color:#15803D;">มา</th>
          <th style="width:28px; color:#B91C1C;">ขาด</th>
          <th style="width:28px; color:#B45309;">ลา</th>
          <th style="width:28px; color:#1D4ED8;">สาย</th>
          <th style="width:36px;">%</th>
        </tr>
      `;

      gTableBodyHtml = gStudents.map((r, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center; font-family:'Courier New', monospace; font-size:8pt; white-space:nowrap;">${escapeHTML(r.student_code || '-')}</td>
          <td style="text-align:left; font-weight:600; padding:2px 6px; white-space:nowrap; min-width:130px;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
          <td style="text-align:center; white-space:nowrap; font-size:8pt;">${escapeHTML(r.classroom || '-')}</td>
          ${dayHeaders.map(h => {
            const st = r.dates ? r.dates[h.ds] : null;
            if (h.isWeekend) return '<td style="background:#F8FAFC; text-align:center; color:#CBD5E1; font-size:7pt;">-</td>';
            if (!st) return '<td style="text-align:center; color:#E2E8F0; font-size:7pt;">·</td>';
            if (st === 'present') return '<td style="text-align:center; color:#15803D; font-weight:bold; font-size:8pt;">/</td>';
            if (st === 'absent') return '<td style="text-align:center; color:#B91C1C; font-weight:bold; font-size:8pt;">ข</td>';
            if (st === 'leave') return '<td style="text-align:center; color:#B45309; font-weight:bold; font-size:8pt;">ล</td>';
            if (st === 'late') return '<td style="text-align:center; color:#1D4ED8; font-weight:bold; font-size:8pt;">ส</td>';
            return '<td style="text-align:center; font-size:7pt;">-</td>';
          }).join('')}
          <td style="text-align:center; font-weight:bold; color:#15803D;">${r.present}</td>
          <td style="text-align:center; font-weight:bold; color:#B91C1C;">${r.absent}</td>
          <td style="text-align:center; font-weight:bold; color:#B45309;">${r.leave}</td>
          <td style="text-align:center; font-weight:bold; color:#1D4ED8;">${r.late}</td>
          <td style="text-align:center; font-weight:bold; ${r.total > 0 && r.attendance_pct < 80 ? 'color:#B91C1C;' : 'color:#15803D;'}">
            ${r.total === 0 ? '-' : r.attendance_pct.toFixed(0) + '%'}
          </td>
        </tr>
      `).join('');

      gExtraLegendHtml = `
        <div style="margin-top:6px; font-size:7.5pt; color:#64748B; display:flex; justify-content:space-between; align-items:center;">
          <div><b>สัญลักษณ์:</b> <span style="color:#15803D; font-weight:bold;">/</span> มาเรียน &nbsp;|&nbsp; <span style="color:#B91C1C; font-weight:bold;">ข</span> ขาดเรียน &nbsp;|&nbsp; <span style="color:#B45309; font-weight:bold;">ล</span> ลา &nbsp;|&nbsp; <span style="color:#1D4ED8; font-weight:bold;">ส</span> มาสาย &nbsp;|&nbsp; <span style="color:#94A3B8;">-</span> วันหยุด/ไม่มีข้อมูล</div>
          <div>* ข้อมูลตัดตามระดับชั้น: <b>${escapeHTML(gLevelName)}</b></div>
        </div>
      `;

    } else if (isSemesterMode) {
      // 2. Semester Monthly Breakdown
      gTableHeaderHtml = `
        <tr>
          <th style="width:28px; min-width:28px; text-align:center;">ที่</th>
          <th style="width:62px; min-width:60px; text-align:center;">รหัสนักเรียน</th>
          <th style="min-width:140px; text-align:left; padding-left:6px; white-space:nowrap;">ชื่อ - นามสกุล</th>
          <th style="width:48px; min-width:45px; text-align:center; white-space:nowrap;">ห้อง</th>
          ${res.months.map(m => `
            <th style="min-width:55px; text-align:center;">${escapeHTML(m.label)}</th>
          `).join('')}
          <th style="width:60px; text-align:center;">รวม (วัน)</th>
          <th style="width:70px; text-align:center;">% ตลอดเทอม</th>
          <th style="width:68px; text-align:center;">ผลประเมิน</th>
        </tr>
      `;

      gTableBodyHtml = gStudents.map((r, idx) => {
        const isRisk = (r.total > 0 && r.attendance_pct < 80);
        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center; font-family:'Courier New', monospace; font-size:8pt; white-space:nowrap;">${escapeHTML(r.student_code || '-')}</td>
            <td style="text-align:left; font-weight:600; padding:2px 6px; white-space:nowrap; min-width:140px;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
            <td style="text-align:center; white-space:nowrap; font-size:8pt;">${escapeHTML(r.classroom || '-')}</td>
            ${res.months.map(m => {
              const mData = r.by_month ? r.by_month[m.ym] : null;
              if (!mData || mData.total === 0) return '<td style="text-align:center; color:#94A3B8;">-</td>';
              const p = mData.attendance_pct || 0;
              return `<td style="text-align:center; font-weight:bold; ${p < 80 ? 'color:#B91C1C;' : 'color:#15803D;'}">${p.toFixed(0)}%</td>`;
            }).join('')}
            <td style="text-align:center; font-weight:bold;">${r.total}</td>
            <td style="text-align:center; font-weight:bold; ${isRisk ? 'color:#B91C1C;' : 'color:#15803D;'}">
              ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
            </td>
            <td style="text-align:center; font-weight:bold; ${r.total === 0 ? 'color:#64748B;' : (isRisk ? 'color:#B91C1C;' : 'color:#15803D;')}">
              ${r.total === 0 ? 'ยังไม่มีข้อมูล' : (isRisk ? 'เสี่ยง มส.' : 'ปกติ')}
            </td>
          </tr>
        `;
      }).join('');

      gExtraLegendHtml = `
        <div style="margin-top:6px; font-size:7.5pt; color:#64748B; display:flex; justify-content:space-between; align-items:center;">
          <div>* หน่วยนับ: จำนวนวันเรียนตลอดภาคเรียน | เกณฑ์ผ่านชั้นเรียน ≥ 80.0%</div>
          <div>ระดับชั้น: <b>${escapeHTML(gLevelName)}</b> (ปกติ ≥80% / เสี่ยง มส. <80%)</div>
        </div>
      `;

    } else if (isAllSubjectsMode) {
      // 3. All Subjects Matrix — Filter subjects specifically for THIS grade level!
      const gSubjects = printSubjects.filter(s => {
        // Direct grade_level check
        if (s.grade_level) {
          const sg = getGradeLevelFromClass(s.grade_level);
          if (sg === gLevel || s.grade_level.includes(gLevel)) return true;
        }
        // Check if any student in this grade level has records for this subject
        const hasData = gStudents.some(stu => {
          const subData = stu.by_subject ? stu.by_subject[s.id] : null;
          return subData && (subData.total > 0 || subData.periods_count > 0);
        });
        if (hasData) return true;

        // Subject code pattern match
        const c = (s.subject_code || s.code || '').trim();
        if (gLevel === 'ม.1' && /^[ก-ฮa-zA-Z]{1,2}21\d{3}/.test(c)) return true;
        if (gLevel === 'ม.2' && /^[ก-ฮa-zA-Z]{1,2}22\d{3}/.test(c)) return true;
        if (gLevel === 'ม.3' && /^[ก-ฮa-zA-Z]{1,2}23\d{3}/.test(c)) return true;
        if (gLevel === 'ม.4' && /^[ก-ฮa-zA-Z]{1,2}31\d{3}/.test(c)) return true;
        if (gLevel === 'ม.5' && /^[ก-ฮa-zA-Z]{1,2}32\d{3}/.test(c)) return true;
        if (gLevel === 'ม.6' && /^[ก-ฮa-zA-Z]{1,2}33\d{3}/.test(c)) return true;

        return false;
      });

      const activeGSubjects = (gSubjects.length > 0) ? gSubjects : printSubjects;

      gTableHeaderHtml = `
        <tr>
          <th style="width:28px; min-width:24px; text-align:center;">ที่</th>
          <th style="width:60px; min-width:52px; text-align:center;">รหัสนักเรียน</th>
          <th style="min-width:110px; text-align:left; padding-left:6px; white-space:nowrap;">ชื่อ - นามสกุล</th>
          <th style="width:45px; min-width:40px; text-align:center; white-space:nowrap;">ห้อง</th>
          ${activeGSubjects.map(s => {
            const clean = getCleanSubjectHeader(s);
            return `
            <th style="min-width:0; padding:2px 1px; text-align:center;" title="${escapeHTML(clean.name)} (${s.periods_count || 0} คาบ)">
              <div style="font-size:7.5pt; font-weight:bold; white-space:nowrap; line-height:1.1;">${escapeHTML(clean.code)}</div>
              <div style="font-size:6.5pt; font-weight:normal; color:#64748B;">${s.periods_count || 0} คาบ</div>
            </th>
            `;
          }).join('')}
          <th style="width:44px; min-width:40px; text-align:center; font-size:7.5pt; padding:2px 2px; white-space:nowrap;">% รวม</th>
          <th style="width:64px; min-width:60px; text-align:center; font-size:7.5pt; padding:2px 2px; white-space:nowrap;">ผลประเมิน</th>
        </tr>
      `;

      gTableBodyHtml = gStudents.map((r, idx) => {
        const bad = r.total > 0 && r.attendance_pct < 80;
        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center; font-family:'Courier New', monospace; font-size:8pt; white-space:nowrap;">${escapeHTML(r.student_code || '-')}</td>
            <td style="text-align:left; font-weight:600; padding:2px 6px; white-space:nowrap; min-width:135px;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
            <td style="text-align:center; white-space:nowrap; font-size:8pt;">${escapeHTML(r.classroom || '-')}</td>
            ${activeGSubjects.map(s => {
              const subData = r.by_subject ? r.by_subject[s.id] : null;
              if (!subData || subData.total === 0) return '<td style="text-align:center; color:#94A3B8; font-size:7.5pt;">-</td>';
              const p = subData.attendance_pct || 0;
              return `<td style="text-align:center; font-weight:bold; font-size:7.5pt; padding:2px 1px; ${p < 80 ? 'color:#B91C1C;' : 'color:#15803D;'}">${p.toFixed(0)}%</td>`;
            }).join('')}
            <td style="text-align:center; font-weight:bold; font-size:7.5pt; white-space:nowrap; ${bad ? 'color:#B91C1C;' : 'color:#15803D;'}">
              ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
            </td>
            <td style="text-align:center; font-weight:bold; font-size:7.5pt; white-space:nowrap; ${r.total === 0 ? 'color:#64748B;' : (bad ? 'color:#B91C1C;' : 'color:#15803D;')}">
              ${r.total === 0 ? 'ยังไม่มีข้อมูล' : (bad ? 'เสี่ยง มส.' : 'ปกติ')}
            </td>
          </tr>
        `;
      }).join('');

      const subLegend = activeGSubjects.map(s => {
        const clean = getCleanSubjectHeader(s);
        return `<span style="display:inline-block; margin-right:8px; white-space:nowrap;"><b>${escapeHTML(clean.code)}</b>: ${escapeHTML(clean.name)}</span>`;
      }).join(' ');

      gExtraLegendHtml = `
        <div style="margin-top:6px; font-size:7.5pt; color:#475569;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
            <div><b>เกณฑ์เวลาเรียน:</b> ตัวเลขในช่องรายวิชาคือร้อยละ (%) เวลาเรียนของนักเรียน | เกณฑ์ผ่านชั้นเรียน ≥ 80.0%</div>
            <div>สถานะ: ปกติ (≥80%) / <span style="color:#B91C1C; font-weight:bold;">เสี่ยง มส. (<80%)</span></div>
          </div>
          ${subLegend ? `<div style="font-size:7pt; color:#64748B; border-top:1px dashed #CBD5E1; padding-top:3px; line-height:1.3;"><b>รายวิชาประจำ${escapeHTML(gLevelName)}:</b> ${subLegend}</div>` : ''}
        </div>
      `;

    } else {
      // 4. Default Summary View
      const countUnit = isSubjectMode ? 'คาบ' : 'วัน';
      gTableHeaderHtml = `
        <tr>
          <th style="width:30px;">ที่</th>
          <th style="width:65px;">รหัสนักเรียน</th>
          <th style="min-width:145px; text-align:left; padding-left:8px; white-space:nowrap;">ชื่อ - นามสกุล</th>
          <th style="width:58px; text-align:center; white-space:nowrap;">ห้อง</th>
          <th style="width:38px; color:#15803D;">มา</th>
          <th style="width:38px; color:#B91C1C;">ขาด</th>
          <th style="width:38px; color:#B45309;">ลา</th>
          <th style="width:38px; color:#1D4ED8;">สาย</th>
          <th style="width:42px;">รวม</th>
          <th style="width:52px;">%</th>
          <th style="width:68px;">ผลประเมิน</th>
        </tr>
      `;

      gTableBodyHtml = gStudents.map((r, idx) => {
        const isRisk = (r.total > 0 && r.attendance_pct < 80);
        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:center; font-family:'Courier New', monospace; font-size:8.5pt;">${escapeHTML(r.student_code || '-')}</td>
            <td style="text-align:left; font-weight:600; padding:2px 8px; white-space:nowrap; min-width:145px;">${escapeHTML((r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''))}</td>
            <td style="text-align:center; white-space:nowrap; font-size:8.5pt;">${escapeHTML(r.classroom || '-')}</td>
            <td style="text-align:center; color:#15803D; font-weight:bold;">${r.present}</td>
            <td style="text-align:center; color:#B91C1C; font-weight:bold;">${r.absent}</td>
            <td style="text-align:center; color:#B45309; font-weight:bold;">${r.leave}</td>
            <td style="text-align:center; color:#1D4ED8; font-weight:bold;">${r.late}</td>
            <td style="text-align:center; font-weight:bold;">${r.total}</td>
            <td style="text-align:center; font-weight:bold; ${isRisk ? 'color:#B91C1C;' : 'color:#15803D;'}">
              ${r.total === 0 ? '-' : r.attendance_pct.toFixed(1) + '%'}
            </td>
            <td style="text-align:center; font-weight:bold; font-size:8.5pt; ${r.total === 0 ? 'color:#64748B;' : (isRisk ? 'color:#B91C1C;' : 'color:#15803D;')}">
              ${r.total === 0 ? 'ยังไม่มีข้อมูล' : (isRisk ? 'เสี่ยง มส.' : 'ปกติ')}
            </td>
          </tr>
        `;
      }).join('');

      gExtraLegendHtml = `
        <div style="margin-top:6px; font-size:8pt; color:#64748B; display:flex; justify-content:space-between; align-items:center;">
          <div>* หน่วยนับ: จำนวน${countUnit}เรียน | เกณฑ์ผ่านชั้นเรียน ≥ 80.0%</div>
          <div>ระดับชั้น: <b>${escapeHTML(gLevelName)}</b> (ปกติ ≥80% / เสี่ยง มส. <80%)</div>
        </div>
      `;
    }

    const autoMap = (typeof window !== 'undefined' && window._mhcClassroomTeachersMap) ? window._mhcClassroomTeachersMap : null;
    const gTeacherInfo = (activeRoom && autoMap && autoMap.byClassroom && autoMap.byClassroom[activeRoom]) ||
                         (autoMap && autoMap.byGrade && autoMap.byGrade[gLevel]) || null;
    const gTeacherName = (isSubjectMode && targetSub?.teacher_name)
      ? targetSub.teacher_name
      : (gTeacherInfo ? gTeacherInfo.name : '');
    const gTeacherSig = (isSubjectMode ? '' : (gTeacherInfo ? gTeacherInfo.signature : ''));

    const pageBreakStyle = (isMultiGrade && !isLastGrade) ? 'page-break-after: always; break-after: page;' : '';

    return `
      <div class="print-page-wrapper grade-level-section" data-grade-level="${escapeHTML(gLevel)}" ${activeRoom ? `data-classroom="${escapeHTML(activeRoom)}"` : ''} style="${pageBreakStyle}">
        <div class="header">
          <img src="${schoolLogoUrl}" class="logo" alt="ตราโรงเรียน" onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN';">
          <div class="title">${escapeHTML(reportTitle)}</div>
          <div class="subtitle">${escapeHTML(gSubTitle)}</div>
          <div style="font-size:8.5pt; color:#475569; margin-top:2px;">โรงเรียนมหาชัยพิทยาคาร สพม.มหาสารคาม</div>
        </div>

        <div class="summary-bar">
          <div><b>ระดับชั้น:</b> ${escapeHTML(gLevelName)}</div>
          <div><b>จำนวนนักเรียน:</b> ${gStudents.length} คน</div>
          <div><b>อัตราการเข้าเรียนเฉลี่ย:</b> ${gAvgPct.toFixed(1)}%</div>
          <div><b>สถานะ:</b> ${gAvgPct >= 80 ? 'ปกติ' : 'ต้องเฝ้าระวัง'}</div>
        </div>

        <table>
          <thead>
            ${gTableHeaderHtml}
          </thead>
          <tbody>
            ${gTableBodyHtml}
          </tbody>
        </table>

        ${gExtraLegendHtml}

        <div class="signatures">
          <div class="sig-box" data-sig-role="teacher" data-grade-level="${escapeHTML(gLevel)}" ${activeRoom ? `data-classroom="${escapeHTML(activeRoom)}"` : ''}>
            <div>&nbsp;</div>
            <div class="sig-stamp-zone">
              ${gTeacherSig ? `<img class="teacher-sig-img" src="${gTeacherSig}" alt="ลายเซ็น" style="max-height:44px; max-width:145px; object-fit:contain; pointer-events:none; display:inline-block;" />` : ''}
            </div>
            <div class="sig-line"></div>
            <div class="sig-dots" style="${gTeacherSig ? 'display:none;' : ''}">ลงชื่อ ........................................ ผู้รายงาน</div>
            <div class="sig-name">( ${escapeHTML(gTeacherName || '........................................')} )</div>
            <div class="sig-title">ตำแหน่ง ${isSubjectMode ? 'ครูผู้สอน' : (isMultiGrade ? 'หัวหน้าระดับชั้น ' + gLevel : 'ครูประจำชั้น ' + (activeRoom || gLevel))}</div>
            <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
          </div>
          <div class="sig-box" data-sig-role="director">
            <div>ทราบ / อนุมัติ</div>
            <div class="sig-stamp-zone"></div>
            <div class="sig-line"></div>
            <div class="sig-dots">ลงชื่อ ........................................</div>
            <div class="sig-name">( นายอธิการ สุขศรี )</div>
            <div class="sig-title">ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</div>
            <div class="sig-date">วันที่ ....... เดือน ....................... พ.ศ. ..........</div>
          </div>
        </div>

        <div class="footer">
          <span>ระบบ MHC Smart School | โรงเรียนมหาชัยพิทยาคาร | พัฒนาโดย ครูก้องนที อุ่นเจริญ</span>
          <span>พิมพ์เมื่อ: ${printTimestamp}</span>
        </div>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(reportTitle)}</title>
  <style>
    @page {
      size: A4 ${isLandscape ? 'landscape' : 'portrait'};
      margin: ${isLandscape ? '5mm 6mm 6mm 6mm' : '8mm 7mm 10mm 7mm'};
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: 'Sarabun', 'Prompt', sans-serif;
      font-size: ${isMatrixMode ? '8pt' : '9pt'};
      color: #0F172A;
      margin: 0;
      padding: 0;
      background: #F8FAFC;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .no-print { position: sticky; top: 0; background: #1E293B; color: white; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    .print-page-wrapper {
      max-width: ${isLandscape ? '285mm' : '196mm'};
      width: 100%;
      margin: 15px auto;
      padding: 8mm 10mm;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
      border-radius: 4px;
      overflow-x: auto;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .logo { width: 48px; height: 48px; object-fit: contain; margin: 0 auto 3px auto; display: block; }
    .title { font-size: ${isMatrixMode ? '12pt' : '13pt'}; font-weight: bold; margin: 0; color: #1E293B; }
    .subtitle { font-size: 9pt; color: #334155; margin: 2px 0 0 0; }
    .summary-bar { display: flex; justify-content: space-between; background: #F8FAFC; border: 1px solid #CBD5E1; padding: 4px 8px; border-radius: 4px; margin: 6px 0; font-size: 8.5pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: ${isMatrixMode || isAllSubjectsMode ? '7.5pt' : '8.5pt'}; table-layout: auto; }
    th { background: #F1F5F9; border: 1px solid #94A3B8; padding: ${isMatrixMode || isAllSubjectsMode ? '2px 1px' : '3px 2px'}; text-align: center; font-weight: bold; }
    td { border: 1px solid #CBD5E1; padding: ${isMatrixMode || isAllSubjectsMode ? '2px 1px' : '2.5px 3px'}; line-height: 1.25; }
    tr:nth-child(even) { background: #FAFAFA; }
    .signatures { margin-top: 20px; display: flex; justify-content: space-around; page-break-inside: avoid; gap: 16px; flex-wrap: nowrap; }
    .sig-box { text-align: center; min-width: 210px; max-width: 340px; flex: 1; font-size: 9pt; }
    .sig-stamp-zone { min-height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
    .sig-line { border-bottom: 1px dotted #64748B; width: 170px; margin: 0 auto 3px auto; }
    .sig-dots { font-size: 9pt; color: #334155; white-space: nowrap; }
    .sig-name, .sig-title, .sig-date { margin-top: 3px; color: #334155; font-size: 9pt; white-space: nowrap; }
    .footer { margin-top: 18px; padding-top: 6px; border-top: 1px solid #CBD5E1; display: flex; justify-content: space-between; font-size: 7.5pt; color: #64748B; page-break-inside: avoid; clear: both; }
    @media print {
      .no-print { display: none !important; }
      html, body { margin: 0 !important; padding: 0 !important; background: #FFFFFF !important; overflow: visible !important; }
      .print-page-wrapper { max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; overflow: visible !important; height: auto !important; }
      .print-page-wrapper.grade-level-section { page-break-after: always !important; break-after: page !important; }
      .print-page-wrapper.grade-level-section:last-child { page-break-after: auto !important; break-after: auto !important; }
      table { width: 100% !important; max-width: 100% !important; min-width: 0 !important; page-break-inside: auto !important; table-layout: auto !important; border-collapse: collapse !important; }
      tr { page-break-inside: avoid !important; break-inside: avoid !important; }
      th, td { min-width: 0 !important; page-break-inside: avoid !important; break-inside: avoid !important; word-break: break-word !important; }
      thead { display: table-header-group !important; }
      tfoot { display: table-footer-group !important; }
      .signatures { page-break-inside: avoid !important; break-inside: avoid !important; flex-wrap: nowrap !important; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div style="display:flex; align-items:center; gap:8px;">
      <strong style="font-size:13px;">ตัวอย่างก่อนพิมพ์: ${escapeHTML(reportTitle)}</strong>
      <span style="font-size:11px; opacity:0.85; background:rgba(255,255,255,0.15); padding:2px 8px; border-radius:4px;">
        A4 ${isLandscape ? 'แนวนอน (Landscape)' : 'แนวตั้ง (Portrait)'}
      </span>
    </div>
    <div style="display:flex; gap:8px;">
      <button onclick="try{if(window.parent&&window.parent.triggerInAppPrint){window.parent.triggerInAppPrint();}else{window.print();}}catch(_){window.print();}" style="background:#4F46E5; color:white; border:none; padding:7px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
        🖨 พิมพ์เอกสาร
      </button>
      <button onclick="window.close()" style="background:#475569; color:white; border:none; padding:7px 12px; border-radius:6px; cursor:pointer; font-size:12px;">
        ปิด
      </button>
    </div>
  </div>

  ${gradeSectionsHtml}

  <script>
    if (window.self === window.top) {
      window.addEventListener('load', function() {
        setTimeout(function() {
          try { window.focus(); window.print(); } catch(e){}
        }, 400);
      });
    }
  </script>
</body>
</html>`;

  if (typeof openHTMLDocument === 'function') {
    openHTMLDocument(html, reportTitle);
  } else {
    window.print();
  }
}

function exportReportCSV() {
  const last = AttendanceState.reportLastData;
  if (!last || !last.res || !last.res.data) {
    return showToast('warning', 'ไม่มีข้อมูลให้ดาวน์โหลด');
  }

  const { res, scope, classroom } = last;
  const activeRoom = AttendanceState.tableClassroom || '';
  const exportStudents = activeRoom
    ? res.data.filter(r => (r.classroom || '').trim() === activeRoom)
    : res.data;

  if (exportStudents.length === 0) {
    return showToast('warning', 'ไม่มีข้อมูลนักเรียนสำหรับดาวน์โหลด');
  }

  const mOpt = document.getElementById('rptMonth');
  const mLabel = mOpt?.options[mOpt.selectedIndex]?.text || '';
  const sem = res.semester || '1';
  const ay = res.academic_year || '2569';
  const roomTag = activeRoom ? ('_' + activeRoom) : (classroom ? ('_' + classroom) : '_ภาพรวม');

  let headers = [];
  let rows = [];
  let filename = '';

  if (scope === 'monthly' && AttendanceState.reportView === 'matrix') {
    const ym = document.getElementById('rptMonth')?.value || res.start_date?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    const parts = ym.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayCols = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dayCols.push({ day: d, ds: ym + '-' + String(d).padStart(2, '0') });
    }

    headers = [
      'ที่', 'รหัสนักเรียน', 'ชื่อ - สกุล', 'ชั้น',
      ...dayCols.map(d => String(d.day)),
      'มา (วัน)', 'ขาด (วัน)', 'ลา (วัน)', 'สาย (วัน)', 'รวมวันเรียน', '% มาเรียน'
    ];

    rows = exportStudents.map((r, i) => [
      i + 1,
      r.student_code || '',
      (r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''),
      r.classroom || '',
      ...dayCols.map(d => {
        const st = r.dates ? r.dates[d.ds] : '';
        if (st === 'present') return '/';
        if (st === 'absent') return 'ข';
        if (st === 'leave') return 'ล';
        if (st === 'late') return 'ส';
        return '-';
      }),
      r.present || 0,
      r.absent || 0,
      r.leave || 0,
      r.late || 0,
      r.total || 0,
      r.total === 0 ? '-' : ((r.attendance_pct || 0).toFixed(1) + '%')
    ]);

    filename = `รายงานเช็คแถวรายวันปพ5_${mLabel}${roomTag}.xls`;
  } else if (rptType === 'all_subjects') {
    const rawExportSubs = (res.subjects && res.subjects.length > 0)
      ? res.subjects
      : (AttendanceState.filterOptions?.subjects || []);
    const exportSubs = filterValidReportSubjects(rawExportSubs);
    headers = [
      'ที่', 'รหัสนักเรียน', 'ชื่อ - สกุล', 'ชั้น',
      ...exportSubs.map(s => {
        const clean = getCleanSubjectHeader(s);
        return clean.code !== clean.name ? `${clean.code} ${clean.name}` : clean.code;
      }),
      '% รวมทุกวิชา', 'การประเมิน'
    ];
    rows = exportStudents.map((r, i) => [
      i + 1,
      r.student_code || '',
      (r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''),
      r.classroom || '',
      ...exportSubs.map(s => {
        const subData = r.by_subject ? r.by_subject[s.id] : null;
        return subData && subData.total > 0 ? (subData.attendance_pct.toFixed(0) + '%') : '-';
      }),
      r.total === 0 ? '-' : (r.attendance_pct.toFixed(1) + '%'),
      r.total === 0 ? 'ยังไม่มีข้อมูล' : (r.attendance_pct < 80 ? 'เสี่ยง มส.' : 'ปกติ')
    ]);
    filename = `รายงานเวลาเรียนทุกรายวิชา_${sem}_${ay}${roomTag}.xls`;
  } else if (scope === 'semester' && res.months && res.months.length > 0) {
    headers = [
      'ที่', 'รหัสนักเรียน', 'ชื่อ - สกุล', 'ชั้น',
      ...res.months.map(m => m.label),
      'รวมทั้งเทอม (วัน)', '% ตลอดเทอม', 'การประเมิน'
    ];

    rows = exportStudents.map((r, i) => [
      i + 1,
      r.student_code || '',
      (r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''),
      r.classroom || '',
      ...res.months.map(m => {
        const bm = r.by_month ? r.by_month[m.ym] : null;
        return bm && bm.total > 0 ? (bm.attendance_pct.toFixed(1) + '%') : '-';
      }),
      r.total || 0,
      r.total === 0 ? '-' : ((r.attendance_pct || 0).toFixed(1) + '%'),
      r.total === 0 ? 'ยังไม่มีข้อมูล' : (r.attendance_pct < 80 ? 'เสี่ยง มส.' : 'ปกติ')
    ]);

    filename = `รายงานเช็คแถวตลอดภาคเรียน_${sem}_${ay}${roomTag}.xls`;
  } else {
    headers = ['ที่', 'รหัสนักเรียน', 'ชื่อ - สกุล', 'ชั้น', 'มา (วัน)', 'ขาด (วัน)', 'ลา (วัน)', 'สาย (วัน)', 'รวมวันเรียน', '% เข้าเรียน', 'สถานะ'];
    rows = exportStudents.map((r, i) => [
      i + 1,
      r.student_code || '',
      (r.prefix || '') + (r.first_name || '') + ' ' + (r.last_name || ''),
      r.classroom || '',
      r.present || 0,
      r.absent || 0,
      r.leave || 0,
      r.late || 0,
      r.total || 0,
      r.total === 0 ? '-' : ((r.attendance_pct || 0).toFixed(1) + '%'),
      r.total === 0 ? 'ยังไม่มีข้อมูล' : (r.attendance_pct < 80 ? 'เสี่ยง มส.' : 'ปกติ')
    ]);
    filename = `รายงานการเข้าเรียน${roomTag}_${new Date().toISOString().slice(0, 10)}.xls`;
  }

  exportToExcel(headers, rows, filename);
  showToast('success', 'ดาวน์โหลดรายงานสำเร็จ');
}
/* ============================================================
 *  IMPORT CSV — Students & Personnel
 * ============================================================ */

function parseCSV(text, delimiter) {
  if (!text) return [];
  if (!delimiter) {
    const firstLine = text.split(/[\r\n]+/)[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount  = (firstLine.match(/;/g) || []).length;
    const tabCount   = (firstLine.match(/\t/g) || []).length;
    if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';
    else delimiter = ',';
  }
  const rows = [];
  let insideQuotes = false;
  let currentCell = '';
  let currentRow = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (insideQuotes) {
      if (ch === '"') {
        if (next === '"') { currentCell += '"'; i++; }
        else { insideQuotes = false; }
      } else { currentCell += ch; }
    } else {
      if (ch === '"') { insideQuotes = true; }
      else if (ch === delimiter) { currentRow.push(currentCell.trim()); currentCell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (currentRow.length || currentCell) { currentRow.push(currentCell.trim()); rows.push(currentRow); }
        currentRow = []; currentCell = '';
        if (ch === '\r' && next === '\n') i++;
      } else { currentCell += ch; }
    }
  }
  if (currentRow.length || currentCell) { currentRow.push(currentCell.trim()); rows.push(currentRow); }
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}

function downloadSampleCSV(type) {
  let content = '';
  if (type === 'students') {
    content = '\uFEFFเลขที่,เลขประจำตัว,คำนำหน้า,ชื่อ,นามสกุล,ชั้น,ปีการศึกษา,เพศ,เลขบัตรประชาชน,ผู้ปกครอง,เบอร์โทรศัพท์\n' +
      '1,25680001,เด็กชาย,สมชาย,ใจดี,ม.1/1,2568,ชาย,1234567890123,สมหมาย ใจดี,0812345678\n' +
      '2,25680002,เด็กหญิง,สมหญิง,รักเรียน,ม.1/1,2568,หญิง,1234567890124,สมหญิง รักเรียน,0898765432\n';
  } else if (type === 'subjects') {
    content = '\uFEFFsubject_code,subject_name,subject_group,subject_type,credit,hours_per_week,grade_level,semester,academic_year,teacher_name\n' +
      'ว21101,วิทยาศาสตร์พื้นฐาน,วิทยาศาสตร์,basic,1.5,3,ม.1,1,2568,นายมั่นคง หัตถสินธ์\n' +
      'อ21201,ภาษาอังกฤษเพิ่มเติม,ภาษาต่างประเทศ,additional,1.0,2,ม.1,1,2568,นางรตินันท์ รังเสนา\n';
  } else {
    content = '\uFEFFprefix,first_name,last_name,national_id,gender,birth_date,position,department,type,academic_level,start_date,phone,email,address,status\n' +
      'นาย,สมศักดิ์,คุณครู,1234567890125,male,1985-03-10,ครูชำนาญการ,คณิตศาสตร์,teacher,ชำนาญการ,2020-05-01,0811111111,somsak@school.ac.th,789 หมู่ 1 ต.ตัวอย่าง,active\n' +
      'นางสาว,สมใจ,ใจดี,1234567890126,female,1990-07-15,ครู,ภาษาไทย,teacher,,2021-06-01,0822222222,somjai@school.ac.th,789 หมู่ 1 ต.ตัวอย่าง,active\n';
  }
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  let filename = 'ตัวอย่าง_บุคลากร.csv';
  if (type === 'students') filename = 'ตัวอย่าง_นักเรียน.csv';
  else if (type === 'subjects') filename = 'ตัวอย่าง_รายวิชา.csv';
  a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let _csvImportRecords = [];

function cleanThaiStudentNameClient(rawPrefix, rawFirst, rawLast, rawFull) {
  let p = (rawPrefix || '').trim();
  let f = (rawFirst || '').trim();
  let l = (rawLast || '').trim();
  const full = (rawFull || '').trim();

  if (!f && full) {
    const parts = full.replace(/\s+/g, ' ').trim().split(' ');
    if (parts.length >= 2) {
      f = parts[0];
      l = parts.slice(1).join(' ');
    } else {
      f = full;
      l = '-';
    }
  }

  const knownPrefixes = [
    { prefix: 'เด็กชาย', patterns: ['เด็กชาย', 'ด.ช.', 'ด.ช. '] },
    { prefix: 'เด็กหญิง', patterns: ['เด็กหญิง', 'ด.ญ.', 'ด.ญ. '] },
    { prefix: 'นาย',     patterns: ['นาย'] },
    { prefix: 'นางสาว',  patterns: ['นางสาว', 'น.ส.', 'น.ส. '] },
    { prefix: 'นาง',     patterns: ['นาง'] }
  ];

  if (p) {
    for (const kp of knownPrefixes) {
      if (kp.patterns.some(pat => p === pat || p.startsWith(pat))) {
        p = kp.prefix;
        break;
      }
    }
  }

  for (const kp of knownPrefixes) {
    for (const pat of kp.patterns) {
      if (f.startsWith(pat)) {
        f = f.substring(pat.length).trim();
        if (!p) p = kp.prefix;
        break;
      }
    }
  }

  while (p && f.startsWith(p)) {
    f = f.substring(p.length).trim();
  }

  for (const kp of knownPrefixes) {
    for (const pat of kp.patterns) {
      while (f.startsWith(pat)) {
        f = f.substring(pat.length).trim();
      }
    }
  }

  return { prefix: p, first_name: f, last_name: l };
}

function extractStudentFromCSVRow(headers, row, defaultClassroom, defaultYear) {
  const raw = {};
  headers.forEach((h, i) => {
    const rawHeader = String(h || '').trim();
    const cleanKey = rawHeader.toLowerCase().replace(/^\uFEFF/, '').replace(/[\s_\-]+/g, '');
    raw[cleanKey] = String(row[i] || '').trim();
    raw[rawHeader] = String(row[i] || '').trim();
  });

  const getVal = (...keys) => {
    for (const k of keys) {
      const cleanKey = k.toLowerCase().replace(/[\s_\-]+/g, '');
      if (raw[cleanKey] !== undefined && raw[cleanKey] !== '') return raw[cleanKey];
      if (raw[k] !== undefined && raw[k] !== '') return raw[k];
    }
    return '';
  };

  const rawPrefix   = getVal('prefix', 'คำนำหน้า', 'คำนำหน้านาม', 'คำนำหน้าชื่อ', 'title');
  const rawFirst    = getVal('first_name', 'firstname', 'first', 'ชื่อ', 'ชื่อจริง');
  const rawLast     = getVal('last_name', 'lastname', 'last', 'นามสกุล');
  const rawFull     = getVal('full_name', 'fullname', 'name', 'ชื่อ-นามสกุล', 'ชื่อ - นามสกุล', 'ชื่อ นามสกุล', 'ชื่อและนามสกุล');
  let studentId     = getVal(
    'student_id', 'studentid', 'std_id', 'st_id', 'sgs_id', 'id',
    'เลขประจำตัว', 'เลขประจำตัวนักเรียน', 'รหัสนักเรียน', 'รหัสประจำตัว',
    'รหัสประจำตัวนักเรียน', 'เลขประจำตัวผู้เรียน', 'รหัสผู้เรียน', 'เลขนักเรียน', 'รหัส'
  );
  if (!studentId) {
    for (const key of Object.keys(raw)) {
      const lk = key.toLowerCase();
      if ((lk.includes('เลขประจำตัว') || lk.includes('รหัสนักเรียน') || lk.includes('studentid') || lk.includes('sgs')) &&
          !lk.includes('ประชาชน') && !lk.includes('national') && !lk.includes('citizen') && !lk.includes('card')) {
        if (raw[key]) {
          studentId = raw[key];
          break;
        }
      }
    }
  }

  const nationalId  = getVal(
    'national_id', 'nationalid', 'citizen_id', 'citizenid', 'id_card',
    'เลขประจำตัวประชาชน', 'เลขบัตรประชาชน', 'เลขบัตร', 'บัตรประชาชน', 'เลขประชาชน'
  );

  const rawStudentNumber = getVal(
    'student_number', 'studentno', 'student_no', 'std_no', 'seat_number',
    'seatno', 'seat_no', 'เลขที่', 'ลำดับที่', 'ลำดับ', 'no', 'number'
  );
  let studentNumber = null;
  if (rawStudentNumber) {
    const sn = parseInt(rawStudentNumber, 10);
    if (!isNaN(sn) && sn > 0) studentNumber = sn;
  }

  let classroom     = getVal('classroom', 'room', 'class', 'grade', 'ชั้น', 'ห้อง', 'ระดับชั้น', 'ชั้นเรียน', 'ชั้น/ห้อง');
  let academicYear  = getVal('academic_year', 'academicyear', 'year', 'ปีการศึกษา', 'ปี');
  const rawGender   = getVal('gender', 'sex', 'เพศ');
  const birthDate   = getVal('birth_date', 'birthdate', 'dob', 'birthday', 'วันเกิด', 'วัน/เดือน/ปีเกิด');
  const bloodType   = getVal('blood_type', 'bloodtype', 'blood', 'หมู่เลือด', 'กรุ๊ปเลือด');
  const parentName  = getVal('parent_name', 'parentname', 'parent', 'ผู้ปกครอง', 'ชื่อผู้ปกครอง');
  const parentPhone = getVal('parent_phone', 'parentphone', 'phone', 'เบอร์ผู้ปกครอง', 'เบอร์โทร', 'เบอร์โทรศัพท์');
  const parentRel   = getVal('parent_relation', 'parentrelation', 'relation', 'ความสัมพันธ์');
  const address     = getVal('address', 'ที่อยู่');
  const status      = getVal('status', 'สถานะ') || 'active';

  if (!classroom && defaultClassroom) classroom = defaultClassroom;
  if (!academicYear && defaultYear) academicYear = defaultYear;

  const nameObj = cleanThaiStudentNameClient(rawPrefix, rawFirst, rawLast, rawFull);

  let gender = rawGender.toLowerCase().trim();
  if (gender === 'ชาย' || gender === 'm' || gender === 'male') gender = 'male';
  else if (gender === 'หญิง' || gender === 'f' || gender === 'female') gender = 'female';
  else if (!gender) {
    if (nameObj.prefix === 'เด็กชาย' || nameObj.prefix === 'นาย') gender = 'male';
    else if (nameObj.prefix === 'เด็กหญิง' || nameObj.prefix === 'นางสาว' || nameObj.prefix === 'นาง') gender = 'female';
  }

  return {
    student_id    : studentId,
    student_number: studentNumber,
    prefix        : nameObj.prefix,
    first_name   : nameObj.first_name,
    last_name    : nameObj.last_name,
    national_id  : nationalId,
    gender       : gender,
    birth_date   : birthDate,
    blood_type   : bloodType,
    classroom    : classroom,
    academic_year: academicYear,
    nationality  : getVal('nationality', 'สัญชาติ') || 'ไทย',
    religion     : getVal('religion', 'ศาสนา') || 'พุทธ',
    parent_name  : parentName,
    parent_phone : parentPhone,
    parent_relation: parentRel,
    address      : address,
    status       : status
  };
}

function showImportStudentsCSV() {
  _csvImportRecords = [];
  const currentYear = APP.dashboardData?.config?.academic_year || String(new Date().getFullYear() + 543);
  const rooms = (StudentsState.data && StudentsState.data.distinct && StudentsState.data.distinct.classrooms) || [];
  const roomOptions = rooms.map(r => `<option value="${escapeHTML(r)}">ชั้น ${escapeHTML(r)}\x3c/option>`).join('');

  Swal.fire({
    title: 'นำเข้าข้อมูลนักเรียนจาก CSV / Excel',
    width: 680,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-upload">\x3c/i> ตรวจสอบและนำเข้า',
    cancelButtonText: 'ยกเลิก',
    showCloseButton: true,
    html: `
      <div style="text-align:left; font-size:14px;">
        <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg mb-3 text-xs text-blue-900 leading-relaxed">
          <i class='bx bx-info-circle text-sm text-blue-600 font-bold'></i>
          <strong>รองรับไฟล์จากระบบ SGS และไฟล์รายชื่อนักเรียน:</strong><br>
          • <code>เลขประจำตัว</code> / <code>เลขประจำตัวนักเรียน</code> (ใช้รหัส SGS หรือหากไม่มีในไฟล์ ระบบจะสร้างให้อัตโนมัติ)<br>
          • <code>เลขที่</code>, <code>คำนำหน้า</code>, <code>ชื่อ</code>, <code>นามสกุล</code> (หรือ <code>ชื่อ-นามสกุล</code>), <code>ชั้น</code>, <code>เพศ</code>, <code>ปีการศึกษา</code>, <code>เลขบัตรประชาชน</code><br>
          <em>*ระบบจะตัดคำนำหน้าที่ซ้ำ และสามารถแก้ไขเลขประจำตัวนักเรียนได้ทุกเมื่อ</em>
        </div>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label class="form-label text-xs font-semibold text-slate-700">กำหนดชั้นเรียน (กรณีในไฟล์ไม่มีระบุ)\x3c/label>
            <select id="csv_default_classroom" class="form-input text-xs" onchange="if(window._lastCsvFile) previewStudentsCSV(document.getElementById('csvFileInput'))">
              <option value="">-- อิงตามไฟล์ CSV --\x3c/option>
              ${roomOptions}
            \x3c/select>
          \x3c/div>
          <div>
            <label class="form-label text-xs font-semibold text-slate-700">ปีการศึกษา (กรณีในไฟล์ไม่มีระบุ)\x3c/label>
            <input type="text" id="csv_default_year" class="form-input text-xs" value="${escapeHTML(currentYear)}" placeholder="เช่น 2568" oninput="if(window._lastCsvFile) previewStudentsCSV(document.getElementById('csvFileInput'))">
          \x3c/div>
        \x3c/div>

        <div class="mb-3">
          <label class="form-label text-xs font-semibold text-slate-700">เลือกไฟล์ CSV (UTF-8)\x3c/label>
          <input type="file" id="csvFileInput" accept=".csv,text/csv,text/plain" class="form-input text-xs"
                 onchange="previewStudentsCSV(this)">
        \x3c/div>

        <div class="flex gap-2 mb-3">
          <button type="button" class="btn btn-outline btn-sm text-xs" style="flex:1;" onclick="downloadSampleCSV('students')">
            <i class='bx bx-download'>\x3c/i> ดาวน์โหลดไฟล์ตัวอย่าง (CSV)
          </button>
        \x3c/div>

        <div id="csvPreviewBox" style="display:none; margin-top:10px;">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-semibold text-slate-700">ตัวอย่างข้อมูลหลังตรวจจับ\x3c/span>
            <span id="csvPreviewCount" class="text-xs text-blue-600 font-bold">\x3c/span>
          \x3c/div>
          <div style="max-height:240px; overflow:auto; border:1px solid #E2E8F0; border-radius:8px;">
            <table class="w-full text-xs" style="border-collapse:collapse;">
              <thead style="position:sticky; top:0; background:#F8FAFC;">
                <tr>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">#\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">รหัส\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ชื่อ-นามสกุล\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ชั้น\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">เพศ\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ปี\x3c/th>
                \x3c/tr>
              \x3c/thead>
              <tbody id="csvPreviewBody">\x3c/tbody>
            \x3c/table>
          \x3c/div>
        \x3c/div>
      \x3c/div>
    `,
    preConfirm: () => {
      if (!_csvImportRecords.length) { Swal.showValidationMessage('กรุณาเลือกไฟล์ CSV ที่มีข้อมูล'); return false; }
      return _csvImportRecords;
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    confirmImportStudentsCSV(r.value);
  });
}

function previewStudentsCSV(input) {
  const file = input && input.files ? input.files[0] : window._lastCsvFile;
  if (!file) return;
  window._lastCsvFile = file;

  const box = document.getElementById('csvPreviewBox');
  const body = document.getElementById('csvPreviewBody');
  const count = document.getElementById('csvPreviewCount');
  if (!body) return;

  const defClass = (document.getElementById('csv_default_classroom')?.value || '').trim();
  const defYear  = (document.getElementById('csv_default_year')?.value || '').trim();

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const rows = parseCSV(e.target.result);
      if (rows.length < 2) {
        body.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-3">ไม่พบข้อมูลในไฟล์\x3c/td>\x3c/tr>';
        box.style.display='block';
        return;
      }
      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);

      const seenInBatch = new Set();
      const records = [];

      dataRows.forEach(row => {
        const rec = extractStudentFromCSVRow(headers, row, defClass, defYear);
        if (rec.first_name && rec.last_name) {
          // Deduplicate in batch
          const key = (rec.student_id ? 'id:' + rec.student_id : '') + '_' + rec.first_name + '_' + rec.last_name;
          if (!seenInBatch.has(key)) {
            seenInBatch.add(key);
            records.push(rec);
          }
        }
      });

      _csvImportRecords = records;
      count.textContent = `พบ ${records.length} รายการ (ไม่ซ้ำ)`;
      const show = records.slice(0, 20);
      body.innerHTML = show.map((r, i) => {
        const genderText = r.gender === 'male' ? 'ชาย' : r.gender === 'female' ? 'หญิง' : '-';
        const fullName = (r.prefix ? r.prefix : '') + r.first_name + ' ' + r.last_name;
        return `<tr>
          <td class="px-2 py-1.5 border-b">${r.student_number ? `<span class="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded text-xs font-bold mr-1">เลขที่ ${r.student_number}</span>` : `${i+1}`}\x3c/td>
          <td class="px-2 py-1.5 border-b font-mono">${escapeHTML(r.student_id || '(สร้างอัตโนมัติ)')}</td>
          <td class="px-2 py-1.5 border-b font-medium text-slate-800">${escapeHTML(fullName)}\x3c/td>
          <td class="px-2 py-1.5 border-b">${escapeHTML(r.classroom || '-')}\x3c/td>
          <td class="px-2 py-1.5 border-b">${escapeHTML(genderText)}\x3c/td>
          <td class="px-2 py-1.5 border-b">${escapeHTML(r.academic_year || '-')}\x3c/td>
        \x3c/tr>`;
      }).join('') + (records.length > 20 ? `<tr><td colspan="6" class="text-center text-slate-400 py-2">... และอีก ${records.length-20} รายการ\x3c/td>\x3c/tr>` : '');

      if (!records.length) {
        body.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 py-3">ไม่พบข้อมูลที่ใช้ได้ (ต้องมีชื่อและนามสกุล)\x3c/td>\x3c/tr>';
      }
      box.style.display = 'block';
    } catch (err) {
      console.error('Error in previewStudentsCSV:', err);
      body.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 py-3">เกิดข้อผิดพลาดในการอ่านไฟล์: ${escapeHTML(err.message || err)}\x3c/td>\x3c/tr>`;
      box.style.display = 'block';
    }
  };
  reader.readAsText(file);
}

function confirmImportStudentsCSV(records) {
  Swal.fire({
    icon: 'question',
    title: 'ยืนยันการนำเข้า',
    text: `นำเข้านักเรียน ${records.length} รายการ? (ระบบจะรวมและไม่สร้างข้อมูลซ้ำ)`,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-check">\x3c/i> ใช่ นำเข้าเลย',
    cancelButtonText: 'ยกเลิก'
  }).then(c => {
    if (!c.isConfirmed) return;
    showLoading('กำลังนำเข้าและประมวลผลข้อมูล...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res && res.status === 'success') {
          Swal.fire({ icon:'success', title:'สำเร็จ', text: res.message });
          loadStudents();
        } else {
          Swal.fire({ icon:'error', title:'ผิดพลาด', text: (res && res.message) || 'เกิดข้อผิดพลาดในการนำเข้า' });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message || err }); })
      .importStudentsCSV(records, APP.token);
  });
}

function cleanStudentDataConfirm() {
  Swal.fire({
    title: 'จัดการชื่อและลบข้อมูลซ้ำ?',
    text: 'ระบบจะตรวจสอบและลบแถวนักเรียนที่ซ้ำกัน และแก้ไขคำนำหน้าที่ซ้ำซ้อน (เช่น เด็กชายเด็กชาย) ให้ถูกต้องโดยอัตโนมัติ',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-check">\x3c/i> ดำเนินการทันที',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#2563EB'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังทำความสะอาดและตรวจสอบข้อมูลนักเรียน...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res && res.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'ทำความสะอาดเรียบร้อย',
            text: res.message || 'แก้ไขข้อมูลนักเรียนสำเร็จแล้ว'
          });
          loadStudents();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: (res && res.message) || 'ไม่สามารถประมวลผลได้'
          });
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        Swal.fire({ icon: 'error', text: err.message || err });
      })
      .cleanStudentsData(APP.token);
  });
}

function showImportPersonnelCSV() {
  _csvImportRecords = [];
  Swal.fire({
    title: 'นำเข้าข้อมูลบุคลากรจาก CSV',
    width: 640,
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
          prefix,first_name,last_name,national_id,gender,birth_date,position,department,type,academic_level,start_date,phone,email,address,status
        \x3c/code>
        <div class="flex gap-2 mt-2">
          <button type="button" class="btn btn-outline" style="flex:1;" onclick="downloadSampleCSV('personnel')">
            <i class='bx bx-download'>\x3c/i> ดาวน์โหลดตัวอย่าง
          \x3c/button>
        \x3c/div>
        <div class="mt-3">
          <label class="form-label">เลือกไฟล์ CSV\x3c/label>
          <input type="file" id="csvFileInput" accept=".csv,text/csv" class="form-input"
                 onchange="previewPersonnelCSV(this)">
        \x3c/div>
        <div id="csvPreviewBox" style="display:none; margin-top:12px;">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-semibold text-slate-700">ตัวอย่างข้อมูล\x3c/span>
            <span id="csvPreviewCount" class="text-xs text-slate-500">\x3c/span>
          \x3c/div>
          <div style="max-height:260px; overflow:auto; border:1px solid #E2E8F0; border-radius:8px;">
            <table class="w-full text-xs" style="border-collapse:collapse;">
              <thead style="position:sticky; top:0; background:#F8FAFC;">
                <tr>
                  <th class="px-2 py-1.5 text-left font-semibold border-b" style="min-width:28px;">#\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ชื่อ\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">นามสกุล\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ตำแหน่ง\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ฝ่าย\x3c/th>
                  <th class="px-2 py-1.5 text-left font-semibold border-b">ประเภท\x3c/th>
                \x3c/tr>
              \x3c/thead>
              <tbody id="csvPreviewBody">\x3c/tbody>
            \x3c/table>
          \x3c/div>
        \x3c/div>
        <style>
          .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
          .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; }
          #csvPreviewBody tr:nth-child(even) { background:#F8FAFC; }
          #csvPreviewBody td { padding:5px 8px; border-bottom:1px solid #F1F5F9; }
          #csvPreviewBody tr.warn td { background:#FEF2F2; color:#B91C1C; }
        \x3c/style>
      \x3c/div>
    `,
    preConfirm: () => {
      if (!_csvImportRecords.length) { Swal.showValidationMessage('กรุณาเลือกไฟล์ CSV ที่มีข้อมูล'); return false; }
      return _csvImportRecords;
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    confirmImportPersonnelCSV(r.value);
  });
}

function previewPersonnelCSV(input) {
  const file = input.files[0];
  const box = document.getElementById('csvPreviewBox');
  const body = document.getElementById('csvPreviewBody');
  const count = document.getElementById('csvPreviewCount');
  if (!file || !body) return;
  const reader = new FileReader();
  reader.onload = e => {
    const rows = parseCSV(e.target.result);
    if (rows.length < 2) { body.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-3">ไม่พบข้อมูล\x3c/td>\x3c/tr>'; box.style.display='block'; return; }
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ''));
    const dataRows = rows.slice(1);
    const records = dataRows.map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return {
        prefix: obj.prefix || '', first_name: obj.first_name || '', last_name: obj.last_name || '',
        national_id: obj.national_id || '', gender: obj.gender || '', birth_date: obj.birth_date || '',
        position: obj.position || '', department: obj.department || '', type: obj.type || 'teacher',
        academic_level: obj.academic_level || '', start_date: obj.start_date || '',
        phone: obj.phone || '', email: obj.email || '', address: obj.address || '', status: obj.status || 'active'
      };
    }).filter(r => r.first_name && r.last_name);
    _csvImportRecords = records;
    count.textContent = `พบ ${records.length} รายการ`;
    const show = records.slice(0, 20);
    body.innerHTML = show.map((r, i) => {
      const warn = !r.first_name || !r.last_name;
      return `<tr class="${warn ? 'warn' : ''}"><td class="px-2 py-1.5">${i+1}\x3c/td><td>${escapeHTML(r.first_name)}\x3c/td><td>${escapeHTML(r.last_name)}\x3c/td><td>${escapeHTML(r.position)}\x3c/td><td>${escapeHTML(r.department)}\x3c/td><td>${escapeHTML(r.type)}\x3c/td>\x3c/tr>`;
    }).join('') + (records.length > 20 ? `<tr><td colspan="6" class="text-center text-slate-400 py-2">... และอีก ${records.length-20} รายการ\x3c/td>\x3c/tr>` : '');
    if (!records.length) body.innerHTML = '<tr><td colspan="6" class="text-center text-red-500 py-3">ไม่พบข้อมูลที่ใช้ได้ (ต้องมีชื่อและนามสกุล)\x3c/td>\x3c/tr>';
    box.style.display = 'block';
  };
  reader.readAsText(file);
}

function bulkCreateUsersFromPersonnel() {
  Swal.fire({
    title: 'สร้างบัญชีผู้ใช้ทั้งหมด',
    width: 480,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-user-check"><\/i> ยืนยันสร้าง',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#10B981',
    html: `
      <div style="text-align:left;font-size:14px;">
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;">
          ระบบจะสร้างบัญชีสำหรับบุคลากรที่ยังไม่มีบัญชี (ข้ามคนที่มีแล้ว)
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;">บทบาทเริ่มต้นสำหรับทุกคน</label>
          <select id="bulk_role" style="width:100%;padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box;">
            <option value="teacher">ครู</option>
            <option value="staff">เจ้าหน้าที่</option>
          </select>
        </div>
        <div style="font-size:12px;color:#64748B;background:#F8FAFC;border-radius:6px;padding:8px 10px;">
          Username = รหัสบุคลากร (P0001, P0002, ...) &nbsp;·&nbsp; รหัสผ่าน = รหัสบุคลากร
        </div>
      </div>
    `,
    preConfirm: () => ({ role: document.getElementById('bulk_role').value })
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังสร้างบัญชี...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          Swal.fire({ icon:'success', title:'สร้างบัญชีสำเร็จ',
            html: `<div style="font-size:15px;">สร้างใหม่: <strong class="text-success">${res.created} คน</strong><br>ข้าม (มีบัญชีแล้ว): <strong>${res.skipped} คน</strong></div>` });
        } else {
          Swal.fire({ icon:'error', text: res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message||err }); })
      .createUsersFromPersonnel(r.value.role, APP.token);
  });
}

function createUserFromPersonnel(id, personnelId, name) {
  const defaultUser = personnelId || '';
  Swal.fire({
    title: 'สร้างบัญชีผู้ใช้สำหรับบุคลากร',
    width: 480,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-user-plus"><\/i> สร้างบัญชี',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left;font-size:14px;">
        <div style="background:#FAF0F2;border-radius:8px;padding:10px 12px;margin-bottom:14px;">
          <strong>${escapeHTML(name)}</strong>
          <span style="display:block;color:#64748B;font-size:12px;margin-top:2px;">รหัสบุคลากร: ${escapeHTML(personnelId)}</span>
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;">Username</label>
          <input type="text" id="cpf_username" value="${escapeHTML(defaultUser)}"
                 style="width:100%;padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;">บทบาท</label>
          <select id="cpf_role" style="width:100%;padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box;">
            <option value="teacher">ครู</option>
            <option value="staff">เจ้าหน้าที่</option>
            <option value="admin">ผู้ดูแลระบบ</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;">รหัสผ่านเริ่มต้น</label>
          <input type="text" id="cpf_password" value="${escapeHTML(defaultUser)}"
                 style="width:100%;padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;box-sizing:border-box;">
          <div style="font-size:11px;color:#94A3B8;margin-top:3px;">ค่าเริ่มต้น = รหัสบุคลากร &nbsp;·&nbsp; แนะนำให้เปลี่ยนหลังล็อกอินครั้งแรก</div>
        </div>
      </div>
    `,
    preConfirm: () => {
      const username = document.getElementById('cpf_username').value.trim();
      const password = document.getElementById('cpf_password').value.trim();
      if (!username) { Swal.showValidationMessage('กรุณากรอก Username'); return false; }
      if (!password || password.length < 6) { Swal.showValidationMessage('รหัสผ่านอย่างน้อย 6 ตัว'); return false; }
      return { username, role: document.getElementById('cpf_role').value,
               name, new_password: password, active: true, id: null,
               email: '', phone: '', department: '', avatar: '' };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังสร้างบัญชี...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          Swal.fire({ icon:'success', title:'สร้างบัญชีสำเร็จ',
            html: `Username: <strong>${escapeHTML(r.value.username)}<\/strong><br>รหัสผ่าน: <strong>${escapeHTML(r.value.new_password)}<\/strong>` });
        } else {
          Swal.fire({ icon:'error', text: res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message||err }); })
      .saveUser(r.value, APP.token);
  });
}

function confirmImportPersonnelCSV(records) {
  Swal.fire({
    icon: 'question',
    title: 'ยืนยันการนำเข้า',
    text: `นำเข้าบุคลากร ${records.length} รายการ?`,
    showCancelButton: true,
    confirmButtonText: 'ใช่ นำเข้าเลย',
    cancelButtonText: 'ยกเลิก'
  }).then(c => {
    if (!c.isConfirmed) return;
    showLoading('กำลังนำเข้า...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          Swal.fire({ icon:'success', title:'สำเร็จ', text: res.message });
          loadPersonnel();
        } else {
          Swal.fire({ icon:'error', title:'ผิดพลาด', text: res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text: err.message || err }); })
      .importPersonnelCSV(records, APP.token);
  });
}