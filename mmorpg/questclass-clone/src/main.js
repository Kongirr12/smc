import './style.css';

document.querySelector('#app').innerHTML = `
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="bg-bg-card border border-slate-700 rounded-2xl p-8 shadow-2xl max-w-md w-full relative overflow-hidden">
      <!-- Top glowing border -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-blue-400 to-brand-mint"></div>
      
      <div class="text-center mb-8">
        <h1 class="font-pixel text-xl tracking-widest mb-1">
          <span class="text-brand-blue">QUEST</span><span class="text-brand-mint">CLASS</span>
        </h1>
        <p class="text-xs tracking-widest text-slate-400">⚔ LEVEL UP YOUR LEARNING ⚔</p>
      </div>

      <div class="flex bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
        <button class="flex-1 py-2 text-sm font-bold rounded-md bg-slate-100 text-brand-blue shadow transition-all">LOGIN</button>
        <button class="flex-1 py-2 text-sm font-bold rounded-md text-slate-400 hover:text-slate-200 transition-all">REGISTER</button>
      </div>

      <form id="loginForm" class="flex flex-col gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1">Username</label>
          <input type="text" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" placeholder="ID or Phone number">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 mb-1">Password</label>
          <input type="password" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" placeholder="••••••••">
        </div>
        
        <button type="submit" class="w-full bg-brand-blue hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Enter the Realm
        </button>
      </form>
    </div>
  </div>
`;
