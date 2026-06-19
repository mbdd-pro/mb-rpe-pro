Router.register('coach', async(params={}, token)=>{
  if(!Auth.isLogged()) return Router.go('login'); if(!Auth.isCoach()) return Router.go('athlete');
  $('#app').innerHTML = basePage('coach','Panel coach','Resumen general',`<div class="empty">Cargando dashboard...</div>`);
  const [d, wellness] = await Promise.all([Api.coachDashboard(), Api.teamWellnessOverview().catch(()=>({players:[]}))]);
  if(Router.isStale(token)) return;
  setPageContent(`
    <div class="grid3"><div class="kpi"><div class="val">${fmt(d.today_reports)}</div><div class="lbl">Reportes hoy</div></div><div class="kpi"><div class="val">${fmt(d.today_ua)}</div><div class="lbl">UA hoy</div></div><div class="kpi"><div class="val">${fmt(d.pending_today)}</div><div class="lbl">Pendientes</div></div></div>
    <div class="grid2"><button class="btn" onclick="Router.go('coach-sessions')">Crear / ver sesiones</button><button class="btn secondary" onclick="syncNow()">Sincronizar</button></div>
    <div class="card"><h3 class="card-title">💤 Bienestar del plantel</h3><div class="list">${renderCoachWellness(wellness)}</div></div>
    <div class="desktop-cols">
      <div class="card"><h3 class="card-title">🚨 Alertas</h3><div class="list">${(d.alerts||[]).map(a=>`<div class="item"><div class="item-main"><div class="item-title">${esc(a.nombre)}</div><div class="item-sub">${esc(a.detalle)}${a.origen ? ' · '+esc(a.origen) : ''}</div></div><span class="pill danger">Revisar</span></div>`).join('') || '<div class="empty">Sin alertas fuertes.</div>'}</div></div>
      <div class="card"><h3 class="card-title">🏆 Ranking semanal</h3><div class="list">${(d.ranking||[]).map((p,i)=>`<div class="item"><div class="avatar">${i+1}</div><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${fmt(p.ua)} UA · RPE prom. ${Number(p.avg_rpe||0).toFixed(1)}</div></div></div>`).join('') || '<div class="empty">Sin datos.</div>'}</div></div>
    </div>`);
  setupCoachWellnessClicks(wellness);
});


function renderCoachWellness(w){
  const players = (w && w.players) || [];
  const total = Number((w && w.total_players) || players.length || 0);
  const loaded = players.filter(p=>Number(p.score||0)>0);
  const submitted = Number((w && w.submitted_today) || loaded.length || 0);
  const flagged = players.filter(p=>Number(p.score||0)>=10 || p.molestia==='SI').slice(0,8);
  const canOpen = submitted > 0;
  const summary = `<div class="item wellness-open ${canOpen?'clickable':''}" id="wellness-loaded-card">
    <div class="item-main">
      <div class="item-title">Cargaron hoy: ${fmt(submitted)} / ${fmt(total)}</div>
      <div class="item-sub">${canOpen?'Tocá para ver quiénes cargaron y abrir su ficha.':'Todavía nadie cargó bienestar hoy.'}</div>
    </div>
    <span class="pill ${submitted? 'ok':'warn'}">${submitted? 'Ver cargas':'Sin cargas'}</span>
  </div>`;
  if(!flagged.length) return summary + '<div class="empty">Sin alertas de bienestar hoy.</div>';
  return summary + flagged.map(p=>{
    const label = wellnessCoachLabel(p);
    return `<div class="item coach-wellness-player clickable" data-id="${esc(p.jugador_id)}"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">Score ${fmt(p.score)} · Sueño ${p.sueno||'-'} · Fatiga ${p.fatiga||'-'} · Dolor ${p.dolor_muscular||'-'} · Ánimo/Estrés ${p.estres_animo||'-'}${p.molestia==='SI'?' · Molestia: '+esc(p.zona_molestia||'sí'):''}</div></div><span class="pill ${label.cls}">${label.txt}</span></div>`;
  }).join('');
}
function setupCoachWellnessClicks(w){
  const players = ((w && w.players) || []).filter(p=>Number(p.score||0)>0);
  const card = $('#wellness-loaded-card');
  if(card && players.length) card.onclick = ()=>openWellnessLoadedModal(players);
  $$('.coach-wellness-player').forEach(el=>el.onclick=()=>Router.go('coach-players',{id:el.dataset.id}));
}
function openWellnessLoadedModal(players){
  const old=$('#wellness-modal'); if(old) old.remove();
  const div=document.createElement('div');
  div.id='wellness-modal';
  div.className='graph-modal';
  div.innerHTML=`<div class="graph-modal-card">
    <div class="card-head"><h3 class="card-title">💤 Bienestar cargado hoy</h3><button class="btn small secondary" id="close-wellness-modal">Cerrar</button></div>
    <div class="list">${players.map(p=>{
      const label=wellnessCoachLabel(p);
      return `<div class="item coach-wellness-modal-player clickable" data-id="${esc(p.jugador_id)}"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">Score ${fmt(p.score)} · Sueño ${p.sueno||'-'} · Fatiga ${p.fatiga||'-'} · Dolor ${p.dolor_muscular||'-'} · Ánimo/Estrés ${p.estres_animo||'-'}${p.molestia==='SI'?' · Molestia: '+esc(p.zona_molestia||'sí'):''}</div></div><span class="pill ${label.cls}">${label.txt}</span></div>`;
    }).join('')}</div>
  </div>`;
  document.body.appendChild(div);
  $('#close-wellness-modal').onclick=()=>div.remove();
  div.onclick=(e)=>{ if(e.target===div) div.remove(); };
  $$('.coach-wellness-modal-player').forEach(el=>el.onclick=()=>{ const id=el.dataset.id; div.remove(); Router.go('coach-players',{id}); });
}
function wellnessCoachLabel(p){
  const score=Number(p.score||0);
  if(p.molestia==='SI' || score>=14) return {txt:'Alerta',cls:'danger'};
  if(score>=10) return {txt:'Atención',cls:'warn'};
  return {txt:'Bien',cls:'ok'};
}
