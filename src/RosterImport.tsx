import {useEffect,useRef,useState} from 'react';
import {parseRoster,planRoster,type RosterFile} from './rosters';
import type {Workspace} from './workspace';
export function RosterImport({workspace,change,visible}:{workspace:Workspace;change:(fn:(w:Workspace)=>Workspace)=>boolean;visible:boolean}){
 const [file,setFile]=useState<RosterFile>(),[answers,setAnswers]=useState<Record<string,string>>({}),[status,setStatus]=useState('Spillerliste er ikke kontrollert ennå.'),[checked,setChecked]=useState(''),[busy,setBusy]=useState(false);
 const latest=useRef({workspace,change});latest.current={workspace,change};const request=useRef<AbortController|null>(null);
 function apply(incoming:RosterFile,choices:Record<string,string>={}){
  const result=planRoster(latest.current.workspace,incoming,choices);
  if(result.conflicts.length){setFile(incoming);setAnswers(choices);setStatus('Spillerlisten krever avklaring. Ingen endringer er importert.');return;}
  if(result.changed){let count=result.count;const saved=latest.current.change(w=>{const fresh=planRoster(w,incoming,choices);if(fresh.conflicts.length)throw new Error('Lokale data er endret. Se gjennom importvalgene igjen.');count=fresh.count;return fresh.workspace;});if(!saved){setStatus('Spillerlisten kunne ikke lagres. Løs lagringsmeldingen og prøv igjen.');return;}setStatus(count+' spillere hentet fra GitHub.');}
  else setStatus(result.count+' importerte spillere · spillerfilen er uendret.');
  setFile(undefined);setAnswers({});
 }
 async function load(){
  if(request.current)return;
  if(!navigator.onLine){setStatus('Frakoblet – tidligere hentede spillere er tilgjengelige lokalt.');return;}
  const controller=new AbortController();request.current=controller;setBusy(true);const timeout=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch(new URL(import.meta.env.BASE_URL+'rosters.json',location.href),{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('Spillerfilen kunne ikke hentes ('+response.status+'). Kontroller at rosters.json er publisert.');const text=await response.text();if(text.length>1000000)throw new Error('Spillerfilen er for stor.');const incoming=parseRoster(text);setChecked(new Date().toLocaleString('nb-NO'));apply(incoming);}
  catch(e){setStatus((e as Error).name==='AbortError'?'Henting tok for lang tid. Lokale spillere er beholdt.':(e as Error).message+' Lokale data er beholdt.');}
  finally{clearTimeout(timeout);request.current=null;setBusy(false);}
 }
 const loadRef=useRef(load);loadRef.current=load;
 useEffect(()=>{const check=()=>{if(document.visibilityState==='visible')void loadRef.current();};const timer=setTimeout(check,600);window.addEventListener('online',check);document.addEventListener('visibilitychange',check);return ()=>{clearTimeout(timer);request.current?.abort();window.removeEventListener('online',check);document.removeEventListener('visibilitychange',check);};},[]);
 let conflicts:ReturnType<typeof planRoster>['conflicts']=[];
 try{if(file)conflicts=planRoster(workspace,file,answers).conflicts;}catch{/* The explicit import action reports changed or invalid state. */}
 if(!visible)return null;
 const imported=workspace.rosterImport;
 const count=imported?Object.values(imported.teams).reduce((n,t)=>n+Object.keys(t.players).length,0):0;
 return <section className="page roster-import"><details className="panel stack" open={Boolean(file)||undefined}><summary>Spillerliste fra GitHub · {count} importert</summary><p role="status">{status}</p><p>Sist kontrollert: {checked||'Ikke i denne åpningen'}. Sist importert: {imported?new Date(imported.importedAt).toLocaleString('nb-NO'):'Aldri'}.</p>{imported&&<p>Filens revisjon: {imported.revision} · Oppdatert {new Date(imported.updatedAt).toLocaleString('nb-NO')}</p>}<button disabled={busy} onClick={()=>void load()}>{busy?'Henter spillerliste …':'Hent spillerliste fra GitHub'}</button><p>Rediger navn og lag i <a href="https://github.com/Levemannen/H-NDBALLTRENER-N/blob/main/public/rosters.json" target="_blank" rel="noreferrer">spillerfilen på GitHub</a>. Filen er offentlig. Ikke legg inn nivåer, oppmøte eller private kommentarer.</p><p>Nye spillere starter med appens standardnivå 4, som du kan endre lokalt. Eksisterende nivåer og historikk beholdes. Fjerning fra filen sletter ikke spilleren i appen.</p>{file&&<div className="stack"><h3>Avklar før import</h3>{conflicts.map(c=><label key={c.key}>{c.message}<select aria-label={c.message} value={answers[c.key]??''} onChange={e=>setAnswers({...answers,[c.key]:e.target.value})}><option value="">Velg</option>{c.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>)}<button onClick={()=>{try{apply(file,answers);}catch(e){setStatus((e as Error).message);}}}>Bruk avklarte valg</button><button onClick={()=>{setFile(undefined);setAnswers({});setStatus('Import utsatt. Lokale data er uendret.');}}>Senere</button></div>}</details></section>;
}
