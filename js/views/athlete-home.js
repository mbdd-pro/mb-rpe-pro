Router.register('athlete', async (params={}, token) => {
  if(!Auth.isLogged()) return Router.go('login');
  const user=Auth.current;
  $('#app').innerHTML = basePage('athlete', 'Inicio deportista', `Hola, ${esc(user.nombre)}`, `<div class="grid"><div class="empty">Cargando sesiones...</div></div>`);
  const data = await Api.athleteHome(user.jugador_id);
  if(Router.isStale(token)) return;
  const pending = data.sessions || [];
  const recent = data.recent || [];
  const content = `
    <div class="grid3">
      <div class="kpi"><div class="val">${fmt(data.week_ua)}</div><div class="lbl">UA semana</div></div>
      <div class="kpi"><div class="val">${fmt(data.month_ua)}</div><div class="lbl">UA mes</div></div>
      <div class="kpi"><div class="val">${Number(data.avg_rpe||0).toFixed(1)}</div><div class="lbl">RPE prom.</div></div>
    </div>
    <div class="grid2"><button class="btn" id="free-session-btn">Cargar sesión libre</button><button class="btn secondary" onclick="syncNow()">Sincronizar</button></div>
    <div class="card"><h3 class="card-title">📝 Sesiones pendientes</h3>
      ${pending.length ? `<div class="list">${pending.map(s=>sessionCard(s)).join('')}</div>` : `<div class="empty">No tenés sesiones pendientes. Cuando el coach cree una sesión abierta, te va a aparecer acá para cargar el RPE.</div>`}
    </div>
    <div class="card"><h3 class="card-title">📌 Últimos reportes</h3>
      ${recent.length ? `<div class="list">${recent.map(r=>reportCard(r)).join('')}</div>` : `<div class="empty">Sin reportes todavía.</div>`}
    </div>`;
  setPageContent(content);
  const freeBtn = $('#free-session-btn'); if(freeBtn) freeBtn.onclick=()=>renderFreeSessionForm();
  $$('.open-report').forEach(btn=>btn.onclick=()=>renderReportForm(btn.dataset.id, pending.find(s=>s.sesion_id===btn.dataset.id)));
  $$('.ath-report-open').forEach(el=>el.onclick=()=>renderAthleteReportDetail(recent.find(r=>r.reporte_id===el.dataset.id)));
  $$('.ath-report-delete').forEach(btn=>btn.onclick=async(ev)=>{ ev.stopPropagation(); await deleteAthleteReport(btn.dataset.id, btn.dataset.free==='1'); });
});
function sessionCard(s){
  const creator = s.creada_por_nombre || s.coach_nombre || '';
  const meta = [dateAR(s.fecha), timeShort(s.hora_inicio), esc(s.tipo_sesion), `${s.duracion_min} min`, sourceLabel(s.estado), creator ? `Coach: <span class="coach-name">${esc(creator)}</span>` : ''].filter(Boolean).join(' · ');
  return `<div class="item pending-session-card"><div class="item-main"><div class="item-title">${esc(s.titulo)}</div><div class="item-sub">${meta}</div></div><button class="btn small open-report pending-pulse" data-id="${esc(s.sesion_id)}">Pendiente · cargar RPE</button></div>`
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
