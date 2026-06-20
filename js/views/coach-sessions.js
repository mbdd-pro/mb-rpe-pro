Router.register('coach-sessions', async(params={}, token)=>{
  if(!Auth.isLogged()||!Auth.isCoach()) return Router.go('login');
  const detailId = params && params.id;
  $('#app').innerHTML = basePage('coach-sessions','Sesiones',detailId?'Detalle de sesión':'Crear y administrar sesiones',`<div class="empty">Cargando...</div>`);
  if(detailId) return renderSessionDetail(detailId, token);

  setPageContent(`
    <details class="accordion session-create-accordion">
      <summary>
        <span>➕ Crear nueva sesión</span>
        <span class="summary-hint">Tocar para desplegar</span>
      </summary>
      <div class="accordion-body">
        <div class="grid2">
          <div class="form-row"><label>Fecha</label><input id="s-fecha" type="date" value="${todayISO()}"></div>
          <div class="form-row"><label>Hora</label><input id="s-hora" type="time" value="20:00"></div>
        </div>
        <div class="form-row"><label>Duración min</label><input id="s-duracion" type="number" value="75"></div>
        <div class="form-row"><label>Título</label><input id="s-titulo" placeholder="Entrenamiento equipo"></div>
        <div class="grid2">
          <div class="form-row"><label>Tipo</label><select id="s-tipo"><option>entrenamiento</option><option>partido</option><option>gimnasio</option><option>recuperacion</option><option>otro</option></select></div>
          <div class="form-row"><label>Deporte</label><input id="s-deporte" placeholder="Básquet"></div>
        </div>
        <div class="grid2">
          <div class="form-row"><label>Categoría</label><input id="s-categoria"></div>
          <div class="form-row"><label>Equipo</label><input id="s-equipo"></div>
        </div>
        <button class="btn" id="create-session">Crear sesión</button>
      </div>
    </details>

    <div id="sessions-list" class="sessions-block"><div class="card"><div class="empty">Cargando...</div></div></div>
  `);

  $('#create-session').onclick=async()=>{try{
    const btn=$('#create-session'); btn.textContent='Creando...'; btn.disabled=true;
    await Api.createSession({
      fecha:$('#s-fecha').value,
      hora_inicio:$('#s-hora').value,
      titulo:$('#s-titulo').value,
      tipo_sesion:$('#s-tipo').value,
      duracion_min:$('#s-duracion').value,
      deporte:$('#s-deporte').value,
      categoria:$('#s-categoria').value,
      equipo:$('#s-equipo').value,
      creada_por:Auth.current.usuario_id
    });
    toast('Sesión creada'); Router.render();
  }catch(e){toast(e.message); const btn=$('#create-session'); btn.textContent='Crear sesión'; btn.disabled=false;}};

  const d=await Api.listSessions();
  if(Router.isStale(token)) return;
  renderCoachSessionsList(d.sessions||[]);
});

function renderCoachSessionsList(sessions){
  const oficiales = sessions.filter(s=>String(s.estado||'').toLowerCase() !== 'libre');
  const libres = sessions.filter(s=>String(s.estado||'').toLowerCase() === 'libre');

  const groups = groupOfficialByCoach(oficiales);
  const officialHtml = Object.keys(groups).length
    ? Object.keys(groups).map((key, idx)=>sessionGroupAccordion(coachGroupLabel(key, groups[key]), groups[key], idx===0)).join('')
    : '<div class="empty">Sin sesiones creadas por coach.</div>';

  const freeHtml = libres.length
    ? `<div class="list">${libres.map(coachSessionCard).join('')}</div>`
    : '<div class="empty">Sin sesiones libres.</div>';

  $('#sessions-list').innerHTML = `
    <div class="card-head sessions-main-head">
      <h3 class="card-title">📅 Sesiones</h3>
      <button class="btn small secondary" onclick="syncNow()">Sincronizar</button>
    </div>

    <details class="accordion session-list-accordion" open>
      <summary>
        <span>🏀 Sesiones creadas por coach</span>
        <span class="summary-count">${oficiales.length}</span>
      </summary>
      <div class="accordion-body session-section-body">${officialHtml}</div>
    </details>

    <details class="accordion session-list-accordion">
      <summary>
        <span>🟠 Sesiones libres cargadas por deportistas</span>
        <span class="summary-count">${libres.length}</span>
      </summary>
      <div class="accordion-body session-section-body">${freeHtml}</div>
    </details>
  `;

  $$('.session-open').forEach(el=>el.onclick=()=>Router.go('coach-sessions',{id:el.dataset.id}));
  $$('.session-delete').forEach(btn=>btn.onclick=async(ev)=>{ev.stopPropagation(); await deleteSessionByCoach(btn.dataset.id, btn.dataset.title);});
}

