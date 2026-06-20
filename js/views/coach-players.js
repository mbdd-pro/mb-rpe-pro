Router.register('coach-players', async(params={}, token)=>{
 if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
 const detailId = params && params.id;
 $('#app').innerHTML=basePage('coach-players','Jugadores', detailId ? 'Ficha deportiva' : 'Plantel y fichas deportivas','<div class="empty">Cargando...</div>');
 if(detailId) return renderPlayerDetail(detailId, token);
 const d=await Api.listPlayers();
 if(Router.isStale(token)) return;
 setPageContent(`<div class="card">
   <div class="card-head"><h3 class="card-title">👥 Jugadores</h3><button class="btn small secondary" onclick="syncNow()">Sincronizar</button></div>
   <div class="list" style="margin-top:10px">${(d.players||[]).map(p=>playerListItem(p)).join('') || '<div class="empty">Sin jugadores.</div>'}</div>
 </div>`);
 $$('.player-open').forEach(el=>el.onclick=()=>Router.go('coach-players',{id:el.dataset.id}));
 $$('.player-delete').forEach(btn=>btn.onclick=async(ev)=>{ev.stopPropagation(); await deletePlayerByCoach(btn.dataset.id, btn.dataset.name);});
});

function playerListItem(p){
  const name = `${p.nombre||''} ${p.apellido||''}`.trim();
  return `<div class="item player-row">
    <div class="avatar player-open" data-id="${esc(p.jugador_id)}">${initials(p.nombre,p.apellido)}</div>
    <div class="item-main player-open" data-id="${esc(p.jugador_id)}">
      <div class="item-title">${esc(p.nombre)} ${esc(p.apellido)}</div>
      <div class="item-sub">${esc(p.deporte||'')} · ${esc(p.categoria||'')} · ${esc(p.equipo||'')} · ${esc(p.posicion||'')}</div>
    </div>
    <div class="item-actions">
      <span class="pill ${p.activo==='SI'?'ok':'warn'}">${esc(p.activo)}</span>
      <button class="btn small danger delete-btn player-delete" data-id="${esc(p.jugador_id)}" data-name="${esc(name)}" title="Eliminar jugador">🗑️</button>
    </div>
  </div>`;
}

async function deletePlayerByCoach(id, name){
  if(!confirm(`¿Eliminar/desactivar al jugador "${name||id}"?\nNo se borra el historial de reportes; queda inactivo y desaparece del plantel.`)) return;
  try{ await Api.deletePlayer(id); toast('Jugador desactivado'); Router.go('coach-players'); }catch(e){ toast(e.message); }
}





function renderCoachPlayerReportDetail(r, p){
  if(!r) return toast('Reporte no encontrado');
  const playerName = `${p.nombre||''} ${p.apellido||''}`.trim() || r.jugador_id || '-';
  $('#page-content').innerHTML = `<div class="card">
    <button class="btn small secondary" onclick="Router.go('coach-players',{id:'${esc(p.jugador_id)}'})">← Volver</button>
    <h3 class="card-title">${esc(r.titulo)} · RPE ${esc(r.rpe)}</h3>
    <div class="session-detail-grid">
      <div class="item"><div class="item-main"><div class="item-title">Fecha y hora</div><div class="item-sub">${dateAR(r.fecha)} ${timeShort(r.hora_inicio)||''}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Jugador</div><div class="item-sub">${esc(playerName)}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Tipo / origen</div><div class="item-sub">${esc(r.tipo_sesion||'-')} · ${sourceLabel(r.estado||r.origen)}</div></div><span class="pill ${String(r.estado||r.origen||'').includes('libre')?'warn':'ok'}">${sourceLabel(r.estado||r.origen)}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Duración</div><div class="item-sub">${esc(r.duracion_min||'-')} min</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">RPE / UA</div><div class="item-sub">RPE ${esc(r.rpe)} · ${fmt(r.ua)} UA</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Comentario</div><div class="item-sub">${esc(r.comentario||'-')}</div></div></div>
    </div>
  </div>`;
}


