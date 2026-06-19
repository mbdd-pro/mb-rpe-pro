Router.register('athlete', async (params={}, token) => {
  if(!Auth.isLogged()) return Router.go('login');
  const user=Auth.current;
  $('#app').innerHTML = basePage('athlete', 'Inicio deportista', `Hola, ${esc(user.nombre)}`, `<div class="grid"><div class="empty">Cargando sesiones...</div></div>`);
  const [data, wellness] = await Promise.all([Api.athleteHome(user.jugador_id), Api.athleteWellness(user.jugador_id).catch(()=>({}))]);
  if(Router.isStale(token)) return;
  const pending = data.sessions || [];
  const recent = data.recent || [];
  window.__athletePendingSessions = pending;
  const content = `
    <div class="athlete-kpi-row">
      <div class="kpi compact"><div class="val">${fmt(data.week_ua)}</div><div class="lbl">UA semana</div></div>
      <div class="kpi compact"><div class="val">${fmt(data.month_ua)}</div><div class="lbl">UA mes</div></div>
      <div class="kpi compact"><div class="val">${Number(data.avg_rpe||0).toFixed(1)}</div><div class="lbl">RPE prom.</div></div>
    </div>

    <div class="card"><h3 class="card-title">💤 Bienestar de hoy</h3>${wellnessCard(wellness)}</div>

    <div class="card"><h3 class="card-title">📌 Últimos reportes</h3>
      ${recent.length ? `<div class="list">${recent.map(r=>reportCard(r)).join('')}</div>` : `<div class="empty">Sin reportes todavía.</div>`}
    </div>`;
  setPageContent(content);
  const freeBtn = $('#free-session-btn'); if(freeBtn) freeBtn.onclick=()=>renderFreeSessionForm();
  setupWellnessButtons(wellness);
  $$('.ath-report-open').forEach(el=>el.onclick=()=>renderAthleteReportDetail(recent.find(r=>r.reporte_id===el.dataset.id)));
  $$('.ath-report-delete').forEach(btn=>btn.onclick=async(ev)=>{ ev.stopPropagation(); await deleteAthleteReport(btn.dataset.id, btn.dataset.free==='1'); });
});


Router.register('athlete-sessions', async (params={}, token) => {
  if(!Auth.isLogged()) return Router.go('login');
  const user=Auth.current;
  $('#app').innerHTML = basePage('athlete-sessions', 'Sesiones', `Hola, ${esc(user.nombre)}`, `<div class="grid"><div class="empty">Cargando sesiones...</div></div>`);
  const data = await Api.athleteHome(user.jugador_id);
  if(Router.isStale(token)) return;
  const pending = data.sessions || [];
  const recent = data.recent || [];
  window.__athletePendingSessions = pending;
  setPageContent(`
    <div class="card pending-first"><h3 class="card-title">📝 Sesiones pendientes del coach</h3><p class="muted chart-note">Tocá la tarjeta o el botón para cargar el RPE pedido por el coach.</p>
      ${pending.length ? `<div class="list">${pending.map(s=>athletePendingSessionCard(s)).join('')}</div>` : `<div class="empty">No tenés sesiones pendientes. Cuando el coach cree una sesión abierta, te va a aparecer acá para cargar el RPE.</div>`}
    </div>

    <div class="grid2 athlete-secondary-actions"><button class="btn secondary" id="free-session-btn">Cargar sesión libre</button><button class="btn secondary" onclick="syncNow()">Sincronizar</button></div>

    <div class="card"><h3 class="card-title">📌 Últimos reportes</h3>
      ${recent.length ? `<div class="list">${recent.map(r=>reportCard(r)).join('')}</div>` : `<div class="empty">Sin reportes todavía.</div>`}
    </div>`);
  const freeBtn = $('#free-session-btn'); if(freeBtn) freeBtn.onclick=()=>renderFreeSessionForm();
  $$('.open-report-card').forEach(card=>card.onclick=()=>openPendingReport(card.dataset.id));
  $$('.open-report').forEach(btn=>btn.onclick=(ev)=>{ev.stopPropagation(); openPendingReport(btn.dataset.id);});
  $$('.ath-report-open').forEach(el=>el.onclick=()=>renderAthleteReportDetail(recent.find(r=>r.reporte_id===el.dataset.id)));
  $$('.ath-report-delete').forEach(btn=>btn.onclick=async(ev)=>{ ev.stopPropagation(); await deleteAthleteReport(btn.dataset.id, btn.dataset.free==='1'); });
});

