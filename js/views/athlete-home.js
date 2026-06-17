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
    <div class="card"><h3 class="card-title">📝 Sesiones pendientes</h3>
      ${pending.length ? `<div class="list">${pending.map(s=>sessionCard(s)).join('')}</div>` : `<div class="empty">No tenés sesiones pendientes. Cuando el coach cree una sesión abierta, te va a aparecer acá para cargar el RPE.</div>`}
    </div>
    <div class="card"><h3 class="card-title">📌 Últimos reportes</h3>
      ${(data.recent||[]).length ? `<div class="list">${data.recent.map(r=>`<div class="item"><div class="item-main"><div class="item-title">${esc(r.titulo)} · RPE ${r.rpe}</div><div class="item-sub">${dateAR(r.fecha)} · ${fmt(r.ua)} UA · ${esc(r.comentario||'')}</div></div><span class="pill ${loadZone(r.ua).cls}">${loadZone(r.ua).label}</span></div>`).join('')}</div>` : `<div class="empty">Sin reportes todavía.</div>`}
    </div>`;
  setPageContent(content);
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
