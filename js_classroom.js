/* ============================================================
 *  CLASSROOM MANAGEMENT — จัดการห้องเรียน
 * ============================================================ */

const CLS = {
  rooms: [],
  teachers: [],
  academicYear: ''
};

function renderClassroomMgmt(container) {
  CLS.academicYear = (APP.dashboardData && APP.dashboardData.config && APP.dashboardData.config.academic_year) || '';

  container.innerHTML = `
    ${pageHeader('จัดการห้องเรียน', 'bxs-school', `
      ${APP.role !== 'teacher' ? `<button class="btn btn-purple" onclick="openPromotionWizard()"><i class='bx bx-up-arrow-circle'></i> ระบบเลื่อนชั้นเรียน</button><button class="btn btn-blue" onclick="openClassroomForm()"><i class='bx bx-plus'></i> เพิ่มห้องเรียน</button>` : ''}
    `)}
    <div class="page-card">
      <div class="page-card-body">
        <div id="clsGrid" class="cls-grid">
          <div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i> กำลังโหลด...</div>
        </div>
      </div>
    </div>

    <style>
      .cls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      .cls-card {
        background: white;
        border: 1.5px solid #E2E8F0;
        border-radius: 16px;
        padding: 20px;
        position: relative;
        transition: box-shadow .2s, transform .2s;
      }
      .cls-card:hover { box-shadow: 0 8px 24px rgba(30,64,175,.1); transform: translateY(-2px); }
      .cls-icon {
        width: 48px; height: 48px; border-radius: 12px;
        background: linear-gradient(135deg,#FAF0F2,#F2D5DA);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 12px;
      }
      .cls-icon i { font-size: 26px; color: #3730A3; }
      .cls-name { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
      .cls-year { font-size: 12px; color: #94A3B8; margin-bottom: 12px; }
      .cls-meta { font-size: 13px; color: #475569; margin-bottom: 4px; }
      .cls-meta span { font-weight: 600; color: #3730A3; }
      .cls-bar-bg { height: 6px; background:#F1F5F9; border-radius:9px; margin: 8px 0 14px; overflow:hidden; }
      .cls-bar    { height: 6px; background: linear-gradient(90deg,#4F46E5,#60A5FA); border-radius:9px; transition:width .5s; }
      .cls-actions { display: flex; gap: 6px; }
      .cls-badge {
        position: absolute; top: 14px; right: 14px;
        font-size: 11px; font-weight: 700; padding: 3px 10px;
        border-radius: 99px;
        background: #DCFCE7; color: #15803D;
      }
      .cls-badge.inactive { background:#FEE2E2; color:#B91C1C; }
    </style>
  `;

  if (CLS.rooms && CLS.rooms.length > 0) {
    renderCLS();
    loadClassroomList(true);
  } else {
    loadClassroomList();
  }
}

function loadClassroomList(silent) {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (!silent) showToast('error', res.message);
        return;
      }
      CLS.rooms = res.data;
      renderCLS();
    })
    .withFailureHandler(err => {
      if (!silent) showToast('error', err.message || err);
    })
    .getClassroomList({ academic_year: CLS.academicYear }, APP.token);
}