function wellnessCard(w){
  const today = w && w.today;
  const score = today ? Number(today.score||0) : 0;
  const label = wellnessLabel(score);
  if(today){
    return `<div class="wellness-summary"><div><div class="wellness-score">${score}</div><div class="muted">Score bienestar</div></div><span class="pill ${label.cls}">${label.txt}</span></div>
    <div class="wellness-mini">Sueño ${today.sueno} · Fatiga ${today.fatiga} · Dolor ${today.dolor_muscular} · Ánimo/Estrés ${today.estres_animo}${today.molestia==='SI'?' · Molestia':''}</div>
    <button class="btn secondary" id="wellness-edit-btn" style="margin-top:10px">Editar bienestar</button>
    <div id="wellness-form-wrap" style="display:none;margin-top:12px">${wellnessForm(today)}</div>`;
  }
  return `<p class="muted">Carga rápida: sueño, fatiga, dolor y ánimo/estrés.</p><button class="btn" id="wellness-edit-btn">Cargar bienestar</button><div id="wellness-form-wrap" style="display:none;margin-top:12px">${wellnessForm({})}</div>`;
}
function wellnessLabel(score){
  score=Number(score||0);
  if(!score) return {txt:'Sin datos',cls:'warn'};
  if(score>=14) return {txt:'Alerta',cls:'danger'};
  if(score>=10) return {txt:'Atención',cls:'warn'};
  return {txt:'Bien',cls:'ok'};
}
function wellnessForm(w){
  return `<div class="grid2">
    ${wellSelect('sueno','Sueño',w.sueno)}
    ${wellSelect('fatiga','Fatiga',w.fatiga)}
    ${wellSelect('dolor_muscular','Dolor muscular',w.dolor_muscular)}
    ${wellSelect('estres_animo','Ánimo / estrés',w.estres_animo)}
  </div>
  <div class="grid2">
    <div class="form-row"><label>Molestia / lesión</label><select id="well-molestia"><option value="NO">No</option><option value="SI" ${w.molestia==='SI'?'selected':''}>Sí</option></select></div>
    <div class="form-row"><label>Zona molestia</label><input id="well-zona" value="${esc(w.zona_molestia||'')}" placeholder="rodilla, tobillo..."></div>
  </div>
  <div class="form-row"><label>Comentario</label><textarea id="well-comentario" placeholder="Opcional">${esc(w.comentario||'')}</textarea></div>
  <button class="btn" id="save-wellness-btn">Guardar bienestar</button>`;
}
function wellSelect(id,label,val){
  val=String(val||'');
  return `<div class="form-row"><label>${label}</label><select id="well-${id}">
    <option value="">Elegir</option>
    <option value="1" ${val==='1'?'selected':''}>1 · Muy bien</option>
    <option value="2" ${val==='2'?'selected':''}>2 · Bien</option>
    <option value="3" ${val==='3'?'selected':''}>3 · Normal</option>
    <option value="4" ${val==='4'?'selected':''}>4 · Mal</option>
    <option value="5" ${val==='5'?'selected':''}>5 · Muy mal</option>
  </select></div>`;
}
function setupWellnessButtons(wellness){
  const edit=$('#wellness-edit-btn');
  const wrap=$('#wellness-form-wrap');
  if(edit && wrap) edit.onclick=()=>{ wrap.style.display = wrap.style.display==='none' ? 'block' : 'none'; };
  const save=$('#save-wellness-btn');
  if(save) save.onclick=async()=>{try{
    const payload={
      jugador_id:Auth.current.jugador_id,
      fecha:todayISO(),
      sueno:$('#well-sueno').value,
      fatiga:$('#well-fatiga').value,
      dolor_muscular:$('#well-dolor_muscular').value,
      estres_animo:$('#well-estres_animo').value,
      molestia:$('#well-molestia').value,
      zona_molestia:$('#well-zona').value,
      comentario:$('#well-comentario').value
    };
    if(!payload.sueno||!payload.fatiga||!payload.dolor_muscular||!payload.estres_animo) return toast('Completá los 4 valores');
    save.textContent='Guardando...'; save.disabled=true;
    await Api.submitWellness(payload);
    toast('Bienestar guardado');
    Router.render();
  }catch(e){ toast(e.message); save.textContent='Guardar bienestar'; save.disabled=false; }};
}