function renderPlayerPendingSessions(rows, jugador_id, playerName){
  rows = rows || [];
  if(!rows.length) return '<div class="empty">Sin sesiones pendientes.</div>';
  return rows.slice(0,8).map(s=>`<div class="item"><div class="item-main"><div class="item-title">${esc(s.titulo)}</div><div class="item-sub">${dateAR(s.fecha)} ${timeShort(s.hora_inicio)||''} · ${esc(s.tipo_sesion||'')} · ${esc(s.duracion_min)} min · Coach: ${esc(s.coach_nombre||s.creada_por_nombre||'')}</div></div><button class="btn small player-fill-session" data-session="${esc(s.sesion_id)}" data-title="${esc(s.titulo)}" data-fecha="${esc(s.fecha)}" data-hora="${esc(s.hora_inicio||'')}" data-duracion="${esc(s.duracion_min)}" data-tipo="${esc(s.tipo_sesion||'')}">Cargar</button></div>`).join('');
}
function renderPlayerPendingFillForm(s, jugador_id, playerName){
  $('#page-content').innerHTML = `<div class="card"><button class="btn small secondary" onclick="Router.go('coach-players',{id:'${esc(jugador_id)}'})">← Volver</button>
    <h3 class="card-title">Cargar RPE por jugador</h3>
    <p class="muted small"><b>${esc(playerName)}</b> · ${esc(s.titulo)} · ${dateAR(s.fecha)} ${timeShort(s.hora_inicio)||''} · ${esc(s.duracion_min)} min</p>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="player-rpe-selected" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="player-comentario" placeholder="Cargado por el coach"></textarea></div>
    <button class="btn" id="player-save-report">Guardar reporte</button>
  </div>`;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#player-rpe-selected').value=b.dataset.rpe;});
  $('#player-save-report').onclick=async()=>{try{
    const rpe=$('#player-rpe-selected').value; if(!rpe) return toast('Elegí RPE');
    const btn=$('#player-save-report'); btn.textContent='Guardando...'; btn.disabled=true;
    await Api.coachSubmitReport({sesion_id:s.sesion_id,jugador_id,rpe,comentario:$('#player-comentario').value});
    btn.textContent='Guardado ✅'; toast('Reporte cargado por coach'); setTimeout(()=>Router.go('coach-players',{id:jugador_id}),350);
  }catch(e){toast(e.message); const btn=$('#player-save-report'); if(btn){btn.textContent='Guardar reporte'; btn.disabled=false;}}};
}


function renderPlayerWellnessList(rows){
  rows = rows || [];
  if(!rows.length) return '<div class="empty">Sin registros de bienestar.</div>';
  return rows.slice(0,8).map(w=>{
    const label = playerWellnessLabel(w);
    return `<div class="item"><div class="item-main"><div class="item-title">${dateAR(w.fecha)} · Score ${fmt(w.score)}</div><div class="item-sub">Sueño ${w.sueno||'-'} · Fatiga ${w.fatiga||'-'} · Dolor ${w.dolor_muscular||'-'} · Ánimo/Estrés ${w.estres_animo||'-'}${w.molestia==='SI'?' · Molestia: '+esc(w.zona_molestia||'sí'):''}${w.comentario?' · '+esc(w.comentario):''}</div></div><span class="pill ${label.cls}">${label.txt}</span></div>`;
  }).join('');
}
function playerWellnessLabel(w){
  const score=Number(w.score||0);
  if(w.molestia==='SI' || score>=14) return {txt:'Alerta',cls:'danger'};
  if(score>=10) return {txt:'Atención',cls:'warn'};
  if(score>0) return {txt:'Bien',cls:'ok'};
  return {txt:'Sin datos',cls:'warn'};
}