function renderCLS() {
  const grid = document.getElementById('clsGrid');
  if (!grid) return;

  if (!CLS.rooms.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i class='bx bxs-school'></i>
        ยังไม่มีห้องเรียน — กดปุ่ม "เพิ่มห้องเรียน" เพื่อเริ่มต้น
      </div>`;
    return;
  }

  grid.innerHTML = CLS.rooms.map(r => {
    const pct = r.capacity ? Math.min(100, Math.round(r.student_count / r.capacity * 100)) : 0;
    return `
    <div class="cls-card">
      <span class="cls-badge ${r.status !== 'active' ? 'inactive' : ''}">${r.status === 'active' ? 'เปิดใช้งาน' : 'ปิด'}</span>
      <div class="cls-icon"><i class='bx bxs-school'></i></div>
      <div class="cls-name">${escapeHTML(r.name)}</div>
      <div class="cls-year">ปีการศึกษา ${escapeHTML(String(r.academic_year))}</div>
      <div class="cls-meta">ครูประจำชั้น: <span>${escapeHTML(r.teacher_name)}</span></div>
      <div class="cls-meta">นักเรียน: <span>${r.student_count} / ${r.capacity}</span></div>
      <div class="cls-bar-bg"><div class="cls-bar" style="width:${pct}%;"></div></div>
      <div style="font-size:11px;color:#94A3B8;text-align:right;margin-bottom:12px;">${pct}%</div>
      <div class="cls-actions">
        ${APP.role !== 'teacher' ? `<button class="btn btn-light" style="flex:1;" onclick="openClassroomForm('${escapeHTML(r.id)}')" ><i class='bx bx-edit'></i> แก้ไข</button>` : ''}
        <button class="btn btn-blue" style="flex:1;" onclick="openClassroomStudents('${escapeHTML(r.id)}','${escapeHTML(r.name)}','${escapeHTML(String(r.academic_year))}')">
          <i class='bx bxs-user-detail'></i> นักเรียน
        </button>
        ${APP.role !== 'teacher' ? `<button class="btn btn-light" style="color:#DC2626;padding:8px 10px;" onclick="deleteClassroomConfirm('${escapeHTML(r.id)}','${escapeHTML(r.name)}')" ><i class='bx bx-trash'></i></button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ---------- FORM เพิ่ม/แก้ไขห้องเรียน ---------- */
function openClassroomForm(id) {
  const r = id ? CLS.rooms.find(x => x.id === id) : null;
  const config = (APP.dashboardData && APP.dashboardData.config) || {};
  const currentYear = CLS.academicYear || config.academic_year || (new Date().getFullYear() + 543);

  // โหลดครูสำหรับ dropdown
  google.script.run
    .withSuccessHandler(res => {
      const teachers = (res.status === 'success') ? res.data : [];
      CLS.teachers = teachers;

      const GRADES = ['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'];

      Swal.fire({
        title: r ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่',
        width: 540,
        showCancelButton: true,
        confirmButtonText: '<i class="bx bx-save"></i> บันทึก',
        cancelButtonText: 'ยกเลิก',
        showCloseButton: true,
        html: `
          <div style="text-align:left;font-size:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label class="form-label">ระดับชั้น <span class="text-danger">*</span></label>
                <select id="cf_grade" class="form-input">
                  <option value="">-- กรุณาเลือก --</option>
                  ${GRADES.map(g => `<option value="${g}" ${(r&&r.grade_level===g)?'selected':''}>${g}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label">ห้อง <span class="text-danger">*</span></label>
                <input type="text" id="cf_room" class="form-input" placeholder="1" maxlength="5"
                       value="${escapeHTML(r ? r.room_number : '')}">
              </div>
              <div>
                <label class="form-label">ปีการศึกษา <span class="text-danger">*</span></label>
                <input type="text" id="cf_year" class="form-input" value="${escapeHTML(r ? String(r.academic_year) : String(currentYear))}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label class="form-label">ความจุ <span class="text-danger">*</span></label>
                <input type="number" id="cf_cap" class="form-input" value="${r ? r.capacity : 40}" min="1" max="200">
              </div>
              <div>
                <label class="form-label">สถานะ</label>
                <select id="cf_status" class="form-input">
                  <option value="active" ${(!r||r.status==='active')?'selected':''}>เปิดใช้งาน</option>
                  <option value="inactive" ${(r&&r.status==='inactive')?'selected':''}>ปิด</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label">ครูประจำชั้นคนที่ 1</label>
              <input type="text" id="cf_teacher_search_1" class="form-input" placeholder="ค้นหาครูประจำชั้น..."
                     value="${escapeHTML(r && r.homeroom_teacher_id ? (teachers.find(t=>t.id===r.homeroom_teacher_id)||{}).name||'' : '')}"
                     autocomplete="off" oninput="filterTeacherDropdown(this.value, 1)">
              <input type="hidden" id="cf_teacher_id_1" value="${escapeHTML(r ? r.homeroom_teacher_id||'' : '')}">
              <div id="cf_teacher_list_1" style="display:none;position:absolute;z-index:9999;background:white;
                   border:1.5px solid #E2E8F0;border-radius:10px;max-height:160px;overflow-y:auto;
                   width:calc(100% - 80px);box-shadow:0 8px 24px rgba(0,0,0,.12);"></div>
            </div>
            <div style="margin-top:10px;">
              <label class="form-label">ครูประจำชั้นคนที่ 2 (ถ้ามี)</label>
              <input type="text" id="cf_teacher_search_2" class="form-input" placeholder="ค้นหาครูประจำชั้นคนที่ 2..."
                     value="${escapeHTML(r && r.homeroom_teacher_id_2 ? (teachers.find(t=>t.id===r.homeroom_teacher_id_2)||{}).name||'' : '')}"
                     autocomplete="off" oninput="filterTeacherDropdown(this.value, 2)">
              <input type="hidden" id="cf_teacher_id_2" value="${escapeHTML(r ? r.homeroom_teacher_id_2||'' : '')}">
              <div id="cf_teacher_list_2" style="display:none;position:absolute;z-index:9999;background:white;
                   border:1.5px solid #E2E8F0;border-radius:10px;max-height:160px;overflow-y:auto;
                   width:calc(100% - 80px);box-shadow:0 8px 24px rgba(0,0,0,.12);"></div>
            </div>
          </div>
          <style>
            .form-label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;}
            .form-input{width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;
              font-family:inherit;font-size:13px;background:#F8FAFC;box-sizing:border-box;}
            .form-input:focus{outline:none;border-color:#4F46E5;background:white;}
            .teacher-opt{padding:8px 12px;cursor:pointer;font-size:13px;}
            .teacher-opt:hover{background:#FAF0F2;color:#3730A3;}
          </style>
        `,
        preConfirm: () => {
          const grade = document.getElementById('cf_grade').value;
          const room  = document.getElementById('cf_room').value.trim();
          const year  = document.getElementById('cf_year').value.trim();
          if (!grade || !room || !year) {
            Swal.showValidationMessage('กรุณากรอกระดับชั้น ห้อง และปีการศึกษา');
            return false;
          }
          return {
            id                 : r ? r.id : null,
            grade_level        : grade,
            room_number        : room,
            academic_year      : year,
            capacity           : parseInt(document.getElementById('cf_cap').value) || 40,
            homeroom_teacher_id: document.getElementById('cf_teacher_id_1').value,
            homeroom_teacher_id_2: document.getElementById('cf_teacher_id_2').value,
            status             : document.getElementById('cf_status').value
          };
        }
      }).then(res => {
        if (!res.isConfirmed) return;
        showLoading('กำลังบันทึก...');
        google.script.run
          .withSuccessHandler(r => {
            hideLoading();
            if (r.status === 'success') { showToast('success', r.message); loadClassroomList(); }
            else Swal.fire({ icon:'error', title:'ผิดพลาด', text: r.message });
          })
          .withFailureHandler(err => { hideLoading(); showToast('error', err.message||err); })
          .saveClassroom(res.value, APP.token);
      });
    })
    .withFailureHandler(() => CLS.teachers = [])
    .getPersonnel({ type:'teacher', per_page:200 }, APP.token);
}

