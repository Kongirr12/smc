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
      .withFailureHandler(() => { hideLoading(); showLoginScreen(); })
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
    }
    enterApp();
  } else {
    sessionStorage.removeItem('sso_token');
    localStorage.removeItem('sso_token');
    showLoginScreen();
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
  document.getElementById('tabAdmin').classList.toggle('active', tab === 'admin');
  document.getElementById('tabStaff').classList.toggle('active', tab === 'staff');
  
  const heroPanel = document.getElementById('loginHeroPanel');
  const roleBadge = document.getElementById('loginRoleBadge');
  
  if (tab === 'admin') {
    document.getElementById('loginUsername').placeholder = 'ชื่อผู้ใช้งาน Admin';
    if(heroPanel) heroPanel.style.background = 'linear-gradient(135deg, #A62639 0%, #26020A 100%)';
    if(roleBadge) roleBadge.textContent = 'ระบบผู้ดูแลระบบ (Admin)';
  } else {
    document.getElementById('loginUsername').placeholder = 'ชื่อผู้ใช้งาน / รหัสประจำตัว';
    if(heroPanel) heroPanel.style.background = 'linear-gradient(135deg, #800020 0%, #26020A 100%)';
    if(roleBadge) roleBadge.textContent = 'ระบบบุคลากร (Staff / Teacher)';
  }
  document.getElementById('loginUsername').focus();
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

function forgotPassword() {
  Swal.fire({
    icon: 'info',
    title: 'ลืมรหัสผ่าน',
    html: 'กรุณาติดต่อผู้ดูแลระบบ<br>หรือ Reset รหัสผ่านในหน้าตั้งค่า',
    confirmButtonText: 'ตกลง'
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
    confirmButtonColor: '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังออกจากระบบ...');
    google.script.run
      .withSuccessHandler(() => {
        hideLoading();
        sessionStorage.removeItem('sso_token');
        localStorage.removeItem('sso_token');
        APP.token = null; APP.user = null; APP.role = null;
        showLoginScreen();
      })
      .withFailureHandler(() => { hideLoading(); showLoginScreen(); })
      .logout(APP.token);
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
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = config.school_logo;
      
      const logoBox = document.getElementById('logoBoxSidebar');
      if (logoBox) {
        logoBox.classList.add('has-image');
        logoBox.innerHTML = `<img src="${config.school_logo}" 
             onerror="handleLogoError(this, 'sidebarLogoIcon', 'logoBoxSidebar')"
             style="max-height:100%; max-width:100%; border-radius:8px; object-fit:contain;">
        <i class='bx bxs-graduation' id="sidebarLogoIcon" style="display:none;"></i>`;
      }
    }
  }

  // ผู้ใช้
  const sidebarName = document.getElementById('sidebarUserName');
  if (sidebarName) sidebarName.textContent = APP.user.name || APP.user.username;
  
  const sidebarRole = document.getElementById('sidebarUserRole');
  if (sidebarRole) sidebarRole.textContent = ({ admin:'ผู้ดูแลระบบ', staff:'เจ้าหน้าที่', teacher:'ครู' })[APP.role] || APP.role;

  const av = document.getElementById('sidebarAvatar');
  if (av) {
    if (APP.user.avatar) {
      av.style.backgroundImage = 'url(' + APP.user.avatar + ')';
      av.textContent = '';
    } else {
      av.textContent = (APP.user.name || APP.user.username || 'U').charAt(0).toUpperCase();
    }
  }

  // ซ่อนเมนู admin ถ้าไม่ใช่ admin
  const isAdmin = APP.role === 'admin';
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
}

/* ============================================================
 *  Dark Mode Toggle
 * ============================================================ */
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark-mode');
  localStorage.setItem('smart_school_dark_mode', isDark);
  
  const icon = document.querySelector('#btnDarkMode i');
  if (icon) {
    icon.className = isDark ? 'bx bx-sun' : 'bx bx-moon';
  }
}

// Initial icon state
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('smart_school_dark_mode') === 'true') {
    const icon = document.querySelector('#btnDarkMode i');
    if (icon) icon.className = 'bx bx-sun';
  }
});