function groupOfficialByCoach(items){
  return items.reduce((acc,s)=>{
    const key = s.creada_por || s.coach_id || 'sin_coach';
    if(!acc[key]) acc[key]=[];
    acc[key].push(s);
    return acc;
  },{});
}

function coachGroupLabel(key, items){
  const first = (items && items[0]) || {};
  const name = first.creada_por_nombre || first.coach_nombre || '';
  if(Auth.current && key === Auth.current.usuario_id) return `Mis sesiones · ${name || ((Auth.current.nombre||'')+' '+(Auth.current.apellido||'')).trim()}`;
  if(name) return `Creadas por ${name}`;
  if(key === 'sin_coach') return 'Coach sin identificar';
  return `Creadas por ${key}`;
}

function sessionGroupAccordion(title, items, open){
  return `<details class="accordion inner-accordion"${open?' open':''}>
    <summary>
      <span>${esc(title)}</span>
      <span class="summary-count">${items.length}</span>
    </summary>
    <div class="accordion-body">
      <div class="list">${items.map(coachSessionCard).join('')}</div>
    </div>
  </details>`;
}

function coachSessionCard(s){
  const estado = String(s.estado||'');
  const isLibre = estado.toLowerCase()==='libre';
  const pillCls = estado==='abierta' ? 'ok' : isLibre ? 'warn' : 'warn';
  const title = s.titulo || (isLibre ? 'Sesión libre' : 'Sesión');
  const jugador = s.jugador_nombre ? ' · '+esc(s.jugador_nombre) : '';
  const creator = !isLibre && (s.creada_por_nombre || s.coach_nombre) ? `Coach: <span class="coach-name">${esc(s.creada_por_nombre || s.coach_nombre)}</span>` : '';
  const meta = [dateAR(s.fecha), timeShort(s.hora_inicio), esc(s.tipo_sesion), `${esc(s.duracion_min)} min`, esc(estado), creator].filter(Boolean).join(' · ');
  return `<div class="item session-card">
    <div class="item-main session-open" data-id="${esc(s.sesion_id)}">
      <div class="item-title">${esc(title)}${jugador}</div>
      <div class="item-sub">${meta}</div>
    </div>
    <div class="item-actions">
      <span class="pill ${pillCls}">${esc(estado)}</span>
      <button class="btn small danger delete-btn session-delete" data-id="${esc(s.sesion_id)}" data-title="${esc(title)}" title="Borrar">🗑️</button>
    </div>
  </div>`;
}



function renderCoachSessionReportDetail(s, r){
  if(!r) return toast('Reporte no encontrado');
  const playerName = `${r.nombre||''} ${r.apellido||''}`.trim() || r.jugador_id || '-';
  $('#page-content').innerHTML = `<div class="card">
    <button class="btn small secondary" onclick="Router.go('coach-sessions',{id:'${esc(s.sesion_id)}'})">← Volver</button>
    <h3 class="card-title">${esc(playerName)} · RPE ${esc(r.rpe)}</h3>
    <div class="session-detail-grid">
      <div class="item"><div class="item-main"><div class="item-title">Sesión</div><div class="item-sub">${esc(s.titulo||r.titulo||'-')}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Fecha y hora</div><div class="item-sub">${dateAR(r.fecha||s.fecha)} ${timeShort(r.hora_inicio||s.hora_inicio)||''}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Jugador</div><div class="item-sub">${esc(playerName)}</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">Tipo / origen</div><div class="item-sub">${esc(r.tipo_sesion||s.tipo_sesion||'-')} · ${sourceLabel(r.estado||r.origen)}</div></div><span class="pill ${String(r.estado||r.origen||'').includes('libre')?'warn':'ok'}">${sourceLabel(r.estado||r.origen)}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Duración</div><div class="item-sub">${esc(r.duracion_min||s.duracion_min||'-')} min</div></div></div>
      <div class="item"><div class="item-main"><div class="item-title">RPE / UA</div><div class="item-sub">RPE ${esc(r.rpe)} · ${fmt(r.ua)} UA</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>
      <div class="item"><div class="item-main"><div class="item-title">Comentario</div><div class="item-sub">${esc(r.comentario||'-')}</div></div></div>
    </div>
    <button class="btn danger" id="delete-report-detail" style="margin-top:12px">🗑️ Borrar reporte</button>
  </div>`;
  const del=$('#delete-report-detail');
  if(del) del.onclick=async()=>{ await deleteReportByCoach(r.reporte_id); };
}


