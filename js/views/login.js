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
      <div class="card">
        <h2 class="card-title">🔐 Iniciar sesión</h2>
        <div class="form-row"><label>Usuario o email</label><input id="login-user" autocomplete="username" placeholder="admin" /></div>
        <div class="form-row"><label>Contraseña / PIN</label><input id="login-pass" type="password" autocomplete="current-password" placeholder="1234" /></div>
        <button class="btn" id="btn-login">Ingresar</button>
        <button class="btn secondary" style="margin-top:8px" onclick="Router.go('register')">Crear cuenta de deportista</button>
        <div class="small muted" style="margin-top:12px">Admin inicial: <b>admin</b> / <b>1234</b>. Cambiar después.<div class="login-version">v${window.APP_CONFIG.VERSION} · <span class="brand-by-pancko">By Pancko</span></div></div>
      </div>
      <div class="theme-toggle" style="width:max-content;margin:14px auto 0">
        <button data-theme-btn="black">Black</button><button data-theme-btn="clean">Clean</button>
      </div>
    </section>
  </main>`;
  setupThemeButtons();
  $('#btn-login').onclick = async () => {
    try{
      const u=$('#login-user').value.trim(); const p=$('#login-pass').value.trim();
      if(!u||!p) return toast('Completá usuario y clave');
      $('#btn-login').textContent='Ingresando...';
      const user=await Auth.login(u,p);
      toast('Bienvenido/a');
      Router.go(['admin','coach'].includes(user.rol)?'coach':'athlete');
    }catch(e){ toast(e.message); $('#btn-login').textContent='Ingresar'; }
  };
});
function setupThemeButtons(){
  const theme=ThemeStore.get(); document.body.dataset.theme=theme;
  $$('[data-theme-btn]').forEach(b=>{ b.classList.toggle('active', b.dataset.themeBtn===theme); b.onclick=()=>{ThemeStore.set(b.dataset.themeBtn); setupThemeButtons();}; });
}
