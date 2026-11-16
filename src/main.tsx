import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CalendarDays,ChevronRight,ClipboardList,Home as HomeIcon,Layers3,Search,Users} from 'lucide-react';
import {Bank,Detail,standard,emptyFilters} from './Bank';
import {Planner,Saved,HallMode} from './Training';
import {Team} from './Team';
import {type Data,type Session,type Exercise,fresh,itemFor,loadData,newSession,saveData} from './model';
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
  const feedbackTimer=useRef<number>(undefined);
  const [loadError,setLoadError]=useState(()=>{try{loadData(localStorage);return false;}catch{return true;}});
  const [data,setData]=useState(()=>{try{return loadData(localStorage);}catch{return fresh();}});
  const dataRef=useRef(data);
  const [draft,setDraft]=useState<Session>(newSession);
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
      saveData(localStorage,next);
      dataRef.current=next;setData(next);setStorageError('');setLoadError(false);return true;
    }catch{setStorageError('Endringen kunne ikke lagres lokalt. Sjekk ledig plass og nettleserens innstillinger.');return false;}
  }
  function update(fn:(d:Data)=>Data){
    if(loadError){setStorageError('Eksisterende data kunne ikke leses. Gjenopprett en gyldig sikkerhetskopi under Mitt lag før du gjør endringer.');return false;}
    return persist(fn(dataRef.current));
  }
  function edit(s:Session){setDraft(structuredClone(s));location.hash='/lag-trening';}
  function add(e:Exercise,open=true){
    setDraft(s=>({...s,items:[...s.items,itemFor(e)]}));
    notify('Øvelse lagt til i treningen');
    if(open)location.hash='/lag-trening';
  }
  function save(){
    const s={...draft,name:draft.name.trim()||'Trening '+draft.date,attendees:draft.attendees.filter(id=>data.players.some(p=>p.id===id))};
    if(update(d=>({...d,sessions:[...d.sessions.filter(x=>x.id!==s.id),s]}))){setDraft(newSession());location.hash='/treninger';notify(s.template?'Mal lagret':'Trening lagret');}
  }
  const [path,id]=route.slice(1).split('/');
  const exercise=exercises.find(e=>e.id===id);
  const session=data.sessions.find(s=>s.id===id);
  const detail=path==='ovelse'&&Boolean(exercise);
  return <div className={detail?'app exercise-page':'app'}>
    {!detail&&<header className={route==='/'?'brand hero':'brand'}><a href="#/" aria-label="Vålerenga Håndball – hjem"><span className="crest">ViF</span><span>VÅLERENGA<br/>HÅNDBALL</span></a>{route==='/'&&<svg className="ribbon" viewBox="0 0 600 100" preserveAspectRatio="none" aria-hidden="true"><path fill="#e52331" d="M0 100Q45 54 193 73Q390 97 600 0V100Z"/><path fill="white" d="M0 100Q45 54 193 73Q396 97 600 19V100Z"/><path fill="#0c54a0" d="M0 100Q45 54 193 73Q404 99 600 32V100Z"/><path fill="#f5f8fb" d="M0 100Q45 54 193 73Q453 107 600 80V100Z"/></svg>}</header>}
    {loadError&&<p className="notice" role="status">Nettleseren kunne ikke lese de lokale dataene. Du kan gjenopprette en sikkerhetskopi under Mitt lag.</p>}
    {storageError&&<p className="notice" role="alert">{storageError}</p>}
    <main id="innhold">
      {route==='/'?<div className="home"><h1 className="visually-hidden">Håndballtrener’n</h1>{links.map(({url,title,description,icon:Icon})=><a className="home-card" href={'#'+url} key={url}><span className="tile"><Icon size={36}/></span><span><strong>{title}</strong><span>{description}</span></span><ChevronRight className="chevron"/></a>)}</div>
      :path==='ovelser'?<Bank exercises={exercises} data={data} update={update} add={e=>add(e,false)} notify={notify} filter={bankFilters} set={setBankFilters}/>
      :path==='ovelse'&&exercise?<Detail key={id} e={exercise} data={data} update={update} add={add} notify={notify}/>
      :path==='lag-trening'?<Planner draft={draft} set={setDraft} exercises={exercises} data={data} save={save} notify={notify}/>
      :path==='treninger'?<Saved data={data} edit={edit} update={update}/>
      :path==='trening'&&session?<HallMode key={id} session={session} data={data} exercises={exercises}/>
      :path==='lag'?<Team data={data} draft={draft} setDraft={setDraft} update={update} notify={notify} replace={d=>{if(!persist(d))return false;setDraft(newSession());return true;}}/>
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
  window.addEventListener('load',()=>{navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(error=>console.error('Kunne ikke aktivere offlinebruk',error));});
}
