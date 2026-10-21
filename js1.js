/* ============================================================
 *  Smart School Office — js1
 *  Part 1: Auth | Session | Navigation | Dashboard | Upload
 * ============================================================ */

/* ---------- Global State ---------- */
const APP = {
  token: null,
  user : null,
  role : null,
  config: null,
  currentPage: 'dashboard',
  charts: {},
  dashboardData: null
};


/* ============================================================
 *  Boot
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('sso_token') || localStorage.getItem('sso_token');
  if (saved) {
    APP.token = saved;
    showLoading('กำลังตรวจสอบการเข้าสู่ระบบ...');
    google.script.run
      .withSuccessHandler(handleSessionCheck)
      .withFailureHandler(() => {
        hideLoading();
        if (typeof window.handleSessionInvalid === 'function') {
          window.handleSessionInvalid('ไม่สามารถตรวจสอบเซสชันได้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        } else {
          showLoginScreen();
        }
      })
      .validateSession(saved);
  } else {
    showLoginScreen();
  }
});

function handleSessionCheck(res) {
  hideLoading();
  if (res && res.valid) {
    APP.user = res.user;
    APP.role = res.role;
    if (res.dashboardData) {
      APP.dashboardData = res.dashboardData;
      APP._dashboardTs = Date.now();
    }
    enterApp();
  } else {
    if (typeof window.handleSessionInvalid === 'function') {
      window.handleSessionInvalid('เซสชันเดิมหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
    } else {
      sessionStorage.removeItem('sso_token');
      localStorage.removeItem('sso_token');
      showLoginScreen();
    }
  }
}


/* ============================================================
 *  Login Screen
 * ============================================================ */
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appLayout').style.display   = 'none';
  setTimeout(() => document.getElementById('loginUsername').focus(), 200);
}

function switchLoginTab(tab) {
  // Tabs unified into a single login portal
  const inp = document.getElementById('loginUsername');
  if (inp) inp.focus();
}

function togglePassword() {
  const inp = document.getElementById('loginPassword');
  const icn = document.getElementById('pwdIcon');
  if (inp.type === 'password') { inp.type = 'text';     icn.className = 'bx bx-hide'; }
  else                          { inp.type = 'password'; icn.className = 'bx bx-show'; }
}

function doLogin() {
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;

  if (!u || !p) {
    return showToast('warning', 'กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;">\x3c/div> กำลังตรวจสอบ...';

  google.script.run
    .withSuccessHandler(res => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-log-in-circle">\x3c/i> เข้าสู่ระบบ';

      if (res.status !== 'success') {
        return Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: res.message || 'รหัสผ่านไม่ถูกต้อง',
          confirmButtonText: 'ตกลง'
        });
      }
      APP.token = res.token;
      APP.user  = res.user;
      APP.role  = res.user.role;
      if (res.dashboardData) {
        APP.dashboardData = res.dashboardData;
        APP._dashboardTs = Date.now();
      }
      (remember ? localStorage : sessionStorage).setItem('sso_token', res.token);
      enterApp();
    })
    .withFailureHandler(err => {
      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-log-in-circle">\x3c/i> เข้าสู่ระบบ';
      Swal.fire({ icon:'error', title:'เกิดข้อผิดพลาด', text: err.message || err });
    })
    .login(u, p);
}

