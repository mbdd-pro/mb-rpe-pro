Router.register('coach-graphs', async(params={}, token)=>{
  if(!Auth.isLogged()) return Router.go('login');
  if(!Auth.isCoach()) return Router.go('athlete');
  $('#app').innerHTML = basePage('coach-graphs','Gráficos','Carga del plantel',`<div class="empty">Cargando gráficos...</div>`);
  const d=await Api.teamLoadOverview();
  if(Router.isStale(token)) return;
  const days=d.days||[];
  const team=d.team_series||[];
  const players=d.players||[];
  const top=players.slice().sort((a,b)=>Number(b.week_ua||0)-Number(a.week_ua||0)).slice(0,8);
  const risk=players.slice().sort((a,b)=>Number(b.acwr||0)-Number(a.acwr||0)).slice(0,8);

  setPageContent(`
    <div class="grid3">
      <div class="kpi"><div class="val">${fmt(d.week_ua)}</div><div class="lbl">UA equipo 7d</div></div>
      <div class="kpi"><div class="val">${fmt(d.today_ua)}</div><div class="lbl">UA hoy</div></div>
      <div class="kpi"><div class="val">${fmt(players.length)}</div><div class="lbl">Jugadores</div></div>
    </div>

    <div class="card">
      <h3 class="card-title">📈 Carga diaria del equipo</h3>
      <div class="chart-box"><canvas id="team-load-chart"></canvas></div>
    </div>

    <div class="desktop-cols">
      <div class="card">
        <h3 class="card-title">🏆 Ranking semanal</h3>
        <div class="chart-box tall"><canvas id="team-ranking-chart"></canvas></div>
      </div>
      <div class="card">
        <h3 class="card-title">⚠️ Subida de carga</h3>
        <p class="muted chart-note">ACWR orientativo: últimos 7 días / promedio semanal de 28 días. No es diagnóstico médico.</p>
        <div class="list">${risk.map(p=>`<div class="item"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${fmt(p.week_ua)} UA 7d · ACWR ${p.acwr ? Number(p.acwr).toFixed(2) : '-'}</div></div><span class="pill ${acwrClass(p.acwr)}">${acwrLabel(p.acwr)}</span></div>`).join('') || '<div class="empty">Sin datos.</div>'}</div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🔥 Heatmap últimos 14 días</h3>
      <p class="muted chart-note">Filas = jugadores. Columnas = días. Color = UA diaria.</p>
      ${renderTeamHeatmap(days, players)}
    </div>

    <div class="card">
      <h3 class="card-title">✅ Cumplimiento</h3>
      <div class="list">${players.map(p=>`<div class="item"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${fmt(p.report_days)} días con carga en últimos 14 · ${fmt(p.week_ua)} UA 7d</div></div><span class="pill ${p.report_days>=3?'ok':p.report_days>=1?'warn':'danger'}">${p.report_days>=3?'Activo':p.report_days>=1?'Bajo':'Sin carga'}</span></div>`).join('') || '<div class="empty">Sin jugadores activos.</div>'}</div>
    </div>
  `);

  Charts.line('team-load-chart', team.map(x=>dateAR(x.fecha).slice(0,5)), team.map(x=>Number(x.ua||0)), 'UA equipo');
  Charts.barHorizontal('team-ranking-chart', top.map(p=>`${p.nombre} ${p.apellido}`), top.map(p=>Number(p.week_ua||0)), 'UA semana');
});

function acwrClass(v){
  v=Number(v||0);
  if(!v) return 'warn';
  if(v>1.5) return 'danger';
  if(v>1.3 || v<0.8) return 'warn';
  return 'ok';
}
function acwrLabel(v){
  v=Number(v||0);
  if(!v) return 'Sin base';
  if(v>1.5) return 'Muy alta';
  if(v>1.3) return 'Subida';
  if(v<0.8) return 'Baja';
  return 'Estable';
}
function renderTeamHeatmap(days, players){
  const max=Math.max(1,...players.flatMap(p=>days.map(d=>Number((p.ua_by_day||{})[d]||0))));
  return `<div class="team-heatmap-wrap"><div class="team-heatmap" style="grid-template-columns:minmax(120px,1.3fr) repeat(${days.length}, minmax(26px,1fr));">
    <div class="heat-head">Jugador</div>
    ${days.map(d=>`<div class="heat-head day">${dateAR(d).slice(0,5)}</div>`).join('')}
    ${players.map(p=>`<div class="heat-player">${esc(p.nombre)} ${esc(p.apellido)}</div>${days.map(d=>{
      const v=Number((p.ua_by_day||{})[d]||0);
      const lvl=v===0?0:Math.max(1,Math.ceil((v/max)*4));
      return `<div class="heat-cell heat-${lvl}" title="${esc(p.nombre)} ${esc(p.apellido)} · ${dateAR(d)} · ${fmt(v)} UA">${v?fmt(v):''}</div>`;
    }).join('')}`).join('')}
  </div></div>`;
}
