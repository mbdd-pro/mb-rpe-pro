Router.register('coach-players', async(params={})=>{
 if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
 const detailId = params && params.id;
 $('#app').innerHTML=basePage('coach-players','Jugadores', detailId ? 'Ficha deportiva' : 'Plantel y fichas deportivas','<div class="empty">Cargando...</div>');
 if(detailId) return renderPlayerDetail(detailId);
 const d=await Api.listPlayers();
 setPageContent(`<div class="card"><h3 class="card-title">👥 Jugadores</h3><button class="btn small secondary" onclick="Api.invalidate('listPlayers'); Router.render()">Actualizar</button><div class="list" style="margin-top:10px">${(d.players||[]).map(p=>`<div class="item player-open" data-id="${esc(p.jugador_id)}"><div class="avatar">${initials(p.nombre,p.apellido)}</div><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${esc(p.deporte||'')} · ${esc(p.categoria||'')} · ${esc(p.equipo||'')} · ${esc(p.posicion||'')}</div></div><span class="pill ${p.activo==='SI'?'ok':'warn'}">${esc(p.activo)}</span></div>`).join('') || '<div class="empty">Sin jugadores.</div>'}</div></div>`);
 $$('.player-open').forEach(el=>el.onclick=()=>Router.go('coach-players',{id:el.dataset.id}));
});

async function renderPlayerDetail(jugador_id){
 const d = await Api.playerDetail(jugador_id);
 const p = d.player || {};
 setPageContent(`
  <div class="card">
    <button class="btn small secondary" onclick="Router.go('coach-players')">← Volver</button>
    <div class="player-head">
      <div class="avatar big">${initials(p.nombre,p.apellido)}</div>
      <div><h3 class="card-title">${esc(p.nombre)} ${esc(p.apellido)}</h3><p class="muted">${esc(p.deporte||'')} · ${esc(p.categoria||'')} · ${esc(p.equipo||'')} · ${esc(p.posicion||'')}</p></div>
    </div>
    <div class="grid3">
      <div class="kpi"><div class="val">${fmt(d.week_ua)}</div><div class="lbl">UA semana</div></div>
      <div class="kpi"><div class="val">${fmt(d.month_ua)}</div><div class="lbl">UA mes</div></div>
      <div class="kpi"><div class="val">${Number(d.avg_rpe||0).toFixed(1)}</div><div class="lbl">RPE prom.</div></div>
    </div>
  </div>
  <div class="card"><h3 class="card-title">Datos</h3>
    <div class="data-list">
      <div><b>Email</b><span>${esc(p.email||'-')}</span></div>
      <div><b>Fecha nac.</b><span>${esc(p.fecha_nacimiento||'-')}</span></div>
      <div><b>Altura</b><span>${esc(p.altura||'-')}</span></div>
      <div><b>Peso</b><span>${esc(p.peso||'-')}</span></div>
    </div>
  </div>
  <div class="card"><h3 class="card-title">Últimos reportes</h3><div class="list">${(d.reports||[]).map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA · ${esc(r.estado||'')}</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>`).join('') || '<div class="empty">Sin reportes.</div>'}</div></div>`);
}