function missingPlayerItem(s,p){
  const name = `${p.nombre||''} ${p.apellido||''}`.trim() || p.jugador_id;
  return `<div class="item"><div class="item-main"><div class="item-title">${esc(name)}</div><div class="item-sub">${esc(p.equipo||'')} · ${esc(p.categoria||'')} · ${esc(p.posicion||'')}</div></div><button class="btn small coach-fill-missing" data-player="${esc(p.jugador_id)}" data-name="${esc(name)}">Cargar por jugador</button></div>`;
}
function renderCoachFillReportForm(s, jugador_id, playerName, backRoute, backParams){
  $('#page-content').innerHTML = `<div class="card"><button class="btn small secondary" id="coach-fill-back">← Volver</button>
    <h3 class="card-title">Cargar RPE por jugador</h3>
    <p class="muted small"><b>${esc(playerName)}</b> · ${esc(s.titulo)} · ${dateAR(s.fecha)} ${timeShort(s.hora_inicio)||''} · ${esc(s.duracion_min)} min</p>
    <label>RPE</label><div class="rpe-grid">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="rpe" data-rpe="${n}">${n}<small>${n<=2?'Fácil':n<=4?'Moderado':n<=6?'Duro':n<=8?'Muy duro':'Máx.'}</small></button>`).join('')}</div>
    <input id="coach-rpe-selected" type="hidden">
    <div class="form-row" style="margin-top:12px"><label>Comentario opcional</label><textarea id="coach-comentario" placeholder="Cargado por el coach"></textarea></div>
    <button class="btn" id="coach-save-report">Guardar reporte</button>
  </div>`;
  const goBack=()=>Router.go(backRoute, backParams||{});
  $('#coach-fill-back').onclick=goBack;
  $$('.rpe').forEach(b=>b.onclick=()=>{$$('.rpe').forEach(x=>x.classList.remove('active')); b.classList.add('active'); $('#coach-rpe-selected').value=b.dataset.rpe;});
  $('#coach-save-report').onclick=async()=>{try{
    const rpe=$('#coach-rpe-selected').value; if(!rpe) return toast('Elegí RPE');
    const btn=$('#coach-save-report'); btn.textContent='Guardando...'; btn.disabled=true;
    await Api.coachSubmitReport({sesion_id:s.sesion_id,jugador_id,rpe,comentario:$('#coach-comentario').value});
    btn.textContent='Guardado ✅'; toast('Reporte cargado por coach'); setTimeout(goBack,350);
  }catch(e){toast(e.message); const btn=$('#coach-save-report'); if(btn){btn.textContent='Guardar reporte'; btn.disabled=false;}}};
}


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
  const missing=d.missing_players || [];
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
    ${reports.length ? `<div class="list">${reports.map((r,i)=>`<div class="item clickable" onclick="window.openCoachSessionReportDetail(${i})"><div class="item-main"><div class="item-title">${esc(r.nombre)} ${esc(r.apellido)} · RPE ${esc(r.rpe)}</div><div class="item-sub">${fmt(r.ua)} UA · ${esc(r.comentario||'-')}</div></div><div class="item-actions"><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span><button class="btn small danger delete-btn report-delete" data-id="${esc(r.reporte_id)}" onclick="event.stopPropagation()" title="Borrar reporte">🗑️</button></div></div>`).join('')}</div>` : '<div class="empty">Sin reportes.</div>'}
  </div>
  <div class="card"><h3 class="card-title">Faltan completar</h3>
    ${missing.length ? `<div class="list">${missing.map(p=>missingPlayerItem(s,p)).join('')}</div>` : '<div class="empty">Todos los jugadores activos ya completaron esta sesión.</div>'}
  </div>`);
  window.__coachSessionDetail = s;
  window.__coachSessionReports = reports;
  window.openCoachSessionReportDetail = function(i){ renderCoachSessionReportDetail(window.__coachSessionDetail, (window.__coachSessionReports||[])[Number(i)]); };
  const del=$('#delete-session-detail'); if(del) del.onclick=()=>deleteSessionByCoach(s.sesion_id, s.titulo);
  $$('.report-delete').forEach(btn=>btn.onclick=async(ev)=>{ev.stopPropagation(); await deleteReportByCoach(btn.dataset.id);});
  $$('.coach-fill-missing').forEach(btn=>btn.onclick=()=>renderCoachFillReportForm(s, btn.dataset.player, btn.dataset.name, 'coach-sessions', {id:s.sesion_id}));
}
