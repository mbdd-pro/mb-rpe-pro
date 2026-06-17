const Router = {
  routes:{},
  register(name, fn){ this.routes[name]=fn; },
  go(name, params={}){ location.hash = name + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''); },
  current(){ const raw=location.hash.replace('#','') || 'auto'; const [name, qs=''] = raw.split('?'); return {name, params:Object.fromEntries(new URLSearchParams(qs))}; },
  async render(){
    const {name,params}=this.current();
    if(name==='auto') return this.go(Auth.isLogged() ? (Auth.isCoach()?'coach':'athlete') : 'login');
    const view=this.routes[name] || this.routes.login;
    try { await view(params); } catch(e){ console.error(e); toast(e.message || 'Error'); if(name!=='login') this.go('login'); }
  }
};
window.addEventListener('hashchange',()=>Router.render());