function filterTeacherDropdown(q, idx) {
  const box = document.getElementById('cf_teacher_list_' + idx);
  if (!box) return;
  const filtered = q.length < 1 ? [] : CLS.teachers.filter(t =>
    (t.name||'').includes(q) || (t.first_name||'').includes(q)
  ).slice(0, 8);

  if (!filtered.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = filtered.map(t => `
    <div class="teacher-opt" onclick="selectTeacher('${escapeHTML(t.id)}','${escapeHTML(t.name||t.first_name||'')}', ${idx})">
      ${escapeHTML(t.name||t.first_name||'')}
    </div>`).join('');
}

function selectTeacher(id, name, idx) {
  const el = document.getElementById('cf_teacher_id_' + idx);
  const search = document.getElementById('cf_teacher_search_' + idx);
  const box = document.getElementById('cf_teacher_list_' + idx);
  if (el) el.value = id;
  if (search) search.value = name;
  if (box) box.style.display = 'none';
}

/* ---------- รายชื่อนักเรียนในห้อง ---------- */
function openClassroomStudents(roomId, roomName, ay) {
  showLoading('กำลังโหลด...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      showClassroomStudentDialog(roomId, roomName, ay, res.data);
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message||err); })
    .getClassroomStudents(roomName, ay, APP.token);
}

