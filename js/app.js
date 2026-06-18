
function renderVersionChip() { /* versión visible solo en login/pantallas internas */ }
function syncNow(){
  Api.invalidate();
  toast('Sincronizando...');
  Router.render();
}

function basePage(active,title,subtitle,content){
  const coach=Auth.isCoach();
  const nav = coach ? [
    ['coach','🏠','Panel'],['coach-sessions','📅','Sesiones'],['coach-players','👥','Jugadores'],['coach-compare','⚔️','Comparar']
  ] : [ ['athlete','🏠','Inicio'],['athlete-stats','📊','Stats'],['profile','⚙️','Perfil'],['logout','🚪','Salir'] ];
  setTimeout(()=>{
    $$('.nav-btn').forEach(b=>b.onclick=()=>{ const to=b.dataset.to; if(to==='logout') return Auth.logout(); if(to==='profile') return Router.go('profile'); Router.go(to); });
    const out=$('#logout-btn'); if(out) out.onclick=()=>Auth.logout();
    setupThemeButtons();
  },0);
  return `<main class="page with-nav"><div class="top-hero"><div class="header">${brandIcon('header-logo')}<div><div class="header-title">${esc(title)}</div><div class="header-sub">${esc(subtitle)}</div></div><div class="header-spacer"></div><div class="header-actions"><div class="theme-toggle"><button data-theme-btn="black">Black</button><button data-theme-btn="clean">Clean</button></div><button id="logout-btn" class="btn small secondary">Salir</button><div class="header-meta header-meta-right">v${esc(window.APP_CONFIG.VERSION)} · <span class="brand-by-pancko">${esc(window.APP_CONFIG.BRAND_BY || 'By Pancko')}</span></div></div></div></div><div id="page-content" class="grid">${content}</div></main><nav class="bottom-nav">${nav.map(n=>`<button class="nav-btn ${active===n[0]?'active':''}" data-to="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join('')}</nav>`;
}
function renderProfile(){
  const u=Auth.current||{};
  const isGuest = u.rol === 'invitado';
  $('#app').innerHTML=basePage('profile','Perfil','Ajustes del dispositivo',`<div class="empty">Cargando perfil...</div>`);
  renderProfileContent(u, isGuest);
}
async function renderProfileContent(u, isGuest){
  let player = {};
  try{
    if(u.jugador_id && !isGuest){
      const d = await Api.playerDetail(u.jugador_id);
      player = d.player || {};
    }
  }catch(e){ player = {}; }
  setPageContent(`
  <div class="card"><h3 class="card-title">Usuario</h3><p><b>${esc(u.nombre)} ${esc(u.apellido)}</b></p><p class="muted">Rol: ${esc(u.rol)}</p>${isGuest?'<p class="pill warn">Modo invitado</p>':''}</div>
  <div class="card"><h3 class="card-title">Editar mis datos</h3>
    <div class="grid2"><div class="form-row"><label>Nombre</label><input id="pr-nombre" value="${esc(player.nombre||u.nombre||'')}"></div><div class="form-row"><label>Apellido</label><input id="pr-apellido" value="${esc(player.apellido||u.apellido||'')}"></div></div>
    <div class="form-row"><label>Email</label><input id="pr-email" value="${esc(player.email||u.email||'')}"></div>
    <div class="grid2"><div class="form-row"><label>Deporte</label><input id="pr-deporte" value="${esc(player.deporte||'')}"></div><div class="form-row"><label>Categoría</label><input id="pr-categoria" value="${esc(player.categoria||'')}"></div></div>
    <div class="grid2"><div class="form-row"><label>Equipo</label><input id="pr-equipo" value="${esc(player.equipo||'')}"></div><div class="form-row"><label>Posición</label><input id="pr-posicion" value="${esc(player.posicion||'')}"></div></div>
    <div class="grid2"><div class="form-row"><label>Fecha nacimiento</label><input id="pr-fecha" inputmode="numeric" placeholder="dd/mm/aaaa" value="${esc(formatDateInput(player.fecha_nacimiento||''))}"></div><div class="form-row"><label>Altura</label><input id="pr-altura" value="${esc(player.altura||'')}"></div></div>
    <div class="form-row"><label>Peso</label><input id="pr-peso" value="${esc(player.peso||'')}"></div>
    <button class="btn" id="save-profile-btn">Guardar perfil</button>
  </div>
  ${isGuest?'':`<div class="card"><h3 class="card-title">Cambiar contraseña</h3><div class="form-row"><label>Nueva contraseña / PIN</label><input id="new-pass" type="password"></div><button class="btn secondary" id="change-pass-btn">Cambiar contraseña</button></div>`}
  <div class="card"><button class="btn secondary" onclick="Auth.logout()">Cerrar sesión</button></div>`);
  setupDateMask('#pr-fecha'); setupDecimalComma('#pr-altura');
  const sp=$('#save-profile-btn');
  if(sp) sp.onclick=async()=>{try{
    sp.textContent='Guardando...'; sp.disabled=true;
    const payload={usuario_id:u.usuario_id,jugador_id:u.jugador_id,nombre:$('#pr-nombre').value,apellido:$('#pr-apellido').value,email:$('#pr-email').value,
      deporte:$('#pr-deporte').value,categoria:$('#pr-categoria').value,equipo:$('#pr-equipo').value,posicion:$('#pr-posicion').value,
      fecha_nacimiento:parseDateInput($('#pr-fecha').value),altura:normalizeDecimal($('#pr-altura').value),peso:$('#pr-peso').value};
    const res=await Api.updateProfile(payload);
    Auth.setSession({...u,...res.user}); toast('Perfil actualizado'); renderProfile();
  }catch(e){toast(e.message); sp.textContent='Guardar perfil'; sp.disabled=false;}};
  const cp=$('#change-pass-btn');
  if(cp) cp.onclick=async()=>{try{
    const np=$('#new-pass').value.trim(); if(!np) return toast('Escribí nueva contraseña');
    cp.textContent='Guardando...'; cp.disabled=true; await Api.changePassword({usuario_id:u.usuario_id,password:np});
    toast('Contraseña actualizada'); $('#new-pass').value=''; cp.textContent='Cambiar contraseña'; cp.disabled=false;
  }catch(e){toast(e.message); cp.textContent='Cambiar contraseña'; cp.disabled=false;}};
}
Router.register('profile', async()=>renderProfile());
(async function init(){
  ThemeStore.set(ThemeStore.get());
  Auth.init();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
  Router.render();
})();

try { renderVersionChip(); } catch(e) {}
