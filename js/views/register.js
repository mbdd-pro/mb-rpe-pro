Router.register('register', async () => {
  $('#app').innerHTML = `<main class="page">
    <div class="header">${brandIcon('header-logo')}<div><div class="header-title">Crear cuenta</div><div class="header-sub">Deportista · RPE Pro</div></div></div>
    <div class="card">
      <div class="grid2">
        <div class="form-row"><label>Nombre</label><input id="r-nombre"></div>
        <div class="form-row"><label>Apellido</label><input id="r-apellido"></div>
      </div>
      <div class="form-row"><label>Email</label><input id="r-email" type="email"></div>
      <div class="grid2">
        <div class="form-row"><label>Usuario</label><input id="r-usuario" placeholder="juanperez"></div>
        <div class="form-row"><label>Contraseña/PIN</label><input id="r-pass" type="password"></div>
      </div>
      <div class="grid2">
        <div class="form-row"><label>Deporte</label><input id="r-deporte" placeholder="Básquet"></div>
        <div class="form-row"><label>Categoría</label><input id="r-categoria" placeholder="U17 / Primera"></div>
      </div>
      <div class="grid2">
        <div class="form-row"><label>Equipo</label><input id="r-equipo"></div>
        <div class="form-row"><label>Posición</label><input id="r-posicion"></div>
      </div>
      <button class="btn" id="btn-register">Crear cuenta</button>
      <button class="btn secondary" style="margin-top:8px" onclick="Router.go('login')">Volver al login</button>
    </div>
  </main>`;
  $('#btn-register').onclick=async()=>{
    try{
      const data={nombre:$('#r-nombre').value,apellido:$('#r-apellido').value,email:$('#r-email').value,usuario:$('#r-usuario').value,password:$('#r-pass').value,deporte:$('#r-deporte').value,categoria:$('#r-categoria').value,equipo:$('#r-equipo').value,posicion:$('#r-posicion').value};
      if(!data.nombre||!data.apellido||!data.usuario||!data.password) return toast('Faltan datos básicos');
      $('#btn-register').textContent='Creando...';
      await Api.register(data); toast('Cuenta creada. Ya podés ingresar.'); Router.go('login');
    }catch(e){ toast(e.message); $('#btn-register').textContent='Crear cuenta'; }
  };
});
