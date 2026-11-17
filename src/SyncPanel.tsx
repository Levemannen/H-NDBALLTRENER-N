import {useEffect,useRef,useState} from 'react';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {downloadJSON,parseWorkspace,type Workspace} from './workspace';
import {syncDecision,stableText} from './syncDecision';
type Remote={revision:number;payload:Workspace};
const configKey='handball.sync.config';
export function SyncPanel({workspace,getLocal,replace,flush}:{workspace:Workspace;getLocal:()=>Workspace;replace:(w:Workspace)=>boolean;flush:()=>boolean}){
 const [config]=useState(()=>{try{return JSON.parse(localStorage.getItem(configKey)??'null') as {url:string;key:string}|null;}catch{return null;}});
 const [url,setUrl]=useState(config?.url??''),[key,setKey]=useState(config?.key??''),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [client,setClient]=useState<SupabaseClient|null>(()=>{try{return config?createClient(config.url,config.key):null;}catch{return null;}});
 const [user,setUser]=useState(''),[status,setStatus]=useState('Kun lagret på denne enheten'),[busy,setBusy]=useState(false),[conflict,setConflict]=useState<Remote|null>();
 const [enabled,setEnabled]=useState(false);
 const state=useRef({getLocal,replace,flush});state.current={getLocal,replace,flush};
 const inFlight=useRef(false),generation=useRef(0);
 const baseKey='handball.sync.base.'+url+'.'+user;
 useEffect(()=>{if(!client)return;const {data}=client.auth.onAuthStateChange((_event,session)=>{setUser(session?.user.id??'');setEnabled(Boolean(session));if(!session)setStatus('Ikke innlogget – lokale data beholdes');});return ()=>{data.subscription.unsubscribe();generation.current++;};},[client]);
 async function sync(choice?:'local'|'remote'){
  if(!client||!user||inFlight.current||!enabled)return;
  if(!navigator.onLine){setStatus('Frakoblet – endringer ligger lokalt og venter');return;}
  if(!state.current.flush()){setStatus('Lokal lagring må løses før synkronisering');return;}
  inFlight.current=true;setBusy(true);const gen=generation.current;
  try{
   const local=state.current.getLocal(),localText=stableText(local);
   const {data,error}=await client.from('coach_workspaces').select('revision,payload').eq('user_id',user).maybeSingle();if(error)throw error;
   if(gen!==generation.current)return;
   const remote=data as Remote|null,remoteText=remote?stableText(parseWorkspace(JSON.stringify(remote.payload))):null;
   const base=localStorage.getItem(baseKey);const decision=syncDecision(localText,remoteText,base);
   if(stableText(state.current.getLocal())!==localText){setStatus('Nye lokale endringer venter på neste synkronisering');return;}
   if(choice&&conflict?.revision!==remote?.revision){setConflict(remote);setStatus('Skydata ble endret igjen. Se gjennom konflikten på nytt.');return;}
   if(decision==='conflict'&&!choice){setConflict(remote);setStatus('Konflikt – begge versjoner beholdes til du velger');return;}
   if(choice==='remote'||(!choice&&decision==='download')){
    if(!remote)throw new Error('Ingen skyversjon finnes. Eksporter lokale data først.');
    if(choice)downloadJSON(local,'handball-for-skyvalg.backup.json');
    if(!state.current.replace(parseWorkspace(remoteText!)))throw new Error('Skydata kunne ikke lagres lokalt.');
    localStorage.setItem(baseKey,remoteText!);
   }else if(choice==='local'||decision==='upload'){
    if(choice&&remote)downloadJSON(remote.payload,'handball-sky-for-erstatning.backup.json');
    const saved=await client.rpc('save_coach_workspace',{expected_revision:remote?.revision??0,new_payload:local});if(saved.error)throw saved.error;
    if(gen!==generation.current)return;
    localStorage.setItem(baseKey,localText);
   }else localStorage.setItem(baseKey,localText);
   setConflict(undefined);setStatus('Synkronisert '+new Date().toLocaleTimeString('nb-NO'));
  }catch(e){setStatus('Synkronisering stoppet: '+((e as Error).message??'Nettverksfeil')+'. Lokale data beholdes.');}
  finally{inFlight.current=false;setBusy(false);}
 }
 const syncRef=useRef(sync);syncRef.current=sync;
 useEffect(()=>{if(!enabled||!user||conflict!==undefined)return;const t=setTimeout(()=>void syncRef.current(),1500);return ()=>clearTimeout(t);},[workspace,user,enabled,conflict]);
 useEffect(()=>{const run=()=>{if(document.visibilityState==='visible')void syncRef.current();};const timer=setInterval(run,30000);window.addEventListener('online',run);document.addEventListener('visibilitychange',run);return ()=>{clearInterval(timer);window.removeEventListener('online',run);document.removeEventListener('visibilitychange',run);};},[]);
 return <details className="sync-panel"><summary>Synkronisering · {status}</summary><div className="stack"><p>Valgfri privat lagring i din Supabase-konto. Innlogging starter synkronisering av alle lag og egne opplysninger. Appen fungerer uten innlogging. Sikkerhetskopi finnes under Mitt lag.</p>{!client?<form className="stack" onSubmit={e=>{e.preventDefault();try{const parsed=new URL(url);if(parsed.protocol!=='https:')throw new Error('Bruk HTTPS-adressen til Supabase-prosjektet.');if(key.startsWith('sb_secret_'))throw new Error('Bruk bare publishable/anon-nøkkel, aldri hemmelig servernøkkel.');if(key.startsWith('ey')){const claim=JSON.parse(atob(key.split('.')[1]));if(claim.role!=='anon')throw new Error('Bruk bare anon-nøkkelen.');}localStorage.setItem(configKey,JSON.stringify({url:parsed.origin,key}));setUrl(parsed.origin);setClient(createClient(parsed.origin,key));setStatus('Koblet til prosjekt – logg inn');}catch(err){setStatus((err as Error).message);}}}><label>Supabase-prosjektadresse<input type="url" required value={url} onChange={e=>setUrl(e.target.value)}/></label><label>Offentlig publishable / anon-nøkkel<input required value={key} onChange={e=>setKey(e.target.value)}/></label><button>Koble til prosjekt</button><p>Prosjekteier må først kjøre oppsettet i supabase/schema.sql. Se SYNC.md i prosjektet.</p></form>:!user?<form className="stack" onSubmit={async e=>{e.preventDefault();setBusy(true);const {error}=await client.auth.signInWithPassword({email,password});setPassword('');setBusy(false);if(error)setStatus(error.message);}}><label>E-post<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Passord<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>Logg inn og synkroniser</button><p>Konto opprettes av prosjekteier i Supabase Auth.</p></form>:<><label className="check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Synkroniser automatisk</label><button disabled={busy||!enabled} onClick={()=>void sync()}>Synkroniser nå</button><button disabled={busy} onClick={async()=>{generation.current++;setEnabled(false);await client.auth.signOut({scope:'local'});setUser('');setConflict(undefined);setStatus('Logget ut – lokale data beholdes');}}>Logg ut</button></>}{conflict!==undefined&&<section className="notice"><h3>Velg hvilken versjon som skal brukes</h3><p>En annen enhet eller en tidligere kontoøkt har andre data. Appen slår dem ikke sammen automatisk. Eksporter begge versjoner før du velger. Et valg erstatter hele samlingen av lag.</p><button onClick={()=>downloadJSON(state.current.getLocal(),'handball-lokal-konflikt.backup.json')}>Eksporter lokal versjon</button>{conflict&&<button onClick={()=>downloadJSON(conflict.payload,'handball-sky-konflikt.backup.json')}>Eksporter skyversjon</button>}<button disabled={busy} onClick={()=>{if(confirm('Bruke alle lokale data i skyen? Skyversjonen lastes ned som reserve først.'))void sync('local');}}>Bruk lokal versjon</button><button disabled={busy||!conflict} onClick={()=>{if(confirm('Erstatte lokale data med skyversjonen? Lokale data lastes ned som reserve først.'))void sync('remote');}}>Bruk skyversjon</button></section>}</div></details>;
}
