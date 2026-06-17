Router.register('athlete', async () => {
  if(!Auth.isLogged()) return Router.go('login');
  const user=Auth.current;
  $('#app').innerHTML = basePage('athlete', 'Inicio deportista', `Hola, ${esc(user.nombre)}`, `
    <div class="grid"><div class="empty">Cargando sesiones...</div></div>`);
  const data = await Api.athleteHome(user.jugador_id);
  const pending = data.sessions || [];
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
      ${(data.recent||[]).length ? `<div class="list">${data.recent.map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA · ${esc(r.comentario||'')}</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>`).join('')}</div>` : `<div class="empty">Sin reportes todavía.</div>`}
    </div>`;
  setPageContent(content);
  const freeBtn = $('#free-session-btn'); if(freeBtn) freeBtn.onclick=()=>renderFreeSessionForm();
  $$('.open-report').forEach(btn=>btn.onclick=()=>renderReportForm(btn.dataset.id, pending.find(s=>s.sesion_id===btn.dataset.id)));
});
function sessionCard(s){return `<div class="item"><div class="item-main"><div class="item-title">${esc(s.titulo)}</div><div class="item-sub">${dateAR(s.fecha)} · ${esc(s.tipo_sesion)} · ${s.duracion_min} min</div></div><button class="btn small open-report" data-id="${esc(s.sesion_id)}">Cargar RPE</button></div>`}
function renderReportForm(id,s){
  $('#page-content').innerHTML = `<div class="card"><h3 class="card-title">Cargar RPE · ${esc(s.titulo)}</h3>
    <p class="muted small">Duración definida por coach: <b>${s.duracion_min} min</b></p>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="rpe-selected" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="comentario" placeholder="¿Cómo te sentiste?"></textarea></div>
    <button class="btn" id="save-report">Guardar reporte</button><button class="btn secondary" style="margin-top:8px" onclick="Router.go('athlete')">Volver</button></div>`;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#rpe-selected').value=b.dataset.rpe;});
  $('#save-report').onclick=async()=>{try{ const rpe=$('#rpe-selected').value; if(!rpe) return toast('Elegí RPE'); await Api.submitReport({sesion_id:id,jugador_id:Auth.current.jugador_id,rpe,comentario:$('#comentario').value}); toast('Reporte guardado'); Router.go('athlete'); }catch(e){toast(e.message)}};
}

function renderFreeSessionForm(){
  $('#page-content').innerHTML = `<div class="card"><h3 class="card-title">Cargar sesión libre</h3>
    <p class="muted small">Para entrenamientos individuales no creados por el coach. Queda visible para revisión.</p>
    <div class="grid2"><div class="form-row"><label>Fecha</label><input id="free-fecha" type="date" value="${todayISO()}"></div><div class="form-row"><label>Duración min</label><input id="free-duracion" type="number" value="60"></div></div>
    <div class="grid2"><div class="form-row"><label>Tipo</label><select id="free-tipo"><option>entrenamiento</option><option>partido</option><option>gimnasio</option><option>recuperacion</option><option>otro</option></select></div><div class="form-row"><label>Título</label><input id="free-titulo" placeholder="Entrenamiento individual"></div></div>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="free-rpe" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="free-comentario" placeholder="¿Qué hiciste y cómo te sentiste?"></textarea></div>
    <button class="btn" id="save-free-report">Guardar sesión libre</button><button class="btn secondary" style="margin-top:8px" onclick="Router.go('athlete')">Volver</button></div>`;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#free-rpe').value=b.dataset.rpe;});
  $('#save-free-report').onclick=async()=>{try{
    const rpe=$('#free-rpe').value; if(!rpe) return toast('Elegí RPE');
    const dur=$('#free-duracion').value; if(!dur || Number(dur)<=0) return toast('Duración inválida');
    await Api.submitFreeReport({jugador_id:Auth.current.jugador_id,fecha:$('#free-fecha').value,titulo:$('#free-titulo').value||'Sesión libre',tipo_sesion:$('#free-tipo').value,duracion_min:dur,rpe,comentario:$('#free-comentario').value,creada_por:Auth.current.usuario_id});
    toast('Sesión libre guardada');
    Router.go('athlete');
  }catch(e){toast(e.message)}};
}