function showClassroomStudentDialog(roomId, roomName, ay, students) {
  let selected = new Set(students.map(s => s.id));

  Swal.fire({
    title: `นักเรียน ${escapeHTML(roomName)}`,
    width: 680,
    showCancelButton: false,
    showConfirmButton: false,
    showCloseButton: true,
    html: `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:13px;color:#64748B;">
          จำนวน ${students.length} คน (ปีการศึกษา ${escapeHTML(String(ay))})
        </div>
        ${students.length ? `
          <div id="clsNormalToolbar" style="display:flex;gap:6px;">
            <button type="button" class="btn btn-light" style="padding:4px 10px;font-size:12px;" onclick="toggleEditStudentNumbers(true)">
              <i class='bx bx-edit-alt'></i> แก้ไขเลขที่
            </button>
            <button type="button" class="btn btn-light" style="padding:4px 10px;font-size:12px;color:#4F46E5;font-weight:600;" onclick="openAutoAssignNumbersDialog('${escapeHTML(roomId)}','${escapeHTML(roomName)}','${escapeHTML(String(ay))}')">
              <i class='bx bx-sort-down'></i> จัดเรียงเลขที่
            </button>
          </div>
          <div id="clsEditToolbar" style="display:none;gap:6px;">
            <button type="button" class="btn btn-blue" style="padding:4px 12px;font-size:12px;" onclick="saveStudentNumbers('${escapeHTML(roomId)}','${escapeHTML(roomName)}','${escapeHTML(String(ay))}')">
              <i class='bx bx-save'></i> บันทึกเลขที่
            </button>
            <button type="button" class="btn btn-light" style="padding:4px 10px;font-size:12px;" onclick="toggleEditStudentNumbers(false)">
              ยกเลิก
            </button>
          </div>
        ` : ''}
      </div>
      <div id="clsEditBanner" style="display:none;padding:8px 12px;background:#EFF6FF;color:#1E40AF;border-radius:8px;font-size:12px;margin-bottom:10px;font-weight:500;">
        <i class='bx bx-info-circle'></i> <b>โหมดกำหนดเลขที่:</b> ป้อนเลขที่ของนักเรียนแต่ละคนในช่องด้านล่าง แล้วกด "บันทึกเลขที่"
      </div>
      ${students.length ? `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;
             background:#F8FAFC;border-radius:10px;margin-bottom:8px;cursor:pointer;"
             onclick="toggleSelectAll(this, ${students.length})">
          <input type="checkbox" id="chkAll" checked style="width:16px;height:16px;cursor:pointer;">
          <span style="font-weight:600;font-size:13px;">เลือกทั้งหมด</span>
          <span style="margin-left:auto;font-size:12px;color:#94A3B8;">${students.length} รายการ</span>
        </div>
        <div style="max-height:340px;overflow-y:auto;">
          ${students.map((s, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
                 border-radius:10px;cursor:pointer;transition:background .15s;"
                 onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''"
                 onclick="toggleStudent('${escapeHTML(s.id)}',this)">
              <input type="checkbox" id="chk_${escapeHTML(s.id)}" checked
                     style="width:16px;height:16px;cursor:pointer;" onclick="event.stopPropagation();"
                     onchange="toggleStudent('${escapeHTML(s.id)}',this.closest('div'))">
              ${avatarHTML(s.photo, s.first_name, 36)}
              <div style="flex:1;text-align:left;">
                <div style="font-weight:600;">${escapeHTML((s.prefix||'')+s.first_name+' '+s.last_name)}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                  <span style="font-size:11px;color:#94A3B8;">รหัส: ${escapeHTML(s.student_id||'-')}</span>
                  <span class="cls-num-badge" style="font-size:11px;font-weight:600;color:#2563EB;background:#EFF6FF;padding:1px 7px;border-radius:6px;border:1px solid #DBEAFE;">
                    เลขที่ ${s.student_number || (i+1)}
                  </span>
                  <div class="cls-num-edit" style="display:none;align-items:center;gap:4px;" onclick="event.stopPropagation();">
                    <span style="font-size:11px;font-weight:600;color:#475569;">เลขที่:</span>
                    <input type="number" class="cls-number-input" data-student-id="${escapeHTML(s.id)}"
                           value="${s.student_number !== null && s.student_number !== undefined ? s.student_number : (i+1)}"
                           min="1" max="999"
                           style="width:56px;padding:2px 6px;border:1.5px solid #3B82F6;border-radius:6px;text-align:center;font-weight:700;font-size:12px;outline:none;"
                           onclick="event.stopPropagation();">
                  </div>
                </div>
              </div>
              <button class="btn btn-light" style="padding:5px 8px;font-size:11px;"
                      onclick="event.stopPropagation();viewStudent('${escapeHTML(s.id)}')">
                <i class='bx bx-show'></i>
              </button>
              <button class="btn btn-light" style="padding:5px 8px;font-size:11px;color:#4F46E5;"
                      onclick="event.stopPropagation();openStudentForm('${escapeHTML(s.id)}')">
                <i class='bx bx-edit'></i>
              </button>
            </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid #E2E8F0;">
          <button class="btn btn-light" onclick="Swal.close()">
            <i class='bx bx-x'></i> ปิด
          </button>
          <button class="btn btn-blue" onclick="openTransferDialog('${escapeHTML(roomName)}','${escapeHTML(String(ay))}')">
            <i class='bx bx-transfer'></i> ย้ายนักเรียนที่เลือก...
          </button>
        </div>
      ` : `
        <div class="empty-state" style="padding:40px 0;">
          <i class='bx bxs-user-x'></i>
          ยังไม่มีนักเรียนในห้องนี้
        </div>
        <button class="btn btn-light" onclick="Swal.close()">ปิด</button>
      `}
    `
  });

  window._clsSelected = selected;
}

function toggleEditStudentNumbers(isEdit) {
  const banner = document.getElementById('clsEditBanner');
  const normalTb = document.getElementById('clsNormalToolbar');
  const editTb = document.getElementById('clsEditToolbar');
  const badges = document.querySelectorAll('.cls-num-badge');
  const edits = document.querySelectorAll('.cls-num-edit');

  if (banner) banner.style.display = isEdit ? 'block' : 'none';
  if (normalTb) normalTb.style.display = isEdit ? 'none' : 'flex';
  if (editTb) editTb.style.display = isEdit ? 'flex' : 'none';
  badges.forEach(b => b.style.display = isEdit ? 'none' : 'inline-block');
  edits.forEach(e => e.style.display = isEdit ? 'inline-flex' : 'none');
}

function saveStudentNumbers(roomId, roomName, ay) {
  const inputs = document.querySelectorAll('.cls-number-input');
  const numberMap = {};
  inputs.forEach(inp => {
    const sid = inp.getAttribute('data-student-id');
    const val = parseInt(inp.value, 10);
    if (sid) numberMap[sid] = (!isNaN(val) && val > 0) ? val : null;
  });

  showLoading('กำลังบันทึกเลขที่...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status === 'success') {
        showToast('success', res.message);
        openClassroomStudents(roomId, roomName, ay);
      } else {
        showToast('error', res.message);
      }
    })
    .withFailureHandler(err => {
      hideLoading();
      showToast('error', err.message || err);
    })
    .updateStudentNumbers(roomName, ay, numberMap, APP.token);
}

function openAutoAssignNumbersDialog(roomId, roomName, ay) {
  Swal.fire({
    title: 'จัดเรียงเลขที่อัตโนมัติ',
    html: `
      <div style="text-align:left;font-size:13px;line-height:1.5;">
        <p style="color:#64748B;margin-bottom:12px;">
          เลือกลำดับการจัดเรียงเลขที่สำหรับห้อง <b>${escapeHTML(roomName)}</b>:
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #3B82F6;background:#F0FDF4;border-radius:10px;cursor:pointer;">
            <input type="radio" name="auto_assign_mode" value="sgs_standard" checked style="margin-top:3px;accent-color:#2563EB;">
            <div>
              <div style="font-weight:700;color:#1E293B;">ตามมาตรฐาน สพฐ. / SGS (แนะนำ)</div>
              <div style="font-size:12px;color:#64748B;">เรียงนักเรียนชาย (ก-ฮ) ก่อน แล้วตามด้วยนักเรียนหญิง (ก-ฮ)</div>
            </div>
          </label>
          <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #E2E8F0;background:#F8FAFC;border-radius:10px;cursor:pointer;">
            <input type="radio" name="auto_assign_mode" value="thai_name" style="margin-top:3px;accent-color:#2563EB;">
            <div>
              <div style="font-weight:700;color:#1E293B;">เรียงตามชื่อ ก-ฮ (ทั้งหมด)</div>
              <div style="font-size:12px;color:#64748B;">เรียงตามลำดับพยัญชนะไทย ก ถึง ฮ โดยไม่แยกเพศ</div>
            </div>
          </label>
          <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1.5px solid #E2E8F0;background:#F8FAFC;border-radius:10px;cursor:pointer;">
            <input type="radio" name="auto_assign_mode" value="student_id" style="margin-top:3px;accent-color:#2563EB;">
            <div>
              <div style="font-weight:700;color:#1E293B;">เรียงตามเลขประจำตัวนักเรียน (SGS ID)</div>
              <div style="font-size:12px;color:#64748B;">เรียงจากรหัสประจำตัวนักเรียนน้อยไปมาก</div>
            </div>
          </label>
        </div>
      </div>
    `,
    width: 480,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-sort-down"></i> จัดเรียงทันที',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const selected = document.querySelector('input[name="auto_assign_mode"]:checked');
      return selected ? selected.value : 'sgs_standard';
    }
  }).then(r => {
    if (!r.isConfirmed) {
      openClassroomStudents(roomId, roomName, ay);
      return;
    }
    showLoading('กำลังจัดเรียงเลขที่...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          openClassroomStudents(roomId, roomName, ay);
        } else {
          showToast('error', res.message);
          openClassroomStudents(roomId, roomName, ay);
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        showToast('error', err.message || err);
        openClassroomStudents(roomId, roomName, ay);
      })
      .autoAssignStudentNumbers(roomName, ay, r.value, APP.token);
  });
}

