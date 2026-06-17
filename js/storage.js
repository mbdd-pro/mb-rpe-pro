const Store = {
  get(k, fallback=null){ try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch(e){ return fallback; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem(k); }
};
const SessionStore = {
  key:'mb_rpe_session_v1',
  get(){ return Store.get(this.key,null); },
  set(s){ Store.set(this.key,s); },
  clear(){ Store.del(this.key); }
};
const ThemeStore = {
  key:'mb_rpe_theme_v1',
  get(){ return Store.get(this.key, window.APP_CONFIG.DEFAULT_THEME || 'black'); },
  set(theme){ Store.set(this.key,theme); document.body.dataset.theme=theme; }
};
