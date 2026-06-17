
const Router = {
  routes:{},
  rendering:0,
  isStale(token){ return token && token !== this.rendering; },
  register(name, fn){ this.routes[name]=fn; },
  go(name, params={}){ location.hash = name + (Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''); },
  current(){ const raw=location.hash.replace('#','') || 'auto'; const [name, qs=''] = raw.split('?'); return {name, params:Object.fromEntries(new URLSearchParams(qs))}; },
  async render(){
    const token=++this.rendering;
    const {name,params}=this.current();
    if(name==='auto') return this.go(Auth.isLogged() ? (Auth.isCoach()?'coach':'athlete') : 'login');
    const view=this.routes[name] || this.routes.login;
    try { await view(params, token); }
    catch(e){
      if(token !== this.rendering) return;
      console.error(e);
      toast(e.message || 'Error');
      const pc=$('#page-content');
      if(pc) pc.innerHTML = `<div class="card"><h3 class="card-title">⚠️ No se pudo cargar</h3><p class="muted">${esc(e.message || 'Error inesperado')}</p><button class="btn secondary" onclick="Router.render()">Reintentar</button></div>`;
      if(!Auth.isLogged() && name!=='login' && name!=='register') this.go('login');
    }
  }
};
window.addEventListener('hashchange',()=>Router.render());
