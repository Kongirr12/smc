/* ============================================================
 *  MHC Smart School — Module: Chat & Live Online Presence Engine
 *  โรงเรียนมหาชัยพิทยาคาร | ผู้จัดทำ: ครูก้องนที อุ่นเจริญ
 *  Version: 3.2.0
 * ============================================================ */

window.APP_CHAT = {
  activeRecipient: 'all', // 'all' (ห้องรวม) หรือ ID ของครู/ผู้บริหาร
  recipientInfo: {
    id: 'all',
    name: 'ห้องสนทนารวมครู MHC',
    position: 'โรงเรียนมหาชัยพิทยาคาร',
    isOnline: true,
    isDirector: false
  },
  messages: [],
  onlineUsers: [],
  onlineCount: 0,
  pollTimer: null,
  pingTimer: null,
  soundEnabled: true,
  isOpen: false,
  activeTab: 'chat', // 'chat' | 'online' | 'contacts'
  lastTimestamp: null,
  knownMessageIds: new Set(),
  quickReplies: [
    '👍 รับทราบครับ/ค่ะ',
    '🙏 ขอบคุณครับ/ค่ะ',
    '📌 ขออนุญาตปรึกษาครับ',
    '⏳ กำลังดำเนินการครับ',
    '✅ ดำเนินการเรียบร้อยแล้ว',
    '👋 สวัสดีครับ/ค่ะ'
  ]
};

// อ่านการตั้งค่าเสียง
try {
  const savedSound = localStorage.getItem('mhc_chat_sound');
  if (savedSound !== null) APP_CHAT.soundEnabled = (savedSound === 'true');
} catch (_) {}

/* ─── Web Audio Chime (เสียงแจ้งเตือนข้อความเข้าเบาๆ นุ่มนวล) ─────────── */
function playChatChime() {
  if (APP_CHAT.soundEnabled === false) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.28);
  } catch (_) {}
}

/* ─── ฟอร์แมตเวลาแสดงผล ────────────────────────────────────────── */
function formatChatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (isToday) return `${hours}:${mins} น.`;
    return `${d.getDate()}/${d.getMonth()+1} ${hours}:${mins}`;
  } catch (_) {
    return '';
  }
}

/* ─── ฟังก์ชันสร้าง Avatar ───────────────────────────────────────── */
function getChatAvatarHtml(user, sizeClass = 'w-9 h-9', textSize = 'text-xs') {
  if (user && user.avatar) {
    return `<img src="${escapeHTML(user.avatar)}" class="${sizeClass} rounded-full object-cover border border-slate-200 shadow-2xs" alt="${escapeHTML(user.name || '')}">`;
  }
  const name = user ? (user.name || 'ครู') : 'ครู';
  const cleanName = name.replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ดร\.)\s*/, '').trim();
  const initial = cleanName.charAt(0) || 'M';
  const isDir = user && (user.isDirector || (user.position && user.position.includes('ผู้อำนวยการ')) || name.includes('อธิการ'));
  
  if (isDir) {
    return `<div class="${sizeClass} rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-bold flex items-center justify-center ${textSize} shadow-2xs border border-amber-300">
      <i class='bx bxs-crown text-sm'></i>
    </div>`;
  }
  return `<div class="${sizeClass} rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center ${textSize} shadow-2xs">
    ${escapeHTML(initial)}
  </div>`;
}

/* ─── ตรวจสอบและดึงข้อมูลข้อความ ─────────────────────────────────── */
function loadChatMessages(recipientId, silent = false) {
  if (recipientId !== undefined) {
    APP_CHAT.activeRecipient = recipientId;
  }
  const target = APP_CHAT.activeRecipient || 'all';

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.status === 'success') {
          handleReceivedMessages(res.messages || [], silent);
        }
      })
      .withFailureHandler(err => {
        if (!silent) console.warn('Chat load error:', err);
      })
      .getChatMessages(typeof APP !== 'undefined' ? APP.token : '', target, null);
  }
}

/* ─── จัดการข้อความที่ได้รับ ──────────────────────────────────────── */
function handleReceivedMessages(msgs, silent = false) {
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';
  let hasNewOtherMsg = false;

  msgs.forEach(m => {
    if (!APP_CHAT.knownMessageIds.has(m.id)) {
      APP_CHAT.knownMessageIds.add(m.id);
      if (m.sender_id !== myId && !silent) {
        hasNewOtherMsg = true;
      }
    }
  });

  APP_CHAT.messages = msgs;

  if (hasNewOtherMsg) {
    playChatChime();
    // ถ้าหน้าต่างแชทไม่ได้เปิดอยู่ ให้แสดงเตือน
    if (!APP_CHAT.isOpen && APP_CHAT.activeTab !== 'chat') {
      updateChatUnreadBadge(1);
    }
  }

  // อัปเดตการแสดงผลถ้าเปิดหน้าต่างแชทอยู่
  renderChatMessagesList();
  
  // อัปเดตในหน้า Full Page ถ้าเปิดอยู่
  renderFullPageChatMessagesList();
}

