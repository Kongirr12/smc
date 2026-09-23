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
            <option value="teacher">ครู\x3c/option>
            <option value="support">สนับสนุน\x3c/option>
            <option value="admin">บริหาร\x3c/option>
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

  const typeLabel = { teacher:'ครู', support:'สนับสนุน', admin:'บริหาร' };
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
              <option value="teacher" ${p.type==='teacher'?'selected':''}>ครู\x3c/option>
              <option value="support" ${p.type==='support'?'selected':''}>สนับสนุน\x3c/option>
              <option value="admin"   ${p.type==='admin'?'selected':''}>บริหาร\x3c/option>
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
      const typeLabel = { teacher:'ครู', support:'สนับสนุน', admin:'บริหาร' };
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
  scheduleCache: [] // schedule cache
};

function renderAttendance(container) {
  container.innerHTML = `
    ${pageHeader('การเข้าเรียน', 'bxs-check-square', '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="tab-pill" style="max-width:400px;">
          <button id="tabRecord" class="active" onclick="switchAttendanceTab('record')">
            <i class='bx bx-edit-alt'>\x3c/i> บันทึกรายวัน
          \x3c/button>
          <button id="tabReport" onclick="switchAttendanceTab('report')">
            <i class='bx bx-bar-chart-alt-2'>\x3c/i> รายงาน
          \x3c/button>
        \x3c/div>

        <div id="attRecord" class="mt-4">\x3c/div>
        <div id="attReport" class="mt-4" style="display:none;">\x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  // ตั้งค่า mode เริ่มต้น: หากยังไม่ได้เลือก ให้เริ่มต้นที่หน้าเสาธง/โฮมรูม หรือคงค่าเดิมที่เลือกไว้
  if (!AttendanceState.mode) {
    AttendanceState.mode = 'class';
  }

  let loaded = 0;
  const checkReady = () => { if (++loaded >= 3) renderAttendanceRecord(); };

  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success') AttendanceState.classrooms = res.data;
      checkReady();
    })
    .withFailureHandler(() => checkReady())
    .getClassrooms(APP.token);

  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success') AttendanceState.subjects = res.data || [];
      checkReady();
    })
    .withFailureHandler(() => checkReady())
    .getSubjects({}, APP.token);

  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success' && res.data) {
        AttendanceState.periods = res.data.periods || [];
      }
      checkReady();
    })
    .withFailureHandler(() => checkReady())
    .getPeriodConfig(APP.dashboardData?.config?.academic_year || '', APP.dashboardData?.config?.semester || '', APP.token);
}

function switchAttendanceTab(tab) {
  AttendanceState.tab = tab;
  document.getElementById('tabRecord').classList.toggle('active', tab === 'record');
  document.getElementById('tabReport').classList.toggle('active', tab === 'report');
  document.getElementById('attRecord').style.display = (tab === 'record') ? '' : 'none';
  document.getElementById('attReport').style.display = (tab === 'report') ? '' : 'none';
  if (tab === 'record') renderAttendanceRecord();
  else                  renderAttendanceReport();
}

function renderAttendanceRecord() {
  const c = document.getElementById('attRecord');
  if (!c) return;
  const mode = AttendanceState.mode;
  const subjects = AttendanceState.subjects || [];
  const classrooms = AttendanceState.classrooms || [];

  c.innerHTML = `
    <div class="flex gap-2 mb-3 flex-wrap items-center">
      <div class="flex rounded-lg overflow-hidden border border-slate-200" style="font-size:13px;">
        <button id="attModeSubject" onclick="switchAttMode('subject')"
          class="px-3 py-1.5 font-semibold transition-colors ${mode==='subject'?'bg-blue-500 text-white':'bg-white text-slate-600 hover:bg-slate-50'}">
          <i class='bx bx-book-open'>\x3c/i> รายวิชา
        </button>
        <button id="attModeClass" onclick="switchAttMode('class')"
          class="px-3 py-1.5 font-semibold transition-colors ${mode==='class'?'bg-blue-500 text-white':'bg-white text-slate-600 hover:bg-slate-50'}">
          <i class='bx bxs-building'>\x3c/i> หน้าเสาธง / โฮมรูม
        </button>
      </div>

      <select id="attClassroom" onchange="onAttClassroomChange()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm flex-1 min-w-[150px]">
        <option value="">เลือกชั้น\x3c/option>
        ${classrooms.map(r => `<option value="${escapeHTML(r)}" ${AttendanceState.classroom===r?'selected':''}>${escapeHTML(r)}\x3c/option>`).join('')}
      </select>

      <input type="date" id="attDate" onchange="onAttDateChange()"
             class="rounded-lg border border-slate-200 px-3 py-2 text-sm" value="${AttendanceState.date}">

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
      <div class="text-xs sm:text-sm font-bold text-slate-800">รายชื่อนักเรียน</div>
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
      <button class="btn btn-blue" onclick="saveAttendance()" style="padding:6px 16px; font-size:13px; box-shadow: 0 2px 8px rgba(128, 0, 32, 0.2);">
        <i class='bx bx-save'></i> บันทึก
      </button>
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
          padding: 10px 4px;
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
            style="${active ? `background:${color}; border-color:${color};` : ''}"
            onclick="setAttendanceStatus(${rowIdx}, '${status}')">
      ${label}
    \x3c/button>`;
}

function setAttendanceStatus(rowIdx, status) {
  AttendanceState.records[rowIdx].status = status;
  if (status === 'leave' && !AttendanceState.records[rowIdx].leave_type) {
    AttendanceState.records[rowIdx].leave_type = 'ลาป่วย';
  }
  renderAttendanceList();
}

function setAllAttendance(status) {
  AttendanceState.records.forEach(r => r.status = status);
  renderAttendanceList();
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


/* ----- Attendance Report ----- */
function renderAttendanceReport() {
  const c = document.getElementById('attReport');
  if (!c) return;
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const todayStr = today.toISOString().slice(0,10);

  c.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-6 gap-2 mb-3">
      <select id="rptClassroom" onchange="updateReportSubjects()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">เลือกชั้น\x3c/option>
        ${AttendanceState.classrooms.map(c => `<option value="${escapeHTML(c)}">ชั้น ${escapeHTML(c)}\x3c/option>`).join('')}
      \x3c/select>
      <select id="rptType" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="homeroom">หน้าเสาธง / โฮมรูม\x3c/option>
        <optgroup label="แยกตามรายวิชา" id="rptSubjectGroup">
        \x3c/optgroup>
      \x3c/select>
      <input type="date" id="rptStart" class="rounded-lg border border-slate-200 px-3 py-2 text-sm" value="${monthStart}">
      <input type="date" id="rptEnd"   class="rounded-lg border border-slate-200 px-3 py-2 text-sm" value="${todayStr}">
      <button class="btn btn-blue" onclick="loadAttendanceReport()">
        <i class='bx bx-search'>\x3c/i> ดูรายงาน
      \x3c/button>
      <button class="btn btn-light" onclick="exportReportCSV()">
        <i class='bx bx-spreadsheet'>\x3c/i> โหลด CSV
      \x3c/button>
      <button class="btn btn-light" onclick="window.print()">
        <i class='bx bx-printer'>\x3c/i> พิมพ์ PDF
      \x3c/button>
    \x3c/div>

    <style>
      @media print {
        body * { visibility: hidden !important; }
        #rptArea, #rptArea * { visibility: visible !important; }
        #rptArea { position: absolute; left: 0; top: 0; width: 100%; }
        .rpt-card { border: 1px solid #ccc !important; }
        .status-badge { border: 1px solid #ccc !important; }
      }
    \x3c/style>

    <div id="rptArea">
      <div class="empty-state">
        <i class='bx bx-bar-chart-alt-2'>\x3c/i>
        เลือกชั้นและช่วงวันที่เพื่อดูรายงาน
      \x3c/div>
    \x3c/div>
  `;
}

