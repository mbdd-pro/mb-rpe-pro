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
});


function renderCoachWellness(w){
  const players = (w && w.players) || [];
  const flagged = players.filter(p=>Number(p.score||0)>=10 || p.molestia==='SI').slice(0,8);
  if(!flagged.length) return '<div class="empty">Sin alertas de bienestar hoy.</div>';
  return flagged.map(p=>{
    const label = wellnessCoachLabel(p);
    return `<div class="item"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">Score ${fmt(p.score)} · Sueño ${p.sueno||'-'} · Fatiga ${p.fatiga||'-'} · Dolor ${p.dolor_muscular||'-'} · Ánimo/Estrés ${p.estres_animo||'-'}${p.molestia==='SI'?' · Molestia: '+esc(p.zona_molestia||'sí'):''}</div></div><span class="pill ${label.cls}">${label.txt}</span></div>`;
  }).join('');
}
function wellnessCoachLabel(p){
  const score=Number(p.score||0);
  if(p.molestia==='SI' || score>=14) return {txt:'Alerta',cls:'danger'};
  if(score>=10) return {txt:'Atención',cls:'warn'};
  return {txt:'Bien',cls:'ok'};
}