/* ─── อัปเดต Badge จำนวนข้อความที่ยังไม่ได้อ่าน ───────────────────────── */
function updateChatUnreadBadge(delta) {
  const badge = document.getElementById('chatFloatingUnreadBadge');
  if (!badge) return;
  if (delta === 0) {
    APP_CHAT.unreadCount = 0;
    badge.classList.add('hidden');
    badge.textContent = '0';
  } else {
    APP_CHAT.unreadCount = (APP_CHAT.unreadCount || 0) + delta;
    if (APP_CHAT.unreadCount > 0) {
      badge.textContent = APP_CHAT.unreadCount > 9 ? '9+' : APP_CHAT.unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

/* ─── ส่งข้อความแชท ────────────────────────────────────────────── */
function sendChatMessageAction(content, type = 'text') {
  if (!content || !content.trim()) return;
  const text = content.trim();
  const token = typeof APP !== 'undefined' ? APP.token : '';
  const recipient = APP_CHAT.activeRecipient || 'all';

  // ป้องกันการกดซ้ำแบบรวดเร็ว
  const inputEl = document.getElementById('chatFloatingInput') || document.getElementById('chatFullPageInput');
  if (inputEl) inputEl.value = '';

  // แสดงผล Optimistic ล่วงหน้าทันที เพื่อความรู้สึก Real-time รวดเร็วทันใจ
  const myUser = (typeof APP !== 'undefined' && APP.user) ? APP.user : { id:'me', name:'คุณครู', role:'teacher' };
  const tempMsg = {
    id: 'temp_' + Date.now(),
    sender_id: myUser.id,
    sender_name: myUser.name,
    sender_role: myUser.role,
    sender_position: myUser.position || 'ครูผู้สอน',
    sender_avatar: myUser.avatar || myUser.photo || '',
    recipient_id: recipient,
    content: text,
    type: type,
    created_at: new Date().toISOString(),
    isSending: true
  };
  APP_CHAT.messages.push(tempMsg);
  APP_CHAT.knownMessageIds.add(tempMsg.id);
  renderChatMessagesList();
  renderFullPageChatMessagesList();
  scrollChatToBottom();

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.status === 'success' && res.message) {
          // แทนที่ข้อความ temp ด้วยข้อความจริงจาก Server
          const idx = APP_CHAT.messages.findIndex(m => m.id === tempMsg.id);
          if (idx !== -1) {
            APP_CHAT.messages[idx] = res.message;
            APP_CHAT.knownMessageIds.add(res.message.id);
          }
          renderChatMessagesList();
          renderFullPageChatMessagesList();
        }
      })
      .withFailureHandler(err => {
        console.error('Send message error:', err);
        if (typeof showToast === 'function') {
          showToast('error', 'ไม่สามารถส่งข้อความได้: ' + (err.message || err));
        }
      })
      .sendChatMessage(token, recipient, text, type);
  }
}

/* ─── ดึงข้อมูลผู้ใช้งานที่กำลังออนไลน์ (Online Roster) ───────────────── */
function fetchOnlineUsersList(callback) {
  const token = typeof APP !== 'undefined' ? APP.token : '';
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.status === 'success') {
          APP_CHAT.onlineUsers = res.users || [];
          APP_CHAT.onlineCount = res.onlineCount || 0;
          updateOnlineCountBadges(APP_CHAT.onlineCount);
          if (typeof callback === 'function') callback(APP_CHAT.onlineUsers);
          renderOnlineUsersTab();
          renderFullPageContacts();
        }
      })
      .withFailureHandler(err => {
        console.warn('Get online users error:', err);
      })
      .getOnlineUsers(token);
  }
}

/* ─── อัปเดตป้ายตัวเลขออนไลน์บนปุ่มลอยและเมนู ─────────────────────── */
function updateOnlineCountBadges(count) {
  const btnBadge = document.getElementById('chatFloatingOnlineCount');
  if (btnBadge) {
    btnBadge.textContent = count > 0 ? `${count} ออนไลน์` : 'MHC Chat';
  }
  const sidebarBadge = document.getElementById('badgeOnlineCount');
  if (sidebarBadge) {
    sidebarBadge.textContent = count;
    sidebarBadge.classList.toggle('hidden', count <= 0);
  }
}

