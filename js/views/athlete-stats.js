Router.register('athlete-stats', async(params={}, token)=>{
  if(!Auth.isLogged()) return Router.go('login');
  $('#app').innerHTML = basePage('athlete-stats','Mis estadísticas',`Hola, ${esc(Auth.current.nombre)}`,`<div class="empty">Cargando gráficos...</div>`);
  const d=await Api.athleteLoadMetrics(Auth.current.jugador_id);
  if(Router.isStale(token)) return;
  const allSeries=d.series||[];
  const series=allSeries.slice(-21);
  const labels=series.map(x=>dateAR(x.fecha).slice(0,5));
  setPageContent(`
    <div class="grid3">
      <div class="kpi"><div class="val">${fmt(d.week_ua)}</div><div class="lbl">UA semana</div></div>
      <div class="kpi"><div class="val">${fmt(d.month_ua)}</div><div class="lbl">UA mes</div></div>
      <div class="kpi"><div class="val">${Number(d.avg_rpe||0).toFixed(1)}</div><div class="lbl">RPE prom.</div></div>
    </div>

    <div class="card">
      <h3 class="card-title">📈 Carga + RPE</h3>
      <p class="muted chart-note">UA = duración × RPE. El RPE muestra cómo de duro sintió la sesión el deportista.</p>
      <div class="chart-box tall"><canvas id="ath-load-rpe-chart"></canvas></div>
    </div>

    <div class="card">
      <h3 class="card-title">📊 Carga por día</h3>
      <div class="chart-box"><canvas id="ath-ua-chart"></canvas></div>
    </div>

    <div class="card">
      <h3 class="card-title">🔥 Mapa mensual</h3>
      <p class="muted chart-note">Más intensidad = más UA cargadas ese día.</p>
      ${renderMiniHeatmap(allSeries)}
    </div>

    <div class="card">
      <h3 class="card-title">Historial</h3>
      <div class="list">${(d.reports||[]).map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>`).join('') || '<div class="empty">Sin datos</div>'}</div>
    </div>
  `);

  Charts.lineMulti('ath-load-rpe-chart', labels, [
    {label:'UA', data:series.map(x=>Number(x.ua||0)), yAxisID:'y'},
    {label:'RPE prom.', data:series.map(x=>Number(x.avg_rpe||0)), yAxisID:'y1'}
  ]);
  Charts.bar('ath-ua-chart', labels, series.map(x=>Number(x.ua||0)), 'UA');
});

function renderMiniHeatmap(series){
  const max = Math.max(1, ...(series||[]).map(x=>Number(x.ua||0)));
  return `<div class="mini-heatmap">${(series||[]).map(x=>{
    const v=Number(x.ua||0);
    const lvl = v===0 ? 0 : Math.max(1, Math.ceil((v/max)*4));
    return `<div class="heat-cell heat-${lvl}" title="${dateAR(x.fecha)} · ${fmt(v)} UA"><span>${dateAR(x.fecha).slice(0,5)}</span></div>`;
  }).join('') || '<div class="empty">Sin datos para graficar.</div>'}</div>`;
}