function quickFillLogin(role) {
  const uInp = document.getElementById('loginUsername');
  const pInp = document.getElementById('loginPassword');
  if (!uInp || !pInp) return;

  if (role === 'director') {
    uInp.value = 'director';
    pInp.value = 'Director@2024';
    if (typeof showToast === 'function') showToast('info', 'กรอกบัญชี ผอ. นายอธิการ สุขศรี');
  } else if (role === 'deputy') {
    uInp.value = 'deputy';
    pInp.value = 'Deputy@2024';
    if (typeof showToast === 'function') showToast('info', 'กรอกบัญชี รอง ผอ. นายสันติ อุดคำ');
  } else if (role === 'admin') {
    uInp.value = 'admin';
    pInp.value = 'Admin@2024';
    if (typeof showToast === 'function') showToast('info', 'กรอกบัญชี ผู้ดูแลระบบ (admin)');
  } else if (role === 'executive_picker') {
    Swal.fire({
      title: '<div class="text-base font-bold flex items-center justify-center gap-2"><i class="bx bx-shield-quarter text-amber-500 text-xl"></i> เลือกบัญชีฝ่ายบริหารสำหรับเข้าสู่ระบบ</div>',
      html: `
        <div class="space-y-2 text-left pt-2">
          <button type="button" onclick="Swal.close(); quickFillLogin('director');" class="w-full p-3 rounded-xl border border-indigo-200 hover:border-indigo-400 bg-indigo-50/70 hover:bg-indigo-100 flex items-center justify-between text-left transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                ผอ
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm">ผอ. นายอธิการ สุขศรี</div>
                <div class="text-xs text-slate-500">ผู้อำนวยการโรงเรียนมหาชัยพิทยาคาร</div>
              </div>
            </div>
            <span class="text-xs font-mono font-bold bg-white text-indigo-700 px-2 py-1 rounded-md border border-indigo-200">director</span>
          </button>

          <button type="button" onclick="Swal.close(); quickFillLogin('deputy');" class="w-full p-3 rounded-xl border border-purple-200 hover:border-purple-400 bg-purple-50/70 hover:bg-purple-100 flex items-center justify-between text-left transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                รอง
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm">รอง ผอ. นายสันติ อุดคำ</div>
                <div class="text-xs text-slate-500">รองผู้อำนวยการโรงเรียน</div>
              </div>
            </div>
            <span class="text-xs font-mono font-bold bg-white text-purple-700 px-2 py-1 rounded-md border border-purple-200">deputy</span>
          </button>

          <button type="button" onclick="Swal.close(); quickFillLogin('admin');" class="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                <i class='bx bx-cog text-lg'></i>
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm">ผู้ดูแลระบบ (Admin)</div>
                <div class="text-xs text-slate-500">จัดการข้อมูลและโครงสร้างระบบ</div>
              </div>
            </div>
            <span class="text-xs font-mono font-bold bg-white text-slate-700 px-2 py-1 rounded-md border border-slate-200">admin</span>
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true
    });
  }
}

function forgotPassword() {
  Swal.fire({
    icon: 'info',
    title: 'ข้อมูลบัญชีและการเข้าสู่ระบบ',
    html: `
      <div class="text-left text-sm space-y-2 text-slate-700">
        <div><b>บัญชีมาตรฐานฝ่ายบริหาร:</b></div>
        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 font-mono text-xs">
          <div>• <b>ผอ. นายอธิการ สุขศรี:</b> director / Director@2024</div>
          <div>• <b>รอง ผอ. นายสันติ อุดคำ:</b> deputy / Deputy@2024</div>
          <div>• <b>ผู้ดูแลระบบ:</b> admin / Admin@2024</div>
        </div>
        <div class="text-xs text-slate-500 pt-1">* หากเปลี่ยนรหัสผ่านแล้วลืม สามารถติดต่อผู้ดูแลระบบเพื่อรีเซ็ตได้ที่เมนู "จัดการผู้ใช้งาน"</div>
      </div>
    `,
    confirmButtonText: 'รับทราบ'
  });
}


/* ============================================================
 *  Logout
 * ============================================================ */
function doLogout() {
  Swal.fire({
    title: 'ต้องการออกจากระบบหรือไม่?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText : 'ยกเลิก',
    confirmButtonColor: '#DC2626'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังออกจากระบบ...');
    if (APP._badgeInterval) {
      clearInterval(APP._badgeInterval);
      APP._badgeInterval = null;
    }
    const curToken = APP.token;
    sessionStorage.removeItem('sso_token');
    localStorage.removeItem('sso_token');
    APP.token = null; APP.user = null; APP.role = null;
    if (typeof window.clearAppCache === 'function') window.clearAppCache();

    google.script.run
      .withSuccessHandler(() => {
        hideLoading();
        showLoginScreen();
      })
      .withFailureHandler(() => {
        hideLoading();
        showLoginScreen();
      })
      .logout(curToken);
  });
}


/* ============================================================
 *  Enter App
 * ============================================================ */
function enterApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appLayout').style.display   = 'flex';

  // Apply dynamic config
  if (APP.dashboardData && APP.dashboardData.config) {
    const config = APP.dashboardData.config;
    if (config.school_name) {
      const el = document.getElementById('brandSchoolName');
      if (el) el.textContent = config.school_name;
      localStorage.setItem('cached_school_name', config.school_name);
    }
    if (config.school_logo) {
      localStorage.setItem('cached_school_logo', config.school_logo);
      
      const logoBox = document.getElementById('logoBoxSidebar');
      if (logoBox) {
        logoBox.classList.add('has-image');
        logoBox.innerHTML = `<img src="${config.school_logo}" 
             onerror="handleLogoError(this, 'sidebarLogoIcon', 'logoBoxSidebar')"
             style="max-height:100%; max-width:100%; border-radius:8px; object-fit:contain;">
        <i class='bx bxs-graduation' id="sidebarLogoIcon" style="display:none;"></i>`;
      }
    }
    if (config.director_name) {
      localStorage.setItem('cached_director_name', config.director_name);
    }
  }

  // ผู้ใช้
  const sidebarName = document.getElementById('sidebarUserName');
  if (sidebarName) sidebarName.textContent = APP.user.name || APP.user.username;
  
  const sidebarRole = document.getElementById('sidebarUserRole');
  if (sidebarRole) sidebarRole.textContent = ({ admin:'ผู้ดูแลระบบ', director:'ผู้อำนวยการโรงเรียน', deputy:'รองผู้อำนวยการโรงเรียน', staff:'เจ้าหน้าที่', teacher:'ครู' })[APP.role] || APP.role;

  const av = document.getElementById('sidebarAvatar');
  if (av) {
    if (APP.user.avatar) {
      av.style.backgroundImage = 'url(' + APP.user.avatar + ')';
      av.textContent = '';
    } else {
      av.textContent = (APP.user.name || APP.user.username || 'U').charAt(0).toUpperCase();
    }
  }

  // ซ่อนเมนู admin ถ้าไม่ใช่ admin หรือผู้บริหาร
  const isAdmin = APP.role === 'admin' || APP.role === 'director' || APP.role === 'deputy';
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? '' : 'none');
  const divAdmin = document.getElementById('adminDivider');
  if (divAdmin) divAdmin.style.display = isAdmin ? '' : 'none';
  const lblAdmin = document.getElementById('adminLabel');
  if (lblAdmin) lblAdmin.style.display = isAdmin ? '' : 'none';

  // แสดงเมนู staff-only ให้ทุกคน (แต่จะจำกัดสิทธิ์แก้ไขในแต่ละหน้าต่าง)
  document.querySelectorAll('.staff-only').forEach(el => {
    el.style.display = '';
  });

  navigate('dashboard');
  refreshBadges();
  if (APP._badgeInterval) clearInterval(APP._badgeInterval);
  APP._badgeInterval = setInterval(refreshBadges, 120000);
  if (typeof startChatHeartbeat === 'function') startChatHeartbeat();
  if (typeof fetchOnlineUsersList === 'function') fetchOnlineUsersList();
}

/* ============================================================
 *  Dark Mode Toggle & Chart Theme Sync
 * ============================================================ */
function applyChartTheme(isDark) {
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = isDark ? '#94A3B8' : '#64748B';
    Chart.defaults.borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  }
  if (window.APP && window.APP.charts) {
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
    const tickColor = isDark ? '#94A3B8' : '#64748B';
    const legendColor = isDark ? '#E2E8F0' : '#475569';

    Object.values(window.APP.charts).forEach(c => {
      if (!c || !c.options) return;
      if (c.options.scales) {
        ['x', 'y'].forEach(axis => {
          if (c.options.scales[axis]) {
            if (c.options.scales[axis].grid && c.options.scales[axis].grid.display !== false) {
              c.options.scales[axis].grid.color = gridColor;
            }
            if (c.options.scales[axis].ticks) {
              c.options.scales[axis].ticks.color = tickColor;
            }
          }
        });
      }
      if (c.options.plugins && c.options.plugins.legend && c.options.plugins.legend.labels) {
        c.options.plugins.legend.labels.color = legendColor;
      }
      try { c.update(); } catch (_) {}
    });
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('smart_school_dark_mode', isDark);
  
  const icon = document.querySelector('#btnDarkMode i');
  if (icon) {
    icon.className = isDark ? 'bx bx-sun' : 'bx bx-moon';
  }
  applyChartTheme(isDark);
}

// Initial icon & theme state
document.addEventListener('DOMContentLoaded', () => {
  const isDark = localStorage.getItem('smart_school_dark_mode') === 'true';
  if (isDark) {
    document.documentElement.classList.add('dark', 'dark-mode');
    const icon = document.querySelector('#btnDarkMode i');
    if (icon) icon.className = 'bx bx-sun';
  }
  applyChartTheme(isDark);
});

/* ============================================================
 *  Access Control Helper
 * ============================================================ */
function canEditModule(moduleName) {
  if (moduleName === 'personnel') {
    return APP.role === 'admin' || APP.role === 'director' || APP.role === 'deputy';
  }
  
  if (APP.role === 'admin' || APP.role === 'director' || APP.role === 'deputy' || APP.role === 'staff') return true;
  if (APP.role !== 'teacher') return false;
  
  const dept = (APP.user.department || '').toLowerCase();
  switch (moduleName) {
    case 'finance': return dept.includes('การเงิน') || dept.includes('งบประมาณ');
    case 'budget':  return dept.includes('การเงิน') || dept.includes('งบประมาณ');
    case 'registration': return dept.includes('ทะเบียน') || dept.includes('วัดผล') || dept.includes('วิชาการ');
    case 'documents': return dept.includes('ธุรการ') || dept.includes('สารบรรณ') || dept.includes('อำนวยการ') || dept.includes('บริหาร') || dept.includes('ทั่วไป');
  }
  return false;
}


/* ============================================================
 *  Navigation
 * ============================================================ */
function navigate(page) {
  APP.currentPage = page;

  // active state
  document.querySelectorAll('.menu-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const titles = {
    dashboard: 'หน้าหลัก',
    chat: 'สนทนาครูและบุคลากร',
    students: 'ข้อมูลนักเรียน',
    classroom_mgmt: 'จัดการห้องเรียน',
    behavior: 'พฤติกรรมนักเรียน',
    student_card: 'บัตรนักเรียน',
    qr_attendance: 'เช็คชื่อ QR Code',
    personnel: 'ครูและบุคลากร',
    attendance: 'การเข้าเรียน',
    academic: 'งานวิชาการ',
    registration: 'งานทะเบียน',
    finance: 'งานการเงิน',
    budget: 'ระบบงบประมาณ',
    documents: 'สารบรรณโรงเรียน',
    approvals: 'ระบบอนุมัติ',
    calendar: 'ปฏิทินและข่าวสาร',
    files: 'คลังไฟล์',
    templates: 'แบบฟอร์มงาน 4 ฝ่าย',
    reports: 'รายงาน',
    users: 'จัดการผู้ใช้งาน',
    settings: 'ตั้งค่าระบบ',
    schedule: 'ตารางสอน',
    manual  : 'คู่มือการใช้งาน',
    ext_sgs : 'โปรแกรมช่วยกรอกคะแนน SGS',
    ext_nited: 'ระบบนิเทศภายใน',
    ext_homevisit: 'ระบบเยี่ยมบ้าน',
    ext_portfolio: 'ระบบเก็บผลงานและข้อมูลการอบรม',
    ext_training: 'ระบบเก็บผลงานและข้อมูลการอบรม'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'หน้าหลัก';

  toggleSidebar(false);

  // ทำลาย charts เดิม
  Object.keys(APP.charts).forEach(k => {
    try { APP.charts[k].destroy(); } catch(_){}
    delete APP.charts[k];
  });

  // route
  const content = document.getElementById('pageContent');
  switch (page) {
    case 'dashboard': return renderDashboard(content);
    case 'chat':      if (typeof renderChat === 'function') return renderChat(content); break;
    case 'students':  if (typeof renderStudents  === 'function') return renderStudents(content);  break;
    case 'classroom_mgmt': if (typeof renderClassroomMgmt === 'function') return renderClassroomMgmt(content); break;
    case 'behavior':  if (typeof renderBehavior  === 'function') return renderBehavior(content);  break;
    case 'student_card': if (typeof renderStudentCard === 'function') return renderStudentCard(content); break;
    case 'qr_attendance': if (typeof renderQRAttendance === 'function') return renderQRAttendance(content); break;
    case 'personnel': if (typeof renderPersonnel === 'function') return renderPersonnel(content); break;
    case 'attendance':if (typeof renderAttendance=== 'function') return renderAttendance(content); break;
    case 'academic':  if (typeof renderAcademic  === 'function') return renderAcademic(content);  break;
    case 'registration': if (typeof renderRegistration === 'function') return renderRegistration(content); break;
    case 'finance':   if (typeof renderFinance   === 'function') return renderFinance(content);   break;
    case 'budget':    return renderBudget(content);
    case 'documents': if (typeof renderDocuments === 'function') return renderDocuments(content); break;
    case 'approvals': if (typeof renderApprovals === 'function') return renderApprovals(content); break;
    case 'calendar':  if (typeof renderCalendar  === 'function') return renderCalendar(content);  break;
    case 'files':     if (typeof renderFiles     === 'function') return renderFiles(content);     break;
    case 'templates': if (typeof renderTemplates === 'function') return renderTemplates(content); break;
    case 'reports':   if (typeof renderReports   === 'function') return renderReports(content);   break;
    case 'users':     if (typeof renderUsers     === 'function') return renderUsers(content);     break;
    case 'settings':  if (typeof renderSettings  === 'function') return renderSettings(content);  break;
    case 'schedule':  if (typeof renderSchedule  === 'function') return renderSchedule(content);  break;
    case 'manual':    if (typeof renderManual    === 'function') return renderManual(content);    break;
    case 'ext_sgs':   return renderExtSgs(content);
    case 'ext_nited': return renderIframe(content, 'https://script.google.com/macros/s/AKfycbwhRcZMFI1aKaOVmlecoujOp_vhRS1RaEIczGefuyDfrgRZyNATB4tfb3oukcJ6InvbwA/exec', 'ระบบนิเทศภายใน');
    case 'ext_homevisit': return renderIframe(content, 'https://script.google.com/macros/s/AKfycbzPVxRjrQ-693tDZa1XdaGxNkLYH_dlZnxQQ-P_co0lxWlXrTbgvvhGIOgJ0NUMpn4B/exec', 'ระบบเยี่ยมบ้าน');
    case 'ext_training':
    case 'ext_portfolio': return renderIframe(content, 'https://script.google.com/macros/s/AKfycby38tVx6RFc9CNsWuP8AZG4RPTGZ9PsjbFS-tLnydiTLDooW2z7x1nwmDlSng1TQm2M/exec', 'ระบบเก็บผลงานและข้อมูลการอบรม');
  }
  // ถ้าไม่มี renderer ใน Part นี้ → แสดง placeholder
  renderComingSoon(content, titles[page] || page);
}

function renderComingSoon(container, label) {
  container.innerHTML = `
    <div class="coming-soon">
      <i class='bx bx-rocket'>\x3c/i>
      <h3>หน้า "${label}" กำลังพัฒนาในส่วนถัดไป\x3c/h3>
      <p>ฟีเจอร์นี้จะเปิดใช้งานใน Part ถัดไป กลับสู่หน้าหลักเพื่อใช้งานต่อ\x3c/p>
      <button class="btn btn-blue mt-4" onclick="navigate('dashboard')">
        <i class='bx bx-home-alt'>\x3c/i> กลับหน้าหลัก
      \x3c/button>
    \x3c/div>`;
}

function toggleSidebar(open) {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  if (open === true)  { sb.classList.add('open');    bd.classList.add('show'); return; }
  if (open === false) { sb.classList.remove('open'); bd.classList.remove('show'); return; }
  sb.classList.toggle('open');
  bd.classList.toggle('show');
}

/* ─── Global Quick Search (Ctrl+K / Cmd+K) ─────────────────── */
window.openGlobalSearch = function() {
  const menuPages = [
    { title: 'หน้าหลัก (ภาพรวม)', icon: 'bxs-home-alt-2', page: 'dashboard', cat: 'ทั่วไป' },
    { title: 'เช็คชื่อการเข้าเรียน / แถวเสาธง', icon: 'bxs-check-square', page: 'attendance', cat: 'งานวิชาการ' },
    { title: 'ตารางสอนประจำชั้น / รายครู', icon: 'bxs-calendar-check', page: 'schedule', cat: 'งานวิชาการ' },
    { title: 'ข้อมูลนักเรียน', icon: 'bxs-user-detail', page: 'students', cat: 'งานวิชาการ' },
    { title: 'จัดการห้องเรียน & เลื่อนชั้นเรียน', icon: 'bxs-school', page: 'classroom_mgmt', cat: 'งานวิชาการ' },
    { title: 'พฤติกรรมนักเรียน / บันทึกคะแนน', icon: 'bxs-heart', page: 'behavior', cat: 'งานวิชาการ' },
    { title: 'พิมพ์บัตรนักเรียน', icon: 'bxs-id-card', page: 'student_card', cat: 'งานวิชาการ' },
    { title: 'เช็คชื่อ QR Code อัตโนมัติ', icon: 'bx-qr-scan', page: 'qr_attendance', cat: 'งานวิชาการ' },
    { title: 'งานวิชาการ & ปพ.5', icon: 'bxs-book-content', page: 'academic', cat: 'งานวิชาการ' },
    { title: 'ครูและบุคลากร', icon: 'bxs-group', page: 'personnel', cat: 'บริหารบุคคล' },
    { title: 'สารบรรณโรงเรียน (รับ-ส่งหนังสือ)', icon: 'bxs-envelope', page: 'documents', cat: 'บริหารทั่วไป' },
    { title: 'แบบฟอร์มงาน 4 ฝ่าย (30 ฟอร์ม)', icon: 'bxs-file-doc', page: 'templates', cat: 'บริหารทั่วไป' },
    { title: 'ระบบอนุมัติเอกสาร', icon: 'bxs-badge-check', page: 'approvals', cat: 'บริหารทั่วไป' },
    { title: 'คลังไฟล์เอกสาร', icon: 'bxs-folder', page: 'files', cat: 'บริหารทั่วไป' },
    { title: 'งานการเงิน', icon: 'bxs-wallet', page: 'finance', cat: 'การเงิน' },
    { title: 'ระบบงบประมาณและแผนงาน', icon: 'bxs-pie-chart-alt-2', page: 'budget', cat: 'การเงิน' },
    { title: 'งานทะเบียนนักเรียน', icon: 'bxs-id-card', page: 'registration', cat: 'ทะเบียน' },
    { title: 'รายงานและสถิติภาพรวม', icon: 'bxs-bar-chart-alt-2', page: 'reports', cat: 'รายงาน' },
    { title: 'ปฏิทินและข่าวสารโรงเรียน', icon: 'bxs-calendar-event', page: 'calendar', cat: 'ประชาสัมพันธ์' },
    { title: 'โปรแกรมช่วยกรอกคะแนน SGS (Mac & Windows)', icon: 'bxs-download', page: 'ext_sgs', cat: 'ส่วนเสริม' },
    { title: 'ระบบนิเทศภายใน', icon: 'bxs-chalkboard', page: 'ext_nited', cat: 'ส่วนเสริม' },
    { title: 'ระบบเยี่ยมบ้าน', icon: 'bxs-home-heart', page: 'ext_homevisit', cat: 'ส่วนเสริม' },
    { title: 'ระบบเก็บผลงานและข้อมูลการอบรม (Portfolio)', icon: 'bxs-briefcase', page: 'ext_portfolio', cat: 'ส่วนเสริม' },
    { title: 'คู่มือการใช้งานระบบ', icon: 'bxs-book-reader', page: 'manual', cat: 'ช่วยเหลือ' },
  ];
  if (APP.role === 'admin' || APP.role === 'director' || APP.role === 'deputy') {
    menuPages.push({ title: 'จัดการผู้ใช้งาน', icon: 'bxs-user-account', page: 'users', cat: 'ผู้ดูแล' });
    menuPages.push({ title: 'ตั้งค่าระบบโรงเรียน', icon: 'bxs-cog', page: 'settings', cat: 'ผู้ดูแล' });
  }

  Swal.fire({
    title: '<div class="text-base font-bold flex items-center justify-center gap-2 text-slate-800"><i class="bx bx-search text-indigo-600 text-xl"></i> ค้นหาด่วน (Quick Search)</div>',
    html: `
      <div class="text-left">
        <div class="relative mb-3">
          <input type="text" id="globalSearchInput" class="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="พิมพ์ชื่อเมนู หรือ หน้าระบบที่ต้องการ..." autofocus>
          <i class="bx bx-search absolute left-3 top-3 text-slate-400 text-base"></i>
        </div>
        <div id="globalSearchResults" style="max-height: 300px; overflow-y: auto;" class="space-y-1">
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    width: '460px',
    customClass: { popup: 'rounded-2xl' },
    didOpen: () => {
      const inp = document.getElementById('globalSearchInput');
      const box = document.getElementById('globalSearchResults');
      const renderResults = (kw) => {
        kw = (kw || '').trim().toLowerCase();
        let html = '';
        const filteredMenus = menuPages.filter(m => !kw || m.title.toLowerCase().includes(kw) || m.cat.toLowerCase().includes(kw));
        if (filteredMenus.length > 0) {
          filteredMenus.forEach(m => {
            html += `
              <div onclick="Swal.close(); navigate('${m.page}');" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 cursor-pointer transition text-slate-700 hover:text-indigo-600 group">
                <div class="flex items-center gap-2.5 text-sm font-medium">
                  <i class="bx ${m.icon} text-lg text-slate-400 group-hover:text-indigo-600"></i>
                  <span>${escapeHTML(m.title)}</span>
                </div>
                <span class="text-[11px] bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 px-2 py-0.5 rounded-md font-semibold">${escapeHTML(m.cat)}</span>
              </div>
            `;
          });
        }
        if (!html) {
          html = `<div class="text-center py-6 text-slate-400 text-xs">ไม่พบผลลัพธ์ที่ตรงกับ "${escapeHTML(kw)}"</div>`;
        }
        box.innerHTML = html;
      };
      renderResults('');
      inp.addEventListener('input', (e) => renderResults(e.target.value));
      setTimeout(() => inp.focus(), 100);
    }
  });
};

// Keyboard shortcut listener: Ctrl+K or Cmd+K
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (typeof window.openGlobalSearch === 'function') {
      window.openGlobalSearch();
    }
  }
});

