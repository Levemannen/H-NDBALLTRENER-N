import {useEffect,useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,CalendarDays,ChevronLeft,ChevronRight,Clock3,Play,Plus,Trash2,GripVertical} from 'lucide-react';
import {type Data,type Exercise,type Session,itemFor,newSession,suggest,total,uid,dateToday,halls,norm} from './model';
import {ExercisePicker,QuickExercise} from './Bank';

export const cloneSession=(s:Session,template=false):Session=>({...structuredClone(s),id:uid(),date:dateToday(),name:s.name+(template?' – mal':' – kopi'),template,evaluation:undefined,items:s.items.map(i=>({...i,id:uid()}))});
export function Attendance({data,selected,change}:{data:Data;selected:string[];change:(ids:string[])=>void}){
  return <div className="stack"><div className="row between wrap"><strong>{selected.filter(id=>data.players.some(p=>p.id===id)).length} valgt</strong><div className="row wrap"><button type="button" onClick={()=>change(data.players.map(p=>p.id))}>Velg alle</button><button type="button" onClick={()=>change([])}>Tøm</button></div></div>
    {data.players.length?<div className="attendance">{data.players.map(p=><label className="check" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>change(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}</label>)}</div>:<p className="muted">Registrer spillere under Mitt lag.</p>}
  </div>;
}
export function Planner({draft,set,exercises,data,save,notify}:{draft:Session;set:(s:Session)=>void;exercises:Exercise[];data:Data;save:()=>void;notify:(message:string)=>void}){
  const [picker,setPicker]=useState<-1|number>();
  const [reuse,setReuse]=useState('');
  const [drag,setDrag]=useState<number>();
  const [message,setMessage]=useState('');
  const catalog=useMemo(()=>exercises.map(e=>data.notes[e.id]?.metadata?{...e,...data.notes[e.id].metadata}:e),[exercises,data.notes]);
  const change=(patch:Partial<Session>)=>set({...draft,...patch});
  function move(from:number,to:number){
    if(to<0||to>=draft.items.length||from===to)return;
    const items=[...draft.items];
    items.splice(to,0,items.splice(from,1)[0]);
    change({items});
  }
  function generate(){
    const items=suggest(draft,catalog);
    if(!items.length){setMessage('Ingen øvelser passer med rammene. Endre antall spillere, hall eller varighet.');return;}
    if(draft.items.length&&!confirm('Erstatte øvelsene i planen med forslaget?'))return;
    change({items});
    const difference=draft.duration-items.reduce((sum,i)=>sum+i.minutes,0);
    setMessage(difference?'Forslaget har '+difference+' minutter ledig tid. Du kan justere planen.':'Forslaget er lagt inn og kan redigeres.');
  }
  return <form className="page stack" onSubmit={e=>{e.preventDefault();save();}}>
    <div className="heading"><h1>{draft.template?'Rediger treningsmal':'Lag trening'}</h1></div>
    <section className="panel stack"><h2>Øktdetaljer</h2><div className="fields">
      <label>Navn<input value={draft.name} onChange={e=>change({name:e.target.value})} placeholder={'Trening '+draft.date}/></label>
      <label>Starttid (valgfritt)<input type="time" value={draft.startTime??''} onChange={e=>change({startTime:e.target.value||undefined})}/></label><label>Dato<input required type="date" value={draft.date} onChange={e=>change({date:e.target.value})}/></label>
      {([['duration','Planlagt varighet (min)',1],['players','Antall spillere',0],['coaches','Antall trenere',0]] as const).map(([key,label,min])=><label key={key}>{label}<input type="number" min={min} required value={draft[key]} onChange={e=>change({[key]:Math.max(min,Number(e.target.value))})}/></label>)}
      <label>Hallstørrelse<select value={draft.hall} onChange={e=>change({hall:e.target.value})}>{halls.map(h=><option key={h} value={h}>{h[0].toUpperCase()+h.slice(1)}</option>)}</select></label>
      <label>Treningsfokus<input value={draft.focus} onChange={e=>change({focus:e.target.value})} placeholder="F.eks. pasning og mottak"/></label>
    </div></section>
    <details className="panel"><summary>Oppmøte ({draft.attendees.length})</summary><Attendance data={data} selected={draft.attendees} change={attendees=>change({attendees,players:attendees.length,allocation:draft.allocation?.map(g=>({...g,players:g.players.filter(id=>attendees.includes(id))}))})}/><a className="button" href="#/lag">Fordel spillere i lag</a></details>
    <section className="stack">
      <div className="row between wrap"><h2>Øvelser</h2><span className="chip"><Clock3 size={17}/> {total(draft)} av {draft.duration} min · {Math.abs(draft.duration-total(draft))} min {total(draft)>draft.duration?'over tiden':'ledig'}</span></div>
      <div className="row wrap"><button type="button" onClick={()=>setPicker(picker===-1?undefined:-1)}><Plus size={18}/> Legg til øvelse</button><button type="button" onClick={generate}>Foreslå trening</button></div>
      {message&&<p role="status">{message}</p>}
      <div className={picker!==undefined?'plan-columns':'stack'}>
      {picker!==undefined&&<div className="panel stack plan-picker"><div className="row between"><h3>{picker===-1?'Legg til øvelse':'Bytt øvelse'}</h3><button type="button" onClick={()=>setPicker(undefined)}>Lukk</button></div><ExercisePicker key={picker} exercises={catalog} onSelect={e=>{
        change({items:picker===-1?[...draft.items,itemFor(e)]:draft.items.map((item,n)=>n===picker?{...item,exerciseId:e.id}:item)});
        notify(picker===-1?'Øvelse lagt til':'Øvelse byttet');
        if(picker!==-1)setPicker(undefined);
      }}/></div>}
      <div className="stack">
      <details className="panel"><summary>Gjenbruk deler av en trening</summary><label>Velg trening<select value={reuse} onChange={e=>setReuse(e.target.value)}><option value="">Velg</option>{data.sessions.map(s=><option key={s.id} value={s.id}>{s.date} · {s.name}</option>)}</select></label>{data.sessions.find(s=>s.id===reuse)?.items.map(item=><button type="button" key={item.id} onClick={()=>{change({items:[...draft.items,{...item,id:uid()}]});notify('Øvelse gjenbrukt');}}>{exercises.find(e=>e.id===item.exerciseId)?.title??'Ukjent øvelse'} · {item.minutes} min</button>)}</details>
      {!draft.items.length&&<p className="panel muted">Legg til en øvelse for å starte planen.</p>}
      {draft.items.map((item,i)=>{
        const exercise=exercises.find(e=>e.id===item.exerciseId);
        const update=(patch:Partial<typeof item>)=>change({items:draft.items.map(x=>x.id===item.id?{...x,...patch}:x)});
        return <div className="panel stack" key={item.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(drag!==undefined)move(drag,i);setDrag(undefined);}}>
          <div className="row between wrap"><h3><span draggable className="grip" onDragStart={e=>{setDrag(i);e.dataTransfer.setData('text/plain',String(i));}} onDragEnd={()=>setDrag(undefined)}><GripVertical size={18}/></span> {i+1}. {exercise?.title??'Øvelse mangler'}</h3>
          <div className="row"><button type="button" className="icon-button" aria-label="Flytt opp" disabled={i===0} onClick={()=>move(i,i-1)}><ArrowUp size={18}/></button><button type="button" className="icon-button" aria-label="Flytt ned" disabled={i===draft.items.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={18}/></button><button type="button" className="icon-button" aria-label="Fjern fra treningen" onClick={()=>{change({items:draft.items.filter(x=>x.id!==item.id)});setPicker(undefined);}}><Trash2 size={18}/></button></div></div>
          {draft.startTime&&<p className="muted">{[0,item.minutes].map(offset=>{
            const [h,m]=draft.startTime!.split(':').map(Number);
            const time=h*60+m+draft.items.slice(0,i).reduce((sum,x)=>sum+x.minutes,0)+offset;
            return String(Math.floor(time/60)%24).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
          }).join(' – ')}</p>}
          <div className="fields"><label>Minutter<input type="number" required min="1" value={item.minutes} onChange={e=>update({minutes:Math.max(1,Number(e.target.value))})}/></label><label>Kommentar<input value={item.comment} onChange={e=>update({comment:e.target.value})}/></label></div>
          <div className="row wrap"><button type="button" onClick={()=>setPicker(i)}>Bytt øvelse</button>{exercise&&<a className="button" href={'#/ovelse/'+exercise.id}>Vis beskrivelse</a>}</div>
        </div>;
      })}
      </div></div>
    </section>
    <div className="row wrap"><button className="primary">Lagre {draft.template?'mal':'trening'}</button><button type="button" onClick={()=>{if((!draft.items.length&&!draft.name)||confirm('Starte på en ny trening? Denne planen må lagres først hvis du vil beholde endringene.'))set(newSession());}}>Ny trening</button></div>
  </form>;
}
export function Saved({data,edit,update}:{data:Data;edit:(s:Session)=>void;update:(fn:(d:Data)=>Data)=>void}){
  const [q,set]=useState('');
  const [mode,setMode]=useState('all');
  const filtered=data.sessions.filter(s=>(mode==='all'||(mode==='templates'?s.template:!s.template&&(mode==='upcoming'?s.date>=dateToday():mode==='past'?s.date<dateToday():true)))&&norm([s.name,s.date,s.focus].join(' ')).includes(norm(q.trim()))).sort((a,b)=>b.date.localeCompare(a.date));
  return <div className="page stack"><div className="heading row between wrap"><h1>Mine treninger</h1><a className="button primary" href="#/lag-trening"><Plus size={18}/> Lag trening</a></div>
    <div className="fields"><label>Søk<input type="search" value={q} onChange={e=>set(e.target.value)} placeholder="Navn, dato eller fokus"/></label><label>Vis<select value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Alle</option><option value="sessions">Treninger</option><option value="upcoming">Kommende</option><option value="past">Tidligere</option><option value="templates">Maler</option></select></label></div>
    {!filtered.length&&<p className="panel muted">{data.sessions.length?'Ingen treff.':'De lagrede treningene dine vises her.'}</p>}
    {filtered.map(s=><section className="panel stack" key={s.id}><div className="row between wrap"><h2>{s.name}</h2>{s.template&&<span className="chip">Mal</span>}</div><p className="row muted"><CalendarDays size={18}/> {s.date} · {s.items.length} øvelser · {total(s)} min</p>{s.focus&&<p className="muted">{s.focus}</p>}
      <div className="row wrap">{!s.template&&<a className="button primary" href={'#/trening/'+s.id}><Play size={18}/> Treningsvisning</a>}<button onClick={()=>edit(s)}>Åpne / rediger</button><button onClick={()=>edit(cloneSession(s))}>{s.template?'Bruk mal':'Kopier til ny dato'}</button>{!s.template&&<button onClick={()=>edit(cloneSession(s,true))}>Lagre som mal</button>}<button onClick={()=>{if(confirm('Slette «'+s.name+'»?'))update(d=>({...d,sessions:d.sessions.filter(x=>x.id!==s.id)}));}}>Slett</button></div>
      {!s.template&&<details><summary>Evaluering etter trening</summary><div className="stack"><label>Hvordan fungerte treningen?<select value={s.evaluation?.rating??''} onChange={e=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,evaluation:{note:x.evaluation?.note??'',rating:e.target.value}}:x)}))}><option value="">Ikke vurdert</option><option value="bra">Fungerte bra</option><option value="middels">Fungerte middels</option><option value="dårlig">Fungerte dårlig</option></select></label><label>Eget notat<textarea value={s.evaluation?.note??''} onChange={e=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,evaluation:{rating:x.evaluation?.rating??'',note:e.target.value}}:x)}))}/></label></div></details>}
    </section>)}
  </div>;
}
export function HallMode({session,exercises,data}:{session:Session;exercises:Exercise[];data:Data}){
  const timerKey='handball.timer.'+session.id;
  const [restored]=useState(()=>{
    try {
      const saved=JSON.parse(sessionStorage.getItem(timerKey)??'null');
      const index=session.items.findIndex(item=>item.id===saved?.itemId);
      if(index>=0 && Number.isFinite(saved.remaining) && saved.remaining>=0 && (saved.deadline===undefined||Number.isFinite(saved.deadline)))return {...saved,index};
    }catch{/* A missing or invalid timer starts at the first exercise. */}
    return {index:0,remaining:(session.items[0]?.minutes??0)*60,deadline:undefined};
  });
  const [index,setIndex]=useState<number>(restored.index);
  const [remaining,setRemaining]=useState<number>(restored.deadline?Math.max(0,Math.ceil((restored.deadline-Date.now())/1000)):restored.remaining);
  const [deadline,setDeadline]=useState<number|undefined>(restored.deadline);
  useEffect(()=>{
    try{sessionStorage.setItem(timerKey,JSON.stringify({itemId:session.items[index]?.id,remaining,deadline}));}catch{/* The timer continues when browser storage is unavailable. */}
  },[timerKey,index,remaining,deadline,session.items]);
  const item=session.items[index];
  const exercise=exercises.find(e=>e.id===item?.exerciseId);
  const next=exercises.find(e=>e.id===session.items[index+1]?.exerciseId);
  useEffect(()=>{
    if(deadline===undefined)return;
    const interval=setInterval(()=>{
      const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
      setRemaining(seconds);
      if(seconds===0)setDeadline(undefined);
    },200);
    return ()=>clearInterval(interval);
  },[deadline]);
  function go(n:number){setIndex(n);setDeadline(undefined);setRemaining((session.items[n]?.minutes??0)*60);}
  return <div className="page detail stack">
    <a className="back" href="#/treninger"><ChevronLeft size={20}/> Mine treninger</a><p className="muted">{session.name} · {item?index+1:0} av {session.items.length}</p><h1>{exercise?.title??(item?'Øvelse mangler':'Treningen har ingen øvelser')}</h1>
    {item&&<><div className="panel stack timer"><div className="row between wrap"><strong>{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</strong><span>{item.minutes} min planlagt</span></div><div className="row wrap"><button className="primary" disabled={!remaining&&deadline===undefined} onClick={()=>{if(deadline!==undefined){setRemaining(Math.max(0,Math.ceil((deadline-Date.now())/1000)));setDeadline(undefined);}else setDeadline(Date.now()+remaining*1000);}}>{deadline===undefined?(remaining<(item.minutes*60)&&remaining>0?'Fortsett':'Start'):'Pause'}</button><button onClick={()=>go(index)}>Nullstill</button></div></div>
      {item.comment&&<p className="panel">{item.comment}</p>}
      {exercise&&<QuickExercise e={exercise} data={data}/>}
      <p className="muted">{next?'Neste: '+next.title:'Siste øvelse'}</p><div className="row between"><button disabled={index===0} onClick={()=>go(index-1)}><ChevronLeft size={18}/> Forrige</button><button disabled={index>=session.items.length-1} onClick={()=>go(index+1)}>Neste <ChevronRight size={18}/></button></div>
    </>}
  </div>;
}
