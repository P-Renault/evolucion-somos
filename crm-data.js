// Somos Software CRM B9.4 — backend adapter.
// Supabase se activa únicamente cuando supabase-config.js tiene enabled:true.
// Nunca usar service_role key en este archivo ni en GitHub Pages.
const localKey = 'somos_leads_pending';
const cfg = window.SOMOS_SUPABASE || {enabled:false};

let sb = null;
let authUser = null;
const listeners = new Set();

function notify(){ listeners.forEach(fn=>{try{fn({authenticated:!!authUser,email:authUser?.email||'',mode:sb?'supabase':'local'})}catch(e){}}); }

async function initSupabase(){
  if(!cfg.enabled || !cfg.url || !cfg.anonKey || cfg.anonKey.includes('YOUR_')) return false;
  try{
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = mod.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await sb.auth.getSession();
    authUser=data.session?.user||null;
    sb.auth.onAuthStateChange((_event,session)=>{authUser=session?.user||null;notify();});
    notify(); return true;
  }catch(e){ console.warn('Supabase no disponible; usando modo local.',e); sb=null; notify(); return false; }
}

export const CRMStore={
  authenticated:false, requiresLogin:false, mode:'local',
  onStateChange:null,
  async init(){const ok=await initSupabase();this.mode=ok?'supabase':'local';this.authenticated=!!authUser;this.requiresLogin=ok;notify();},
  async login(email,password){
    if(!sb) return {ok:true};
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error)return {ok:false,error:error.message};
    authUser=data.user;this.authenticated=true;notify();return {ok:true};
  },
  async logout(){if(sb)await sb.auth.signOut();authUser=null;this.authenticated=false;notify();},
  async list(){
    if(!sb||!authUser)return [];
    const {data,error}=await sb.from('leads').select('*').order('created_at',{ascending:false});
    if(error){console.error(error);return []} return data||[];
  },
  async upsert(lead){
    if(!sb||!authUser)return null;
    const payload={...lead,external_id:lead.external_id||lead.id,state:lead.state||lead.status||'Nuevo',next_date:lead.next_date||lead.next_action_date||null};
    delete payload.id; delete payload.status; delete payload.next_action_date;
    const {data,error}=await sb.from('leads').upsert(payload,{onConflict:'external_id'}).select().single();
    if(error){console.error(error);alert('No fue posible guardar en Supabase: '+error.message);return null}
    return data;
  },
  async importMany(items){
    if(!sb||!authUser)return false;
    const payload=items.map(x=>{const y={...x,external_id:x.external_id||x.id,state:x.state||x.status||'Nuevo',next_date:x.next_date||x.next_action_date||null};delete y.id;delete y.status;delete y.next_action_date;return y});
    const {error}=await sb.from('leads').upsert(payload,{onConflict:'external_id'});
    if(error){console.error(error);return false} return true;
  }
};
Object.defineProperty(CRMStore,'authenticated',{get:()=>!!authUser});
Object.defineProperty(CRMStore,'requiresLogin',{get:()=>!!sb});
Object.defineProperty(CRMStore,'mode',{get:()=>sb?'supabase':'local'});
CRMStore.onStateChange = null;
listeners.add(state=>{if(typeof CRMStore.onStateChange==='function')CRMStore.onStateChange(state)});