/* ─── เลื่อนแชทลงล่างสุดอัตโนมัติ ───────────────────────────────────── */
function scrollChatToBottom(smooth = true) {
  const container = document.getElementById('chatFloatingMessageArea');
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }
  const fullContainer = document.getElementById('chatFullPageMessageArea');
  if (fullContainer) {
    fullContainer.scrollTo({ top: fullContainer.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }
}

/* ─── สลับห้องสนทนา (ห้องรวม หรือ คนต่อคน) ─────────────────────────── */
function switchChatConversation(recipientId, recipientName, position, avatar, isOnline, isDirector) {
  APP_CHAT.activeRecipient = recipientId;
  APP_CHAT.recipientInfo = {
    id: recipientId,
    name: recipientName || 'ห้องสนทนารวมครู MHC',
    position: position || 'โรงเรียนมหาชัยพิทยาคาร',
    avatar: avatar || '',
    isOnline: isOnline !== undefined ? isOnline : true,
    isDirector: !!isDirector
  };
  APP_CHAT.activeTab = 'chat';

  // อัปเดต Header ใน Floating Window
  const titleEl = document.getElementById('chatFloatingRecipientTitle');
  const subEl = document.getElementById('chatFloatingRecipientSubtitle');
  const avatarEl = document.getElementById('chatFloatingRecipientAvatar');
  if (titleEl) titleEl.textContent = APP_CHAT.recipientInfo.name;
  if (subEl) {
    if (recipientId === 'all') {
      subEl.innerHTML = `<span class="flex items-center gap-1 text-emerald-600"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ห้องสาธารณะของครูทุกคน</span>`;
    } else {
      const statusHtml = APP_CHAT.recipientInfo.isOnline
        ? `<span class="text-emerald-600 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> กำลังออนไลน์</span>`
        : `<span class="text-slate-400">ออฟไลน์</span>`;
      subEl.innerHTML = `${escapeHTML(APP_CHAT.recipientInfo.position || 'คุณครู')} • ${statusHtml}`;
    }
  }
  if (avatarEl) {
    avatarEl.innerHTML = recipientId === 'all'
      ? `<div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs"><i class='bx bxs-school'></i></div>`
      : getChatAvatarHtml(APP_CHAT.recipientInfo, 'w-8 h-8', 'text-xs');
  }

  // อัปเดตแท็บในหน้าต่าง
  switchFloatingTab('chat');

  // โหลดข้อความใหม่ของห้องนี้
  loadChatMessages(recipientId, false);
}

/* ─── เรนเดอร์รายการข้อความใน Floating Messenger ─────────────────── */
function renderChatMessagesList() {
  const container = document.getElementById('chatFloatingMessageArea');
  if (!container) return;

  const msgs = APP_CHAT.messages || [];
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';

  if (msgs.length === 0) {
    const isGeneral = APP_CHAT.activeRecipient === 'all';
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
        <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-2xl shadow-xs">
          <i class='bx ${isGeneral ? 'bxs-chat' : 'bxs-conversation'}'></i>
        </div>
        <div class="font-semibold text-xs text-slate-700">
          ${isGeneral ? 'ยินดีต้อนรับสู่ห้องสนทนารวมครู MHC' : `เริ่มการสนทนากับ ${escapeHTML(APP_CHAT.recipientInfo.name)}`}
        </div>
        <p class="text-[11px] text-slate-400 max-w-[220px]">
          ${isGeneral ? 'พิมพ์พูดคุย ปรึกษางาน หรือแจ้งข่าวสารกับคณะครูและผู้บริหารได้ที่นี่' : 'ส่งข้อความเพื่อติดต่อประสานงาน หรือสอบถามเรื่องงาน'}
        </p>
      </div>
    `;
    return;
  }

  let html = '';
  let lastSenderId = null;

  msgs.forEach((m, idx) => {
    const isMe = (m.sender_id === myId) || (!m.sender_id && m.isSending);
    const timeStr = formatChatTime(m.created_at);
    const showAvatarAndName = !isMe && (lastSenderId !== m.sender_id);
    lastSenderId = m.sender_id;

    const isDir = m.sender_position && m.sender_position.includes('ผู้อำนวยการ') || (m.sender_name && m.sender_name.includes('อธิการ'));

    if (isMe) {
      // ฝั่งเรา (ขวา) — สไตล์ Aurora Gradient คมชัด
      html += `
        <div class="flex flex-col items-end mb-2.5 px-3">
          <div class="max-w-[82%] bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-xs px-3.5 py-2 text-xs shadow-xs break-words relative leading-relaxed">
            ${escapeHTML(m.content)}
            ${m.isSending ? `<span class="inline-block ml-1 opacity-70"><i class='bx bx-loader-alt bx-spin text-[10px]'></i></span>` : ''}
          </div>
          <span class="text-[9px] text-slate-400 mt-0.5 mr-1 font-mono">${timeStr}</span>
        </div>
      `;
    } else {
      // ฝั่งผู้อื่น (ซ้าย) — ขาวนวล ขอบเทาชัดเจน
      html += `
        <div class="flex items-start gap-2 mb-2.5 px-3">
          <div class="flex-shrink-0 mt-0.5">
            ${getChatAvatarHtml({ name: m.sender_name, avatar: m.sender_avatar, isDirector: isDir, position: m.sender_position }, 'w-7 h-7', 'text-[10px]')}
          </div>
          <div class="flex flex-col items-start max-w-[78%]">
            ${showAvatarAndName ? `
              <div class="flex items-center gap-1.5 mb-1 ml-0.5">
                <span class="text-[11px] font-bold text-slate-800">${escapeHTML(m.sender_name || 'คุณครู')}</span>
                ${isDir ? `<span class="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-amber-200">👑 ผอ.</span>` : `<span class="text-[9px] text-slate-400 font-normal">(${escapeHTML(m.sender_position || 'ครูผู้สอน')})</span>`}
              </div>
            ` : ''}
            <div class="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs shadow-xs break-words leading-relaxed">
              ${escapeHTML(m.content)}
            </div>
            <span class="text-[9px] text-slate-400 mt-0.5 ml-1 font-mono">${timeStr}</span>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  scrollChatToBottom();
}

/* ─── เรนเดอร์แท็บใครกำลังออนไลน์ (Online Roster Tab) ──────────────── */
function renderOnlineUsersTab() {
  const container = document.getElementById('chatFloatingOnlineListArea');
  if (!container) return;

  const users = APP_CHAT.onlineUsers || [];
  if (users.length === 0) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <i class='bx bx-loader-alt bx-spin text-2xl text-indigo-500 mb-2'></i>
        <div class="text-xs">กำลังตรวจสอบผู้ใช้งานออนไลน์...</div>
      </div>
    `;
    return;
  }

  const onlineList = users.filter(u => u.isOnline);
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';

  let html = `
    <div class="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-xs font-bold text-indigo-950">กำลังเข้าใช้งานขณะนี้</span>
      </div>
      <span class="badge badge-sm badge-green text-[10px] font-bold">${onlineList.length} ท่าน</span>
    </div>
    <div class="divide-y divide-slate-100 overflow-y-auto">
  `;

  users.forEach(u => {
    const isMe = u.id === myId;
    const isDir = u.isDirector || (u.position && u.position.includes('ผู้อำนวยการ')) || u.name.includes('อธิการ');
    const statusText = u.isOnline
      ? '<span class="text-emerald-600 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ใช้งานอยู่</span>'
      : (u.minutesAgo !== null && u.minutesAgo < 60
        ? `<span class="text-slate-400">เข้าใช้งานเมื่อ ${u.minutesAgo} นาทีที่แล้ว</span>`
        : '<span class="text-slate-300">ออฟไลน์</span>');

    html += `
      <div class="p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2.5 ${u.isOnline ? 'bg-emerald-50/20' : ''}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="relative flex-shrink-0">
            ${getChatAvatarHtml(u, 'w-9 h-9', 'text-xs')}
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${u.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-xs font-semibold text-slate-800 truncate">${escapeHTML(u.name)}</span>
              ${isDir ? `<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">👑 ผู้บริหาร</span>` : ''}
              ${isMe ? `<span class="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1 rounded">ฉัน</span>` : ''}
            </div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHTML(u.position || 'ครูผู้สอน')}</div>
            <div class="text-[10px] mt-0.5">${statusText}</div>
          </div>
        </div>

        ${!isMe ? `
          <button class="btn btn-sm flex-shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1"
            onclick="switchChatConversation('${u.id}', '${escapeHTML(u.name)}', '${escapeHTML(u.position||'')}', '${escapeHTML(u.avatar||'')}', ${u.isOnline}, ${isDir})">
            <i class='bx bxs-chat text-xs'></i>
            <span>แชท</span>
          </button>
        ` : ''}
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

/* ─── เรนเดอร์แท็บติดต่อครูทั้งหมด (Contacts Tab) ─────────────────── */
function renderContactsTab(filterQuery = '') {
  const container = document.getElementById('chatFloatingContactsArea');
  if (!container) return;

  const users = APP_CHAT.onlineUsers || [];
  const q = filterQuery.trim().toLowerCase();
  const filtered = q ? users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.position||'').toLowerCase().includes(q)) : users;
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';

  let html = `
    <!-- ปุ่มเลือกห้องสนทนารวม -->
    <div class="p-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 transition-all cursor-pointer border-b border-indigo-100 flex items-center justify-between"
      onclick="switchChatConversation('all', 'ห้องสนทนารวมครู MHC', 'โรงเรียนมหาชัยพิทยาคาร', '', true, false)">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
          <i class='bx bxs-school'></i>
        </div>
        <div>
          <div class="text-xs font-bold text-indigo-900">ห้องสนทนารวมครู MHC</div>
          <div class="text-[10px] text-indigo-600">พื้นที่แลกเปลี่ยนข่าวสารของครูทุกคน</div>
        </div>
      </div>
      <span class="text-indigo-600 text-xs"><i class='bx bx-chevron-right'></i></span>
    </div>

    <!-- รายชื่อครูรายบุคคล -->
    <div class="divide-y divide-slate-100 overflow-y-auto">
  `;

  if (filtered.length === 0) {
    html += `
      <div class="p-6 text-center text-slate-400 text-xs">
        ไม่พบลายชื่อครูที่ตรงกับคำค้นหา
      </div>
    `;
  } else {
    filtered.forEach(u => {
      const isMe = u.id === myId;
      const isDir = u.isDirector || (u.position && u.position.includes('ผู้อำนวยการ')) || u.name.includes('อธิการ');
      html += `
        <div class="p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
          onclick="switchChatConversation('${u.id}', '${escapeHTML(u.name)}', '${escapeHTML(u.position||'')}', '${escapeHTML(u.avatar||'')}', ${u.isOnline}, ${isDir})">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="relative flex-shrink-0">
              ${getChatAvatarHtml(u, 'w-9 h-9', 'text-xs')}
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${u.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-xs font-semibold text-slate-800 truncate">${escapeHTML(u.name)}</span>
                ${isDir ? `<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">👑 ผอ.</span>` : ''}
              </div>
              <div class="text-[10px] text-slate-400 truncate">${escapeHTML(u.position || 'ครูผู้สอน')}</div>
            </div>
          </div>
          <span class="text-slate-300 text-xs"><i class='bx bx-chat'></i></span>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

/* ─── สลับแท็บใน Floating Messenger ──────────────────────────────── */
function switchFloatingTab(tab) {
  APP_CHAT.activeTab = tab;
  const tabChatBtn = document.getElementById('chatTabBtnChat');
  const tabOnlineBtn = document.getElementById('chatTabBtnOnline');
  const tabContactsBtn = document.getElementById('chatTabBtnContacts');

  const paneChat = document.getElementById('chatPaneChat');
  const paneOnline = document.getElementById('chatPaneOnline');
  const paneContacts = document.getElementById('chatPaneContacts');

  if (tabChatBtn) tabChatBtn.className = `flex-1 py-1.5 text-xs font-semibold transition-all rounded-md text-center ${tab === 'chat' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`;
  if (tabOnlineBtn) tabOnlineBtn.className = `flex-1 py-1.5 text-xs font-semibold transition-all rounded-md text-center ${tab === 'online' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`;
  if (tabContactsBtn) tabContactsBtn.className = `flex-1 py-1.5 text-xs font-semibold transition-all rounded-md text-center ${tab === 'contacts' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'}`;

  if (paneChat) paneChat.classList.toggle('hidden', tab !== 'chat');
  if (paneOnline) {
    paneOnline.classList.toggle('hidden', tab !== 'online');
    if (tab === 'online') renderOnlineUsersTab();
  }
  if (paneContacts) {
    paneContacts.classList.toggle('hidden', tab !== 'contacts');
    if (tab === 'contacts') renderContactsTab();
  }
}

/* ─── เปิด/ปิด หน้าต่าง Floating Messenger ─────────────────────────── */
function toggleFloatingChat(forceOpen) {
  const win = document.getElementById('mhcChatFloatingWindow');
  if (!win) return;

  const shouldOpen = (forceOpen !== undefined) ? forceOpen : win.classList.contains('hidden');
  APP_CHAT.isOpen = shouldOpen;

  if (shouldOpen) {
    win.classList.remove('hidden');
    updateChatUnreadBadge(0);
    loadChatMessages(APP_CHAT.activeRecipient, false);
    fetchOnlineUsersList();
    startChatPolling();
    setTimeout(() => {
      scrollChatToBottom(false);
      const inp = document.getElementById('chatFloatingInput');
      if (inp) inp.focus();
    }, 150);
  } else {
    win.classList.add('hidden');
    stopChatPolling();
  }
}

/* ─── เริ่มต้นระบบ Polling ข้อความและ Heartbeat ออนไลน์ ──────────────── */
function startChatPolling() {
  stopChatPolling();
  APP_CHAT.pollTimer = setInterval(() => {
    if (APP_CHAT.isOpen || APP.currentPage === 'chat') {
      loadChatMessages(APP_CHAT.activeRecipient, true);
    }
  }, 4500); // ทุก 4.5 วินาทีเมื่อหน้าต่างแชทเปิดอยู่
}

function stopChatPolling() {
  if (APP_CHAT.pollTimer) {
    clearInterval(APP_CHAT.pollTimer);
    APP_CHAT.pollTimer = null;
  }
}

function startChatHeartbeat() {
  if (APP_CHAT.pingTimer) clearInterval(APP_CHAT.pingTimer);

  const doPing = () => {
    const token = typeof APP !== 'undefined' ? APP.token : '';
    if (!token) return;
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(res => {
          if (res && res.status === 'success') {
            APP_CHAT.onlineCount = res.onlineCount || 0;
            updateOnlineCountBadges(APP_CHAT.onlineCount);
          }
        })
        .pingOnlineStatus(token);
    }
  };

  // Ping ทันที 1 ครั้ง
  setTimeout(doPing, 1000);
  // และ Ping ทุกๆ 50 วินาที
  APP_CHAT.pingTimer = setInterval(doPing, 50000);
}

/* ─── สร้าง Floating Messenger DOM Widget ────────────────────────── */
function initFloatingChatWidget() {
  if (document.getElementById('mhcChatFloatingBtn')) return;

  // 1. ปุ่มลอยตัว (Floating Launcher Button)
  const btn = document.createElement('div');
  btn.id = 'mhcChatFloatingBtn';
  btn.className = 'fixed z-40 transition-all duration-300 select-none';
  btn.style.cssText = 'bottom: calc(20px + var(--sab)); right: 20px;';
  btn.innerHTML = `
    <button class="relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/30"
      onclick="toggleFloatingChat()" title="สนทนาครู & ติดต่อผู้บริหาร (MHC Messenger)">
      <div class="relative">
        <i class='bx bxs-chat text-xl'></i>
        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white animate-pulse"></span>
      </div>
      <span class="text-xs font-bold tracking-wide pr-1" id="chatFloatingOnlineCount">MHC Chat</span>
      <span id="chatFloatingUnreadBadge" class="hidden absolute -top-1.5 -left-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">0</span>
    </button>
  `;
  document.body.appendChild(btn);

  // 2. หน้าต่างแชทลอยตัว (Floating Window Popup)
  const win = document.createElement('div');
  win.id = 'mhcChatFloatingWindow';
  win.className = 'hidden fixed z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300';
  win.style.cssText = 'bottom: calc(75px + var(--sab)); right: 20px; width: 380px; max-width: calc(100vw - 32px); height: 560px; max-height: calc(100vh - 100px);';
  win.innerHTML = `
    <!-- Top Bar Header -->
    <div class="px-4 py-3 bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 text-white flex items-center justify-between shadow-xs select-none">
      <div class="flex items-center gap-2.5 min-w-0">
        <div id="chatFloatingRecipientAvatar" class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            <i class='bx bxs-school'></i>
          </div>
        </div>
        <div class="min-w-0">
          <div id="chatFloatingRecipientTitle" class="text-xs font-bold truncate">ห้องสนทนารวมครู MHC</div>
          <div id="chatFloatingRecipientSubtitle" class="text-[10px] text-indigo-200 truncate">
            <span class="flex items-center gap-1 text-emerald-300"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ห้องสาธารณะของครูทุกคน</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1 text-indigo-200">
        <button id="btnChatToggleSound" class="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-sm" title="เปิด/ปิดเสียงเตือน">
          <i class='bx ${APP_CHAT.soundEnabled ? 'bxs-volume-full' : 'bxs-volume-mute text-rose-300'}'></i>
        </button>
        <button class="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-sm" onclick="navigate('chat'); toggleFloatingChat(false);" title="ขยายเต็มหน้าจอ">
          <i class='bx bx-fullscreen'></i>
        </button>
        <button class="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors text-base" onclick="toggleFloatingChat(false)" title="ย่อหน้าต่าง">
          <i class='bx bx-x'></i>
        </button>
      </div>
    </div>

    <!-- Sub Navigation Tabs -->
    <div class="p-1.5 bg-slate-100/90 border-b border-slate-200 flex gap-1 select-none">
      <button id="chatTabBtnChat" class="flex-1 py-1.5 text-xs font-bold transition-all rounded-md text-center bg-white text-indigo-700 shadow-2xs" onclick="switchFloatingTab('chat')">
        💬 แชท
      </button>
      <button id="chatTabBtnOnline" class="flex-1 py-1.5 text-xs font-semibold transition-all rounded-md text-center text-slate-500 hover:text-slate-800" onclick="switchFloatingTab('online')">
        🟢 ใครออนไลน์
      </button>
      <button id="chatTabBtnContacts" class="flex-1 py-1.5 text-xs font-semibold transition-all rounded-md text-center text-slate-500 hover:text-slate-800" onclick="switchFloatingTab('contacts')">
        👥 ติดต่อครู
      </button>
    </div>

    <!-- PANE 1: Chat Message Thread -->
    <div id="chatPaneChat" class="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      <!-- Area: Message Bubbles -->
      <div id="chatFloatingMessageArea" class="flex-1 overflow-y-auto py-3 space-y-1">
        <!-- Rendered via renderChatMessagesList() -->
      </div>

      <!-- Quick Reply Chips -->
      <div class="px-2.5 py-1.5 bg-white/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        ${APP_CHAT.quickReplies.map(r => `
          <button class="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/80 transition-all font-medium"
            onclick="sendChatMessageAction('${escapeHTML(r)}')">${escapeHTML(r)}</button>
        `).join('')}
      </div>

      <!-- Chat Input Bar -->
      <div class="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
        <input id="chatFloatingInput" type="text" class="flex-1 text-xs rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2 px-3 bg-slate-50 focus:bg-white transition-all"
          placeholder="พิมพ์ข้อความ... (กด Enter เพื่อส่ง)" autocomplete="off">
        <button id="btnChatFloatingSend" class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center hover:shadow-md active:scale-95 transition-all cursor-pointer flex-shrink-0"
          title="ส่งข้อความ">
          <i class='bx bxs-send text-sm'></i>
        </button>
      </div>
    </div>

    <!-- PANE 2: Online Users Board -->
    <div id="chatPaneOnline" class="hidden flex-1 overflow-hidden flex flex-col bg-white">
      <div id="chatFloatingOnlineListArea" class="flex-1 overflow-y-auto">
        <!-- Rendered via renderOnlineUsersTab() -->
      </div>
    </div>

    <!-- PANE 3: All Contacts Directory -->
    <div id="chatPaneContacts" class="hidden flex-1 overflow-hidden flex flex-col bg-white">
      <div class="p-2.5 border-b border-slate-100 bg-slate-50">
        <input id="chatFloatingSearchInput" type="text" class="w-full text-xs rounded-lg border-slate-200 py-1.5 px-2.5 bg-white" placeholder="🔍 ค้นหาชื่อครู หรือตำแหน่ง...">
      </div>
      <div id="chatFloatingContactsArea" class="flex-1 overflow-y-auto">
        <!-- Rendered via renderContactsTab() -->
      </div>
    </div>
  `;
  document.body.appendChild(win);

  // Hook Send Events
  const sendBtn = win.querySelector('#btnChatFloatingSend');
  const inputEl = win.querySelector('#chatFloatingInput');
  const doSend = () => {
    if (inputEl && inputEl.value.trim()) {
      sendChatMessageAction(inputEl.value.trim());
      inputEl.value = '';
    }
  };
  if (sendBtn) sendBtn.onclick = doSend;
  if (inputEl) {
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    };
  }

  // Hook Search Contacts
  const searchInput = win.querySelector('#chatFloatingSearchInput');
  if (searchInput) {
    searchInput.oninput = () => renderContactsTab(searchInput.value);
  }

  // Hook Sound Toggle
  const soundBtn = win.querySelector('#btnChatToggleSound');
  if (soundBtn) {
    soundBtn.onclick = () => {
      APP_CHAT.soundEnabled = !APP_CHAT.soundEnabled;
      localStorage.setItem('mhc_chat_sound', String(APP_CHAT.soundEnabled));
      soundBtn.innerHTML = `<i class='bx ${APP_CHAT.soundEnabled ? 'bxs-volume-full' : 'bxs-volume-mute text-rose-300'}'></i>`;
      if (typeof showToast === 'function') {
        showToast('info', APP_CHAT.soundEnabled ? 'เปิดเสียงเตือนข้อความแชท' : 'ปิดเสียงเตือนข้อความแชท');
      }
    };
  }

  // ปรับตำแหน่งตาม Safe Area ของมือถือหากมี Bottom Nav
  const adjustMobilePos = () => {
    const mobileNav = document.getElementById('mobileBottomNav');
    if (mobileNav && window.innerWidth <= 768 && window.getComputedStyle(mobileNav).display !== 'none') {
      btn.style.bottom = 'calc(68px + var(--sab))';
      win.style.bottom = 'calc(118px + var(--sab))';
    } else {
      btn.style.bottom = 'calc(20px + var(--sab))';
      win.style.bottom = 'calc(75px + var(--sab))';
    }
  };
  window.addEventListener('resize', adjustMobilePos);
  adjustMobilePos();
}

/* ============================================================
 *  Full Page Chat Screen: renderChat(container)
 *  (เมื่อผู้ใช้คลิกจากแถบ Sidebar Menu 'สนทนาครู / ห้องแชท')
 * ============================================================ */
function renderChat(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="h-[calc(100vh-130px)] min-h-[500px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      
      <!-- Top Title Bar -->
      <div class="p-3.5 sm:px-6 bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-xs">
            <i class='bx bxs-chat text-indigo-300'></i>
          </div>
          <div>
            <h1 class="text-sm sm:text-base font-bold flex items-center gap-2">
              <span>ห้องสนทนาครูและบุคลากร MHC Messenger</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ออนไลน์ <b id="fullPageOnlineCountTxt">${APP_CHAT.onlineCount}</b> ท่าน</span>
              </span>
            </h1>
            <p class="text-[11px] text-indigo-200">โรงเรียนมหาชัยพิทยาคาร • ติดต่อสื่อสารระหว่างผู้บริหาร ครู และบุคลากร</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn btn-sm bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
            onclick="fetchOnlineUsersList(); loadChatMessages(APP_CHAT.activeRecipient);">
            <i class='bx bx-refresh text-sm'></i>
            <span class="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </div>

      <!-- Main Body: 2 Columns Layout -->
      <div class="flex-1 flex min-h-0 overflow-hidden">
        
        <!-- Left Column: Contacts & Online Roster (320px) -->
        <div class="w-full sm:w-80 md:w-88 border-r border-slate-200 flex flex-col bg-slate-50/50 flex-shrink-0">
          
          <!-- Search Box -->
          <div class="p-3 border-b border-slate-200 bg-white">
            <div class="relative">
              <i class='bx bx-search absolute left-3 top-2.5 text-slate-400 text-sm'></i>
              <input id="chatFullPageSearchInput" type="text" class="form-input w-full text-xs rounded-xl pl-8 pr-3 py-2 border-slate-200 bg-slate-50 focus:bg-white"
                placeholder="ค้นหาชื่อครู, ตำแหน่ง, ผู้บริหาร...">
            </div>
          </div>

          <!-- Roster Scrollable Area -->
          <div id="chatFullPageRosterArea" class="flex-1 overflow-y-auto divide-y divide-slate-100">
            <!-- Rendered via renderFullPageContacts() -->
          </div>

        </div>

        <!-- Right Column: Active Conversation Feed -->
        <div class="hidden sm:flex flex-1 flex-col bg-slate-50 min-h-0">
          
          <!-- Conversation Header -->
          <div class="p-3.5 px-5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 shadow-2xs">
            <div class="flex items-center gap-3">
              <div id="chatFullPageRecipientAvatar">
                ${APP_CHAT.activeRecipient === 'all'
                  ? `<div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-xs"><i class='bx bxs-school'></i></div>`
                  : getChatAvatarHtml(APP_CHAT.recipientInfo, 'w-10 h-10', 'text-sm')}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 id="chatFullPageRecipientName" class="text-sm font-bold text-slate-800">${escapeHTML(APP_CHAT.recipientInfo.name)}</h2>
                  <span id="chatFullPageRecipientBadge"></span>
                </div>
                <div id="chatFullPageRecipientSub" class="text-xs text-slate-500">${escapeHTML(APP_CHAT.recipientInfo.position)}</div>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <button class="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                onclick="switchChatConversation('all', 'ห้องสนทนารวมครู MHC', 'โรงเรียนมหาชัยพิทยาคาร', '', true, false)">
                <i class='bx bxs-group text-sm'></i>
                <span>สลับไปห้องรวม</span>
              </button>
            </div>
          </div>

          <!-- Message Bubbles Scroll Area -->
          <div id="chatFullPageMessageArea" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
            <!-- Rendered via renderFullPageChatMessagesList() -->
          </div>

          <!-- Quick Reply Pills -->
          <div class="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            ${APP_CHAT.quickReplies.map(r => `
              <button class="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition-all font-medium"
                onclick="sendChatMessageAction('${escapeHTML(r)}')">${escapeHTML(r)}</button>
            `).join('')}
          </div>

          <!-- Chat Input Bar -->
          <div class="p-3.5 px-5 bg-white border-t border-slate-200 flex items-center gap-3">
            <input id="chatFullPageInput" type="text" class="flex-1 text-xs sm:text-sm rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2.5 px-4 bg-slate-50 focus:bg-white transition-all"
              placeholder="พิมพ์ข้อความที่ต้องการส่ง... (กด Enter เพื่อส่ง)" autocomplete="off">
            <button id="btnChatFullPageSend" class="btn px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all flex-shrink-0">
              <i class='bx bxs-send text-base'></i>
              <span>ส่งข้อความ</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  `;

  // Hook Send Event
  const sendBtn = container.querySelector('#btnChatFullPageSend');
  const inputEl = container.querySelector('#chatFullPageInput');
  const doSend = () => {
    if (inputEl && inputEl.value.trim()) {
      sendChatMessageAction(inputEl.value.trim());
      inputEl.value = '';
    }
  };
  if (sendBtn) sendBtn.onclick = doSend;
  if (inputEl) {
    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    };
  }

  // Hook Search Roster
  const searchInput = container.querySelector('#chatFullPageSearchInput');
  if (searchInput) {
    searchInput.oninput = () => renderFullPageContacts(searchInput.value);
  }

  // โหลดข้อมูลล่าสุด
  fetchOnlineUsersList(() => {
    renderFullPageContacts();
  });
  loadChatMessages(APP_CHAT.activeRecipient, false);
  startChatPolling();
}

/* ─── เรนเดอร์ Contacts ในหน้า Full Page ──────────────────────────── */
function renderFullPageContacts(filterQuery = '') {
  const container = document.getElementById('chatFullPageRosterArea');
  if (!container) return;

  const users = APP_CHAT.onlineUsers || [];
  const q = (filterQuery || '').trim().toLowerCase();
  const filtered = q ? users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.position||'').toLowerCase().includes(q)) : users;
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';

  const onlineList = users.filter(u => u.isOnline);
  const countEl = document.getElementById('fullPageOnlineCountTxt');
  if (countEl) countEl.textContent = onlineList.length;

  let html = `
    <!-- การ์ดห้องสนทนารวม -->
    <div class="p-3.5 hover:bg-indigo-50/70 transition-all cursor-pointer flex items-center justify-between ${APP_CHAT.activeRecipient === 'all' ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'bg-white'}"
      onclick="switchChatConversation('all', 'ห้องสนทนารวมครู MHC', 'โรงเรียนมหาชัยพิทยาคาร', '', true, false)">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
          <i class='bx bxs-school'></i>
        </div>
        <div>
          <div class="text-xs font-bold text-indigo-950">ห้องสนทนารวมครู MHC</div>
          <div class="text-[11px] text-indigo-600 font-medium">คุยรวมคณะครูทั้งโรงเรียน</div>
        </div>
      </div>
      <span class="badge badge-sm badge-green text-[10px] font-bold">ห้องหลัก</span>
    </div>

    <!-- หัวข้อผู้บริหารและครู -->
    <div class="px-3.5 py-2 bg-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-between">
      <span>รายชื่อผู้บริหารและคุณครู</span>
      <span class="text-[10px] text-emerald-600 font-semibold">${onlineList.length} คนออนไลน์</span>
    </div>
  `;

  filtered.forEach(u => {
    const isSelected = APP_CHAT.activeRecipient === u.id;
    const isMe = u.id === myId;
    const isDir = u.isDirector || (u.position && u.position.includes('ผู้อำนวยการ')) || u.name.includes('อธิการ');

    html += `
      <div class="p-3 hover:bg-slate-100/80 transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600 font-bold' : (u.isOnline ? 'bg-emerald-50/15' : 'bg-white')}"
        onclick="switchChatConversation('${u.id}', '${escapeHTML(u.name)}', '${escapeHTML(u.position||'')}', '${escapeHTML(u.avatar||'')}', ${u.isOnline}, ${isDir})">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="relative flex-shrink-0">
            ${getChatAvatarHtml(u, 'w-9 h-9', 'text-xs')}
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${u.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-xs ${isSelected ? 'text-indigo-900 font-bold' : 'text-slate-800 font-semibold'} truncate">${escapeHTML(u.name)}</span>
              ${isDir ? `<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full border border-amber-200">👑 ผอ.</span>` : ''}
              ${isMe ? `<span class="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1 rounded">ฉัน</span>` : ''}
            </div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHTML(u.position || 'ครูผู้สอน')}</div>
          </div>
        </div>

        <div class="flex-shrink-0 text-right">
          ${u.isOnline
            ? `<span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ออนไลน์</span>`
            : `<span class="text-[10px] text-slate-400">ออฟไลน์</span>`}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ─── เรนเดอร์ข้อความในหน้า Full Page ────────────────────────────── */
function renderFullPageChatMessagesList() {
  const container = document.getElementById('chatFullPageMessageArea');
  if (!container) return;

  const msgs = APP_CHAT.messages || [];
  const myId = (typeof APP !== 'undefined' && APP.user) ? APP.user.id : '';

  // อัปเดตข้อมูลคู่สนทนาที่ Header
  const titleEl = document.getElementById('chatFullPageRecipientName');
  const subEl = document.getElementById('chatFullPageRecipientSub');
  const badgeEl = document.getElementById('chatFullPageRecipientBadge');
  const avatarEl = document.getElementById('chatFullPageRecipientAvatar');

  if (titleEl) titleEl.textContent = APP_CHAT.recipientInfo.name;
  if (subEl) subEl.textContent = APP_CHAT.recipientInfo.position;
  if (badgeEl) {
    if (APP_CHAT.recipientInfo.isDirector) {
      badgeEl.innerHTML = `<span class="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">👑 ผู้อำนวยการโรงเรียน</span>`;
    } else if (APP_CHAT.recipientInfo.isOnline) {
      badgeEl.innerHTML = `<span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> กำลังออนไลน์</span>`;
    } else {
      badgeEl.innerHTML = '';
    }
  }
  if (avatarEl) {
    avatarEl.innerHTML = APP_CHAT.activeRecipient === 'all'
      ? `<div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-xs"><i class='bx bxs-school'></i></div>`
      : getChatAvatarHtml(APP_CHAT.recipientInfo, 'w-10 h-10', 'text-sm');
  }

  if (msgs.length === 0) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-3xl shadow-xs">
          <i class='bx bxs-chat'></i>
        </div>
        <div class="font-bold text-sm text-slate-700">เริ่มต้นการสนทนา</div>
        <p class="text-xs text-slate-400 max-w-sm">
          พิมพ์ข้อความเพื่อพูดคุย ปรึกษางาน หรือประสานงานภายในโรงเรียนมหาชัยพิทยาคารได้ทันที
        </p>
      </div>
    `;
    return;
  }

  let html = '';
  let lastSenderId = null;

  msgs.forEach(m => {
    const isMe = (m.sender_id === myId) || (!m.sender_id && m.isSending);
    const timeStr = formatChatTime(m.created_at);
    const showAvatarAndName = !isMe && (lastSenderId !== m.sender_id);
    lastSenderId = m.sender_id;

    const isDir = m.sender_position && m.sender_position.includes('ผู้อำนวยการ') || (m.sender_name && m.sender_name.includes('อธิการ'));

    if (isMe) {
      html += `
        <div class="flex flex-col items-end mb-3">
          <div class="max-w-[70%] bg-gradient-to-tr from-indigo-600 via-indigo-600 to-indigo-700 text-white rounded-2xl rounded-br-xs px-4 py-2.5 text-xs sm:text-sm shadow-xs break-words leading-relaxed">
            ${escapeHTML(m.content)}
            ${m.isSending ? `<span class="inline-block ml-1 opacity-70"><i class='bx bx-loader-alt bx-spin text-xs'></i></span>` : ''}
          </div>
          <span class="text-[10px] text-slate-400 mt-1 mr-1 font-mono">${timeStr}</span>
        </div>
      `;
    } else {
      html += `
        <div class="flex items-start gap-3 mb-3">
          <div class="flex-shrink-0 mt-0.5">
            ${getChatAvatarHtml({ name: m.sender_name, avatar: m.sender_avatar, isDirector: isDir, position: m.sender_position }, 'w-8 h-8 sm:w-9 sm:h-9', 'text-xs')}
          </div>
          <div class="flex flex-col items-start max-w-[72%]">
            ${showAvatarAndName ? `
              <div class="flex items-center gap-2 mb-1 ml-0.5">
                <span class="text-xs font-bold text-slate-800">${escapeHTML(m.sender_name || 'คุณครู')}</span>
                ${isDir ? `<span class="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.2 rounded-full border border-amber-200">👑 ผู้อำนวยการ</span>` : `<span class="text-[10px] text-slate-400">(${escapeHTML(m.sender_position || 'ครูผู้สอน')})</span>`}
              </div>
            ` : ''}
            <div class="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-xs px-4 py-2.5 text-xs sm:text-sm shadow-xs break-words leading-relaxed">
              ${escapeHTML(m.content)}
            </div>
            <span class="text-[10px] text-slate-400 mt-1 ml-1 font-mono">${timeStr}</span>
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  scrollChatToBottom();
}

/* ─── ออโต้สตาร์ทเมื่อโหลดสคริปต์ ──────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initFloatingChatWidget();
    startChatHeartbeat();
  });
} else {
  initFloatingChatWidget();
  startChatHeartbeat();
}