function toggleStudent(id, row) {
  const chk = document.getElementById('chk_' + id);
  if (!chk) return;
  chk.checked = !chk.checked;
  if (chk.checked) window._clsSelected.add(id);
  else window._clsSelected.delete(id);
}

function toggleSelectAll(container, total) {
  const chkAll = document.getElementById('chkAll');
  chkAll.checked = !chkAll.checked;
  document.querySelectorAll('[id^="chk_"]').forEach(chk => {
    chk.checked = chkAll.checked;
    const id = chk.id.replace('chk_','');
    if (chkAll.checked) window._clsSelected.add(id);
    else window._clsSelected.delete(id);
  });
}

/* ---------- ย้ายห้อง ---------- */
function openTransferDialog(fromRoom, ay) {
  const selectedIds = Array.from(window._clsSelected || []);
  if (!selectedIds.length) return showToast('warning', 'กรุณาเลือกนักเรียนก่อน');

  const options = CLS.rooms
    .filter(r => r.name !== fromRoom && r.status === 'active')
    .map(r => `<option value="${escapeHTML(r.name)}">${escapeHTML(r.name)} (ปี ${r.academic_year})</option>`)
    .join('');

  Swal.fire({
    title: `ย้ายนักเรียน (${selectedIds.length} คน)`,
    html: `
      <div style="text-align:left;font-size:14px;">
        <p style="color:#64748B;margin-bottom:12px;">เลือกห้องเรียนปลายทางที่ต้องการย้ายนักเรียนไป</p>
        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">ห้องเรียนปลายทาง</label>
        <select id="transfer_target" class="form-input" style="width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:inherit;font-size:14px;">
          <option value="">-- เลือกห้องเรียน --</option>
          ${options}
        </select>
      </div>
    `,
    width: 440,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-transfer"></i> ย้ายเลย',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const target = document.getElementById('transfer_target').value;
      if (!target) { Swal.showValidationMessage('กรุณาเลือกห้องเรียนปลายทาง'); return false; }
      return target;
    }
  }).then(res => {
    if (!res.isConfirmed) return;
    showLoading('กำลังย้าย...');
    google.script.run
      .withSuccessHandler(r => {
        hideLoading();
        if (r.status === 'success') {
          Swal.close();
          showToast('success', r.message);
          loadClassroomList();
        } else {
          Swal.fire({ icon:'error', text: r.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message||err); })
      .transferStudents(selectedIds, res.value, APP.token);
  });
}

function deleteClassroomConfirm(id, name) {
  Swal.fire({
    title: `ลบห้อง "${name}"?`,
    text: 'ข้อมูลห้องเรียนจะถูกลบ (นักเรียนในห้องจะยังคงอยู่)',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadClassroomList(); }
        else showToast('error', res.message);
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message||err); })
      .deleteClassroom(id, APP.token);
  });
}


/* ============================================================
 *  STUDENT GRADE PROMOTION WIZARD (ระบบเลื่อนชั้นเรียน)
 * ============================================================ */

const PromotionState = {
  data: null,
  mapping: {},
  overrides: {},
  activeOverrideClass: null
};

window.openPromotionWizard = function() {
  showLoading('กำลังโหลดข้อมูลนักเรียนและห้องเรียน...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') {
        return showToast('error', res.message || 'ไม่สามารถโหลดข้อมูลเลื่อนชั้นได้');
      }
      PromotionState.data = res.data;
      PromotionState.mapping = {};
      PromotionState.overrides = {};
      PromotionState.activeOverrideClass = null;

      (res.data.suggested_mapping || []).forEach(m => {
        PromotionState.mapping[m.from_classroom] = {
          action: m.action,
          to_classroom: m.to_classroom
        };
      });

      renderPromotionWizardModal();
    })
    .withFailureHandler(err => {
      hideLoading();
      showToast('error', err.message || err);
    })
    .getPromotionPreview(APP.token);
};