function updateReportSubjects() {
  const cls = document.getElementById('rptClassroom').value;
  const grp = document.getElementById('rptSubjectGroup');
  if (!grp) return;
  grp.innerHTML = '';
  if (!cls) return;

  // ลองหาวิชาจาก scheduleCache ก่อน (ถ้ามี)
  const schedCache = AttendanceState.scheduleCache || [];
  const schedSubjects = [];
  if (schedCache.length > 0 && AttendanceState.classroom === cls) {
    // มี cache ของชั้นนี้
    schedCache.forEach(e => {
      if (e.subject_id && !schedSubjects.some(x => x.id === e.subject_id)) {
        schedSubjects.push({ id: e.subject_id, subject_name: e.subject_name || e.subject_id, subject_code: e.subject_code || '' });
      }
    });
  }

  // Fallback: กรองจาก subjects list ทั่วไป
  let fallbackSubjects = (AttendanceState.subjects || []).filter(s => {
    const gl = String(s.grade_level || '');
    return gl === String(cls) || gl.includes(cls) || String(cls).includes(gl);
  });

  const finalSubjects = schedSubjects.length > 0 ? schedSubjects : fallbackSubjects;

  if (finalSubjects.length === 0) {
    grp.innerHTML = `<option value="" disabled>ไม่พบรายวิชาในชั้นนี้</option>`;
  } else {
    finalSubjects.forEach(s => {
      grp.innerHTML += `<option value="${escapeHTML(s.id)}">${escapeHTML(s.subject_name)}${s.subject_code ? ' (' + escapeHTML(s.subject_code) + ')' : ''}\x3c/option>`;
    });
  }

  // ถ้ายังไม่มี scheduleCache สำหรับชั้นนี้ ให้ดึงเพื่อโหลดวิชาแบบ real-time
  if (schedSubjects.length === 0) {
    const ay = APP.dashboardData?.config?.academic_year || '';
    const sem = APP.dashboardData?.config?.semester || '';
    google.script.run
      .withSuccessHandler(res => {
        if (res.status === 'success' && res.data && res.data.length > 0) {
          // บันทึก cache เฉพาะถ้าชั้นยังตรงกัน
          if (document.getElementById('rptClassroom').value === cls) {
            grp.innerHTML = '';
            const seen = new Set();
            res.data.forEach(e => {
              if (e.subject_id && !seen.has(e.subject_id)) {
                seen.add(e.subject_id);
                grp.innerHTML += `<option value="${escapeHTML(e.subject_id)}">${escapeHTML(e.subject_name || e.subject_id)}${e.subject_code ? ' (' + escapeHTML(e.subject_code) + ')' : ''}\x3c/option>`;
              }
            });
          }
        }
      })
      .getSchedule({ classroom: cls, academic_year: ay, semester: sem }, APP.token);
  }
}

