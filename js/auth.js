const Auth = {
  current:null,
  init(){ this.current = SessionStore.get(); return this.current; },
  isLogged(){ return !!this.current; },
  isCoach(){ return this.current && ['admin','coach'].includes(this.current.rol); },
  async login(usuario,password){
    const device_id = Store.get('mb_rpe_device_id') || uid('dev');
    Store.set('mb_rpe_device_id', device_id);
    const res = await Api.login(usuario,password,device_id);
    this.current = res.user;
    SessionStore.set(res.user);
    ThemeStore.set(res.user.tema || ThemeStore.get());
    return res.user;
  },
  logout(){ this.current=null; SessionStore.clear(); Router.go('login'); },
  setSession(user){ this.current=user; SessionStore.set(user); }
};
