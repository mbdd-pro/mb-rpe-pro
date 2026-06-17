const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (v='') => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid = (prefix='id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2300); }
function initials(a='',b=''){return ((a[0]||'')+(b[0]||'')).toUpperCase() || 'MB'}
function fmt(n){ return Math.round(Number(n||0)).toLocaleString('es-AR'); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function dateAR(iso){ if(!iso) return ''; const [y,m,d]=String(iso).slice(0,10).split('-'); return `${d}/${m}/${y}`; }
function loadZone(ua){ ua=Number(ua||0); if(ua>=600) return {label:'Alta', cls:'danger'}; if(ua>=300) return {label:'Moderada', cls:'warn'}; return {label:'Baja', cls:'ok'}; }
function rpeZone(rpe){ rpe=Number(rpe||0); if(rpe>=8) return {label:'RPE alto', cls:'danger'}; if(rpe>=6) return {label:'Duro', cls:'warn'}; return {label:'Controlado', cls:'ok'}; }