async function renderPlayerDetail(jugador_id, token){
 const d = await Api.playerDetail(jugador_id);
 if(Router.isStale(token)) return;
 const p = d.player || {};
 setPageContent(`
  <div class="card">
    <div class="grid2"><button class="btn small secondary" onclick="Router.go('coach-players')">← Volver</button><button class="btn small danger" id="delete-player-detail">🗑️ Desactivar</button></div>
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
  <div class="card"><h3 class="card-title">Datos editables</h3>
      <div class="grid2"><div class="form-row"><label>Nombre</label><input id="ep-nombre" value="${esc(p.nombre||'')}"></div><div class="form-row"><label>Apellido</label><input id="ep-apellido" value="${esc(p.apellido||'')}"></div></div>
      <div class="form-row"><label>Email</label><input id="ep-email" value="${esc(p.email||'')}"></div>
      <div class="grid2"><div class="form-row"><label>Deporte</label><input id="ep-deporte" value="${esc(p.deporte||'')}"></div><div class="form-row"><label>Categoría</label><input id="ep-categoria" value="${esc(p.categoria||'')}"></div></div>
      <div class="grid2"><div class="form-row"><label>Equipo</label><input id="ep-equipo" value="${esc(p.equipo||'')}"></div><div class="form-row"><label>Posición</label><input id="ep-posicion" value="${esc(p.posicion||'')}"></div></div>
      <div class="grid2"><div class="form-row"><label>Fecha nacimiento</label><input id="ep-fecha" inputmode="numeric" placeholder="dd/mm/aaaa" value="${esc(formatDateInput(p.fecha_nacimiento||''))}"></div><div class="form-row"><label>Altura</label><input id="ep-altura" value="${esc(p.altura||'')}"></div></div>
      <div class="form-row"><label>Peso</label><input id="ep-peso" value="${esc(p.peso||'')}"></div>
      <div class="form-row"><label>Nota coach</label><textarea id="ep-nota">${esc(p.nota||'')}</textarea></div>
      <button class="btn" id="save-player-btn">Guardar datos</button>
  </div>
  <div class="card"><h3 class="card-title">📝 Sesiones pendientes</h3>
    <div class="list">${renderPlayerPendingSessions(d.pending_sessions||[], jugador_id, `${p.nombre||''} ${p.apellido||''}`.trim())}</div>
  </div>
  <div class="card"><h3 class="card-title">💤 Bienestar</h3>
    <div class="chart-box"><canvas id="player-wellness-chart"></canvas></div>
    <div class="list wellness-history-list">${renderPlayerWellnessList(d.wellness||[])}</div>
  </div>
  <div class="card"><h3 class="card-title">Últimos reportes</h3><div class="list">${(d.reports||[]).map((r,i)=>`<div class="item clickable" onclick="window.openCoachPlayerReportDetail(${i})"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA · ${sourceLabel(r.estado)}</div></div><span class="pill ${String(r.estado||'').includes('libre')?'warn':loadZone(r.ua).cls}">${String(r.estado||'').includes('libre')?'Libre':loadZone(r.ua).label}</span></div>`).join('') || '<div class="empty">Sin reportes.</div>'}</div></div>`);
 const wSeries=(d.wellness||[]).slice().reverse(); Charts.line('player-wellness-chart', wSeries.map(x=>dateAR(x.fecha).slice(0,5)), wSeries.map(x=>Number(x.score||0)), 'Bienestar');
 window.__coachPlayerReports = d.reports || [];
 window.__coachPlayerData = p;
 window.openCoachPlayerReportDetail = function(i){ renderCoachPlayerReportDetail((window.__coachPlayerReports||[])[Number(i)], window.__coachPlayerData); };
 $$('.player-fill-session').forEach(btn=>btn.onclick=()=>renderPlayerPendingFillForm({sesion_id:btn.dataset.session,titulo:btn.dataset.title,fecha:btn.dataset.fecha,hora_inicio:btn.dataset.hora,duracion_min:btn.dataset.duracion,tipo_sesion:btn.dataset.tipo}, jugador_id, `${p.nombre||''} ${p.apellido||''}`.trim()));
 const delBtn=$('#delete-player-detail'); if(delBtn) delBtn.onclick=()=>deletePlayerByCoach(jugador_id, `${p.nombre||''} ${p.apellido||''}`.trim());
 setupDateMask('#ep-fecha'); setupDecimalComma('#ep-altura');
 const saveBtn=$('#save-player-btn');
 if(saveBtn) saveBtn.onclick=async()=>{try{
   saveBtn.textContent='Guardando...'; saveBtn.disabled=true;
   await Api.updatePlayer({jugador_id,nombre:$('#ep-nombre').value,apellido:$('#ep-apellido').value,email:$('#ep-email').value,deporte:$('#ep-deporte').value,categoria:$('#ep-categoria').value,equipo:$('#ep-equipo').value,posicion:$('#ep-posicion').value,fecha_nacimiento:parseDateInput($('#ep-fecha').value),altura:normalizeDecimal($('#ep-altura').value),peso:$('#ep-peso').value,nota:$('#ep-nota').value});
   saveBtn.textContent='Guardado ✅'; toast('Jugador actualizado'); setTimeout(()=>Router.go('coach-players',{id:jugador_id}),350);
 }catch(e){ toast(e.message); saveBtn.textContent='Guardar datos'; saveBtn.disabled=false; }};
}
