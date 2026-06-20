
const Api = {
  _cache: new Map(),
  _inflight: new Map(),
  _key(action, params={}){ return action + '::' + JSON.stringify(params || {}); },
  invalidate(prefix=''){
    if(!prefix){ this._cache.clear(); return; }
    [...this._cache.keys()].forEach(k=>{ if(k.startsWith(prefix+'::') || k.startsWith(prefix)) this._cache.delete(k); });
  },
  async cached(action, params={}, ttl=60000){
    const key=this._key(action, params);
    const now=Date.now();
    const hit=this._cache.get(key);
    if(hit && (now-hit.t) < ttl) return hit.data;
    if(this._inflight.has(key)) return this._inflight.get(key);
    const p=this.request(action, params).then(data=>{ this._cache.set(key,{t:Date.now(),data}); this._inflight.delete(key); return data; }).catch(err=>{ this._inflight.delete(key); throw err; });
    this._inflight.set(key,p);
    return p;
  },
  request(action, params={}){
    const base = window.APP_CONFIG.API_URL;
    if(!base || base.includes('PEGAR_AQUI')) return Promise.reject(new Error('Falta configurar API_URL en js/config.js'));
    const cb = `mb_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = new URL(base);
    url.searchParams.set('action', action);
    url.searchParams.set('callback', cb);
    url.searchParams.set('_', Date.now());
    Object.entries(params).forEach(([k,v]) => { if(v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      const timer=setTimeout(()=>{ cleanup(); reject(new Error('Timeout leyendo API')); }, 22000);
      function cleanup(){ clearTimeout(timer); delete window[cb]; s.remove(); }
      window[cb] = data => { cleanup(); data && data.ok === false ? reject(new Error(data.error || 'Error API')) : resolve(data); };
      s.onerror=()=>{ cleanup(); reject(new Error('No se pudo conectar con API')); };
      s.src=url.toString();
      document.body.appendChild(s);
    });
  },
  ping(){ return this.request('ping'); },
  setup(){ return this.request('setup'); },
  login(usuario, password, device_id){ return this.request('login',{usuario,password,device_id}); },
  async register(data){ const r=await this.request('register', data); this.invalidate(); return r; },
  async createSession(data){ const r=await this.request('createSession', data); this.invalidate(); return r; },
  listSessions(){ return this.cached('listSessions', {}, 60000); },
  athleteHome(jugador_id){ return this.cached('athleteHome',{jugador_id}, 45000); },
  async submitReport(data){ const r=await this.request('submitReport', data); this.invalidate(); return r; },
  athleteStats(jugador_id){ return this.cached('athleteStats',{jugador_id}, 60000); },
  coachDashboard(){ return this.cached('coachDashboard', {}, 45000); },
  listPlayers(){ return this.cached('listPlayers', {}, 90000); },
  comparePlayers(a,b){ return this.cached('comparePlayers',{jugador_a:a,jugador_b:b}, 60000); },
  async closeSession(sesion_id){ const r=await this.request('closeSession',{sesion_id}); this.invalidate(); return r; }
};
