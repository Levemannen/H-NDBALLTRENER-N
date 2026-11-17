import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CalendarDays,ChevronRight,ClipboardList,Home as HomeIcon,Layers3,Search,Users} from 'lucide-react';
import {Bank,Detail,standard,emptyFilters} from './Bank';
import {Planner,Saved,HallMode} from './Training';
import {Team} from './Team';
import {type Data,type Session,type Exercise,fresh,itemFor,loadData,newSession,storageKey} from './model';
import {checkedWrite,draftKey,parseDraft,draftText,serializeData} from './storage';
import './style.css';

const links=[
  {url:'/ovelser',title:'Øvelsesbank',nav:'Øvelser',description:'Alle øvelser med beskrivelser, illustrasjoner og variasjoner',icon:ClipboardList},
  {url:'/lag-trening',title:'Lag trening',nav:'Lag økt',description:'Sett sammen øvelser og planlegg en økt',icon:CalendarDays},
  {url:'/treninger',title:'Mine treninger',nav:'Treninger',description:'Åpne lagrede økter og treningsmaler',icon:Layers3},
  {url:'/lag',title:'Mitt lag',nav:'Mitt lag',description:'Hold oversikt over spillere, oppmøte og lagdeling',icon:Users},
];
const readRoute=()=>location.hash.slice(1)||'/';
function App(){
  const [route,setRoute]=useState(readRoute);
  const [storageError,setStorageError]=useState('');
  const [feedback,setFeedback]=useState('');
  const [waiting,setWaiting]=useState<ServiceWorker>();
  useEffect(()=>{
    const ready=(event:Event)=>setWaiting((event as CustomEvent<ServiceWorker>).detail);
    window.addEventListener('handball-update',ready);
    return ()=>window.removeEventListener('handball-update',ready);
  },[]);
  const feedbackTimer=useRef<number>(undefined);
  const [loadError,setLoadError]=useState(()=>{try{loadData(localStorage);return false;}catch{return true;}});
  const [data,setData]=useState(()=>{try{return loadData(localStorage);}catch{return fresh();}});
  const dataRef=useRef(data);
  const [draftInitial]=useState(()=>{try{const raw=localStorage.getItem(draftKey);return {raw,session:raw?parseDraft(raw):newSession(),error:''};}catch{return {raw:null,session:newSession(),error:'Det lagrede utkastet kunne ikke leses. Eksporter rådata før du forkaster det.'};}});
  const [draft,setDraft]=useState<Session>(draftInitial.session);
  const draftRef=useRef(draft);draftRef.current=draft;
  const draftSnapshot=useRef(draftInitial.raw);
  const dataSnapshot=useRef<string|null>((()=>{try{return localStorage.getItem(storageKey);}catch{return null;}})());
  const [draftStatus,setDraftStatus]=useState(draftInitial.error||'');
  const [recovered,setRecovered]=useState(Boolean(draftInitial.raw));
  const draftBlocked=useRef(Boolean(draftInitial.error));
  const ownsStorage=useRef(!('locks' in navigator));
  useEffect(()=>{
    if(!('locks' in navigator))return;
    let release:()=>void=()=>{};
    let cancelled=false;
    void navigator.locks.request('handballtrenern-editor',{ifAvailable:true},async lock=>{
      if(cancelled)return;
      if(!lock){setStorageError('Appen er åpen for redigering i en annen fane. Denne fanen er skrivebeskyttet. Lukk den andre fanen og last denne siden på nytt.');return;}
      ownsStorage.current=true;
      await new Promise<void>(resolve=>{release=resolve;});
      ownsStorage.current=false;
    });
    return ()=>{cancelled=true;release();};
  },[]);
  const cleanDraft=useRef<string|null>(draftInitial.raw?null:JSON.stringify(draftInitial.session));
  function flushDraft(){
    if(draftBlocked.current)return false;
    try{
      if(!ownsStorage.current)throw new Error('Denne fanen er skrivebeskyttet. Lukk den andre appfanen og last siden på nytt.');
      const next=JSON.stringify(draftRef.current)===cleanDraft.current?null:draftText(draftRef.current);
      checkedWrite(localStorage,draftKey,draftSnapshot.current,next);draftSnapshot.current=next;
      setDraftStatus(next?'Utkast lagret på denne enheten':'Ingen ulagrede endringer');return true;
    }catch(error){setDraftStatus((error as Error).message);return false;}
  }
  useEffect(()=>{if(!draftBlocked.current)setDraftStatus('Lagrer utkast …');const timeout=setTimeout(flushDraft,450);return ()=>clearTimeout(timeout);},[draft]);
  useEffect(()=>{
    const flush=()=>{flushDraft();};
    const changed=(e:StorageEvent)=>{if(e.storageArea===localStorage&&(e.key===storageKey||e.key===draftKey||e.key===null))setStorageError('En annen fane har endret data. Eksporter denne fanens data før du laster siden på nytt. Lagring stoppes ved konflikt.');};
    const hidden=()=>{if(document.visibilityState==='hidden')flush();};
    window.addEventListener('pagehide',flush);window.addEventListener('storage',changed);document.addEventListener('visibilitychange',hidden);
    return ()=>{window.removeEventListener('pagehide',flush);window.removeEventListener('storage',changed);document.removeEventListener('visibilitychange',hidden);};
  },[]);
  function resetDraft(){
    try{if(!ownsStorage.current)throw new Error('Denne fanen er skrivebeskyttet.');checkedWrite(localStorage,draftKey,draftBlocked.current?localStorage.getItem(draftKey):draftSnapshot.current,null);draftBlocked.current=false;draftSnapshot.current=null;const empty=newSession();cleanDraft.current=JSON.stringify(empty);draftRef.current=empty;setDraft(empty);setRecovered(false);return true;}
    catch(error){setDraftStatus((error as Error).message);return false;}
  }
  function exportRaw(){
    const blob=new Blob([JSON.stringify({...dataRef.current,draft:draftRef.current,unreadableData:loadError?localStorage.getItem(storageKey):undefined,unreadableDraft:draftInitial.error?localStorage.getItem(draftKey):undefined},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='handball-redningskopi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const [bankFilters,setBankFilters]=useState(emptyFilters);
  const exercises=useMemo(()=>[...standard,...data.exercises],[data.exercises]);
  useEffect(()=>{
    const change=()=>{setRoute(readRoute());window.scrollTo(0,0);};
    window.addEventListener('hashchange',change);
    return ()=>window.removeEventListener('hashchange',change);
  },[]);
  useEffect(()=>()=>window.clearTimeout(feedbackTimer.current),[]);
  function notify(message:string){
    window.clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current=window.setTimeout(()=>setFeedback(''),4200);
  }
  function persist(next:Data){
    try{
      if(!ownsStorage.current)throw new Error('Denne fanen er skrivebeskyttet. Lukk den andre appfanen og last siden på nytt.');
      const text=serializeData(next);checkedWrite(localStorage,storageKey,dataSnapshot.current,text);dataSnapshot.current=text;
      dataRef.current=next;setData(next);setStorageError('');setLoadError(false);return true;
    }catch(error){setStorageError('Endringen kunne ikke lagres: '+(error as Error).message);return false;}
  }
  function update(fn:(d:Data)=>Data){
    if(loadError){setStorageError('Eksisterende data kunne ikke leses. Gjenopprett en gyldig sikkerhetskopi under Mitt lag før du gjør endringer.');return false;}
    return persist(fn(dataRef.current));
  }
  function edit(s:Session){if((draftSnapshot.current||JSON.stringify(draftRef.current)!==cleanDraft.current)&&!confirm('Erstatte det påbegynte utkastet? Lagre det først dersom du vil beholde det.'))return;setRecovered(false);setDraft(structuredClone(s));location.hash='/lag-trening';}
  function add(e:Exercise,open=true){
    setDraft(s=>({...s,items:[...s.items,itemFor(e)]}));
    notify('Øvelse lagt til i treningen');
    if(open)location.hash='/lag-trening';
  }
  function save(){
    const s={...draft,name:draft.name.trim()||'Trening '+draft.date,attendees:draft.attendees.filter(id=>data.players.some(p=>p.id===id))};
    if(!flushDraft())return;
    if(update(d=>({...d,sessions:[...d.sessions.filter(x=>x.id!==s.id),s]}))){resetDraft();location.hash='/treninger';notify(s.template?'Mal lagret':'Trening lagret');}
  }
  const [path,id]=route.slice(1).split('/');
  const exercise=exercises.find(e=>e.id===id);
  const session=data.sessions.find(s=>s.id===id);
  const detail=path==='ovelse'&&Boolean(exercise);
  return <div className={detail?'app exercise-page':'app'}>
    {!detail&&<header className={route==='/'?'brand hero':'brand'}><a href="#/" aria-label="Vålerenga Håndball – hjem"><img className="club-logo" src={import.meta.env.BASE_URL+'valerenga-handball.png'} alt="Vålerenga Håndball" /><span>VÅLERENGA<br/>HÅNDBALL</span></a>{route==='/'&&<svg className="ribbon" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#e52331" d="M0 100Q45 54 193 73Q390 97 600 0V100Z"/><path fill="white" d="M0 100Q45 54 193 73Q396 97 600 19V100Z"/><path fill="#0c54a0" d="M0 100Q45 54 193 73Q404 99 600 32V100Z"/><path fill="#f5f8fb" d="M0 100Q45 54 193 73Q453 107 600 80V100Z"/></svg>}</header>}
    {loadError&&<p className="notice" role="status">Nettleseren kunne ikke lese de lokale dataene. Du kan gjenopprette en sikkerhetskopi under Mitt lag.</p>}
    {storageError&&<div className="notice" role="alert">{storageError}<button onClick={exportRaw}>Eksporter redningskopi</button><button onClick={()=>location.reload()}>Last inn siste lagrede data</button></div>}
    <main id="innhold">
      {waiting&&<div className="notice"><p>Ny versjon er klar. Utkast og brukerdata beholdes.</p><button onClick={()=>{if(flushDraft()){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});waiting.postMessage('ACTIVATE_UPDATE');}}}>Oppdater appen</button></div>}
      {recovered&&<section className="notice"><p>Du har et uferdig treningsutkast.</p><button onClick={()=>{setRecovered(false);location.hash='/lag-trening';}}>Fortsett forrige trening</button><button onClick={()=>{if(confirm('Forkaste forrige utkast og starte en ny trening?'))resetDraft();}}>Start ny trening</button></section>}
      {path==='lag-trening'&&<div className="draft-status"><p role="status">{draftStatus}</p><details><summary>Utkast og sikkerhetskopi</summary><div className="row wrap"><button onClick={exportRaw}>Eksporter utkast og data</button><button onClick={()=>{if(confirm('Forkaste utkastet? Lagrede treninger beholdes.'))resetDraft();}}>Forkast utkast</button></div></details></div>}
      {route==='/'?<div className="home"><h1 className="visually-hidden">Håndballtrener’n</h1>{links.map(({url,title,description,icon:Icon})=><a className="home-card" href={'#'+url} key={url}><span className="tile"><Icon size={36}/></span><span><strong>{title}</strong><span>{description}</span></span><ChevronRight className="chevron"/></a>)}</div>
      :path==='ovelser'?<Bank exercises={exercises} data={data} update={update} add={e=>add(e,false)} notify={notify} filter={bankFilters} set={setBankFilters}/>
      :path==='ovelse'&&exercise?<Detail key={id} e={exercise} data={data} update={update} add={add} notify={notify}/>
      :path==='lag-trening'?<Planner draft={draft} set={setDraft} exercises={exercises} data={data} save={save} notify={notify}/>
      :path==='treninger'?<Saved data={data} edit={edit} update={update}/>
      :path==='trening'&&session?<HallMode key={id} session={session} data={data} exercises={exercises} update={update}/>
      :path==='lag'?<Team data={data} draft={draft} setDraft={setDraft} update={update} notify={notify} replace={d=>{if(!flushDraft())return false;const {draft:importedDraft,...rest}=d;if(!persist(rest))return false;if(!resetDraft())return false;if(importedDraft){draftRef.current=importedDraft;setDraft(importedDraft);flushDraft();}return true;}}/>
      :<div className="page stack"><h1>Siden finnes ikke</h1><a href="#/">Gå til hjem</a></div>}
    </main>
    <footer className="app-version">Håndballtrener’n · Versjon {__APP_VERSION__}</footer>
    <div className={feedback?'toast':'visually-hidden'} role="status">{feedback}</div>
    <nav className="nav" aria-label="Hovedmeny">{[{url:'/',nav:'Hjem',icon:HomeIcon},...links.map(l=>l.url==='/ovelser'?{...l,icon:Search}:l)].map(({url,nav,icon:Icon})=>{
      const active=route===url||(url==='/ovelser'&&path==='ovelse')||(url==='/treninger'&&path==='trening');
      return <a key={url} href={'#'+url} aria-current={active?'page':undefined}><Icon size={23}/><span>{nav}{url==='/lag-trening'&&draft.items.length>0&&<small className="draft-count" aria-label={draft.items.length+' øvelser'}>{draft.items.length}</small>}</span></a>;
    })}</nav>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{updateViaCache:'none'}).then(reg=>{
    const announce=()=>{if(reg.waiting&&navigator.serviceWorker.controller)window.dispatchEvent(new CustomEvent('handball-update',{detail:reg.waiting}));};
    announce();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',announce));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){announce();void reg.update().catch(()=>{});}});
  }).catch(error=>console.error('Kunne ikke aktivere offlinebruk',error));});
}
