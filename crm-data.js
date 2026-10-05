// Somos Software CRM B9.4.7 — Supabase Auth + sesión persistente.
// Nunca usar service_role/secret key en frontend.
const localKey = 'somos_leads_pending';
const cfg = window.SOMOS_SUPABASE || {enabled:false};

let sb = null;
let authUser = null;
let authReady = false;
const listeners = new Set();

function notify(){
  const state = {
    authenticated: !!authUser,
    email: authUser?.email || '',
    mode: sb ? 'supabase' : 'local'
  };
  listeners.forEach(fn=>{ try { fn(state); } catch(e){ console.error('CRMStore listener:', e); } });
}

function makePersistentStorage(){
  return {
    getItem(key){ try { return localStorage.getItem(key); } catch(e){ return null; } },
    setItem(key,value){ try { localStorage.setItem(key,value); } catch(e){} },
    removeItem(key){ try { localStorage.removeItem(key); } catch(e){} }
  };
}

async function initSupabase(){
  if(!cfg.enabled || !cfg.url || !cfg.anonKey || cfg.anonKey.includes('YOUR_')) return false;
  try{
    let createClient = window.supabase?.createClient;
    if(!createClient){
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      createClient = mod.createClient;
    }
    if(typeof createClient !== 'function') throw new Error('No se encontró createClient de Supabase.');

    sb = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: makePersistentStorage()
      }
    });

    window.__SOMOS_SUPABASE_CLIENT__ = sb;

    const {data, error} = await sb.auth.getSession();
    if(error) throw error;
    authUser = data?.session?.user || null;

    sb.auth.onAuthStateChange((_event, session)=>{
      authUser = session?.user || null;
      notify();
    });

    authReady = true;
    notify();
    return true;
  }catch(e){
    console.error('Supabase init error:', e);
    sb = null;
    authReady = false;
    notify();
    return false;
  }
}

export const CRMStore = {
  async init(){
    await initSupabase();
    notify();
    return !!sb;
  },

  async login(email,password){
    if(!sb) return {ok:false,error:'Supabase no está disponible. Recarga la página e inténtalo nuevamente.'};
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error) return {ok:false,error:error.message,code:error.code||'',status:error.status||0};
    authUser=data?.user||null;
    notify();
    return {ok:true};
  },

  async signUp(email,password){
    if(!sb) return {ok:false,error:'Supabase no está disponible. Recarga la página e inténtalo nuevamente.'};
    const redirectTo = window.location.href.split('#')[0];
    const {data,error}=await sb.auth.signUp({
      email,
      password,
      options:{ emailRedirectTo: redirectTo }
    });
    if(error) return {ok:false,error:error.message,code:error.code||'',status:error.status||0};

    authUser=data?.session?.user || null;
    notify();
    return {
      ok:true,
      confirmed:!!data?.session,
      user:data?.user || null,
      emailConfirmationRequired:!data?.session && !!data?.user,
      confirmationSentAt:data?.user?.confirmation_sent_at || null
    };
  },

  async logout(){
    if(sb){
      const {error}=await sb.auth.signOut({scope:'local'});
      if(error) console.warn('Supabase signOut:', error);
    }
    authUser=null;
    notify();
  },

  async list(){
    if(!sb || !authUser) return [];
    const {data,error}=await sb.from('leads').select('*').order('created_at',{ascending:false});
    if(error){ console.error('Supabase leads:',error); return []; }
    return data||[];
  },

  async upsert(lead){
    if(!sb || !authUser) return null;
    const payload={...lead,external_id:lead.external_id||lead.id,state:lead.state||lead.status||'Nuevo',next_date:lead.next_date||lead.next_action_date||null};
    delete payload.id;
    delete payload.status;
    delete payload.next_action_date;
    const {data,error}=await sb.from('leads').upsert(payload,{onConflict:'external_id'}).select().single();
    if(error){ console.error(error); alert('No fue posible guardar en Supabase: '+error.message); return null; }
    return data;
  },

  async importMany(items){
    if(!sb || !authUser) return false;
    const payload=items.map(x=>{
      const y={...x,external_id:x.external_id||x.id,state:x.state||x.status||'Nuevo',next_date:x.next_date||x.next_action_date||null};
      delete y.id; delete y.status; delete y.next_action_date;
      return y;
    });
    const {error}=await sb.from('leads').upsert(payload,{onConflict:'external_id'});
    if(error){ console.error(error); return false; }
    return true;
  },

  get authenticated(){ return !!authUser; },
  get requiresLogin(){ return !!sb; },
  get mode(){ return sb ? 'supabase' : 'local'; },
  get ready(){ return authReady; },
  onStateChange:null
};

listeners.add(state=>{
  if(typeof CRMStore.onStateChange==='function') CRMStore.onStateChange(state);
});