function loadAttendanceReport() {
  const classroom = document.getElementById('rptClassroom').value;
  const rptType   = document.getElementById('rptType').value;
  const start = document.getElementById('rptStart').value;
  const end   = document.getElementById('rptEnd').value;
  if (!classroom) return showToast('warning', 'กรุณาเลือกชั้น');

  const area = document.getElementById('rptArea');
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(res.message)}\x3c/div>`;
        return;
      }
      renderAttendanceReportData(res, start, end, rptType);
    })
    .withFailureHandler(err => { area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(err.message||err)}\x3c/div>`; })
    .getAttendanceReport({ mode:'class', classroom:classroom, report_type:rptType, start_date:start, end_date:end }, APP.token);
}

function renderAttendanceReportData(res, start, end, rptType) {
  const area = document.getElementById('rptArea');
  if (!res.data || res.data.length === 0) {
    area.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-info-circle'>\x3c/i>
        ไม่พบข้อมูลในช่วงเวลานี้
      \x3c/div>`;
    return;
  }

  const showPct = rptType === 'homeroom';
  const rptClass = document.getElementById('rptClassroom').value;
  const rptTypeEl = document.getElementById('rptType');
  const typeText = showPct ? 'การเข้าแถวหน้าเสาธง' : 'เวลาเรียนรายวิชา ' + rptTypeEl.options[rptTypeEl.selectedIndex].text.replace(/\\s*\\(.*\\)/, '').trim();

  const printHeader = `
    <div class="hidden print:block text-center mb-6">
      <img src="https://lh3.googleusercontent.com/d/19aXvolxpVK5GndtRSMFP6sEdl7oa5PzN" alt="โลโก้โรงเรียน" style="width: 80px; height: 80px; margin: 0 auto 10px auto; object-fit: contain;">
      <div style="font-size:18px; font-weight:bold;">รายงาน${typeText}\x3c/div>
      <div style="font-size:16px; font-weight:bold; margin-top:4px;">ระดับชั้น ${escapeHTML(rptClass)} โรงเรียนมหาชัยพิทยาคาร\x3c/div>
    \x3c/div>
  `;

  const printFooter = `
    <div class="hidden print:block text-center mt-10 text-xs text-slate-500">
      ระบบ MHC Smart School | พัฒนาโดยครูก้องนที อุ่นเจริญ
    \x3c/div>
  `;

  area.innerHTML = `
    ${printHeader}
    <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 print:hidden">
      <div class="rpt-card" style="background:#DCFCE7;color:#15803D;">
        <div class="lbl">มาเรียน\x3c/div>
        <div class="val">${formatNumber(res.summary.present)}\x3c/div>
      \x3c/div>
      <div class="rpt-card" style="background:#FEE2E2;color:#B91C1C;">
        <div class="lbl">ขาด\x3c/div>
        <div class="val">${formatNumber(res.summary.absent)}\x3c/div>
      \x3c/div>
      <div class="rpt-card" style="background:#FEF3C7;color:#B45309;">
        <div class="lbl">ลา\x3c/div>
        <div class="val">${formatNumber(res.summary.leave)}\x3c/div>
      \x3c/div>
      <div class="rpt-card" style="background:#F2D5DA;color:#3730A3;">
        <div class="lbl">มาสาย\x3c/div>
        <div class="val">${formatNumber(res.summary.late)}\x3c/div>
      \x3c/div>
      ${showPct ? `
      <div class="rpt-card" style="background:#F1F5F9;color:#0F172A;">
        <div class="lbl">% เข้าเรียน\x3c/div>
        <div class="val">${res.summary.attendance_pct.toFixed(1)}%\x3c/div>
      \x3c/div>` : ''}
    \x3c/div>

    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left">นักเรียน\x3c/th>
            <th class="px-3 py-2.5 text-center">มา\x3c/th>
            <th class="px-3 py-2.5 text-center">ขาด\x3c/th>
            <th class="px-3 py-2.5 text-center">ลา\x3c/th>
            <th class="px-3 py-2.5 text-center">มาสาย\x3c/th>
            <th class="px-3 py-2.5 text-center">รวม\x3c/th>
            ${showPct ? `<th class="px-3 py-2.5 text-center">% เข้าเรียน\x3c/th>` : ''}
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(r => {
            const pct = r.attendance_pct || 0;
            const bad = pct < 80;
            return `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5">
                <div class="font-semibold text-slate-800">${escapeHTML((r.prefix||'') + (r.first_name||'') + ' ' + (r.last_name||''))}\x3c/div>
              \x3c/td>
              <td class="px-3 py-2.5 text-center text-green-700 font-semibold">${r.present}\x3c/td>
              <td class="px-3 py-2.5 text-center text-red-600 font-semibold">${r.absent}\x3c/td>
              <td class="px-3 py-2.5 text-center text-amber-700 font-semibold">${r.leave}\x3c/td>
              <td class="px-3 py-2.5 text-center text-blue-600 font-semibold">${r.late}\x3c/td>
              <td class="px-3 py-2.5 text-center text-slate-600">${r.total}\x3c/td>
              ${showPct ? `
              <td class="px-3 py-2.5 text-center">
                <span class="status-badge ${bad ? 'status-inactive' : 'status-active'}">${pct.toFixed(1)}%\x3c/span>
              \x3c/td>` : ''}
            \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${printFooter}

    <style>
      .rpt-card { padding: 12px 16px; border-radius:12px; }
      .rpt-card .lbl { font-size: 12px; font-weight: 600; opacity: .8; }
      .rpt-card .val { font-size: 22px; font-weight: 700; line-height: 1.1; margin-top: 4px; }
    \x3c/style>
  `;
}

function exportReportCSV() {
  const table = document.querySelector('#rptArea table');
  if (!table) return showToast('warning', 'ไม่มีข้อมูลให้ดาวน์โหลด');
  
  const headers = [];
  table.querySelectorAll('thead th').forEach(th => headers.push(th.innerText.trim()));
  
  const rows = [];
  table.querySelectorAll('tbody tr').forEach(tr => {
    const row = [];
    tr.querySelectorAll('td').forEach(td => row.push(td.innerText.replace(/\n/g, ' ').trim()));
    rows.push(row);
  });
  
  const rptClass = document.getElementById('rptClassroom').value;
  const rptType = document.getElementById('rptType');
  const typeText = rptType.options[rptType.selectedIndex].text.replace(/\//g, '-').trim();
  const filename = 'รายงานเข้าเรียน_' + rptClass + '_' + typeText + '_' + new Date().toISOString().slice(0,10) + '.xls';
  
  exportToExcel(headers, rows, filename);
  showToast('success', 'เตรียมไฟล์สำเร็จ');
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