function athletePendingSessionCard(s){
  const creator = s.creada_por_nombre || s.coach_nombre || '';
  const meta = [dateAR(s.fecha), timeShort(s.hora_inicio), esc(s.tipo_sesion), `${s.duracion_min} min`, creator ? `Coach: <span class="coach-name">${esc(creator)}</span>` : ''].filter(Boolean).join(' · ');
  return `<div class="item pending-session-card open-report-card" data-id="${esc(s.sesion_id)}" onclick="openPendingReport(\'${esc(s.sesion_id)}\')">
    <div class="item-main">
      <div class="pending-topline"><div class="item-title">${esc(s.titulo)}</div><span class="pill ok">abierta</span></div>
      <div class="item-sub">${meta}</div>
      <button type="button" class="btn pending-rpe-btn open-report" data-id="${esc(s.sesion_id)}" onclick="event.stopPropagation();openPendingReport(\'${esc(s.sesion_id)}\')">Cargar RPE de esta sesión</button>
    </div>
  </div>`;
}
function openPendingReport(id){
  const list = window.__athletePendingSessions || [];
  const s = list.find(x=>String(x.sesion_id)===String(id));
  if(!s) return toast('No se encontró la sesión pendiente. Tocá Sincronizar.');
  renderReportForm(id, s);
}
function isFreeReport(r){ return String(r.estado||'').includes('libre') || String(r.origen||'').toLowerCase()==='libre'; }
function reportCard(r){
  const free = isFreeReport(r);
  return `<div class="item ath-report-open" data-id="${esc(r.reporte_id)}"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} ${timeShort(r.hora_inicio)} · ${fmt(r.ua)} UA · ${sourceLabel(r.estado)}${r.comentario?' · '+esc(r.comentario):''}</div></div><div class="item-actions"><span class="pill ${free?'warn':loadZone(r.ua).cls}">${free?'Libre':loadZone(r.ua).label}</span>${free?`<button class="btn small danger delete-btn ath-report-delete" data-id="${esc(r.reporte_id)}" data-free="1" title="Borrar">🗑️</button>`:''}</div></div>`
}
async function deleteAthleteReport(reporte_id, free){
  if(!free) return toast('Solo podés borrar sesiones libres. Las oficiales las borra el coach.');
  if(!confirm('¿Borrar definitivamente esta sesión libre?\nSe elimina de la app y de la Sheet.')) return;
  try{ await Api.deleteReport(reporte_id); toast('Sesión libre borrada'); Router.render(); }catch(e){ toast(e.message); }
}
function renderAthleteReportDetail(r){
  if(!r) return toast('Reporte no encontrado');
  const free = isFreeReport(r);
  $('#page-content').innerHTML = `<div class="card">
    <button class="btn small secondary" onclick="Router.go('athlete')">← Volver</button>
    <h3 class="card-title">${esc(r.titulo)} · RPE ${esc(r.rpe)}</h3>
    <div class="session-detail-grid">
      <div class="item"><div class="item-main"><div class="item-title">Fecha y hora</div><div class="item-sub">${dateAR(r.fecha)} ${timeShort(r.hora_inicio)||''}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Tipo / origen</div><div class="item-sub">${esc(r.tipo_sesion||'-')} · ${sourceLabel(r.estado)}</div></div><span class="pill ${free?'warn':'ok'}">${sourceLabel(r.estado)}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Duración</div><div class="item-sub">${esc(r.duracion_min||'-')} min</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">UA</div><div class="item-sub">${fmt(r.ua)} UA</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Comentario</div><div class="item-sub">${esc(r.comentario||'-')}</div></div></div>
    </div>
    ${free?`<button class="btn danger" id="delete-report-detail" style="margin-top:12px">🗑️ Borrar sesión libre</button>`:`<p class="muted small" style="margin-top:12px">Las sesiones oficiales solo puede borrarlas el coach.</p>`}
  </div>`;
  const del=$('#delete-report-detail'); if(del) del.onclick=()=>deleteAthleteReport(r.reporte_id, true);
}
function renderReportForm(id,s){
  $('#page-content').innerHTML = `<div class="card"><h3 class="card-title">Cargar RPE · ${esc(s.titulo)}</h3>
    <p class="muted small">Duración definida por coach: <b>${s.duracion_min} min</b></p>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="rpe-selected" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="comentario" placeholder="¿Cómo te sentiste?"></textarea></div>
    <button class="btn" id="save-report">Guardar reporte</button><button class="btn secondary" style="margin-top:8px" onclick="Router.go('athlete')">Volver</button></div>`;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#rpe-selected').value=b.dataset.rpe;});
  $('#save-report').onclick=async()=>{try{ const rpe=$('#rpe-selected').value; if(!rpe) return toast('Elegí RPE'); const btn=$('#save-report'); btn.textContent='Guardando...'; btn.disabled=true;
    await Api.submitReport({sesion_id:id,jugador_id:Auth.current.jugador_id,rpe,comentario:$('#comentario').value});
    btn.textContent='Guardado ✅'; toast('Reporte guardado'); setTimeout(()=>Router.go('athlete'),350); }catch(e){toast(e.message)}};
}

