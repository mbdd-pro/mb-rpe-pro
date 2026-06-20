Router.register('coach-graphs', async(params={}, token)=>{
  if(!Auth.isLogged()) return Router.go('login');
  if(!Auth.isCoach()) return Router.go('athlete');
  $('#app').innerHTML = basePage('coach-graphs','Gráficos','Carga del plantel',`<div class="empty">Cargando gráficos...</div>`);
  const d=await Api.teamLoadOverview();
  if(Router.isStale(token)) return;

  const days=d.days||[];
  const team=(d.team_series||[]).slice(-21);
  const players=d.players||[];
  const top=players.slice().sort((a,b)=>Number(b.week_ua||0)-Number(a.week_ua||0)).slice(0,8);
  const risk=players.slice().sort((a,b)=>{
    const ar = acwrPriority(b) - acwrPriority(a);
    return ar || Number(b.week_ua||0)-Number(a.week_ua||0);
  }).slice(0,8);

  setPageContent(`
    <div class="coach-kpi-row">
      <div class="kpi compact"><div class="val">${fmt(d.week_ua)}</div><div class="lbl">UA equipo 7d</div></div>
      <div class="kpi compact"><div class="val">${fmt(d.today_ua)}</div><div class="lbl">UA hoy</div></div>
      <div class="kpi compact"><div class="val">${fmt(players.length)}</div><div class="lbl">Jugadores</div></div>
    </div>

    <div class="card">
      <h3 class="card-title">📈 Carga diaria del equipo</h3>
      <div class="chart-box"><canvas id="team-load-chart"></canvas></div>
    </div>

    <div class="card">
      <h3 class="card-title">🏆 Ranking semanal</h3>
      ${renderRankingBars(top)}
    </div>

    <div class="card">
      <h3 class="card-title">⚠️ Subida de carga</h3>
      <p class="muted chart-note">ACWR orientativo. Si no hay historial suficiente, se muestra “Sin base”. No es diagnóstico médico.</p>
      <div class="list">${risk.map(p=>`<div class="item"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${fmt(p.week_ua)} UA 7d · ${acwrText(p)}</div></div><span class="pill ${acwrClass(p)}">${acwrLabel(p)}</span></div>`).join('') || '<div class="empty">Sin datos.</div>'}</div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3 class="card-title">🔥 Heatmap últimos 14 días</h3>
        <button class="btn small secondary" id="heatmap-big-btn">🔍 Ver grande</button>
      </div>
      <p class="muted chart-note">Filas = jugadores. Columnas = días. Color = UA diaria.</p>
      ${renderTeamHeatmap(days, players)}
    </div>

    <div class="card">
      <h3 class="card-title">✅ Cumplimiento</h3>
      <div class="list">${players.map(p=>`<div class="item"><div class="item-main"><div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div><div class="item-sub">${fmt(p.report_days)} días con carga en últimos 14 · ${fmt(p.week_ua)} UA 7d</div></div><span class="pill ${p.report_days>=3?'ok':p.report_days>=1?'warn':'danger'}">${p.report_days>=3?'Activo':p.report_days>=1?'Bajo':'Sin carga'}</span></div>`).join('') || '<div class="empty">Sin jugadores activos.</div>'}</div>
    </div>
  `);

  Charts.line('team-load-chart', team.map(x=>dateAR(x.fecha).slice(0,5)), team.map(x=>Number(x.ua||0)), 'UA equipo');

  const big=$('#heatmap-big-btn');
  if(big) big.onclick=()=>openHeatmapModal(days, players);
});

function renderRankingBars(players){
  const max = Math.max(1, ...players.map(p=>Number(p.week_ua||0)));
  return `<div class="rank-bars">${players.map((p,i)=>{
    const v=Number(p.week_ua||0);
    const pct=Math.max(3, Math.round((v/max)*100));
    return `<div class="rank-row">
      <div class="rank-label"><span class="rank-pos">${i+1}</span><span>${esc(p.nombre)} ${esc(p.apellido)}</span></div>
      <div class="rank-track"><div class="rank-fill" style="width:${pct}%"></div></div>
      <div class="rank-value">${fmt(v)} UA</div>
    </div>`;
  }).join('') || '<div class="empty">Sin datos.</div>'}</div>`;
}

function acwrPriority(p){
  const status = String(p.acwr_status||'');
  if(status==='very_high') return 4;
  if(status==='high') return 3;
  if(status==='low') return 2;
  if(status==='stable') return 1;
  return 0;
}
function acwrClass(p){
  const s=String(p.acwr_status||'');
  if(s==='very_high') return 'danger';
  if(s==='high' || s==='low') return 'warn';
  if(s==='stable') return 'ok';
  return 'warn';
}
function acwrLabel(p){
  const s=String(p.acwr_status||'');
  if(s==='very_high') return 'Muy alta';
  if(s==='high') return 'Subida';
  if(s==='low') return 'Baja';
  if(s==='stable') return 'Estable';
  return 'Sin base';
}
function acwrText(p){
  if(!p || !p.acwr || String(p.acwr_status||'')==='no_base') return 'ACWR sin base';
  return `ACWR ${Number(p.acwr).toFixed(2)}`;
}
function renderTeamHeatmap(days, players){
  const max=Math.max(1,...players.flatMap(p=>days.map(d=>Number((p.ua_by_day||{})[d]||0))));
  return `<div class="team-heatmap-wrap"><div class="team-heatmap" style="grid-template-columns:minmax(106px,1.1fr) repeat(${days.length}, minmax(25px,1fr));">
    <div class="heat-head">Jugador</div>
    ${days.map(d=>`<div class="heat-head day">${dateAR(d).slice(0,5)}</div>`).join('')}
    ${players.map(p=>`<div class="heat-player">${esc(p.nombre)} ${esc(p.apellido)}</div>${days.map(d=>{
      const v=Number((p.ua_by_day||{})[d]||0);
      const lvl=v===0?0:Math.max(1,Math.ceil((v/max)*4));
      return `<div class="heat-cell heat-${lvl}" title="${esc(p.nombre)} ${esc(p.apellido)} · ${dateAR(d)} · ${fmt(v)} UA">${v?fmt(v):''}</div>`;
    }).join('')}`).join('')}
  </div></div>`;
}
function openHeatmapModal(days, players){
  const old=$('#graph-modal'); if(old) old.remove();
  const div=document.createElement('div');
  div.id='graph-modal';
  div.className='graph-modal';
  div.innerHTML=`<div class="graph-modal-card">
    <div class="card-head">
      <h3 class="card-title">🔥 Heatmap plantel</h3>
      <button class="btn small secondary" id="close-graph-modal">Cerrar</button>
    </div>
    <p class="muted chart-note">Deslizá horizontalmente para ver todos los días.</p>
    ${renderTeamHeatmap(days, players)}
  </div>`;
  document.body.appendChild(div);
  $('#close-graph-modal').onclick=()=>div.remove();
  div.onclick=(e)=>{ if(e.target===div) div.remove(); };
}
