Router.register('coach-players', async()=>{
 if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
 $('#app').innerHTML=basePage('coach-players','Jugadores','Plantel y fichas deportivas','<div class="empty">Cargando...</div>');
 const d=await Api.listPlayers();
 $('#page-content').innerHTML=`<div class="card"><h3 class="card-title">👥 Jugadores</h3><div class="list">${(d.players||[]).map(p=>`<div class="item"><div class="avatar">${initials(p.nombre,p.apellido)}</div><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${esc(p.deporte||'')} · ${esc(p.categoria||'')} · ${esc(p.equipo||'')} · ${esc(p.posicion||'')}</div></div><span class="pill ${p.activo==='SI'?'ok':'warn'}">${esc(p.activo)}</span></div>`).join('') || '<div class="empty">Sin jugadores.</div>'}</div></div>`;
});
