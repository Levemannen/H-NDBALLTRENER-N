import {TrainingCalendar} from './TrainingCalendar';
import {SessionHome} from './SessionHome';
import {activeTeam,openDraft,sessionFor} from './workspace';
import {RosterImport} from './RosterImport';
import {editingSession,mergeSession} from './sessionMerge';
import {AppBoundary} from './AppBoundary';
import {Season} from './SeasonPanel';
import {Updates} from './Updates';
import {SyncPanel} from './SyncPanel';
import {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {CalendarDays,ChevronRight,ClipboardList,Home as HomeIcon,Layers3,Search,Users} from 'lucide-react';
import {Bank,Detail,standard,emptyFilters} from './Bank';
import {Planner,Saved,HallMode} from './Training';
import {Team} from './Team';
import {type Session,type Exercise,itemFor,storageKey,cloneSession} from './model';
import {draftKey} from './storage';
import './style.css';
import {useWorkspace} from './useWorkspace';
import {downloadJSON,selectTeam} from './workspace';
import {IllustrationAudit} from './Illustration';
import {QuickBank} from './QuickBank';
import {TeamSettings} from './TeamSettings';

const links=[
  {url:'/ovelser',title:'Øvelsesbank',nav:'Øvelser',description:'Alle øvelser med beskrivelser, illustrasjoner og variasjoner',icon:ClipboardList},
  {url:'/lag-trening',title:'Lag trening',nav:'Lag økt',description:'Sett sammen øvelser og planlegg en økt',icon:CalendarDays},
  {url:'/treninger',title:'Mine treninger',nav:'Treninger',description:'Åpne lagrede økter og treningsmaler',icon:Layers3},
  {url:'/lag',title:'Mitt lag',nav:'Mitt lag',description:'Hold oversikt over spillere, oppmøte og lagdeling',icon:Users},
];
const readRoute=()=>location.hash.slice(1)||'/';
function App(){
  const [route,setRoute]=useState(readRoute);
  const store=useWorkspace();
  const {data,draft,setDraft,update,resetDraft,flush:flushDraft,error:storageError,status:draftStatus,recovered,setRecovered}=store;
  const [addUndo,setAddUndo]=useState<{draftId:string;addedIds:string[]}>();
  const [feedback,setFeedback]=useState('');
  const feedbackTimer=useRef<number>(undefined);
  const exportRaw=()=>downloadJSON(store.exportValue(),'handball-3.backup.json');
  const rescue=()=>{const raw:Record<string,string|null>={};try{for(const k of ['handballtrenern.v3',storageKey,draftKey])raw[k]=localStorage.getItem(k);}catch{}downloadJSON({raw,pending:store.exportValue()},'handball-redningskopi.json');};
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
  function edit(s:Session){const next=!s.editBase&&data.sessions.some(x=>x.id===s.id)?editingSession(s):structuredClone(s);if(store.change(w=>openDraft(w,next))){setRecovered(false);location.hash='/lag-trening';}}
  function newDraft(){if(store.change(w=>openDraft(w,sessionFor(activeTeam(w).settings))))setRecovered(false);}
  function add(e:Exercise,open=true){
    const item=itemFor(e);setAddUndo({draftId:draft.id,addedIds:[item.id]});setDraft(s=>({...s,items:[...s.items,item]}));
    notify('Øvelse lagt til i treningen');
    if(open)location.hash='/lag-trening';
  }
  function save(start=false){
    const s={...draft,state:'ready' as const,name:draft.name.trim()||'Trening '+draft.date};
    if(!flushDraft())return;
    const current=data.sessions.find(x=>x.id===s.id),result=mergeSession(s,current);
    if(result.conflicts.length){
      if(!confirm('Økten er endret etter at utkastet ble åpnet: '+result.conflicts.join(', ')+'. Bruke utkastets verdier for disse feltene? OK erstatter de motstridende feltene og laster ned en sikkerhetskopi. Avbryt beholder begge versjoner uten å lagre.'))return;
      downloadJSON(store.exportValue(),'handball-for-konfliktvalg.backup.json');
    }
    if(update(d=>({...d,sessions:[...d.sessions.filter(x=>x.id!==s.id),result.session]}))){resetDraft();location.hash=start?'/trening/'+s.id:'/treninger';notify(s.template?'Mal lagret':'Trening lagret');}
  }
  const [path,id]=route.slice(1).split('/');
  const exercise=exercises.find(e=>e.id===id);
  const session=data.sessions.find(s=>s.id===id);
  const detail=path==='ovelse'&&Boolean(exercise);
  return <div className={path==='trening'?'app runner-app':detail?'app exercise-page':'app'}>
    {!detail&&<header className={route==='/'?'brand hero':'brand'}><a href="#/" aria-label="Vålerenga Håndball – hjem"><img className="club-logo" src={import.meta.env.BASE_URL+'valerenga-handball.png'} alt="Vålerenga Håndball" /><span className="brand-text"><strong>Vålerenga</strong><span>HÅNDBALL</span></span></a></header>}
    {storageError&&<div className="notice" role="alert">{storageError}<button onClick={rescue}>Eksporter redningskopi</button><button onClick={()=>location.reload()}>Last inn siste lagrede data</button></div>}
    <div className="team-switch"><label>Aktivt lag<select aria-label="Aktivt lag" value={store.workspace.activeTeamId} onChange={e=>{if(store.change(w=>selectTeam(w,e.target.value))){setRecovered(false);location.hash='/lag';}}}>{store.workspace.teams.filter(t=>!t.archived).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><a href="#/lag">Mitt lag · {data.players.filter(p=>!p.archived).length} spillere</a></div>
    <main id="innhold"><RosterImport workspace={store.workspace} change={store.change} visible={path==='lag'}/>
      {store.migrated&&<details className="notice"><summary>Data fra 2.1 er bevart</summary><p>Spillerstall og historikk er knyttet til {data.team}. Den opprinnelige 2.1-lagringen beholdes som reserve på enheten.</p><button onClick={exportRaw}>Eksporter sikkerhetskopi</button></details>}
      {recovered&&<section className="notice"><p>Du har et uferdig treningsutkast.</p><button onClick={()=>{setRecovered(false);location.hash='/lag-trening';}}>Fortsett forrige trening</button><button onClick={()=>{if(confirm('Forkaste forrige utkast og starte en ny trening?'))resetDraft();}}>Start ny trening</button></section>}
      {path==='lag-trening'&&<div className="draft-status"><p role="status">{draftStatus}</p><details><summary>Utkast og sikkerhetskopi</summary><div className="row wrap"><button onClick={exportRaw}>Eksporter utkast og data</button><button onClick={()=>{if(confirm('Forkaste utkastet? Lagrede treninger beholdes.'))resetDraft();}}>Forkast utkast</button></div></details></div>}
      {route==='/'?<><SessionHome data={data} draft={draft} edit={edit}/><div className="home">{links.map(({url,title,description,icon:Icon})=><a className="home-card" href={'#'+url} key={url}><span className="tile"><Icon size={36}/></span><span><strong>{title}</strong><span>{description}</span></span><ChevronRight className="chevron"/></a>)}</div></>
      :path==='illustrasjoner'?<IllustrationAudit exercises={exercises} data={data}/>
      :path==='fem-min'?<div className="page"><QuickBank ids={store.workspace.quickCollection} exercises={exercises} change={ids=>store.change(w=>({...w,quickCollection:ids}))} favorites={data.favorites} toggle={id=>update(d=>({...d,favorites:d.favorites.includes(id)?d.favorites.filter(x=>x!==id):[...d.favorites,id]}))} use={e=>{setDraft(s=>({...s,items:[...s.items,{...itemFor(e,5),comment:'Forkortet femminuttersgjennomføring'}]}));notify('Fem minutter lagt til treningen');}}/></div>
      :path==='ovelser'?<Bank addMany={items=>{const added=items.map(e=>itemFor(e));setAddUndo({draftId:draft.id,addedIds:added.map(i=>i.id)});setDraft(s=>({...s,items:[...s.items,...added]}));notify(items.length+' øvelser lagt til');}} undoAdd={()=>{if(addUndo&&addUndo.draftId===draft.id){setDraft(s=>({...s,items:s.items.filter(i=>!addUndo.addedIds.includes(i.id))}));setAddUndo(undefined);notify('Siste tillegg angret');}}} exercises={exercises} data={data} update={update} add={e=>add(e,false)} notify={notify} filter={bankFilters} set={setBankFilters}/>
      :path==='ovelse'&&exercise?<Detail key={id} e={exercise} data={data} update={update} add={add} notify={notify}/>
      :path==='lag-trening'?<><section className="page draft-switch"><label>Arbeidsutkast<select value={draft.id} onChange={e=>{const next=activeTeam(store.workspace).drafts?.find(s=>s.id===e.target.value);if(next)edit(next);}}>{[draft,...(activeTeam(store.workspace).drafts??[])].map(s=><option key={s.id} value={s.id}>{s.name||'Nytt utkast'} · {s.date}</option>)}</select></label><button type="button" onClick={newDraft}>Nytt parallelt utkast</button></section><Planner key={draft.id} newDraft={newDraft} personalize={store.workspace.personalize} draft={draft} set={setDraft} exercises={exercises} data={data} save={()=>save()} start={()=>save(true)} notify={notify}/></>
      :path==='treninger'?<Saved targets={store.workspace.teams.filter(t=>!t.archived&&t.id!==store.workspace.activeTeamId)} copyTo={(s,id)=>{const copy=cloneSession(s);if(store.change(w=>({...w,teams:w.teams.map(t=>t.id===id?{...t,sessions:[...t.sessions,copy]}:t)})))notify('Trening kopiert uten spilleropplysninger');}} drafts={[draft,...(activeTeam(store.workspace).drafts??[])].filter(s=>s.name||s.items.length)} exercises={exercises} data={data} edit={edit} update={update}/>
      :path==='trening'&&session?<HallMode edit={edit} quickIds={store.workspace.quickCollection} changeQuick={ids=>store.change(w=>({...w,quickCollection:ids}))} key={id} session={session} data={data} exercises={exercises} update={update}/>
      :path==='lag'?<div key={store.workspace.activeTeamId}><Team data={data} draft={draft} setDraft={setDraft} update={update} notify={notify} exportAll={exportRaw} replace={store.replace}/><TeamSettings workspace={store.workspace} change={store.change}/><section className="page stack"><TrainingCalendar workspace={store.workspace} change={store.change} exercises={exercises}/><Season workspace={store.workspace} change={store.change} exercises={exercises} edit={edit}/></section></div>
      :<div className="page stack"><h1>Siden finnes ikke</h1><a href="#/">Gå til hjem</a></div>}
    </main>
    <SyncPanel workspace={store.workspace} getLocal={store.exportValue} replace={store.replace} flush={flushDraft}/><Updates route={route} flush={flushDraft} error={storageError} active={store.workspace.teams.some(t=>t.sessions.some(s=>s.runner&&!s.runner.endedAt))}/><footer className="app-version">Håndballtrener’n · Versjon {__APP_VERSION__} · <a href="#/illustrasjoner">Illustrasjonskontroll</a></footer>
    <div className={feedback?'toast':'visually-hidden'} role="status">{feedback}</div>
    <nav className="nav" aria-label="Hovedmeny">{[{url:'/',nav:'Hjem',icon:HomeIcon},...links.map(l=>l.url==='/ovelser'?{...l,icon:Search}:l)].map(({url,nav,icon:Icon})=>{
      const active=route===url||(url==='/ovelser'&&path==='ovelse')||(url==='/treninger'&&path==='trening');
      return <a key={url} href={'#'+url} aria-current={active?'page':undefined}><Icon size={23}/><span>{nav}{url==='/lag-trening'&&draft.items.length>0&&<small className="draft-count" aria-label={draft.items.length+' øvelser'}>{draft.items.length}</small>}</span></a>;
    })}</nav>
  </div>;
}
createRoot(document.getElementById('root')!).render(<AppBoundary><App/></AppBoundary>);
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{updateViaCache:'none'}).then(reg=>{
    const announce=()=>{if(reg.waiting&&navigator.serviceWorker.controller)window.dispatchEvent(new CustomEvent('handball-update',{detail:reg.waiting}));};
    announce();window.dispatchEvent(new Event('handball-registered'));void reg.update().catch(()=>{});reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',announce));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){announce();void reg.update().catch(()=>{});}});
  }).catch(error=>console.error('Kunne ikke aktivere offlinebruk',error));});
}
