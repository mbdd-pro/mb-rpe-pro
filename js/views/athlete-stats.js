Router.register('athlete-stats', async()=>{
  if(!Auth.isLogged()) return Router.go('login');
  $('#app').innerHTML = basePage('athlete-stats','Mis estadísticas',`Hola, ${esc(Auth.current.nombre)}`,`<div class="empty">Cargando...</div>`);
  const d=await Api.athleteStats(Auth.current.jugador_id);
  setPageContent(`
    <div class="grid3"><div class="kpi"><div class="val">${fmt(d.week_ua)}</div><div class="lbl">Semana</div></div><div class="kpi"><div class="val">${fmt(d.month_ua)}</div><div class="lbl">Mes</div></div><div class="kpi"><div class="val">${Number(d.avg_rpe||0).toFixed(1)}</div><div class="lbl">RPE prom.</div></div></div>
    <div class="card"><h3 class="card-title">📈 Evolución</h3><div class="chart-box"><canvas id="ath-chart"></canvas></div></div>
    <div class="card"><h3 class="card-title">Historial</h3><div class="list">${(d.reports||[]).map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>`).join('') || '<div class="empty">Sin datos</div>'}</div></div>`);
  Charts.line('ath-chart',(d.series||[]).map(x=>dateAR(x.fecha).slice(0,5)),(d.series||[]).map(x=>Number(x.ua||0)));
});
