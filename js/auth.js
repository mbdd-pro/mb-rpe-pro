const Auth = {
  current:null,
  init(){
    this.current = SessionStore.get();
    if (this.current && !this.current.session_token) {
      this.current = null;
      SessionStore.clear();
    }
    if (this.current && this.current.rol) this.current.rol = String(this.current.rol).trim().toLowerCase();
    return this.current;
  },
  isLogged(){ return !!this.current; },
  isCoach(){ return this.current && ['admin','coach'].includes(String(this.current.rol || '').trim().toLowerCase()); },
  async login(usuario,password){
    Api.invalidate();
    const device_id = Store.get('mb_rpe_device_id') || uid('dev');
    Store.set('mb_rpe_device_id', device_id);
    const res = await Api.login(usuario,password,device_id);
    const user = normalizeUser(res.user);
    if (res.session_token) user.session_token = res.session_token;
    this.current = user;
    SessionStore.set(user);
    ThemeStore.set(user.tema || ThemeStore.get());
    Api.invalidate();
    return user;
  },

  async guestLogin(nombre, apellido){
    Api.invalidate();
    const device_id = Store.get('mb_rpe_device_id') || uid('dev');
    Store.set('mb_rpe_device_id', device_id);
    const res = await Api.guestLogin(nombre, apellido, device_id);
    const user = normalizeUser(res.user);
    if (res.session_token) user.session_token = res.session_token;
    this.current = user;
    SessionStore.set(user);
    ThemeStore.set(user.tema || ThemeStore.get());
    Api.invalidate();
    return user;
  },
  logout(){ this.current=null; SessionStore.clear(); Api.invalidate(); Router.go('login'); },
  setSession(user){ this.current=normalizeUser(user); SessionStore.set(this.current); }
};
function normalizeUser(user){
  user = user || {};
  user.rol = String(user.rol || '').trim().toLowerCase();
  if (['admin','coach'].includes(user.rol)) user.jugador_id = '';
  return user;
}
