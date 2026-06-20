
function renderVersionChip() {
  const old = document.querySelector('.app-version-chip');
  if (old) old.remove();
  const chip = document.createElement('div');
  chip.className = 'app-version-chip';
  const version = (window.APP_CONFIG && window.APP_CONFIG.VERSION) || 'dev';
  chip.textContent = `v${version} · By Pancko`;
  document.body.appendChild(chip);
}

function basePage(active,title,subtitle,content){
  const coach=Auth.isCoach();
  const nav = coach ? [
    ['coach','🏠','Panel'],['coach-sessions','📅','Sesiones'],['coach-players','👥','Jugadores'],['coach-compare','⚔️','Comparar']
  ] : [ ['athlete','🏠','Inicio'],['athlete-stats','📊','Stats'],['profile','⚙️','Perfil'],['logout','🚪','Salir'] ];
  setTimeout(()=>{
    $$('.nav-btn').forEach(b=>b.onclick=()=>{ const to=b.dataset.to; if(to==='logout') return Auth.logout(); if(to==='profile') return renderProfile(); Router.go(to); });
    const out=$('#logout-btn'); if(out) out.onclick=()=>Auth.logout();
    setupThemeButtons();
  },0);
  return `<main class="page with-nav"><div class="top-hero"><div class="header">${brandIcon('header-logo')}<div><div class="header-title">${esc(title)}</div><div class="header-sub">${esc(subtitle)}</div></div><div class="header-spacer"></div><div class="theme-toggle"><button data-theme-btn="black">Black</button><button data-theme-btn="clean">Clean</button></div><button id="logout-btn" class="btn small secondary">Salir</button></div></div><div id="page-content" class="grid">${content}</div></main><nav class="bottom-nav">${nav.map(n=>`<button class="nav-btn ${active===n[0]?'active':''}" data-to="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('')}</nav>`;
}
function renderProfile(){
  $('#app').innerHTML=basePage('profile','Perfil','Ajustes del dispositivo',`<div class="card"><h3 class="card-title">Usuario</h3><p><b>${esc(Auth.current.nombre)} ${esc(Auth.current.apellido)}</b></p><p class="muted">Rol: ${esc(Auth.current.rol)}</p><button class="btn secondary" onclick="Auth.logout()">Cerrar sesión</button></div>`);
}
(async function init(){
  ThemeStore.set(ThemeStore.get());
  Auth.init();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
  Router.render();
})();

try { renderVersionChip(); } catch(e) {}
