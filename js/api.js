const Api = {
  _cache: new Map(),
  _inflight: new Map(),
  _key(action, params={}){
    let uid = 'anon';
    try { if (typeof Auth !== 'undefined' && Auth.current && Auth.current.usuario_id) uid = Auth.current.usuario_id; } catch(e) {}
    return uid + '::' + action + '::' + JSON.stringify(params || {});
  },
  _storageKey(key){ return 'mb_rpe_api_cache__' + key; },
  _readLocal(key, ttl){
    try{
      const raw = localStorage.getItem(this._storageKey(key));
      if(!raw) return null;
      const hit = JSON.parse(raw);
      if(!hit || !hit.t) return null;
      if((Date.now() - hit.t) > ttl) return null;
      return hit.data;
    }catch(e){ return null; }
  },
  _writeLocal(key, data){
    try{ localStorage.setItem(this._storageKey(key), JSON.stringify({t:Date.now(), data})); }catch(e){}
  },
  invalidate(prefix=''){
    if(!prefix){
      this._cache.clear();
      try{ Object.keys(localStorage).forEach(k=>{ if(k.startsWith('mb_rpe_api_cache__')) localStorage.removeItem(k); }); }catch(e){}
      return;
    }
    [...this._cache.keys()].forEach(k=>{ if(k.startsWith(prefix+'::') || k.startsWith(prefix)) this._cache.delete(k); });
    try{
      Object.keys(localStorage).forEach(k=>{
        if(k.startsWith('mb_rpe_api_cache__' + prefix + '::') || k.startsWith('mb_rpe_api_cache__' + prefix)) localStorage.removeItem(k);
      });
    }catch(e){}
  },
  async cached(action, params={}, ttl=86400000){
    const key=this._key(action, params);
    const now=Date.now();
    const mem=this._cache.get(key);
    if(mem && (now-mem.t) < ttl) return mem.data;
    const local=this._readLocal(key, ttl);
    if(local){
      this._cache.set(key,{t:now,data:local});
      return local;
    }
    if(this._inflight.has(key)) return this._inflight.get(key);
    const p=this.request(action, params).then(data=>{
      this._cache.set(key,{t:Date.now(),data});
      this._writeLocal(key,data);
      this._inflight.delete(key);
      return data;
    }).catch(err=>{ this._inflight.delete(key); throw err; });
    this._inflight.set(key,p);
    return p;
  },
  request(action, params={}){
    const base = window.APP_CONFIG.API_URL;
    if(!base || base.includes('PEGAR_AQUI')) return Promise.reject(new Error('Falta configurar API_URL en js/config.js'));
    const cb = `mb_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const url = new URL(base);
    const finalParams = Object.assign({}, params || {});
    try {
      const publicActions = ['ping','setup','login','guestLogin','register'];
      if (!publicActions.includes(action) && typeof Auth !== 'undefined' && Auth.current) {
        if (Auth.current.usuario_id && !finalParams.usuario_id) finalParams.usuario_id = Auth.current.usuario_id;
        if (Auth.current.usuario_id) finalParams.auth_usuario_id = Auth.current.usuario_id;
        if (Auth.current.session_token) finalParams.session_token = Auth.current.session_token;
      }
    } catch(e) {}
    url.searchParams.set('action', action);
    url.searchParams.set('callback', cb);
    url.searchParams.set('_', Date.now());
    Object.entries(finalParams).forEach(([k,v]) => { if(v !== undefined && v !== null) url.searchParams.set(k, String(v)); });
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
  guestLogin(nombre, apellido, device_id){ return this.request('guestLogin',{nombre,apellido,device_id}); },
  async register(data){ const r=await this.request('register', data); this.invalidate(); return r; },
  async createSession(data){ const r=await this.request('createSession', data); this.invalidate(); return r; },
  listSessions(){ return this.cached('listSessions', {}, 86400000); },
  sessionDetail(sesion_id){ return this.cached('sessionDetail',{sesion_id}, 86400000); },
  athleteHome(jugador_id){ return this.cached('athleteHome',{jugador_id}, 86400000); },
  async submitReport(data){ const r=await this.request('submitReport', data); this.invalidate(); return r; },
  async submitFreeReport(data){ const r=await this.request('submitFreeReport', data); this.invalidate(); return r; },
  athleteStats(jugador_id){ return this.cached('athleteStats',{jugador_id}, 86400000); },
  athleteLoadMetrics(jugador_id){ return this.cached('athleteLoadMetrics',{jugador_id}, 86400000); },
  coachDashboard(){ return this.cached('coachDashboard', {}, 86400000); },
  teamLoadOverview(){ return this.cached('teamLoadOverview', {}, 86400000); },
  listPlayers(){ return this.cached('listPlayers', {}, 86400000); },
  comparePlayers(a,b){ return this.cached('comparePlayers',{jugador_a:a,jugador_b:b}, 86400000); },
  playerDetail(jugador_id){ return this.cached('playerDetail',{jugador_id}, 86400000); },
  async updatePlayer(data){ const r=await this.request('updatePlayer', data); this.invalidate(); return r; },
  async updateProfile(data){ const r=await this.request('updateProfile', data); this.invalidate(); return r; },
  async changePassword(data){ const r=await this.request('changePassword', data); this.invalidate(); return r; },
  async closeSession(sesion_id){ const r=await this.request('closeSession',{sesion_id}); this.invalidate(); return r; },
  async deleteSession(sesion_id){ const r=await this.request('deleteSession',{sesion_id}); this.invalidate(); return r; },
  async deleteReport(reporte_id){ const r=await this.request('deleteReport',{reporte_id}); this.invalidate(); return r; }
};
