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
  $('#sessions-list').innerHTML=`<div class="card-head"><h3 class="card-title">📅 Sesiones</h3><button class="btn small secondary" onclick="syncNow()">Sincronizar</button></div><div class="list">${(d.sessions||[]).map(s=>`<div class="item session-open" data-id="${esc(s.sesion_id)}"><div class="item-main"><div class="item-title">${esc(s.titulo)}</div><div class="item-sub">${dateAR(s.fecha)} ${timeShort(s.hora_inicio)} · ${esc(s.tipo_sesion)} · ${s.duracion_min} min · ${esc(s.estado)}</div></div><span class="pill ${s.estado==='abierta'?'ok':s.estado==='libre'?'warn':'warn'}">${esc(s.estado)}</span></div>`).join('') || '<div class="empty">Sin sesiones.</div>'}</div>`;
  $$('.session-open').forEach(el=>el.onclick=()=>Router.go('coach-sessions',{id:el.dataset.id}));
});

async function renderSessionDetail(id, token){
  const d=await Api.listSessions();
  if(Router.isStale(token)) return;
  const s=(d.sessions||[]).find(x=>x.sesion_id===id);
  if(!s) return setPageContent(`<div class="card"><button class="btn secondary" onclick="Router.go('coach-sessions')">← Volver</button><div class="empty">Sesión no encontrada</div></div>`);
  setPageContent(`<div class="card">
    <button class="btn small secondary" onclick="Router.go('coach-sessions')">← Volver</button>
    <h3 class="card-title">${esc(s.titulo)}</h3>
    <div class="session-detail-grid">
      <div class="item"><div class="item-main"><div class="item-title">Fecha y hora</div><div class="item-sub">${dateAR(s.fecha)} ${timeShort(s.hora_inicio)||''}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Tipo</div><div class="item-sub">${esc(s.tipo_sesion)} · ${esc(s.deporte||'')}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Duración</div><div class="item-sub">${esc(s.duracion_min)} min</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Estado</div><div class="item-sub">${esc(s.estado)}</div></div><span class="pill ${s.estado==='libre'?'warn':'ok'}">${esc(s.estado)}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Categoría / Equipo</div><div class="item-sub">${esc(s.categoria||'-')} · ${esc(s.equipo||'-')}</div></div></div>
    </div>
  </div>`);
}