function renderPromotionWizardModal() {
  const d = PromotionState.data;
  if (!d) return;

  const currentYear = d.current_year || '2569';
  const nextYear = d.next_year || '2570';
  const mappings = d.suggested_mapping || [];

  const html = `
    <div style="text-align:left; font-size:13px; color:#1E293B;">
      <!-- Header Banner -->
      <div style="background:linear-gradient(135deg,#4F46E5,#3730A3); border-radius:12px; padding:16px 20px; color:white; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:800; color:white; display:flex; align-items:center; gap:8px;">
              <i class='bx bx-up-arrow-circle' style="font-size:22px;"></i> ระบบเลื่อนชั้นเรียนประจำปีการศึกษา
            </h3>
            <p style="margin:3px 0 0 0; font-size:12px; color:#E0E7FF;">
              โรงเรียนมหาชัยพิทยาคาร • ปรับปรุงชั้นเรียนอัตโนมัติ ไม่ต้องกรอกรายชื่อใหม่
            </p>
          </div>
          <div>
            <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700;">
              นักเรียนทั้งหมด: ${d.total_students} คน
            </span>
          </div>
        </div>
      </div>

      <!-- Year Setup Box -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px 16px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:700; color:#475569; font-size:12.5px;">ปีการศึกษาปัจจุบัน:</span>
            <span style="background:#E2E8F0; padding:3px 8px; border-radius:6px; font-weight:800; color:#1E293B; font-size:13px;">${currentYear}</span>
          </div>
          <i class='bx bx-right-arrow-alt' style="font-size:20px; color:#94A3B8;"></i>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-weight:700; color:#4338CA; font-size:12.5px;">เลื่อนขึ้นสู่ปีการศึกษาใหม่:</span>
            <input type="text" id="promo_target_year" value="${nextYear}" style="width:75px; padding:4px 8px; border:2px solid #818CF8; border-radius:8px; font-weight:800; font-size:13.5px; text-align:center; color:#312E81; outline:none;">
          </div>
          ${d.can_rollback ? `
            <button type="button" class="btn btn-light" onclick="triggerRollbackPromotion()" style="margin-left:auto; font-size:11.5px; padding:4px 10px; color:#B91C1C; border-color:#FECDD3;">
              <i class='bx bx-undo'></i> ย้อนกลับการเลื่อนชั้นครั้งก่อน
            </button>
          ` : ''}
        </div>
        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #CBD5E1;">
          <label style="display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; color:#334155; cursor:pointer;">
            <input type="checkbox" id="promo_update_system_year" checked style="width:15px; height:15px; accent-color:#4F46E5;">
            <span>ปรับเปลี่ยนปีการศึกษาหลักของระบบเป็นปีการศึกษาใหม่ทันทีหลังจากเลื่อนชั้นเสร็จสิ้น</span>
          </label>
        </div>
      </div>

      <!-- Mapping Table Header -->
      <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <h4 style="margin:0; font-size:13.5px; font-weight:800; color:#0F172A; display:flex; align-items:center; gap:6px;">
          <i class='bx bx-git-branch text-indigo-600'></i> แผนผังการเลื่อนชั้นห้องเรียน
        </h4>
        <span style="font-size:11.5px; color:#64748B;">คลิก "ปรับรายคน" เพื่อระบุนักเรียนที่ซ้ำชั้นหรือไม่เลื่อน</span>
      </div>

      <!-- Mapping Table Scroll Box -->
      <div style="max-height:280px; overflow-y:auto; border:1px solid #E2E8F0; border-radius:10px; margin-bottom:12px;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="background:#F1F5F9; border-bottom:1px solid #CBD5E1; color:#334155; position:sticky; top:0; z-index:2;">
              <th style="padding:8px 10px; text-align:left;">ห้องเรียนเดิม (${currentYear})</th>
              <th style="padding:8px 6px; text-align:center; width:80px;">จำนวน</th>
              <th style="padding:8px 4px; text-align:center; width:30px;"></th>
              <th style="padding:8px 10px; text-align:left;">การดำเนินการ / ห้องเรียนปลายทาง (${nextYear})</th>
              <th style="padding:8px 8px; text-align:center; width:110px;">ข้อยกเว้น</th>
            </tr>
          </thead>
          <tbody>
            ${mappings.map(m => {
              const currentAction = PromotionState.mapping[m.from_classroom]?.action || m.action;
              const currentTo = PromotionState.mapping[m.from_classroom]?.to_classroom || m.to_classroom;
              const overrideCount = Object.keys(PromotionState.overrides).filter(sid => {
                const s = (d.students_by_class[m.from_classroom] || []).find(x => x.id === sid);
                return !!s;
              }).length;

              return `
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:8px 10px; font-weight:700; color:#1E293B;">
                    ชั้น ${escapeHTML(m.from_classroom)}
                  </td>
                  <td style="padding:8px 6px; text-align:center; font-semibold; color:#475569;">
                    ${m.student_count} คน
                  </td>
                  <td style="padding:8px 4px; text-align:center; color:#94A3B8;">
                    ➔
                  </td>
                  <td style="padding:8px 10px;">
                    <select class="promo-select" style="width:100%; padding:5px 8px; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; background:white; font-weight:600;" onchange="onPromoRoomChange('${escapeHTML(m.from_classroom)}', this.value)">
                      <option value="promote:${m.to_classroom}" ${currentAction==='promote' && currentTo===m.to_classroom ? 'selected' : ''}>
                        🚀 เลื่อนขึ้น: ชั้น ${escapeHTML(m.to_classroom)}
                      </option>
                      <option value="graduate:จบการศึกษา" ${currentAction==='graduate' ? 'selected' : ''}>
                        🎓 สำเร็จการศึกษา (จบการศึกษา)
                      </option>
                      <option value="retain:${m.from_classroom}" ${currentAction==='retain' ? 'selected' : ''}>
                        ⏸️ คงชั้นเดิม (ซ้ำชั้นทั้งห้อง)
                      </option>
                    </select>
                  </td>
                  <td style="padding:8px 8px; text-align:center;">
                    <button type="button" class="btn btn-light" style="font-size:11px; padding:3px 8px;" onclick="toggleStudentOverridePanel('${escapeHTML(m.from_classroom)}')">
                      <i class='bx bx-user'></i> ปรับรายคน
                      ${overrideCount > 0 ? `<b style="color:#4F46E5; margin-left:2px;">(${overrideCount})</b>` : ''}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Expandable Student Override Box -->
      <div id="promoStudentOverridePanel" style="display:none; background:#F8FAFC; border:1.5px solid #CBD5E1; border-radius:10px; padding:12px; margin-bottom:12px; max-height:220px; overflow-y:auto;">
      </div>
    </div>
  `;

  Swal.fire({
    title: null,
    html: html,
    width: 820,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-check"></i> ดำเนินการเลื่อนชั้นเรียน',
    confirmButtonColor: '#4F46E5',
    cancelButtonText: 'ยกเลิก',
    customClass: {
      popup: 'rounded-2xl',
      actions: 'gap-2'
    },
    preConfirm: () => {
      return confirmExecutePromotion();
    }
  });
}

window.onPromoRoomChange = function(fromRoom, val) {
  const parts = val.split(':');
  const action = parts[0];
  const toRoom = parts[1] || '';
  if (!PromotionState.mapping[fromRoom]) PromotionState.mapping[fromRoom] = {};
  PromotionState.mapping[fromRoom].action = action;
  PromotionState.mapping[fromRoom].to_classroom = toRoom;
};

window.toggleStudentOverridePanel = function(classroom) {
  const panel = document.getElementById('promoStudentOverridePanel');
  if (!panel) return;

  if (PromotionState.activeOverrideClass === classroom && panel.style.display !== 'none') {
    panel.style.display = 'none';
    PromotionState.activeOverrideClass = null;
    return;
  }

  PromotionState.activeOverrideClass = classroom;
  panel.style.display = 'block';

  const students = PromotionState.data?.students_by_class?.[classroom] || [];
  const currentAction = PromotionState.mapping[classroom]?.action || 'promote';
  const currentToRoom = PromotionState.mapping[classroom]?.to_classroom || classroom;

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div style="font-weight:800; font-size:12.5px; color:#1E293B;">
        <i class='bx bx-user-check text-indigo-600'></i> ปรับข้อยกเว้นรายคน: ชั้น ${escapeHTML(classroom)} (${students.length} คน)
      </div>
      <button type="button" class="btn btn-light" style="padding:2px 6px; font-size:11px;" onclick="document.getElementById('promoStudentOverridePanel').style.display='none';">
        <i class='bx bx-x'></i> ปิด
      </button>
    </div>
    <div style="font-size:11px; color:#64748B; margin-bottom:8px;">
      กำหนดสถานะเฉพาะนักเรียนที่ไม่ต้องการเลื่อนตามห้อง (เช่น ซ้ำชั้น หรือไม่ผ่านเกณฑ์)
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:11.5px;">
      <thead>
        <tr style="background:#E2E8F0; color:#334155;">
          <th style="padding:5px 6px; width:35px; text-align:center;">ที่</th>
          <th style="padding:5px 6px; width:70px; text-align:center;">รหัส</th>
          <th style="padding:5px 8px; text-align:left;">ชื่อ - นามสกุล</th>
          <th style="padding:5px 8px; text-align:left;">การดำเนินการเฉพาะบุคคล</th>
        </tr>
      </thead>
      <tbody>
        ${students.map((s, idx) => {
          const ov = PromotionState.overrides[s.id];
          const curVal = ov ? (ov.action + (ov.target_classroom ? (':' + ov.target_classroom) : '')) : 'default';

          return `
            <tr style="border-bottom:1px solid #E2E8F0;">
              <td style="padding:4px 6px; text-align:center; color:#64748B;">${idx + 1}</td>
              <td style="padding:4px 6px; text-align:center; font-mono text-slate-500;">${escapeHTML(s.student_code || '-')}</td>
              <td style="padding:4px 8px; font-weight:600; color:#1E293B;">${escapeHTML(s.name)}</td>
              <td style="padding:4px 8px;">
                <select style="width:100%; padding:3px 6px; border:1px solid #CBD5E1; border-radius:4px; font-size:11px; background:${ov ? '#EFF6FF' : 'white'}; font-weight:${ov ? '700' : 'normal'};" onchange="onStudentOverrideChange('${s.id}', this.value, '${escapeHTML(classroom)}')">
                  <option value="default" ${curVal==='default'?'selected':''}>เลื่อนตามห้อง (${currentAction==='graduate'?'จบการศึกษา':('ขึ้นชั้น ' + currentToRoom)})</option>
                  <option value="retain:${classroom}" ${curVal.startsWith('retain')?'selected':''}>⏸️ คงชั้นเดิม (ซ้ำชั้น ${escapeHTML(classroom)})</option>
                  <option value="graduate:จบการศึกษา" ${curVal.startsWith('graduate')?'selected':''}>🎓 จบการศึกษา</option>
                </select>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
};

