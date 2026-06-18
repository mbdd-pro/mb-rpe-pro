Router.register('coach-sessions', async(params={}, token)=>{
  if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
  const detailId = params && params.id;
  $('#app').innerHTML = basePage('coach-sessions','Sesiones',detailId?'Detalle de sesión':'Crear y administrar sesiones',`<div class="empty">Cargando...</div>`);
  if(detailId) return renderSessionDetail(detailId, token);

  setPageContent(`<div class="card"><h3 class="card-title">➕ Nueva sesión</h3>
    <div class="grid2"><div class="form-row"><label>Fecha</label><input id="s-fecha" type="date" value="${todayISO()}"></div><div class="form-row"><label>Hora</label><input id="s-hora" type="time" value="20:00"></div></div>
    <div class="form-row"><label>Duración min</label><input id="s-duracion" type="number" value="75"></div>
    <div class="form-row"><label>Título</label><input id="s-titulo" placeholder="Entrenamiento equipo"></div>
    <div class="grid2"><div class="form-row"><label>Tipo</label><select id="s-tipo"><option>entrenamiento</option><option>partido</option><option>gimnasio</option><option>recuperacion</option><option>otro</option></select></div><div class="form-row"><label>Deporte</label><input id="s-deporte" placeholder="Básquet"></div></div>
    <div class="grid2"><div class="form-row"><label>Categoría</label><input id="s-categoria"></div><div class="form-row"><label>Equipo</label><input id="s-equipo"></div></div>
    <button class="btn" id="create-session">Crear sesión</button></div><div id="sessions-list" class="card"><div class="empty">Cargando...</div></div>`);

  $('#create-session').onclick=async()=>{try{
    const btn=$('#create-session'); btn.textContent='Creando...'; btn.disabled=true;
    await Api.createSession({fecha:$('#s-fecha').value,hora_inicio:$('#s-hora').value,titulo:$('#s-titulo').value,tipo_sesion:$('#s-tipo').value,duracion_min:$('#s-duracion').value,deporte:$('#s-deporte').value,categoria:$('#s-categoria').value,equipo:$('#s-equipo').value,creada_por:Auth.current.usuario_id});
    toast('Sesión creada'); Router.render();
  }catch(e){toast(e.message); const btn=$('#create-session'); btn.textContent='Crear sesión'; btn.disabled=false;}};

  const d=await Api.listSessions();
  if(Router.isStale(token)) return;
  $('#sessions-list').innerHTML=`<div class="card-head"><h3 class="card-title">📅 Sesiones</h3><button class="btn small secondary" onclick="syncNow()">Sincronizar</button></div><div class="list">${(d.sessions||[]).map(s=>`<div class="item"><div class="item-main session-open" data-id="${esc(s.sesion_id)}"><div class="item-title">${esc(s.titulo)}${s.jugador_nombre?' · '+esc(s.jugador_nombre):''}</div><div class="item-sub">${dateAR(s.fecha)} ${timeShort(s.hora_inicio)} · ${esc(s.tipo_sesion)} · ${s.duracion_min} min · ${esc(s.estado)}</div></div><div class="item-actions"><span class="pill ${s.estado==='abierta'?'ok':s.estado==='libre'?'warn':'warn'}">${esc(s.estado)}</span><button class="btn small danger delete-btn session-delete" data-id="${esc(s.sesion_id)}" data-title="${esc(s.titulo)}" title="Borrar">🗑️</button></div></div>`).join('') || '<div class="empty">Sin sesiones.</div>'}</div>`;
  $$('.session-open').forEach(el=>el.onclick=()=>Router.go('coach-sessions',{id:el.dataset.id}));
  $$('.session-delete').forEach(btn=>btn.onclick=async(ev)=>{ev.stopPropagation(); await deleteSessionByCoach(btn.dataset.id, btn.dataset.title);});
});

async function deleteSessionByCoach(id, title){
  if(!confirm(`¿Borrar definitivamente la sesión "${title||id}"?\nSe elimina de la app, de la Sheet y también sus reportes asociados.`)) return;
  try{ await Api.deleteSession(id); toast('Sesión borrada'); Router.go('coach-sessions'); }catch(e){ toast(e.message); }
}
async function deleteReportByCoach(id){
  if(!confirm('¿Borrar definitivamente este reporte?\nSe elimina de la app y de la Sheet.')) return;
  try{ await Api.deleteReport(id); toast('Reporte borrado'); Router.render(); }catch(e){ toast(e.message); }
}

async function renderSessionDetail(id, token){
  const d=await Api.sessionDetail(id);
  if(Router.isStale(token)) return;
  const s=d.session || {};
  const reports=d.reports || [];
  setPageContent(`<div class="card">
    <div class="grid2"><button class="btn small secondary" onclick="Router.go('coach-sessions')">← Volver</button><button class="btn small danger" id="delete-session-detail">🗑️ Borrar sesión</button></div>
    <h3 class="card-title">${esc(s.titulo)}</h3>
    <div class="session-detail-grid">
      <div class="item"><div class="item-main"><div class="item-title">Fecha y hora</div><div class="item-sub">${dateAR(s.fecha)} ${timeShort(s.hora_inicio)||''}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Tipo</div><div class="item-sub">${esc(s.tipo_sesion)} · ${esc(s.deporte||'-')}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Duración</div><div class="item-sub">${esc(s.duracion_min)} min</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Estado</div><div class="item-sub">${esc(s.estado)}</div></div><span class="pill ${s.estado==='libre'?'warn':'ok'}">${esc(s.estado)}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Jugador</div><div class="item-sub">${esc(s.jugador_nombre||'-')}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">RPE / UA</div><div class="item-sub">${s.rpe?('RPE '+esc(s.rpe)+' · '+fmt(s.ua)+' UA'):'Sin reporte cargado'}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Comentario</div><div class="item-sub">${esc(s.comentario||'-')}</div></div></div>
    </div>
  </div>
  <div class="card"><h3 class="card-title">Reportes de la sesión</h3>
    ${reports.length ? `<div class="list">${reports.map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.nombre)} ${esc(r.apellido)} · RPE ${esc(r.rpe)}</div><div class="item-sub">${fmt(r.ua)} UA · ${esc(r.comentario||'-')}</div></div><div class="item-actions"><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span><button class="btn small danger delete-btn report-delete" data-id="${esc(r.reporte_id)}" title="Borrar reporte">🗑️</button></div></div>`).join('')}</div>` : '<div class="empty">Sin reportes.</div>'}
  </div>`);
  const del=$('#delete-session-detail'); if(del) del.onclick=()=>deleteSessionByCoach(s.sesion_id, s.titulo);
  $$('.report-delete').forEach(btn=>btn.onclick=async(ev)=>{ev.stopPropagation(); await deleteReportByCoach(btn.dataset.id);});
}