/* ============================================================
 *  Dashboard
 * ============================================================ */
function renderDashboard(container) {
  container.innerHTML = `
    <div class="welcome-row">
      <div>
        <h1>สวัสดีค่ะ, ${escapeHTML(APP.user.name || APP.user.username)}\x3c/h1>
        <div class="sub">
          <i class='bx bxs-school'>\x3c/i>
          <span id="schoolNameDash">โรงเรียนมหาชัยพิทยาคาร\x3c/span>
          <span class="mx-1">·\x3c/span>
          <span>ภาพรวมการบริหารจัดการ\x3c/span>
        \x3c/div>
      \x3c/div>
      <div class="date-pill">
        <i class='bx bx-calendar'>\x3c/i>
        <span id="todayLabel">\x3c/span>
      \x3c/div>
    \x3c/div>

    <!-- Quick Actions Hub (ทางลัดประจำวัน) -->
    <div class="quick-actions-bar">
      <div class="quick-action-btn" onclick="navigate('attendance')">
        <div class="qa-icon qa-icon-green"><i class='bx bxs-check-shield'>\x3c/i>\x3c/div>
        <div class="qa-info">
          <div class="qa-title">เช็คชื่อประจำวัน\x3c/div>
          <div class="qa-desc">แถวหน้าเสาธง / โฮมรูม\x3c/div>
        \x3c/div>
        <i class='bx bx-chevron-right qa-arrow'>\x3c/i>
      \x3c/div>

      <div class="quick-action-btn" onclick="navigate('schedule')">
        <div class="qa-icon qa-icon-indigo"><i class='bx bxs-calendar-check'>\x3c/i>\x3c/div>
        <div class="qa-info">
          <div class="qa-title">ตารางสอนวันนี้\x3c/div>
          <div class="qa-desc">ตารางสอน & คาบเรียน\x3c/div>
        \x3c/div>
        <i class='bx bx-chevron-right qa-arrow'>\x3c/i>
      \x3c/div>

      <div class="quick-action-btn" onclick="navigate('students')">
        <div class="qa-icon qa-icon-blue"><i class='bx bxs-user-detail'>\x3c/i>\x3c/div>
        <div class="qa-info">
          <div class="qa-title">ค้นหานักเรียน\x3c/div>
          <div class="qa-desc">ข้อมูล / ชั้นเรียน / ติดต่อ\x3c/div>
        \x3c/div>
        <i class='bx bx-chevron-right qa-arrow'>\x3c/i>
      \x3c/div>

      <div class="quick-action-btn" onclick="navigate('templates')">
        <div class="qa-icon qa-icon-purple"><i class='bx bxs-file-doc'>\x3c/i>\x3c/div>
        <div class="qa-info">
          <div class="qa-title">แบบฟอร์ม 4 ฝ่าย\x3c/div>
          <div class="qa-desc">บันทึกข้อความ / งานเอกสาร\x3c/div>
        \x3c/div>
        <i class='bx bx-chevron-right qa-arrow'>\x3c/i>
      \x3c/div>
    \x3c/div>

    <div class="stat-grid">
      <div class="stat-card s1">
        <div class="icon-wrap"><i class='bx bxs-user-detail'>\x3c/i>\x3c/div>
        <div class="label">นักเรียนทั้งหมด\x3c/div>
        <div class="value" id="statStudents">—\x3c/div>
        <div class="trend"><i class='bx bx-up-arrow-alt'>\x3c/i> ภาคเรียนปัจจุบัน\x3c/div>
      \x3c/div>
      <div class="stat-card s2">
        <div class="icon-wrap"><i class='bx bxs-group'>\x3c/i>\x3c/div>
        <div class="label">ครูและบุคลากร\x3c/div>
        <div class="value" id="statPersonnel">—\x3c/div>
        <div class="trend"><i class='bx bx-up-arrow-alt'>\x3c/i> สถานะปฏิบัติงาน\x3c/div>
      \x3c/div>
      <div class="stat-card s3">
        <div class="icon-wrap"><i class='bx bxs-check-circle'>\x3c/i>\x3c/div>
        <div class="label">อัตราการเข้าเรียน\x3c/div>
        <div class="value" id="statAttendance">—\x3c/div>
        <div class="trend"><i class='bx bx-calendar-check'>\x3c/i> สถิติวันนี้\x3c/div>
      \x3c/div>
      <div class="stat-card s4">
        <div class="icon-wrap"><i class='bx bxs-wallet'>\x3c/i>\x3c/div>
        <div class="label">คงเหลือในบัญชี\x3c/div>
        <div class="value" id="statBalance">—\x3c/div>
        <div class="trend"><i class='bx bx-trending-up'>\x3c/i> รายรับ - รายจ่าย\x3c/div>
      \x3c/div>
    \x3c/div>

    <!-- Attendance Command Center Dashboard -->
    <div class="att-dash-section">
      <div class="att-section-header">
        <div class="att-section-title">
          <div>
            <h2><i class="bx bxs-check-shield text-indigo-600 mr-1.5"></i> แดชบอร์ดสรุปยอดการเข้าเรียนประจำวัน</h2>
            <p>สถิติการมาเรียน เช็คชื่อหน้าเสาธง/โฮมรูม ประจำวันที่ <span id="attTodayLabel" class="font-semibold text-slate-700">—</span></p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button class="btn btn-blue flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3" onclick="navigate('attendance')">
            <i class="bx bx-edit-alt"></i> บันทึกการเข้าเรียน
          </button>
          <button class="btn btn-light flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-3" onclick="navigate('attendance'); setTimeout(()=>{ if(typeof switchAttendanceTab==='function') switchAttendanceTab('report'); }, 150);">
            <i class="bx bx-bar-chart-alt-2"></i> รายงานสรุป
          </button>
        </div>
      </div>

      <!-- Scope Switcher: วันนี้ / รายเดือน / ตลอดภาคเรียน -->
      <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div class="att-scope-container">
          <button class="att-scope-pill active" id="attScope_daily" onclick="switchAttendanceDashboardPeriod('daily')">
            <i class="bx bx-calendar"></i> ประจำวัน (วันนี้)
          </button>
          <button class="att-scope-pill" id="attScope_monthly" onclick="switchAttendanceDashboardPeriod('monthly')">
            <i class="bx bx-calendar-event"></i> สรุปรายเดือน
          </button>
          <button class="att-scope-pill" id="attScope_semester" onclick="switchAttendanceDashboardPeriod('semester')">
            <i class="bx bx-calendar-star"></i> สรุปตลอดภาคเรียน
          </button>
        </div>
        <div id="attDashPeriodWrap" class="flex items-center gap-2" style="display:none;">
          <select id="attDashPeriodSelect" onchange="onAttDashPeriodChange()" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white font-semibold text-slate-700">
          </select>
        </div>
      </div>

      <!-- 4 KPI Attendance Cards -->
      <div class="att-kpi-grid">
        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">อัตราการมาเรียนเฉลี่ย</span>
            <span class="att-kpi-badge att-badge-green" id="attRateBadge">ปกติ</span>
          </div>
          <div class="att-kpi-num" id="attRateNum">—%</div>
          <div class="att-kpi-sub">เป้าหมายสถานศึกษา ≥ 95.0%</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">มาเรียนตามเวลาปกติ</span>
            <span class="att-kpi-badge att-badge-green" id="attPresentPct">—%</span>
          </div>
          <div class="att-kpi-num text-emerald-600" id="attPresentNum">— คน</div>
          <div class="att-kpi-sub" id="attPresentSub">จากนักเรียนทั้งหมด — คน</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">มาสาย (หลัง 08:15 น.)</span>
            <span class="att-kpi-badge att-badge-amber">สาย</span>
          </div>
          <div class="att-kpi-num text-amber-600" id="attLateNum">— คน</div>
          <div class="att-kpi-sub">บันทึกเวลามาสายหน้าเสาธง</div>
        </div>

        <div class="att-kpi-card">
          <div class="att-kpi-top">
            <span class="att-kpi-label">ขาดเรียน / ลา</span>
            <span class="att-kpi-badge att-badge-rose">ขาด / ลา</span>
          </div>
          <div class="att-kpi-num text-rose-600" id="attAbsentNum">— คน</div>
          <div class="att-kpi-sub" id="attAbsentSub">มีใบลา / ขาดเรียน</div>
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
            <a href="#" onclick="event.preventDefault(); navigate('attendance');" class="text-xs text-indigo-600 font-semibold hover:underline">
              ดูทั้งหมด <i class="bx bx-chevron-right"></i>
            </a>
          </div>
          <div class="chart-box" style="height:220px;"><canvas id="chartAttendance"></canvas></div>
        </div>

        <!-- Right: Classroom Queue -->
        <div class="dash-card mb-0 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h3 class="text-base font-bold text-slate-800 m-0">
                <i class="bx bxs-school text-primary mr-1"></i> สถานะการส่งยอดรายห้อง
              </h3>
              <p class="text-xs text-slate-500 m-0 mt-0.5">ห้องที่ยังไม่ส่งยอดจัดเรียงไว้ด้านบนสุด</p>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="room-chip room-chip-pending" id="chipPendingCount">รอส่ง: 0</span>
              <span class="room-chip room-chip-submitted" id="chipSubmittedCount">ส่งแล้ว: 0</span>
            </div>
          </div>
          <div class="room-queue-container flex-1" id="classroomQueueArea">
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
            <span class="text-xs text-slate-500 font-medium" id="riskCountBadge">แสดงสูงสุด 10 อันดับแรก</span>
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
              <tbody id="riskStudentsTableBody">
                <tr><td colspan="6" class="text-center py-6 text-slate-400 text-xs">กำลังตรวจสอบข้อมูล...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Rest of Dashboard: Finance & Announcements -->
    <div class="dash-row mt-4">
      <div class="dash-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 m-0 flex items-center gap-1.5 text-left">
            <i class="bx bxs-megaphone text-primary"></i>
            <span>ประกาศและกิจกรรมล่าสุด</span>
          </h3>
          <a href="#" onclick="event.preventDefault(); navigate('announcements');" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
            ดูทั้งหมด <i class="bx bx-chevron-right"></i>
          </a>
        </div>
        <div class="announce-list" id="announceList">
          <div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i>กำลังโหลด...</div>
        </div>
      </div>

      <div class="dash-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 m-0 flex items-center gap-1.5 text-left">
            <i class="bx bx-wallet text-primary"></i>
            <span>สรุปรายรับ - รายจ่าย</span>
          </h3>
          <a href="#" onclick="event.preventDefault(); navigate('finance');" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
            ดูทั้งหมด <i class="bx bx-chevron-right"></i>
          </a>
        </div>
        <div class="chart-box" style="height:170px;"><canvas id="chartFinance"></canvas></div>
        <div class="text-center mt-2">
          <div class="text-xs text-slate-500">คงเหลือสุทธิ</div>
          <div class="text-lg font-bold text-blue-600" id="netBalance">฿0</div>
        </div>
      </div>
    </div>
  `;
  // วันที่ภาษาไทย
  document.getElementById('todayLabel').textContent = formatThaiDate(new Date());

  if (APP.dashboardData) {
    renderDashboardData(APP.dashboardData);
    // Only re-fetch if cached data is older than 30 seconds
    if (!APP._dashboardTs || Date.now() - APP._dashboardTs > 30000) {
      loadDashboardData(true);
    }
  } else {
    loadDashboardData();
  }
}