window.onStudentOverrideChange = function(studentId, val, classroom) {
  if (val === 'default') {
    delete PromotionState.overrides[studentId];
  } else {
    const parts = val.split(':');
    PromotionState.overrides[studentId] = {
      action: parts[0],
      target_classroom: parts[1] || ''
    };
  }
};

window.confirmExecutePromotion = function() {
  const targetYear = document.getElementById('promo_target_year')?.value?.trim();
  const updateSystemYear = !!document.getElementById('promo_update_system_year')?.checked;

  if (!targetYear) {
    showToast('warning', 'กรุณาระบุปีการศึกษาใหม่');
    return false;
  }

  const d = PromotionState.data;
  let promoCount = 0;
  let gradCount = 0;
  let retainCount = 0;

  Object.keys(d.students_by_class || {}).forEach(cls => {
    const students = d.students_by_class[cls] || [];
    const roomMap = PromotionState.mapping[cls] || { action: 'promote' };

    students.forEach(s => {
      const ov = PromotionState.overrides[s.id];
      const act = ov ? ov.action : roomMap.action;
      if (act === 'graduate') gradCount++;
      else if (act === 'retain') retainCount++;
      else promoCount++;
    });
  });

  Swal.fire({
    title: 'ยืนยันการเลื่อนชั้นเรียน?',
    html: `
      <div style="text-align:left; font-size:13px; color:#334155; line-height:1.6;">
        <p style="margin-top:0;">ระบบกำลังจะดำเนินการเลื่อนชั้นนักเรียนขึ้นสู่ปีการศึกษา <b>${targetYear}</b> ดังนี้:</p>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:10px 14px; margin:10px 0;">
          <div>🚀 เลื่อนชั้นเรียน: <b style="color:#4F46E5;">${promoCount} คน</b></div>
          <div>🎓 สำเร็จการศึกษา: <b style="color:#059669;">${gradCount} คน</b></div>
          <div>⏸️ ซ้ำชั้น / คงชั้นเดิม: <b style="color:#D97706;">${retainCount} คน</b></div>
        </div>
        <p style="font-size:11.5px; color:#64748B; margin-bottom:0;">
          * ข้อมูลเดิมทั้งหมดจะถูกสำรองไว้ก่อนดำเนินการ สามารถกดย้อนกลับ (Rollback) ได้ทุกเมื่อ
        </p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-check"></i> ยืนยันเลื่อนชั้นทันที',
    confirmButtonColor: '#4F46E5',
    cancelButtonText: 'กลับไปตรวจสอบ'
  }).then(r => {
    if (!r.isConfirmed) {
      renderPromotionWizardModal();
      return;
    }

    showLoading('กำลังดำเนินการเลื่อนชั้นเรียนและสำรองข้อมูล...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          Swal.fire({
            title: 'เลื่อนชั้นเรียนสำเร็จ!',
            text: res.message,
            icon: 'success',
            confirmButtonColor: '#4F46E5'
          }).then(() => {
            if (typeof loadClassroomList === 'function') loadClassroomList();
            if (typeof loadStudents === 'function') loadStudents();
            if (typeof loadDashboardData === 'function') loadDashboardData(true);
          });
        } else {
          Swal.fire({ title: 'เกิดข้อผิดพลาด', text: res.message, icon: 'error' });
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message || err, icon: 'error' });
      })
      .executePromotion({
        target_year: targetYear,
        mapping: PromotionState.mapping,
        overrides: PromotionState.overrides,
        update_system_year: updateSystemYear
      }, APP.token);
  });

  return false;
};

window.triggerRollbackPromotion = function() {
  Swal.fire({
    title: 'ย้อนกลับการเลื่อนชั้นครั้งก่อน?',
    text: 'ระบบจะคืนค่าห้องเรียนและสถานะของนักเรียนทุกคนกลับสู่สภาวะเดิมก่อนการเลื่อนชั้นครั้งล่าสุด',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ย้อนกลับข้อมูล',
    confirmButtonColor: '#DC2626',
    cancelButtonText: 'ยกเลิก'
  }).then(r => {
    if (!r.isConfirmed) return;

    showLoading('กำลังเรียกคืนข้อมูลนักเรียน...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          openPromotionWizard();
          if (typeof loadClassroomList === 'function') loadClassroomList();
          if (typeof loadStudents === 'function') loadStudents();
        } else {
          showToast('error', res.message);
        }
      })
      .withFailureHandler(err => {
        hideLoading();
        showToast('error', err.message || err);
      })
      .rollbackPromotion(APP.token);
  });
};
