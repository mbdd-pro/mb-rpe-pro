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

function setPageContent(html){
  const el = $('#page-content');
  if(!el) return false;
  el.innerHTML = html;
  return true;
}
function brandIcon(cls=''){
  return `<img class="brand-icon ${cls}" src="assets/logo/brand-dark-192.png" alt="MB">`;
}

function timeShort(v){ if(!v) return ''; const x=String(v); return x.includes(':') ? x.slice(0,5) : x; }
function sourceLabel(status){ return String(status||'').toLowerCase().includes('libre') ? 'Libre' : 'Oficial'; }

function formatDateInput(v){
  if(!v) return '';
  const s=String(v).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){ const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; }
  if(/^\d{8}$/.test(s)){ return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`; }
  return s;
}
function parseDateInput(v){
  const s=String(v||'').replace(/\D/g,'');
  if(s.length===8){ const d=s.slice(0,2), m=s.slice(2,4), y=s.slice(4,8); return `${y}-${m}-${d}`; }
  return String(v||'');
}
function setupDateMask(sel){
  const el=$(sel); if(!el) return;
  el.addEventListener('input', ()=>{ let v=el.value.replace(/\D/g,'').slice(0,8); if(v.length>4) v=v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4); else if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); el.value=v; });
}
function sourceLabel(status){ return String(status||'').toLowerCase().includes('libre') ? 'Libre' : 'Oficial'; }

// v1.0.7 helpers
function formatDateInput(v){
  if(!v) return '';
  let s=String(v).trim();
  if(s.includes(' ')) s=s.split(' ')[0];
  if(/^\d{4}-\d{2}-\d{2}/.test(s)){ const [y,m,d]=s.slice(0,10).split('-'); return `${d}/${m}/${y}`; }
  if(/^\d{8}$/.test(s)){ return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`; }
  return s;
}
function parseDateInput(v){
  const s=String(v||'').replace(/\D/g,'');
  if(s.length===8){ const d=s.slice(0,2), m=s.slice(2,4), y=s.slice(4,8); return `${y}-${m}-${d}`; }
  return String(v||'').split(' ')[0];
}
function setupDateMask(sel){
  const el=$(sel); if(!el) return;
  el.addEventListener('input', ()=>{
    let v=el.value.replace(/\D/g,'').slice(0,8);
    if(v.length>4) v=v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4);
    else if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2);
    el.value=v;
  });
}
function setupDecimalComma(sel){
  const el=$(sel); if(!el) return;
  el.value = String(el.value||'').replace('.', ',');
  el.addEventListener('input', ()=>{ el.value = el.value.replace('.', ','); });
}
function normalizeDecimal(v){ return String(v||'').replace('.', ','); }
function sourceLabel(status){ return String(status||'').toLowerCase().includes('libre') ? 'Libre' : 'Oficial'; }