function loadDashboardData(silent) {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') {
        if (!silent) showToast('error', res.message || 'โหลดข้อมูลไม่สำเร็จ');
        return;
      }
      APP.dashboardData = res.data;
      APP._dashboardTs = Date.now();
      renderDashboardData(res.data);
    })
    .withFailureHandler(err => {
      if (!silent) showToast('error', err.message || err);
    })
    .getDashboardData(APP.token);
}

function renderDashboardData(d) {
  // ชื่อโรงเรียน
  const schoolName = (d.config && d.config.school_name) ? d.config.school_name : 'โรงเรียนมหาชัยพิทยาคาร';
  
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('schoolNameDash', schoolName);
  setTxt('brandSchoolName', schoolName);
  
  // Stats
  setTxt('statStudents', formatNumber(d.stats.students));
  setTxt('statPersonnel', formatNumber(d.stats.personnel));
  setTxt('statAttendance', (d.stats.attendance_pct ? d.stats.attendance_pct.toFixed(1) : '0') + '%');
  setTxt('statBalance', formatMoney(d.stats.balance));

  // Attendance Command Center Panel
  if (d.attendance_dashboard) {
    renderAttendanceDashboardPanel(d.attendance_dashboard);
  }

  const isDarkTheme = document.documentElement.classList.contains('dark-mode');
  const chartGridColor = isDarkTheme ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const chartTickColor = isDarkTheme ? '#94A3B8' : '#64748B';
  const chartLegendColor = isDarkTheme ? '#E2E8F0' : '#475569';

  // Chart: เข้าเรียน 7 วัน
  const ctxA = document.getElementById('chartAttendance');
  if (ctxA) {
    if (APP.charts.attendance) {
      try { APP.charts.attendance.destroy(); } catch (_) {}
      delete APP.charts.attendance;
    }
    APP.charts.attendance = new Chart(ctxA, {
      type: 'line',
      data: {
        labels: d.week_chart.map(x => x.label),
        datasets: [{
          label: 'อัตราการเข้าเรียน (%)',
          data: d.week_chart.map(x => x.pct),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(59,130,246,.15)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#3730A3', pointRadius: 4,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { color: chartTickColor, stepSize: 25, callback: v => v + '%' }, grid:{ color: chartGridColor } },
          x: { ticks: { color: chartTickColor }, grid: { display: false } }
        }
      }
    });
  }

  // Chart: การเงิน
  const ctxF = document.getElementById('chartFinance');
  if (ctxF) {
    if (APP.charts.finance) {
      try { APP.charts.finance.destroy(); } catch (_) {}
      delete APP.charts.finance;
    }
    APP.charts.finance = new Chart(ctxF, {
      type: 'doughnut',
      data: {
        labels: ['รายรับ', 'รายจ่าย'],
        datasets: [{
          data: [d.finance.income || 0, d.finance.expense || 0],
          backgroundColor: ['#10B981', '#DC2626'],
          borderWidth: 0, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: chartLegendColor, font: { family: 'Sarabun', size: 12 }, padding: 12, boxWidth: 12 } },
          tooltip: { callbacks: { label: c => c.label + ': ' + formatMoney(c.parsed) } }
        }
      }
    });
  }
  const netBal = document.getElementById('netBalance');
  if (netBal) netBal.textContent = formatMoney(d.stats.balance);

  // ประกาศ
  // ประกาศ
  const list = document.getElementById('announceList');
  if (list) {
    if (!d.announcements || d.announcements.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class='bx bx-news'>\x3c/i>
          ยังไม่มีประกาศ
        \x3c/div>`;
    } else {
      list.innerHTML = d.announcements.slice(0,4).map(a => `
        <div class="announce-item">
          <div class="icn"><i class='bx bxs-megaphone'>\x3c/i>\x3c/div>
          <div style="flex:1; min-width:0;">
            <div class="title">${escapeHTML(a.title || '(ไม่มีหัวข้อ)')}\x3c/div>
            <div class="meta">${formatThaiDate(new Date(a.created_at || a.start_date))}\x3c/div>
          \x3c/div>
        \x3c/div>
      `).join('');
    }
  }

  // Sidebar badge & Topbar Dot
  const badge = document.getElementById('badgeApprovals');
  const dot = document.getElementById('topbarDot');
  if (d.pending_approvals > 0) {
    if (badge) {
      badge.textContent = d.pending_approvals;
      badge.style.display = '';
    }
    if (dot) dot.style.display = '';
  } else {
    if (badge) badge.style.display = 'none';
    if (dot) dot.style.display = 'none';
  }
  
  // แจ้งเตือน (Notifications)
  if (d.unread_notifications !== undefined) {
    updateNotificationsUI(d.unread_notifications);
  }
}

window.switchAttendanceDashboardPeriod = function(scope, prefix) {
  const p = prefix || '';
  const getId = id => p ? (p + '_' + id) : id;

  const btnDaily = document.getElementById(getId('attScope_daily'));
  const btnMonthly = document.getElementById(getId('attScope_monthly'));
  const btnSemester = document.getElementById(getId('attScope_semester'));
  const periodWrap = document.getElementById(getId('attDashPeriodWrap'));
  const periodSel  = document.getElementById(getId('attDashPeriodSelect'));

  if (btnDaily) btnDaily.classList.toggle('active', scope === 'daily');
  if (btnMonthly) btnMonthly.classList.toggle('active', scope === 'monthly');
  if (btnSemester) btnSemester.classList.toggle('active', scope === 'semester');

  if (scope === 'daily') {
    if (periodWrap) periodWrap.style.display = 'none';
    const titleEl = document.querySelector(p ? '#attOverview h2' : '.att-dash-section h2');
    if (titleEl) titleEl.innerHTML = '<i class="bx bxs-check-shield text-indigo-600 mr-1.5"></i> แดชบอร์ดสรุปยอดการเข้าเรียนประจำวัน';
    const subEl = document.querySelector(p ? '#attOverview p' : '.att-dash-section p');
    if (subEl) subEl.innerHTML = 'สถิติการมาเรียน เช็คชื่อหน้าเสาธง/โฮมรูม ประจำวันที่ <span id="' + getId('attTodayLabel') + '" class="font-semibold text-slate-700">—</span>';

    if (APP.dashboardData && APP.dashboardData.attendance_dashboard) {
      renderAttendanceDashboardPanel(APP.dashboardData.attendance_dashboard, p);
    }
    if (APP.dashboardData && APP.dashboardData.week_chart) {
      updateAttendanceTrendChart(APP.dashboardData.week_chart, p);
    }
  } else if (scope === 'monthly') {
    if (periodWrap) periodWrap.style.display = '';
    const titleEl = document.querySelector(p ? '#attOverview h2' : '.att-dash-section h2');
    if (titleEl) titleEl.innerHTML = '<i class="bx bxs-check-shield text-indigo-600 mr-1.5"></i> แดชบอร์ดสรุปยอดการเข้าเรียนประจำเดือน';

    const loadMonthly = () => {
      const ym = periodSel?.value || new Date().toISOString().slice(0, 7);
      const parts = ym.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const mLabel = periodSel?.options[periodSel.selectedIndex]?.text || '';
      const subEl = document.querySelector(p ? '#attOverview p' : '.att-dash-section p');
      if (subEl) subEl.innerHTML = 'สถิติการมาเรียนและเช็คแถวหน้าเสาธง ประจำเดือน <span class="font-semibold text-indigo-700">' + mLabel + '</span>';

      showToast('info', 'กำลังโหลดสถิติประจำเดือน ' + mLabel + '...');
      google.script.run
        .withSuccessHandler(res => {
          if (res.status === 'success') {
            applyPeriodSummaryToDashboard(res, p, 'monthly');
          }
        })
        .getAttendanceReport({ scope: 'monthly', month: m, year: y, report_type: 'homeroom' }, APP.token);
    };

    if (window.AttendanceState?.filterOptions?.months && periodSel) {
      periodSel.innerHTML = (typeof renderMonthOptionsHtml === 'function')
        ? renderMonthOptionsHtml(window.AttendanceState.filterOptions.months, window.AttendanceState.filterOptions.current_ym)
        : window.AttendanceState.filterOptions.months.map(m => '<option value="' + m.ym + '">' + escapeHTML(m.label) + '</option>').join('');
      if (window.AttendanceState.filterOptions.current_ym) periodSel.value = window.AttendanceState.filterOptions.current_ym;
      loadMonthly();
    } else {
      google.script.run
        .withSuccessHandler(res => {
          if (res.status === 'success' && res.data) {
            if (!window.AttendanceState) window.AttendanceState = {};
            window.AttendanceState.filterOptions = res.data;
            if (periodSel) {
              periodSel.innerHTML = (typeof renderMonthOptionsHtml === 'function')
                ? renderMonthOptionsHtml(res.data.months, res.data.current_ym)
                : res.data.months.map(m => '<option value="' + m.ym + '">' + escapeHTML(m.label) + '</option>').join('');
              if (res.data.current_ym) periodSel.value = res.data.current_ym;
            }
            loadMonthly();
          }
        })
        .getAttendanceFilterOptions(APP.token);
    }
  } else if (scope === 'semester') {
    if (periodWrap) periodWrap.style.display = '';
    const titleEl = document.querySelector(p ? '#attOverview h2' : '.att-dash-section h2');
    if (titleEl) titleEl.innerHTML = '<i class="bx bxs-check-shield text-indigo-600 mr-1.5"></i> แดชบอร์ดสรุปยอดการเข้าเรียนตลอดภาคเรียน';

    const loadSemester = () => {
      const sem = periodSel?.value || '1';
      const ay = APP.dashboardData?.config?.academic_year || '2569';
      const semLabel = periodSel?.options[periodSel.selectedIndex]?.text || ('ภาคเรียนที่ ' + sem + '/' + ay);
      const subEl = document.querySelector(p ? '#attOverview p' : '.att-dash-section p');
      if (subEl) subEl.innerHTML = 'สถิติการมาเรียนและเช็คแถวหน้าเสาธง <span class="font-semibold text-indigo-700">' + semLabel + '</span>';

      showToast('info', 'กำลังโหลดสถิติตลอด ' + semLabel + '...');
      google.script.run
        .withSuccessHandler(res => {
          if (res.status === 'success') {
            applyPeriodSummaryToDashboard(res, p, 'semester');
          }
        })
        .getAttendanceReport({ scope: 'semester', semester: sem, academic_year: ay, report_type: 'homeroom' }, APP.token);
    };

    if (window.AttendanceState?.filterOptions?.semesters && periodSel) {
      periodSel.innerHTML = window.AttendanceState.filterOptions.semesters.map(s => '<option value="' + s.id + '">' + escapeHTML(s.label) + '</option>').join('');
      loadSemester();
    } else {
      google.script.run
        .withSuccessHandler(res => {
          if (res.status === 'success' && res.data) {
            if (!window.AttendanceState) window.AttendanceState = {};
            window.AttendanceState.filterOptions = res.data;
            if (periodSel) {
              periodSel.innerHTML = res.data.semesters.map(s => '<option value="' + s.id + '">' + escapeHTML(s.label) + '</option>').join('');
            }
            loadSemester();
          }
        })
        .getAttendanceFilterOptions(APP.token);
    }
  }
};

window.onAttDashPeriodChange = function(prefix) {
  const p = prefix || '';
  const getId = id => p ? (p + '_' + id) : id;
  const btnMonthly = document.getElementById(getId('attScope_monthly'));
  const isMonthly = btnMonthly && btnMonthly.classList.contains('active');
  switchAttendanceDashboardPeriod(isMonthly ? 'monthly' : 'semester', p);
};

window.applyPeriodSummaryToDashboard = function(res, prefix, scopeType) {
  const p = prefix || '';
  const getId = id => p ? (p + '_' + id) : id;
  const sum = res.summary || {};

  const setElTxt = (id, val) => {
    const el = document.getElementById(getId(id));
    if (el) el.textContent = val;
  };

  const rate = typeof sum.attendance_pct === 'number' ? sum.attendance_pct : 0;
  setElTxt('attRateNum', rate.toFixed(1) + '%');
  const badgeEl = document.getElementById(getId('attRateBadge'));
  if (badgeEl) {
    badgeEl.className = 'att-kpi-badge ' + (rate >= 95 ? 'att-badge-green' : (rate >= 90 ? 'att-badge-amber' : 'att-badge-rose'));
    badgeEl.textContent = rate >= 95 ? 'ปกติ' : (rate >= 90 ? 'ควรเฝ้าระวัง' : 'ต่ำกว่าเกณฑ์');
  }

  const total = sum.total || 0;
  const present = sum.present || 0;
  const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
  setElTxt('attPresentPct', presentPct + '%');
  setElTxt('attPresentNum', formatNumber(present) + ' คน-วัน');
  setElTxt('attPresentSub', 'เช็คชื่อเข้าแถวหน้าเสาธงสะสม');

  setElTxt('attLateNum', formatNumber(sum.late || 0) + ' คน-วัน');
  setElTxt('attAbsentNum', formatNumber((sum.absent || 0) + (sum.leave || 0)) + ' คน-วัน');
  setElTxt('attAbsentSub', 'ขาด ' + formatNumber(sum.absent || 0) + ' / ลา ' + formatNumber(sum.leave || 0) + ' คน-วัน');

  const queueArea = document.getElementById(getId('classroomQueueArea'));
  if (queueArea) {
    const classrooms = res.classrooms || [];
    if (classrooms.length === 0) {
      queueArea.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">ไม่พบข้อมูลห้องเรียน</div>';
    } else {
      queueArea.innerHTML = classrooms.map(rm => {
        const rateCls = rm.attendance_pct >= 95 ? 'room-chip-submitted' : (rm.attendance_pct >= 90 ? 'room-chip-pending' : 'risk-pill-absent');
        return `
          <div class="room-queue-item is-submitted" onclick="goToClassAttendance('${escapeHTML(rm.classroom)}')">
            <div class="room-queue-left">
              <div class="room-queue-name">ชั้น ${escapeHTML(rm.classroom)}</div>
              <div class="room-queue-teacher">${escapeHTML(rm.teacher || 'ครูประจำชั้น')} • มา ${rm.present} • สาย ${rm.late} • ลา ${rm.leave} • ขาด ${rm.absent}</div>
            </div>
            <div class="room-queue-right">
              <span class="room-chip ${rateCls}">${rm.attendance_pct.toFixed(1)}%</span>
              <i class="bx bx-chevron-right text-slate-400"></i>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  const riskBody = document.getElementById(getId('riskStudentsTableBody'));
  const riskBadge = document.getElementById(getId('riskCountBadge'));
  if (riskBody) {
    const risks = res.risk_students || [];
    if (riskBadge) {
      riskBadge.textContent = 'พบ ' + risks.length + ' คน (ขาดเรียนสะสมสูงสุด)';
    }
    if (risks.length === 0) {
      riskBody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-emerald-600 font-medium text-xs"><i class="bx bx-check-shield text-base mr-1"></i> ไม่มีนักเรียนในกลุ่มเฝ้าระวัง</td></tr>';
    } else {
      riskBody.innerHTML = risks.map(s => {
        const phoneLink = (s.parent_phone && s.parent_phone !== '-' && s.parent_phone !== '—')
          ? `<a href="tel:${escapeHTML(s.parent_phone)}" class="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1 text-xs"><i class="bx bxs-phone-call text-sm"></i> ${escapeHTML(s.parent_phone)}</a>`
          : '<span class="text-slate-400 text-xs">-</span>';

        return `
          <tr>
            <td>
              <div class="font-semibold text-slate-800">${escapeHTML((s.prefix || '') + (s.first_name || '') + ' ' + (s.last_name || ''))}</div>
            </td>
            <td class="text-slate-500 font-mono text-xs">${escapeHTML(s.student_code || s.id)}</td>
            <td style="text-align:center;"><span class="font-medium text-slate-700">ชั้น ${escapeHTML(s.classroom)}</span></td>
            <td style="text-align:center;">
              <span class="inline-flex items-center justify-center font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full text-xs border border-rose-200">
                ${s.absent} วัน
              </span>
            </td>
            <td style="text-align:center;">
              <span class="inline-block px-2 py-0.5 rounded text-xs font-bold ${s.attendance_pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                ${s.attendance_pct.toFixed(1)}%
              </span>
            </td>
            <td style="text-align:center;">${phoneLink}</td>
          </tr>
        `;
      }).join('');
    }
  }

  if (scopeType === 'semester' && res.months && res.months.length > 0) {
    updateAttendanceTrendChart(res.months.map(m => ({ label: m.label, pct: m.attendance_pct })), p, 'บาร์ / แท่ง');
  } else if (scopeType === 'monthly' && res.dates && res.dates.length > 0) {
    const dateCounts = {};
    res.dates.forEach(d => dateCounts[d] = { present: 0, total: 0 });
    res.data.forEach(s => {
      if (s.dates) {
        Object.keys(s.dates).forEach(d => {
          if (dateCounts[d]) {
            dateCounts[d].total++;
            if (s.dates[d] === 'present' || s.dates[d] === 'late') dateCounts[d].present++;
          }
        });
      }
    });
    const trendData = res.dates.map(d => {
      const b = dateCounts[d];
      const pt = b && b.total > 0 ? Math.round((b.present / b.total) * 100) : 0;
      return { label: parseInt(d.slice(8, 10), 10), pct: pt };
    });
    updateAttendanceTrendChart(trendData, p, 'เส้น');
  }
};

window.updateAttendanceTrendChart = function(chartData, prefix, type) {
  const p = prefix || '';
  const canvasId = p ? (p + '_chartAttendance') : 'chartAttendance';
  const ctx = document.getElementById(canvasId) || document.getElementById('chartAttendance');
  if (!ctx) return;

  const chartKey = p ? (p + '_attendance') : 'attendance';
  if (APP.charts && APP.charts[chartKey]) {
    try { APP.charts[chartKey].destroy(); } catch (_) {}
    delete APP.charts[chartKey];
  }
  const isDark = document.documentElement.classList.contains('dark-mode');

  if (!APP.charts) APP.charts = {};
  APP.charts[chartKey] = new Chart(ctx, {
    type: (type === 'บาร์ / แท่ง') ? 'bar' : 'line',
    data: {
      labels: chartData.map(x => x.label),
      datasets: [{
        label: 'อัตราการเข้าเรียน (%)',
        data: chartData.map(x => x.pct),
        borderColor: '#4F46E5',
        backgroundColor: (type === 'บาร์ / แท่ง') ? 'rgba(79,70,229,.7)' : 'rgba(79,70,229,.15)',
        borderRadius: (type === 'บาร์ / แท่ง') ? 6 : 0,
        fill: (type !== 'บาร์ / แท่ง'),
        tension: 0.35,
        pointBackgroundColor: '#3730A3',
        pointRadius: 3,
        borderWidth: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: isDark ? '#94A3B8' : '#64748B', stepSize: 25, callback: v => v + '%' }, grid: { color: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' } },
        x: { ticks: { color: isDark ? '#94A3B8' : '#64748B' }, grid: { display: false } }
      }
    }
  });
};

window.goToClassAttendance = function(className) {
  if (typeof AttendanceState !== 'undefined') {
    AttendanceState.mode = 'class';
    AttendanceState.classroom = className;
    AttendanceState.tab = 'record';
  }
  navigate('attendance');
  setTimeout(() => {
    if (typeof switchAttendanceTab === 'function') {
      switchAttendanceTab('record');
    }
    const classEl = document.getElementById('attClassroom');
    if (classEl) {
      classEl.value = className;
      if (typeof onAttClassroomChange === 'function') {
        onAttClassroomChange();
      }
    }
  }, 250);
};

function renderAttendanceDashboardPanel(attDash, prefix) {
  if (!attDash) return;
  const p = prefix || '';
  const getId = id => p ? (p + '_' + id) : id;

  const setElTxt = (id, val) => {
    const el = document.getElementById(getId(id));
    if (el) el.textContent = val;
  };

  // วันที่
  const todayDate = attDash.today ? new Date(attDash.today + 'T00:00:00') : new Date();
  setElTxt('attTodayLabel', formatThaiDate(todayDate));

  // อัตราการมาเรียนเฉลี่ย
  const rate = typeof attDash.attendance_rate === 'number' ? attDash.attendance_rate : 0;
  setElTxt('attRateNum', rate.toFixed(1) + '%');

  const badgeEl = document.getElementById(getId('attRateBadge'));
  if (badgeEl) {
    badgeEl.className = 'att-kpi-badge ' + (rate >= 95 ? 'att-badge-green' : (rate >= 90 ? 'att-badge-amber' : 'att-badge-rose'));
    badgeEl.textContent = rate >= 95 ? 'ปกติ' : (rate >= 90 ? 'ควรเฝ้าระวัง' : 'ต่ำกว่าเกณฑ์');
  }

  // มาเรียนตามเวลาปกติ
  const total = attDash.total_students || 0;
  const present = attDash.present_today || 0;
  const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
  setElTxt('attPresentPct', presentPct + '%');
  setElTxt('attPresentNum', formatNumber(present) + ' คน');
  setElTxt('attPresentSub', 'จากนักเรียนทั้งหมด ' + formatNumber(total) + ' คน');

  // มาสาย
  const late = attDash.late_today || 0;
  setElTxt('attLateNum', formatNumber(late) + ' คน');

  // ขาดเรียน / ลา
  const absent = attDash.absent_today || 0;
  const leave = attDash.leave_today || 0;
  setElTxt('attAbsentNum', formatNumber(absent + leave) + ' คน');
  setElTxt('attAbsentSub', 'ขาด ' + formatNumber(absent) + ' / ลา ' + formatNumber(leave) + ' คน');

  // ชิปสถานะห้องเรียน
  const pendingCount = attDash.pending_rooms !== undefined ? attDash.pending_rooms : 0;
  const submittedCount = attDash.submitted_rooms !== undefined ? attDash.submitted_rooms : 0;
  setElTxt('chipPendingCount', 'รอส่ง: ' + pendingCount);
  setElTxt('chipSubmittedCount', 'ส่งแล้ว: ' + submittedCount);

  // สถานะการส่งยอดรายห้อง
  const queueArea = document.getElementById(getId('classroomQueueArea'));
  if (queueArea) {
    const queue = attDash.classroom_queue || [];
    if (queue.length === 0) {
      queueArea.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">ไม่พบข้อมูลห้องเรียน</div>';
    } else {
      queueArea.innerHTML = queue.map(rm => {
        const isPending = !!rm.isPending;
        const statusBadge = isPending
          ? '<span class="room-chip room-chip-pending"><i class="bx bx-time-five"></i> รอส่ง</span>'
          : '<span class="room-chip room-chip-submitted"><i class="bx bx-check"></i> ' + rm.rate + '%</span>';
        const teacher = rm.teacher ? escapeHTML(rm.teacher) : 'ครูประจำชั้น';
        const statsSub = isPending
          ? ('ทั้งหมด ' + rm.total + ' คน')
          : ('มา ' + rm.present + (rm.late ? ' • สาย ' + rm.late : '') + (rm.leave ? ' • ลา ' + rm.leave : '') + (rm.absent ? ' • ขาด ' + rm.absent : ''));
        return `
          <div class="room-queue-item ${isPending ? 'is-pending' : 'is-submitted'}" onclick="goToClassAttendance('${escapeHTML(rm.name)}')">
            <div class="room-queue-left">
              <div class="room-queue-name">ชั้น ${escapeHTML(rm.name)}</div>
              <div class="room-queue-teacher">${teacher} • ${statsSub}</div>
            </div>
            <div class="room-queue-right">
              ${statusBadge}
              <i class="bx bx-chevron-right text-slate-400"></i>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // รายชื่อนักเรียนกลุ่มเฝ้าระวัง
  const riskBody = document.getElementById(getId('riskStudentsTableBody'));
  const riskBadge = document.getElementById(getId('riskCountBadge'));
  if (riskBody) {
    const risks = attDash.risk_students || [];
    if (riskBadge) {
      riskBadge.textContent = risks.length > 0 ? ('พบ ' + risks.length + ' คน (ขาดเรียนสะสม ≥ 2 ครั้ง)') : 'สถานะปกติ';
    }
    if (risks.length === 0) {
      riskBody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-emerald-600 font-medium text-xs"><i class="bx bx-check-shield text-base mr-1"></i> ไม่มีนักเรียนในกลุ่มเฝ้าระวัง (ขาดเรียนสะสมน้อยกว่า 2 ครั้ง)</td></tr>';
    } else {
      riskBody.innerHTML = risks.map(s => {
        let statusBadge = '';
        if (s.today_status === 'present') {
          statusBadge = '<span class="risk-pill risk-pill-present"><i class="bx bx-check"></i> มาเรียน</span>';
        } else if (s.today_status === 'late') {
          statusBadge = '<span class="risk-pill risk-pill-late"><i class="bx bx-time"></i> มาสาย</span>';
        } else if (s.today_status === 'absent') {
          statusBadge = '<span class="risk-pill risk-pill-absent"><i class="bx bx-x"></i> ขาดเรียน</span>';
        } else if (s.today_status === 'leave') {
          statusBadge = '<span class="risk-pill risk-pill-leave"><i class="bx bx-file-blank"></i> ลา</span>';
        } else {
          statusBadge = '<span class="risk-pill risk-pill-pending"><i class="bx bx-time-five"></i> รอเช็คชื่อ</span>';
        }

        const phoneLink = (s.parent_phone && s.parent_phone !== '-' && s.parent_phone !== '—')
          ? `<a href="tel:${escapeHTML(s.parent_phone)}" class="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1 text-xs"><i class="bx bxs-phone-call text-sm"></i> ${escapeHTML(s.parent_phone)}</a>`
          : '<span class="text-slate-400 text-xs">-</span>';

        return `
          <tr>
            <td>
              <div class="font-semibold text-slate-800">${escapeHTML(s.name)}</div>
            </td>
            <td class="text-slate-500 font-mono text-xs">${escapeHTML(s.id)}</td>
            <td style="text-align:center;"><span class="font-medium text-slate-700">${escapeHTML(s.classroom)}</span></td>
            <td style="text-align:center;">
              <span class="inline-flex items-center justify-center font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full text-xs border border-rose-200">
                ${s.absent_count} ครั้ง
              </span>
            </td>
            <td style="text-align:center;">${statusBadge}</td>
            <td style="text-align:center;">${phoneLink}</td>
          </tr>
        `;
      }).join('');
    }
  }
}

function updateNotificationsUI(notifs) {
  const dot = document.getElementById('topbarBellDot');
  const countSpan = document.getElementById('notifCount');
  const list = document.getElementById('notificationsList');
  
  if (notifs.length > 0) {
    if (dot) dot.style.display = '';
    if (countSpan) countSpan.textContent = notifs.length;
    if (list) {
      list.innerHTML = notifs.map(n => `
        <div style="padding:12px 16px; border-bottom:1px solid #F1F5F9; cursor:pointer; transition:background .2s;"
             onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='white'"
             onclick="readNotification('${n.id}', '${n.link_type}', '${n.link_id}')">
          <div style="font-size:13px; font-weight:600; color:#0F172A; margin-bottom:2px;">
            ${escapeHTML(n.title)}
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom:4px;">
            ${escapeHTML(n.message)}
          </div>
          <div style="font-size:10px; color:#94A3B8;">
            ${formatThaiDate(new Date(n.created_at))}
          </div>
        </div>
      `).join('');
    }
  } else {
    if (dot) dot.style.display = 'none';
    if (countSpan) countSpan.textContent = '0';
    if (list) {
      list.innerHTML = `<div style="padding:20px; text-align:center; color:#94A3B8; font-size:13px;">ไม่มีแจ้งเตือนใหม่</div>`;
    }
  }
}

function toggleNotifications() {
  const dd = document.getElementById('notificationsDropdown');
  if (dd) {
    if (dd.style.display === 'none') {
      dd.style.display = 'block';
      // ปิด dropdown อื่นๆ ถ้ามี
      document.addEventListener('click', closeNotificationsOutside);
    } else {
      dd.style.display = 'none';
      document.removeEventListener('click', closeNotificationsOutside);
    }
  }
}

function closeNotificationsOutside(e) {
  const dd = document.getElementById('notificationsDropdown');
  const btn = e.target.closest('button[onclick="toggleNotifications()"]');
  if (!btn && !e.target.closest('#notificationsDropdown')) {
    if (dd) dd.style.display = 'none';
    document.removeEventListener('click', closeNotificationsOutside);
  }
}

function readNotification(id, link_type, link_id) {
  toggleNotifications(); // ปิด dropdown
  showLoading('กำลังเปิด...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status === 'success') {
        // นำเอาออกจาก APP.dashboardData เพื่อให้อัปเดต UI
        if (APP.dashboardData && APP.dashboardData.unread_notifications) {
          APP.dashboardData.unread_notifications = APP.dashboardData.unread_notifications.filter(n => n.id !== id);
          updateNotificationsUI(APP.dashboardData.unread_notifications);
        }
        // นำทางไปหน้าเป้าหมาย
        if (link_type === 'documents') {
          navigate('documents');
          // ถ้าต้องการให้เปิดเอกสารนั้นขึ้นมาเลย สามารถทำได้โดยอัปเดต state
          // setTimeout(() => openDocumentForm(link_id), 500); 
        }
      }
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message||err); })
    .markNotificationRead(id, APP.token);
}

function refreshBadges() {
  if (document.hidden) return; // ไม่ส่ง polling เมื่อแท็บไม่ได้ถูกเปิดดู เพื่อประหยัดเน็ตและ CPU
  if (!APP.token) return;
  google.script.run
    .withSuccessHandler(res => {
      if (res && (res.message === 'session_invalid' || res.code === 401)) {
        if (typeof window.handleSessionInvalid === 'function') window.handleSessionInvalid();
        return;
      }
      if (!res || res.status !== 'success') return;
      const badge = document.getElementById('badgeApprovals');
      const dot   = document.getElementById('topbarDot');
      if (res.pending_approvals !== undefined) {
        if (res.pending_approvals > 0) {
          if (badge) {
            badge.textContent = res.pending_approvals;
            badge.style.display = '';
          }
          if (dot) dot.style.display = '';
        } else {
          if (badge) badge.style.display = 'none';
          if (dot) dot.style.display = 'none';
        }
      }
      
      if (res.data && res.data.unread_notifications !== undefined) {
        if (APP.dashboardData) {
          APP.dashboardData.unread_notifications = res.data.unread_notifications;
        }
        updateNotificationsUI(res.data.unread_notifications);
      }
    })
    .withFailureHandler(()=>{})
    .getSidebarBadges(APP.token);
}

// เมื่อกลับมาเปิดดูแท็บ จะอัปเดตแจ้งเตือนทันทีโดยไม่ต้องรอรอบ Interval
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && APP.token) {
    refreshBadges();
  }
});


/* ============================================================
 *  Profile (Mini)
 * ============================================================ */
function openProfile() {
  Swal.fire({
    title: 'โปรไฟล์ผู้ใช้งาน',
    html: `
      <div style="text-align:left; font-size:14px; padding: 8px 4px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #E2E8F0;">
          <div class="avatar-circle" style="width:60px;height:60px;border-radius:50%;font-size:24px;
            ${APP.user.avatar ? `background-image:url(${APP.user.avatar});` : ''}">
            ${APP.user.avatar ? '' : (APP.user.name || APP.user.username || 'U').charAt(0).toUpperCase()}
          \x3c/div>
          <div>
            <div style="font-weight:700;font-size:16px;">${escapeHTML(APP.user.name || '-')}\x3c/div>
            <div style="color:#64748B;font-size:13px;">${escapeHTML(APP.user.username)}\x3c/div>
          \x3c/div>
        \x3c/div>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:8px 14px; color:#334155;">
          <span style="color:#64748B;">บทบาท:\x3c/span>
          <span><span class="status-badge status-active">${({admin:'ผู้ดูแลระบบ', director:'ผู้อำนวยการโรงเรียน', deputy:'รองผู้อำนวยการโรงเรียน', staff:'เจ้าหน้าที่', teacher:'ครู'})[APP.role] || APP.role}\x3c/span>\x3c/span>
          <span style="color:#64748B;">อีเมล:\x3c/span>      <span>${escapeHTML(APP.user.email || '-')}\x3c/span>
          <span style="color:#64748B;">โทรศัพท์:\x3c/span>   <span>${escapeHTML(APP.user.phone || '-')}\x3c/span>
          <span style="color:#64748B;">ฝ่าย/กลุ่ม:\x3c/span> <span>${escapeHTML(APP.user.department || '-')}\x3c/span>
        \x3c/div>
      \x3c/div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-lock-alt">\x3c/i> เปลี่ยนรหัสผ่าน',
    cancelButtonText : 'ปิด',
    customClass: { confirmButton: 'swal2-confirm' }
  }).then(r => {
    if (r.isConfirmed) openChangePassword();
  });
}

function openChangePassword() {
  Swal.fire({
    title: 'เปลี่ยนรหัสผ่าน',
    html: `
      <div style="text-align:left; padding: 4px;">
        <div style="margin-bottom:10px;">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:#334155;">รหัสผ่านเดิม\x3c/label>
          <input type="password" id="oldPwd" class="swal2-input" style="margin:0;width:100%;font-family:inherit;" />
        \x3c/div>
        <div style="margin-bottom:10px;">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:#334155;">รหัสผ่านใหม่ (≥ 6 ตัว)\x3c/label>
          <input type="password" id="newPwd" class="swal2-input" style="margin:0;width:100%;font-family:inherit;" />
        \x3c/div>
        <div>
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:#334155;">ยืนยันรหัสผ่านใหม่\x3c/label>
          <input type="password" id="newPwd2" class="swal2-input" style="margin:0;width:100%;font-family:inherit;" />
        \x3c/div>
      \x3c/div>
    `,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText : 'ยกเลิก',
    preConfirm: () => {
      const o = document.getElementById('oldPwd').value;
      const n = document.getElementById('newPwd').value;
      const n2= document.getElementById('newPwd2').value;
      if (!o || !n) { Swal.showValidationMessage('กรอกข้อมูลให้ครบ'); return false; }
      if (n.length < 6) { Swal.showValidationMessage('รหัสใหม่อย่างน้อย 6 ตัว'); return false; }
      if (n !== n2) { Swal.showValidationMessage('รหัสยืนยันไม่ตรงกัน'); return false; }
      return { o, n };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังเปลี่ยนรหัสผ่าน...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text: res.message, timer: 1800 });
        else Swal.fire({ icon:'error', title:'ไม่สำเร็จ', text: res.message });
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', title:'ผิดพลาด', text: err.message || err }); })
      .changeOwnPassword(APP.token, r.value.o, r.value.n);
  });
}


/* ============================================================
 *  Upload Helpers (ใช้ได้ทุก Part)
 * ============================================================ */
async function uploadFileToGAS(file, category) {
  return new Promise((resolve, reject) => {
    if (file.size > 8 * 1024 * 1024) return reject(new Error('ไฟล์ใหญ่เกิน 8MB'));

    if (file.type.startsWith('image/')) {
      compressImage(file, 800, 0.7, (base64, mimeType) => {
        sendToGAS(base64, file.name, mimeType || 'image/jpeg', category || 'general', resolve, reject);
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        sendToGAS(base64, file.name, file.type || 'application/octet-stream', category || 'general', resolve, reject);
      };
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'));
      reader.readAsDataURL(file);
    }
  });
}

function compressImage(file, maxWidth, quality, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio  = Math.min(maxWidth / img.width, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d');
      const isPng = (file.type === 'image/png');
      if (!isPng) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      callback(canvas.toDataURL(mimeType, quality).split(',')[1], mimeType);
    };
    img.onerror = () => callback(e.target.result.split(',')[1], file.type);
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function sendToGAS(base64, fileName, mimeType, category, resolve, reject) {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status === 'success') resolve(res);
      else reject(new Error(res.message || 'อัพโหลดไม่สำเร็จ'));
    })
    .withFailureHandler(err => reject(err))
    .uploadFile(base64, fileName, mimeType, category);
}

/**
 * ใช้ใน HTML:  <input type="file" onchange="handleImageUpload(this, 'students', cb)">
 * cb(viewUrl, fileId)
 */
async function handleImageUpload(inputEl, category, callback) {
  const file = inputEl.files[0];
  if (!file) return;
  showLoading('กำลังอัพโหลด...');
  try {
    const result = await uploadFileToGAS(file, category);
    hideLoading();
    showToast('success', 'อัพโหลดสำเร็จ');
    if (callback) callback(result.view_url, result.file_id, result);
  } catch (err) {
    hideLoading();
    showToast('error', 'อัพโหลดไม่สำเร็จ: ' + (err.message || err));
  }
  inputEl.value = '';
}


/* ============================================================
 *  UI Helpers
 * ============================================================ */
function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'กำลังโหลด...';
  document.getElementById('loadingOverlay').classList.add('show');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

function showToast(icon, title) {
  let container = document.getElementById('custom-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'custom-toast-container';
    container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:999999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bgColor = icon === 'error' ? '#DC2626' : (icon === 'success' ? '#10B981' : '#3B82F6');
  toast.style.cssText = `background: ${bgColor}; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; opacity: 0; transform: translateX(50px); transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);`;
  
  const iconClass = icon === 'error' ? 'bx-error-circle' : (icon === 'success' ? 'bx-check-circle' : 'bx-info-circle');
  toast.innerHTML = `<i class='bx ${iconClass}' style='font-size:18px;'></i> <span>${escapeHTML(title)}</span>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}


/* ============================================================
 *  Formatters / Escapers
 * ============================================================ */
function escapeHTML(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/\x3c/g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US');
}
function formatMoney(n) {
  const v = Number(n || 0);
  return '฿' + v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function formatThaiDate(d) {
  if (!(d instanceof Date)) d = new Date(d);
  if (isNaN(d.getTime())) return '-';
  const m = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
             'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}
function formatThaiDateShort(d) {
  if (!(d instanceof Date)) d = new Date(d);
  if (isNaN(d.getTime())) return '-';
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
             'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + ((d.getFullYear() + 543) % 100);
}

function renderBudget(container) {
  renderIframe(container, 'https://kongirr12.github.io/bug/', 'ระบบบริหารงานงบประมาณ');
}

function renderIframe(container, url, title) {
  container.innerHTML = `
    <div style="width: 100%; height: calc(100vh - 140px); display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); background: var(--bg-surface);">
      <iframe src="${url}" 
              style="flex: 1; width: 100%; height: 100%; border: none; zoom: 0.95;" 
              title="${title}"></iframe>
    </div>
  `;
}

/* ============================================================
 *  EXTERNAL ADDONS: โปรแกรมช่วยกรอกคะแนน SGS (AutoGrade v1.0.3)
 *  รองรับ Windows (v1.0.3), macOS (v1.0.3), ส่วนขยาย Chrome & แบบฟอร์ม 69/1
 * ============================================================ */
function renderExtSgs(container) {
  // URLs & Direct File Links from Google Drive (v1.0.3 Update)
  const gdriveMainUrl = 'https://drive.google.com/drive/folders/153RWKxcpQmdPZYz8QHBA6vyXKWwV4QDD';
  
  // Windows
  const winZipUrl = 'https://drive.google.com/file/d/1zLD8-vB1nHCWKnI_ZmAyCIOfRMQphHs8/view?usp=sharing';
  const winBatUrl = 'https://drive.google.com/file/d/1dZEP5IJP2_XVV9CkZ2oraGuVJM0uJYx0/view?usp=sharing';
  const winDocUrl = 'https://drive.google.com/file/d/17TIFbUnbNJk0AJQL0W3N0j2MhYJkZfKq/view?usp=sharing';
  const winFolderUrl = 'https://drive.google.com/drive/folders/1KrXnn2B0jai7gXIA8v_meJ9q2qDVrGya';

  // Mac
  const macZipUrl = 'https://drive.google.com/file/d/1weergAzyWxLCrOrMkZvrXe86Z3SoYoK3/view?usp=sharing';
  const macAppUrl = 'https://drive.google.com/drive/folders/1ErmrES-kJyMeXzzN9Q5zoCTWRM3g4VVa';
  const macDocUrl = 'https://drive.google.com/file/d/1UjZeIiiXMyxIEHylO7DbmkqFYVaYM9pQ/view?usp=sharing';
  const macFolderUrl = 'https://drive.google.com/drive/folders/1J8CV5tG_fbCs8pB01KDDSSNgQzcoBs9j';

  // Chrome Extension
  const chromeExtZipUrl = 'https://drive.google.com/file/d/1EefrevF9yR6AT1Fw47-lBFslyahAXuDC/view?usp=sharing';
  const chromeExtFolderUrl = 'https://drive.google.com/drive/folders/18lgmfotfQLzYVHF7jjiRWIjqVnVKch6-';

  // Templates & Guides
  const sampleExcelUrl = 'https://drive.google.com/file/d/1YLMGobE0cHmrcfOGZZe1Icp2WR2xBKlO/view?usp=sharing';
  const sampleFolderUrl = 'https://drive.google.com/drive/folders/1Qek8W5BWP6nhPz8w69AADW8zZasn42yR';
  const generalDocUrl = 'https://drive.google.com/file/d/1hTpDD8xTfT3_MUWUsrPH__bfeqycur4k/view?usp=sharing';

  container.innerHTML = `
    <div class="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      <!-- Hero Banner -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/25">
        <div class="relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>อัปเดตเวอร์ชันใหม่ล่าสุด v1.0.3 (พร้อมส่วนขยาย Chrome)</span>
          </div>
          <h1 class="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            โปรแกรมช่วยกรอกคะแนน SGS (AutoGrade v1.0.3)
          </h1>
          <p class="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            ศูนย์รวมดาวน์โหลดโปรแกรมและส่วนเสริมช่วยกรอกคะแนนเข้าสู่ระบบ SGS ของ สพฐ. โดยอัตโนมัติ สำหรับคุณครูโรงเรียนมหาชัยพิทยาคาร รองรับระบบปฏิบัติการ Windows (แบบ Portable ไม่ต้องติดตั้ง), macOS (ชิป Apple Silicon M1-M4 & Intel) และส่วนขยาย Google Chrome เชื่อมโยงกับไฟล์ Excel ปพ.5 จากระบบ MHC Smart School ได้ 100%
          </p>
          <div class="flex flex-wrap items-center gap-2 mt-4 text-[11px] sm:text-xs text-slate-300 font-medium">
            <span class="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <i class='bx bxl-windows text-sky-400'></i> Windows v1.0.3 (Portable)
            </span>
            <span class="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <i class='bx bxl-apple text-slate-200'></i> macOS v1.0.3 (M1-M4 & Intel)
            </span>
            <span class="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <i class='bx bxl-chrome text-amber-400'></i> ส่วนขยาย Google Chrome
            </span>
            <span class="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              <i class='bx bx-check-shield text-emerald-400'></i> ฟอร์มมาตรฐาน 69/1
            </span>
          </div>
        </div>
        <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- Download Cards Grid (4 Columns: Windows, Mac, Chrome Extension, Templates) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Windows (Portable v1.0.3) -->
        <div class="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl mb-3 border border-sky-200 dark:border-sky-800 shadow-2xs">
              <i class='bx bxl-windows'></i>
            </div>
            <div class="flex items-center gap-1.5 mb-1">
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">สำหรับ Windows</h3>
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">v1.0.3</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              ไฟล์ AutoGrade-Windows-v1.0.3.zip (231 MB) แบบ Portable เปิดใช้งานได้ทันที
            </p>
            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mb-3 border border-slate-100 dark:border-slate-800">
              <div class="flex items-start gap-1">
                <i class='bx bx-check-circle text-sky-500 mt-0.5 flex-shrink-0'></i>
                <span>แตกไฟล์ ZIP แล้วดับเบิลคลิก <b>เปิดใช้งานโปรแกรม.bat</b> หรือ .exe</span>
              </div>
              <div class="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <i class='bx bx-shield-quarter text-amber-500 mt-0.5 flex-shrink-0'></i>
                <span>หากขึ้น SmartScreen กด <i>More info</i> > <i>Run anyway</i></span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5 pt-1">
            <a href="${winZipUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-blue w-full justify-center text-xs font-bold shadow-sm">
              <i class='bx bxs-download mr-1 text-sm'></i> ดาวน์โหลด Windows (.zip)
            </a>
            <div class="grid grid-cols-2 gap-1.5">
              <a href="${winBatUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="ดาวน์โหลดตัวเรียกโปรแกรม .bat">
                <i class='bx bx-terminal mr-0.5 text-sky-600'></i> โหลด .bat
              </a>
              <a href="${winDocUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="อ่านคู่มือ Windows">
                <i class='bx bx-file mr-0.5 text-slate-500'></i> อ่านคู่มือ
              </a>
            </div>
            <a href="${winFolderUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light w-full justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <i class='bx bxl-google-cloud mr-1 text-sky-500'></i> เปิดโฟลเดอร์ Google Drive
            </a>
          </div>
        </div>

        <!-- Card 2: macOS (v1.0.3) -->
        <div class="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center text-2xl mb-3 border border-slate-300 dark:border-slate-700 shadow-2xs">
              <i class='bx bxl-apple'></i>
            </div>
            <div class="flex items-center gap-1.5 mb-1">
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">สำหรับ macOS</h3>
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">v1.0.3</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              ไฟล์ AutoGrade-Mac-v1.0.3.zip (438 MB) รองรับชิป M1-M4 และ Intel
            </p>
            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mb-3 border border-slate-100 dark:border-slate-800">
              <div class="flex items-start gap-1">
                <i class='bx bx-check-circle text-indigo-500 mt-0.5 flex-shrink-0'></i>
                <span>แตกไฟล์แล้วนำ <b>SGS AutoGrade.app</b> ไปวางใน Applications</span>
              </div>
              <div class="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <i class='bx bx-lock-alt text-amber-500 mt-0.5 flex-shrink-0'></i>
                <span>เปิดครั้งแรก: คลิกขวาที่แอปเลือก <i>Open</i> หรือกด <i>Open Anyway</i></span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5 pt-1">
            <a href="${macZipUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-blue w-full justify-center text-xs font-bold shadow-sm" style="background:#1E293B; border-color:#334155;">
              <i class='bx bxs-download mr-1 text-sm'></i> ดาวน์โหลด Mac (.zip)
            </a>
            <div class="grid grid-cols-2 gap-1.5">
              <a href="${macAppUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="เข้าโฟลเดอร์ SGS AutoGrade.app">
                <i class='bx bxs-folder-open mr-0.5 text-indigo-500'></i> โฟลเดอร์ .app
              </a>
              <a href="${macDocUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="อ่านคู่มือ Mac">
                <i class='bx bx-file mr-0.5 text-slate-500'></i> อ่านคู่มือ
              </a>
            </div>
            <a href="${macFolderUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light w-full justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <i class='bx bxl-google-cloud mr-1 text-indigo-500'></i> เปิดโฟลเดอร์ Google Drive
            </a>
          </div>
        </div>

        <!-- Card 3: Google Chrome Extension -->
        <div class="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-3 border border-amber-200 dark:border-amber-800 shadow-2xs">
              <i class='bx bxl-chrome'></i>
            </div>
            <div class="flex items-center gap-1.5 mb-1">
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">ส่วนขยาย Chrome</h3>
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">Extension</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              ไฟล์ SGS_AutoGrade_Extension.zip (687 KB) สำหรับติดตั้งในเบราว์เซอร์ Chrome
            </p>
            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mb-3 border border-slate-100 dark:border-slate-800">
              <div class="flex items-start gap-1">
                <i class='bx bx-check-circle text-amber-500 mt-0.5 flex-shrink-0'></i>
                <span>เข้า <b>chrome://extensions</b> เปิด Developer mode</span>
              </div>
              <div class="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <i class='bx bx-upload text-amber-600 mt-0.5 flex-shrink-0'></i>
                <span>กด <i>Load unpacked</i> แล้วเลือกโฟลเดอร์ที่แตกไฟล์</span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5 pt-1">
            <a href="${chromeExtZipUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-warning w-full justify-center text-xs font-bold shadow-2xs" style="color:#B45309; border-color:#FCD34D;">
              <i class='bx bxs-download mr-1 text-sm'></i> ดาวน์โหลดส่วนขยาย (.zip)
            </a>
            <a href="${chromeExtFolderUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light w-full justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <i class='bx bxl-google-cloud mr-1 text-amber-500'></i> เปิดโฟลเดอร์ Google Drive
            </a>
          </div>
        </div>

        <!-- Card 4: Templates & Resources -->
        <div class="card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mb-3 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <i class='bx bxs-file-doc'></i>
            </div>
            <div class="flex items-center gap-1.5 mb-1">
              <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">แบบฟอร์ม 69/1</h3>
              <span class="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">.xlsx</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              ไฟล์ตัวอย่างและชุดแบบฟอร์มตามรายชื่อนักเรียน SGS ภาคเรียนที่ 1
            </p>
            <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 mb-3 border border-slate-100 dark:border-slate-800">
              <div class="flex items-start gap-1">
                <i class='bx bx-check-double text-emerald-600 mt-0.5 flex-shrink-0'></i>
                <span>คอลัมน์ stdID, S1-S20, กลางภาค, ปลายภาค, Q1-Q8, L1-L5</span>
              </div>
              <div class="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <i class='bx bx-folder text-emerald-600 mt-0.5 flex-shrink-0'></i>
                <span>มีโฟลเดอร์แยกตามระดับชั้น ม.1 - ม.6</span>
              </div>
            </div>
          </div>
          <div class="space-y-1.5 pt-1">
            <a href="${sampleExcelUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-full justify-center text-xs font-bold shadow-2xs">
              <i class='bx bx-download mr-1 text-sm text-emerald-600'></i> โหลดไฟล์ตัวอย่าง (.xlsx)
            </a>
            <div class="grid grid-cols-2 gap-1.5">
              <a href="${sampleFolderUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="โฟลเดอร์แบบฟอร์ม 69/1">
                <i class='bx bx-folder mr-0.5 text-emerald-600'></i> ฟอร์ม 69/1
              </a>
              <a href="${generalDocUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300" title="คู่มือรวม">
                <i class='bx bx-book mr-0.5 text-slate-500'></i> คู่มือรวม
              </a>
            </div>
            <a href="${gdriveMainUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-light w-full justify-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              <i class='bx bxl-google-cloud mr-1 text-emerald-600'></i> Google Drive รวมทั้งหมด
            </a>
          </div>
        </div>

      </div>

      <!-- How to use 4-Step Guide -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i class='bx bx-book-open text-indigo-600'></i>
              <span>ขั้นตอนการใช้งานโปรแกรมร่วมกับระบบ MHC Smart School</span>
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เพียง 4 ขั้นตอนง่ายๆ ในการนำผลการเรียน ปพ.5 เข้าสู่ระบบ SGS กระทรวงศึกษาธิการ
            </p>
          </div>
          <button class="btn btn-light text-xs font-semibold hidden sm:inline-flex" onclick="navigate('academic')">
            <i class='bx bx-arrow-back mr-1'></i> ไปหน้าบันทึกคะแนน ปพ.5
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Step 1 -->
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            <div class="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">1</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">บันทึกคะแนนในระบบ</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              เข้าเมนู <b>"งานวิชาการ & ปพ.5"</b> เลือกรายวิชา และกรอกคะแนนเก็บ (S1-S20), กลางภาค, ปลายภาค, คุณลักษณะ (Q1-Q8) และอ่านคิดวิเคราะห์ (L1-L5)
            </p>
          </div>

          <!-- Step 2 -->
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            <div class="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">2</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">ส่งออกไฟล์ AutoGrade</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              คลิกปุ่มสีเขียว <b>"โหลด Excel (AutoGrade .xlsx)"</b> ด้านบนตารางคะแนน ระบบจะสร้างไฟล์ที่มีโครงสร้างตรงกับโปรแกรม 100%
            </p>
          </div>

          <!-- Step 3 -->
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            <div class="w-7 h-7 rounded-full bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">3</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">เปิดโปรแกรม AutoGrade</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              เปิดโปรแกรม <b>SGS AutoGrade</b> บนเครื่องคอมพิวเตอร์ของคุณครู (Windows, Mac หรือส่วนขยาย Chrome) แล้วคลิกเลือกไฟล์ Excel ที่ดาวน์โหลดมา
            </p>
          </div>

          <!-- Step 4 -->
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            <div class="w-7 h-7 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">4</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1.5">เริ่มกรอกคะแนนอัตโนมัติ</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ล็อกอินเข้าเว็บไซต์ระบบ SGS เปิดหน้ารายวิชาที่ตรงกัน แล้วกดปุ่ม <b>"เริ่มกรอกคะแนน"</b> ในโปรแกรม ระบบจะพิมพ์คะแนนให้อัตโนมัติทันที
            </p>
          </div>

        </div>

        <div class="mt-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <i class='bx bxs-bulb text-base mt-0.5 text-amber-600 flex-shrink-0'></i>
          <div class="leading-relaxed">
            <b>ข้อแนะนำเพิ่มเติม:</b> ขณะที่โปรแกรม AutoGrade กำลังหยอดคะแนนลงบนหน้าเว็บ SGS แนะนำให้เปิดหน้าต่างเว็บ SGS ไว้ที่หน้าจอหลักและหลีกเลี่ยงการคลิกเมาส์หรือพิมพ์แป้นพิมพ์อื่นแทรก จนกว่าโปรแกรมจะขึ้นแจ้งเตือนว่ากรอกคะแนนเสร็จสิ้นครบทุกคนครับ
          </div>
        </div>

        <div class="mt-4 text-center sm:hidden">
          <button class="btn btn-blue w-full text-xs font-bold" onclick="navigate('academic')">
            <i class='bx bx-book-content mr-1'></i> ไปหน้าระบบ ปพ.5 และบันทึกคะแนน
          </button>
        </div>
      </div>
    </div>
  `;
}
