Router.register('login', async () => {
  const app=$('#app');
  app.innerHTML = `
  <main class="login-wrap">
    <section class="login-card">
      <div class="login-brand">
        ${brandIcon('brand-logo-lg')}
        <h1 class="brand-name">Matías Burrieza</h1>
        <p>Desarrollo Deportivo · RPE Pro</p>
      </div>

      <div class="login-options">
        <button class="login-option active" id="show-login">🔐 Iniciar sesión</button>
        <button class="login-option" id="show-guest">⚡ Invitado</button>
      </div>

      <div class="card" id="login-panel">
        <h2 class="card-title">Iniciar sesión</h2>
        <div class="form-row"><label>Usuario o email</label><input id="login-user" autocomplete="username" placeholder="Usuario o email" /></div>
        <div class="form-row"><label>Contraseña / PIN</label><input id="login-pass" type="password" autocomplete="current-password" placeholder="Contraseña / PIN" /></div>
        <button class="btn" id="btn-login">Ingresar</button>
      </div>

      <div class="card" id="guest-panel" hidden>
        <h2 class="card-title">Ingresar como invitado</h2>
        <p class="small muted">Modo rápido para cargar una sesión libre sin cuenta.</p>
        <div class="grid2">
          <div class="form-row"><label>Nombre</label><input id="guest-name" placeholder="Nombre"></div>
          <div class="form-row"><label>Apellido</label><input id="guest-surname" placeholder="Apellido"></div>
        </div>
        <button class="btn" id="btn-guest">Continuar como invitado</button>
      </div>

      <button class="btn secondary" style="margin-top:10px" onclick="Router.go('register')">Crear cuenta de deportista</button>
      <div class="login-version">v${window.APP_CONFIG.VERSION} · <span class="brand-by-pancko">By Pancko</span></div>

      <div class="theme-toggle" style="width:max-content;margin:14px auto 0">
        <button data-theme-btn="black">Black</button><button data-theme-btn="clean">Clean</button>
      </div>
    </section>
  </main>`;

  setupThemeButtons();

  $('#show-login').onclick = () => {
    $('#login-panel').hidden=false; $('#guest-panel').hidden=true;
    $('#show-login').classList.add('active'); $('#show-guest').classList.remove('active');
  };
  $('#show-guest').onclick = () => {
    $('#login-panel').hidden=true; $('#guest-panel').hidden=false;
    $('#show-login').classList.remove('active'); $('#show-guest').classList.add('active');
  };

  $('#btn-guest').onclick = async () => {
    const btn=$('#btn-guest');
    try{
      const n=$('#guest-name').value.trim(); const a=$('#guest-surname').value.trim();
      if(!n) return toast('Escribí al menos el nombre');
      btn.textContent='Ingresando...'; btn.disabled=true;
      const user=await Auth.guestLogin(n,a);
      toast('Ingresaste como invitado');
      Router.go('athlete');
    }catch(e){ toast(e.message); btn.textContent='Continuar como invitado'; btn.disabled=false; }
  };

  $('#btn-login').onclick = async () => {
    const btn=$('#btn-login');
    try{
      const u=$('#login-user').value.trim(); const p=$('#login-pass').value.trim();
      if(!u||!p) return toast('Completá usuario y clave');
      btn.textContent='Ingresando...'; btn.disabled=true;
      const user=await Auth.login(u,p);
      toast('Bienvenido/a');
      Router.go(['admin','coach'].includes(String(user.rol || '').trim().toLowerCase())?'coach':'athlete');
    }catch(e){ toast(e.message); btn.textContent='Ingresar'; btn.disabled=false; }
  };
});

function setupThemeButtons(){
  const theme=ThemeStore.get(); document.body.dataset.theme=theme;
  $$('[data-theme-btn]').forEach(b=>{ b.classList.toggle('active', b.dataset.themeBtn===theme); b.onclick=()=>{ThemeStore.set(b.dataset.themeBtn); setupThemeButtons();}; });
}