/* ============================================================
 *  Access Control Helper
 * ============================================================ */
function canEditModule(moduleName) {
  if (moduleName === 'personnel') {
    return APP.role === 'admin';
  }
  
  if (APP.role === 'admin' || APP.role === 'staff') return true;
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

  const titles = {
    dashboard: 'หน้าหลัก',
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
    reports: 'รายงาน',
    users: 'จัดการผู้ใช้งาน',
    settings: 'ตั้งค่าระบบ',
    schedule: 'ตารางสอน',
    manual  : 'คู่มือการใช้งาน'
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
    case 'reports':   if (typeof renderReports   === 'function') return renderReports(content);   break;
    case 'users':     if (typeof renderUsers     === 'function') return renderUsers(content);     break;
    case 'settings':  if (typeof renderSettings  === 'function') return renderSettings(content);  break;
    case 'schedule':  if (typeof renderSchedule  === 'function') return renderSchedule(content);  break;
    case 'manual':    if (typeof renderManual    === 'function') return renderManual(content);    break;
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

    <div class="dash-row">
      <div class="dash-card">
        <h3>
          <i class='bx bx-bar-chart-alt-2' style="color:#A62639; margin-right:5px;">\x3c/i> สถิติการเข้าเรียนรายสัปดาห์
          <a href="#" onclick="event.preventDefault(); navigate('attendance');">ดูทั้งหมด <i class='bx bx-chevron-right'>\x3c/i>\x3c/a>
        \x3c/h3>
        <div class="chart-box"><canvas id="chartAttendance">\x3c/canvas>\x3c/div>
      \x3c/div>

      <div class="dash-card">
        <h3><i class='bx bxs-megaphone' style="color:#A62639; margin-right:5px;">\x3c/i> ประกาศล่าสุด\x3c/h3>
        <div class="announce-list" id="announceList">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="dash-card">
        <h3><i class='bx bx-wallet' style="color:#A62639; margin-right:5px;">\x3c/i> สรุปรายรับ - รายจ่าย\x3c/h3>
        <div class="chart-box" style="height:170px;"><canvas id="chartFinance">\x3c/canvas>\x3c/div>
        <div class="text-center mt-2">
          <div class="text-xs text-slate-500">คงเหลือสุทธิ\x3c/div>
          <div class="text-lg font-bold text-blue-600" id="netBalance">฿0\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
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

  // Chart: เข้าเรียน 7 วัน
  const ctxA = document.getElementById('chartAttendance');
  if (ctxA) {
    APP.charts.attendance = new Chart(ctxA, {
      type: 'line',
      data: {
        labels: d.week_chart.map(x => x.label),
        datasets: [{
          label: 'อัตราการเข้าเรียน (%)',
          data: d.week_chart.map(x => x.pct),
          borderColor: '#A62639',
          backgroundColor: 'rgba(59,130,246,.15)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#800020', pointRadius: 4,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { stepSize: 25, callback: v => v + '%' }, grid:{ color:'#F1F5F9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Chart: การเงิน
  const ctxF = document.getElementById('chartFinance');
  if (ctxF) {
    APP.charts.finance = new Chart(ctxF, {
      type: 'doughnut',
      data: {
        labels: ['รายรับ', 'รายจ่าย'],
        datasets: [{
          data: [d.finance.income || 0, d.finance.expense || 0],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 0, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Sarabun', size: 12 }, padding: 12, boxWidth: 12 } },
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
  if (!APP.token) return;
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return;
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
          <span><span class="status-badge status-active">${({admin:'ผู้ดูแลระบบ',staff:'เจ้าหน้าที่',teacher:'ครู'})[APP.role] || APP.role}\x3c/span>\x3c/span>
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
  const bgColor = icon === 'error' ? '#EF4444' : (icon === 'success' ? '#10B981' : '#3B82F6');
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
  container.innerHTML = `
    <div style="width: 100%; height: calc(100vh - 60px); display: flex; flex-direction: column;">
      <iframe src="https://kongirr12.github.io/budgetsystem/" 
              style="flex: 1; width: 100%; border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" 
              title="ระบบบริหารงานงบประมาณ"></iframe>
    </div>
  `;
}
