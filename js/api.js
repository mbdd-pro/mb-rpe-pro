const Api = {
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
      const timer=setTimeout(()=>{ cleanup(); reject(new Error('Timeout leyendo API')); }, 18000);
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
  register(data){ return this.request('register', data); },
  createSession(data){ return this.request('createSession', data); },
  listSessions(){ return this.request('listSessions'); },
  athleteHome(jugador_id){ return this.request('athleteHome',{jugador_id}); },
  submitReport(data){ return this.request('submitReport', data); },
  athleteStats(jugador_id){ return this.request('athleteStats',{jugador_id}); },
  coachDashboard(){ return this.request('coachDashboard'); },
  listPlayers(){ return this.request('listPlayers'); },
  comparePlayers(a,b){ return this.request('comparePlayers',{jugador_a:a,jugador_b:b}); },
  closeSession(sesion_id){ return this.request('closeSession',{sesion_id}); }
};
