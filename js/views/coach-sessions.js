Router.register('coach-sessions', async()=>{
  if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
  $('#app').innerHTML = basePage('coach-sessions','Sesiones','Crear y administrar sesiones',`<div class="card"><h3 class="card-title">➕ Nueva sesión</h3>
    <div class="grid2"><div class="form-row"><label>Fecha</label><input id="s-fecha" type="date" value="${todayISO()}"></div><div class="form-row"><label>Duración min</label><input id="s-duracion" type="number" value="75"></div></div>
    <div class="form-row"><label>Título</label><input id="s-titulo" placeholder="Entrenamiento equipo"></div>
    <div class="grid2"><div class="form-row"><label>Tipo</label><select id="s-tipo"><option>entrenamiento</option><option>partido</option><option>gimnasio</option><option>recuperacion</option><option>otro</option></select></div><div class="form-row"><label>Deporte</label><input id="s-deporte" placeholder="Básquet"></div></div>
    <div class="grid2"><div class="form-row"><label>Categoría</label><input id="s-categoria"></div><div class="form-row"><label>Equipo</label><input id="s-equipo"></div></div>
    <button class="btn" id="create-session">Crear sesión</button></div><div id="sessions-list" class="card"><div class="empty">Cargando...</div></div>`);
  $('#create-session').onclick=async()=>{try{await Api.createSession({fecha:$('#s-fecha').value,titulo:$('#s-titulo').value,tipo_sesion:$('#s-tipo').value,duracion_min:$('#s-duracion').value,deporte:$('#s-deporte').value,categoria:$('#s-categoria').value,equipo:$('#s-equipo').value,creada_por:Auth.current.usuario_id}); toast('Sesión creada'); Router.render();}catch(e){toast(e.message)}};
  const d=await Api.listSessions();
  $('#sessions-list').innerHTML=`<div class="card-head"><h3 class="card-title">📅 Sesiones</h3><button class="btn small secondary" onclick="syncNow()">Sincronizar</button></div><div class="list">${(d.sessions||[]).map(s=>`<div class="item"><div class="item-main"><div class="item-title">${esc(s.titulo)}</div><div class="item-sub">${dateAR(s.fecha)} · ${esc(s.tipo_sesion)} · ${s.duracion_min} min · ${esc(s.estado)}</div></div><span class="pill ${s.estado==='abierta'?'ok':'warn'}">${esc(s.estado)}</span></div>`).join('') || '<div class="empty">Sin sesiones.</div>'}</div>`;
});