function renderFreeSessionForm(){
  $('#page-content').innerHTML = `<div class="card"><h3 class="card-title">Cargar sesión libre</h3>
    <p class="muted small">Para entrenamientos individuales no creados por el coach. Queda visible para revisión.</p>
    <div class="grid2"><div class="form-row"><label>Fecha</label><input id="free-fecha" type="date" value="${todayISO()}"></div><div class="form-row"><label>Hora</label><input id="free-hora" type="time" value=""></div></div>
    <div class="form-row"><label>Duración min</label><input id="free-duracion" type="number" value="60"></div>
    <div class="grid2"><div class="form-row"><label>Tipo</label><select id="free-tipo"><option>entrenamiento</option><option>partido</option><option>gimnasio</option><option>recuperacion</option><option>otro</option></select></div><div class="form-row"><label>Título</label><input id="free-titulo" placeholder="Entrenamiento individual"></div></div>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="free-rpe" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="free-comentario" placeholder="¿Qué hiciste y cómo te sentiste?"></textarea></div>
    <button class="btn" id="save-free-report">Guardar sesión libre</button><button class="btn secondary" style="margin-top:8px" onclick="Router.go('athlete')">Volver</button></div>`;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#free-rpe').value=b.dataset.rpe;});
  $('#save-free-report').onclick=async()=>{try{
    const rpe=$('#free-rpe').value; if(!rpe) return toast('Elegí RPE');
    const dur=$('#free-duracion').value; if(!dur || Number(dur)<=0) return toast('Duración inválida');
    const btn=$('#save-free-report'); btn.textContent='Guardando...'; btn.disabled=true;
    await Api.submitFreeReport({jugador_id:Auth.current.jugador_id,fecha:$('#free-fecha').value,hora_inicio:$('#free-hora').value,titulo:$('#free-titulo').value||'Sesión libre',tipo_sesion:$('#free-tipo').value,duracion_min:dur,rpe,comentario:$('#free-comentario').value,creada_por:Auth.current.usuario_id});
    btn.textContent='Guardado ✅'; toast('Sesión libre guardada'); setTimeout(()=>Router.go('athlete'),350);
  }catch(e){toast(e.message)}};
}
