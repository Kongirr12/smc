/* ============================================================
 *  Smart School Office — js3
 *  Part 3: Academic | Finance | Documents | Approvals | Registration
 * ============================================================ */


/* ============================================================
 *  Shared: เปิด HTML ที่ได้จาก backend ในหน้าต่างใหม่
 * ============================================================ */
function openHTMLDocument(html) {
  const w = window.open('', '_blank');
  if (!w) {
    return Swal.fire({
      icon: 'warning',
      title: 'Popup ถูกปิด',
      text: 'กรุณาอนุญาตให้เปิด pop-up จาก URL นี้'
    });
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
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
      // สร้าง distinct years
      const years = Array.from(new Set(AcademicState.allSubjects.map(s => s.academic_year).filter(Boolean))).sort().reverse();
      const yrSel = document.getElementById('grYear');
      yrSel.innerHTML = '<option value="">เลือกปีการศึกษา\x3c/option>' +
        years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}\x3c/option>`).join('');
      // default ปี/เทอมปัจจุบัน
      const curYear = APP.dashboardData?.config?.academic_year || '';
      const curSem  = APP.dashboardData?.config?.semester || '1';
      if (curYear && years.includes(curYear)) yrSel.value = curYear;
      const semSel = document.getElementById('grSem');
      if (curSem) semSel.value = curSem;
      onGradesFilterChange();
    })
    .getSubjects({ page:1, per_page:200 }, APP.token);
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
    const yMatch = !year || !s.academic_year || String(s.academic_year).trim() === String(year).trim();
    const sMatch = !sem  || String(s.semester || '1').trim() === String(sem).trim();
    return yMatch && sMatch;
  });
  sel.innerHTML = '<option value="">เลือกรายวิชา\x3c/option>' +
    subjects.map(s =>
      `<option value="${s.id}">${escapeHTML(s.subject_code||'')} ${escapeHTML(s.subject_name||'')} · ${escapeHTML(s.grade_level||'')} (เทอม ${escapeHTML(s.semester||'1')})\x3c/option>`
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

  const roomDisplay = AcademicState.currentSubjectClassroom 
    ? ` · ห้อง <b>${escapeHTML(AcademicState.currentSubjectClassroom)}</b>` 
    : ' · <b>ทุกห้องเรียน</b>';

  area.innerHTML = `
    <div class="p-3 rounded-lg mb-3" style="background:#FAF0F2;border:1px solid #BFDBFE;">
      <div class="font-semibold text-slate-800">
        ${escapeHTML(subj.subject_code||'')} · ${escapeHTML(subj.subject_name||'')}
      </div>
      <div class="text-xs text-slate-600 mt-1">
        ระดับชั้น <b>${escapeHTML(subj.grade_level||'-')}</b>${roomDisplay} · เทอม ${escapeHTML(subj.semester||'-')} · ปีการศึกษา ${escapeHTML(subj.academic_year||'-')}
        · ระหว่างภาค <b>${subj.midterm_weight||70}\x3c/b> · ปลายภาค <b>${subj.final_weight||30}\x3c/b>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 justify-end mb-2">
      <button class="btn btn-light" onclick="printPP5()">
        <i class='bx bx-printer'>\x3c/i> พิมพ์ ปพ.5
      </button>
      <button class="btn btn-blue" onclick="saveGradeSheet()">
        <i class='bx bx-save'>\x3c/i> บันทึกคะแนน
      </button>
    </div>

    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm" id="gradeTable">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-2 py-2.5 text-center rounded-l-lg" style="width:40px;">ที่\x3c/th>
            <th class="px-2 py-2.5 text-left">นักเรียน\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:90px;">ระหว่างภาค\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:90px;">ปลายภาค\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:70px;">รวม\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:75px;">ชม.เรียน\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">ชม.รวม\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">%\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">เกรด\x3c/th>
            <th class="px-2 py-2.5 text-center rounded-r-lg" style="width:85px;">พิเศษ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${rows.map((r, i) => `
            <tr class="border-b border-slate-100" data-row="${i}">
              <td class="px-2 py-2 text-center text-slate-500">${i+1}\x3c/td>
              <td class="px-2 py-2">
                <div class="flex items-center gap-2">
                  ${avatarHTML(r.photo, r.first_name, 28)}
                  <div>
                    <div class="font-semibold text-slate-800 text-xs">
                      ${escapeHTML((r.prefix||'')+(r.first_name||'')+' '+(r.last_name||''))}
                      ${r.classroom ? `<span class="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-normal">ห้อง ${escapeHTML(r.classroom)}</span>` : ''}
                    </div>
                    <div class="text-xs text-slate-400 font-mono">${escapeHTML(r.student_code||'')}\x3c/div>
                  </div>
                </div>
              </td>
              <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-midterm" data-row="${i}" value="${r.score_midterm===''||r.score_midterm==null?'':r.score_midterm}">\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-final"   data-row="${i}" value="${r.score_final===''||r.score_final==null?'':r.score_final}">\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-total" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-att" data-row="${i}" value="${r.attendance_hours===''||r.attendance_hours==null?'':r.attendance_hours}">\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-tot" data-row="${i}" value="${r.total_hours===''||r.total_hours==null?'':r.total_hours}">\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-pct" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-grade" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1">
                <select class="grade-input g-special" data-row="${i}">
                  <option value="">-\x3c/option>
                  <option value="มส" ${r.grade_special==='มส'?'selected':''}>มส\x3c/option>
                  <option value="มผ" ${r.grade_special==='มผ'?'selected':''}>มผ\x3c/option>
                  <option value="ร"  ${r.grade_special==='ร'?'selected':''}>ร\x3c/option>
                \x3c/select>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>

    <style>
      .grade-input {
        width:100%; padding:5px 6px; border:1.5px solid #E2E8F0;
        border-radius:6px; font-family:inherit; font-size:12px;
        background:#F8FAFC; text-align:center; box-sizing:border-box;
      }
      .grade-input:focus { outline:none; border-color:#4F46E5; background:white; }
      .grade-output {
        padding:5px; text-align:center; font-size:12px; font-weight:600;
        background:#F1F5F9; border-radius:6px; color:#3730A3; min-height:26px;
      }
      .grade-output.grade-fail { background:#FEE2E2; color:#B91C1C; }
      .grade-output.grade-pass { background:#DCFCE7; color:#15803D; }
    \x3c/style>
  `;

  // bind events
  document.querySelectorAll('#gradeTable .grade-input').forEach(inp => {
    inp.addEventListener('input', e => recalcGradeRow(+e.target.dataset.row));
    inp.addEventListener('change', e => recalcGradeRow(+e.target.dataset.row));
  });

  // คำนวณรอบแรก
  rows.forEach((_, i) => recalcGradeRow(i));
}

function recalcGradeRow(i) {
  const get = sel => document.querySelector(`#gradeTable .g-${sel}[data-row="${i}"]`);
  const mid = parseFloat(get('midterm').value);
  const fin = parseFloat(get('final').value);
  const att = parseFloat(get('att').value);
  const tot = parseFloat(get('tot').value);
  const special = get('special').value;

  let total = null;
  if (!isNaN(mid) && !isNaN(fin)) total = mid + fin;
  else if (!isNaN(mid)) total = mid;
  else if (!isNaN(fin)) total = fin;
  get('total').textContent = (total === null) ? '-' : Number(total).toFixed(total % 1 ? 1 : 0);

  let pct = null;
  if (!isNaN(att) && !isNaN(tot) && tot > 0) pct = Math.round((att / tot) * 1000) / 10;
  const pctEl = get('pct');
  pctEl.textContent = (pct === null) ? '-' : pct + '%';
  pctEl.className = 'grade-output g-pct ' + (pct === null ? '' : (pct < 80 ? 'grade-fail' : 'grade-pass'));

  let grade = '-';
  if (special) {
    grade = special;
    get('grade').className = 'grade-output g-grade grade-fail';
  } else if (pct !== null && pct < 80) {
    grade = 'มส';
    get('grade').className = 'grade-output g-grade grade-fail';
  } else if (total !== null) {
    if (total >= 80) grade = '4';
    else if (total >= 75) grade = '3.5';
    else if (total >= 70) grade = '3';
    else if (total >= 65) grade = '2.5';
    else if (total >= 60) grade = '2';
    else if (total >= 55) grade = '1.5';
    else if (total >= 50) grade = '1';
    else                  grade = '0';
    get('grade').className = 'grade-output g-grade ' + (Number(grade) >= 1 ? 'grade-pass' : 'grade-fail');
  } else {
    get('grade').className = 'grade-output g-grade';
  }
  get('grade').textContent = grade;

  // sync state
  AcademicState.gradeRows[i].score_midterm    = isNaN(mid) ? '' : mid;
  AcademicState.gradeRows[i].score_final      = isNaN(fin) ? '' : fin;
  AcademicState.gradeRows[i].attendance_hours = isNaN(att) ? '' : att;
  AcademicState.gradeRows[i].total_hours      = isNaN(tot) ? '' : tot;
  AcademicState.gradeRows[i].grade_special    = special;
}

function saveGradeSheet() {
  if (!AcademicState.currentSubject || !AcademicState.gradeRows) return;
  const year = AcademicState.currentSubjectYear || document.getElementById('grYear')?.value || (APP.dashboardData?.config?.academic_year || '');
  const sem  = AcademicState.currentSubjectSem || document.getElementById('grSem')?.value || '1';

  showLoading('กำลังบันทึก...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message, timer:1800 });
      else showToast('error', res.message);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .saveGradeBulk(AcademicState.currentSubject.id, AcademicState.gradeRows, APP.token, year, sem);
}

function printPP5() {
  if (!AcademicState.currentSubject) return showToast('warning', 'เลือกวิชาก่อน');
  const year = AcademicState.currentSubjectYear || document.getElementById('grYear')?.value || '';
  const sem  = AcademicState.currentSubjectSem || document.getElementById('grSem')?.value || '';
  const classroom = document.getElementById('grClassroom') ? document.getElementById('grClassroom').value : '';

  showLoading('กำลังเตรียมเอกสาร...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
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
  const year = document.getElementById('gpaYear').value || '';
  const sem  = document.getElementById('gpaSem').value || '';
  showLoading('กำลังเตรียมเอกสาร...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
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
  showLoading('กำลังเตรียมใบเสร็จ...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
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
