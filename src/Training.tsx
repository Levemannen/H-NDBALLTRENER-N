import {sessionEdit,applySessionEdit} from './sessionEdits';
import {useSessionEdits} from './useSessionEdits';
import {changeAttendance} from './sessionAttendance';
import {SessionHistory} from './SessionHistory';
import {SessionTimeline} from './SessionTimeline';
import {SessionPlayers} from './SessionPlayers';
import {fillSession,optimizeTime,sessionCheck,equipmentList,planningPreferences} from './sessionPlanning';
import {replaceExercise,statusOf,plannedMinutes} from './sessionFlow';
import {rememberPlan,adjustRemaining} from './planB';
import {planningReason} from './planningMeta';
import {useEffect,useMemo,useState} from 'react';
import {ArrowDown,ArrowUp,CalendarDays,ChevronLeft,ChevronRight,Clock3,Play,Plus,Trash2,GripVertical} from 'lucide-react';
import {type Data,type Exercise,type Session,itemFor,suggest,total,uid,dateToday,halls,norm,cloneSession,activePlayers,playerCount,fits,alternatives,section} from './model';
import {ExercisePicker,QuickExercise} from './Bank';
import {variants} from './variants';
import {ShareSession} from './ShareSession';
import {QuickBank} from './QuickBank';

export function Attendance({data,selected,change}:{data:Data;selected:string[];change:(ids:string[])=>void}){
  return <div className="stack"><div className="row between wrap"><strong>{selected.filter(id=>data.players.some(p=>p.id===id)).length} valgt</strong><div className="row wrap"><button type="button" onClick={()=>change(activePlayers(data).map(p=>p.id))}>Velg alle</button><button type="button" onClick={()=>change([])}>Tøm</button></div></div>
    {data.players.length?<div className="attendance">{data.players.filter(p=>!p.archived||selected.includes(p.id)).map(p=><label className="check" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>change(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}{p.archived?' (arkivert)':''}</label>)}</div>:<p className="muted">Registrer spillere under Mitt lag.</p>}
  </div>;
}
export function Planner({draft,set,exercises,data,save,start,notify,newDraft,personalize}:{newDraft:()=>void;personalize:boolean;draft:Session;set:(s:Session|((s:Session)=>Session))=>void;exercises:Exercise[];data:Data;save:()=>void;start?:()=>void;notify:(message:string)=>void}){

  const [advanced,setAdvanced]=useState(false);
  const [picker,setPicker]=useState<-1|number>();
  const [insertMode,setInsertMode]=useState<'replace'|'before'|'after'>('replace');
  const [reuse,setReuse]=useState('');
  const [drag,setDrag]=useState<number>();
  const [message,setMessage]=useState('');
  const catalog=useMemo(()=>exercises.map(e=>data.notes[e.id]?.metadata?{...e,...data.notes[e.id].metadata}:e),[exercises,data.notes]);
  const history=useSessionEdits(fn=>set(fn),setMessage);
  const change=(patch:Partial<Session>)=>{const edit=sessionEdit(draft,{...draft,...patch});return history.change(current=>applySessionEdit(current,edit,false));};
  function move(from:number,to:number){
    if(to<0||to>=draft.items.length||from===to)return;
    const items=[...draft.items];
    items.splice(to,0,items.splice(from,1)[0]);
    change({items});
  }
  function generate(newVariant=false){
    const items=fillSession(draft,catalog,data,false,personalize,newVariant);
    if(!items.length){setMessage('Ingen øvelser passer med rammene. Endre antall spillere, hall eller varighet.');return;}

    if(newVariant&&items.every((i,n)=>i.exerciseId===draft.items[n]?.exerciseId)&&items.length===draft.items.length){setMessage('Ingen ny relevant variant er tilgjengelig med disse rammene og låsene. Planen er beholdt.');return;}
    change({items});
    const difference=draft.duration-plannedMinutes({...draft,items});
    setMessage(difference?'Forslaget har '+difference+' minutter ledig tid. Du kan justere planen.':'Forslaget er lagt inn og kan redigeres.');
  }
  return <form className="page stack" onSubmit={e=>{e.preventDefault();save();}}>
    <div className="heading"><h1>{draft.template?'Rediger treningsmal':'Lag trening'}</h1></div>
    <div className="row wrap"><button type="button" onClick={()=>setAdvanced(!advanced)}>{advanced?'Hurtigplanlegging':'Avansert planlegging'}</button><button type="button" disabled={!history.canUndo} onClick={history.undo}>Angre planendring</button></div><ShareSession session={draft} team={data.team} exercises={exercises}/><section className="panel stack"><h2>Øktdetaljer</h2><div className="fields">
      <label>Navn<input value={draft.name} onChange={e=>change({name:e.target.value})} placeholder={'Trening '+draft.date}/></label>
      <label>Starttid (valgfritt)<input type="time" value={draft.startTime??''} onChange={e=>change({startTime:e.target.value||undefined})}/></label><label>Dato<input required type="date" value={draft.date} onChange={e=>change({date:e.target.value})}/></label>
      {([['duration','Planlagt varighet (min)',1],['players','Forventet spillerantall',0],['coaches','Antall trenere',0]] as const).map(([key,label,min])=><label key={key}>{label}<input type="number" min={min} required value={draft[key]} onChange={e=>change({[key]:Math.max(min,Number(e.target.value))})}/></label>)}
      <label>Hallstørrelse<select value={draft.hall} onChange={e=>change({hall:e.target.value})}>{halls.map(h=><option key={h} value={h}>{h[0].toUpperCase()+h.slice(1)}</option>)}</select></label>
      <label hidden={!advanced}>Treningsfokus<input value={draft.focus} onChange={e=>change({focus:e.target.value})} placeholder="F.eks. pasning og mottak"/></label>
    </div></section>
    <p className="muted">{(draft.attendanceRegistered||draft.attendees.length)?`Registrert oppmøte: ${playerCount(draft)} spillere. Dette antallet brukes i forslag.`:`Ingen oppmøteliste registrert. Forslag bruker ${draft.players} forventede spillere.`}</p><details className="panel"><summary>Oppmøte ({draft.attendees.length})</summary><Attendance data={data} selected={draft.attendees} change={attendees=>history.change(current=>changeAttendance(current,attendees))}/><details><summary>Organiser lag i denne treningen</summary><SessionPlayers session={draft} data={data} save={fn=>history.change(fn)}/></details></details>
    <SessionTimeline session={draft} exercises={catalog} save={fn=>history.change(fn)}/><details className="panel"><summary>Øktkontroll og utstyr</summary>{sessionCheck(draft,catalog).map((r,i)=><p key={i}>{({fact:'Registrert',advice:'Vurder',unknown:'Uavklart',good:'Bra'})[r.kind]}: {r.text}</p>)}<h3>Utstyr og rigging</h3><p>Utstyr kan gjenbrukes mellom øvelser. Mengdene nedenfor summeres ikke. Kontroller samtidig behov ved stasjoner.</p>{equipmentList(draft,catalog).map(line=><p key={line}>{line}</p>)}{!equipmentList(draft,catalog).length&&<p>Utstyr er ikke dokumentert.</p>}</details><section className="stack">
      <div className="row between wrap"><h2>Øvelser</h2><span className="chip"><Clock3 size={17}/> {plannedMinutes(draft)} av {draft.duration} min · {Math.abs(draft.duration-plannedMinutes(draft))} min {plannedMinutes(draft)>draft.duration?'over tiden':'ledig'}</span></div>
      <div className="row wrap"><button type="button" onClick={()=>setPicker(picker===-1?undefined:-1)}><Plus size={18}/> Legg til øvelse</button><button type="button" onClick={()=>generate()}>Foreslå trening</button><button type="button" onClick={()=>generate(true)}>Foreslå ny variant</button></div>
      <label>Repetisjon og variasjon<select value={draft.variety??'balanced'} onChange={e=>change({variety:e.target.value as Session['variety']})}><option value="known">Kjente øvelser</option><option value="balanced">Balanse</option><option value="new">Nye øvelser</option></select></label><div className="row wrap"><button type="button" onClick={()=>change({items:fillSession(draft,catalog,data,true,personalize)})}>Fyll ledig tid</button><button type="button" onClick={()=>{const items=optimizeTime(draft,catalog);change({items});const delta=draft.duration-plannedMinutes({...draft,items});setMessage(delta?'Målvarigheten kan ikke nås innenfor låser og kjente varigheter. Avvik: '+delta+' min.':'Varigheten er tilpasset.');}}>Tilpass varighet</button></div>{message&&<p role="status">{message}</p>}
      <div className={picker!==undefined?'plan-columns':'stack'}>
      {picker!==undefined&&<div className="panel stack plan-picker"><div className="row between"><h3>{picker===-1?'Legg til øvelse':insertMode==='before'?'Sett inn før':insertMode==='after'?'Sett inn etter':'Bytt øvelse'}</h3><button type="button" onClick={()=>setPicker(undefined)}>Lukk</button></div><ExercisePicker data={data} onSelectMany={picker===-1||insertMode!=='replace'?chosen=>{const target=draft.items[picker]?.id;history.change(current=>{const targetIndex=current.items.findIndex(i=>i.id===target);const at=picker===-1?current.items.length:targetIndex+(insertMode==='after'?1:0);if(picker!==-1&&targetIndex<0)throw Error('Øvelsen er fjernet. Åpne velgeren igjen.');return {...current,items:[...current.items.slice(0,at),...chosen.map(e=>itemFor(e)),...current.items.slice(at)]};});notify(chosen.length+' øvelser lagt til');setPicker(undefined);}:undefined} session={draft} favorites={data.favorites} key={picker} exercises={catalog} onSelect={e=>{
        const target=draft.items[picker]?.id;history.change(current=>{if(picker===-1)return {...current,items:[...current.items,itemFor(e)]};const at=current.items.findIndex(i=>i.id===target);if(at<0)throw Error('Øvelsen er fjernet. Åpne velgeren på nytt.');if(insertMode==='replace')return {...current,items:current.items.map(i=>i.id===target?replaceExercise(i,e.id):i)};const position=at+(insertMode==='after'?1:0);return {...current,items:[...current.items.slice(0,position),itemFor(e),...current.items.slice(position)]};});
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
            const time=h*60+m+draft.items.slice(0,i).reduce((sum,x)=>sum+x.minutes+(x.transition??0),0)+offset;
            return String(Math.floor(time/60)%24).padStart(2,'0')+':'+String(time%60).padStart(2,'0');
          }).join(' – ')}</p>}
          {exercise&&<p className="muted">{planningReason(catalog.find(e=>e.id===exercise.id)!,draft.coaches,personalize&&data.favorites.includes(exercise.id),personalize&&planningPreferences(data,draft).successful.includes(exercise.id))}</p>}<div className="fields">{exercise&&<label>Variant<select aria-label="Variant" value={item.variant??''} onChange={e=>update({variant:e.target.value||undefined})}><option value="">Grunnøvelse</option>{variants(exercise).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>}<label>Minutter<input type="number" required min="1" value={item.minutes} onChange={e=>update({minutes:Math.max(1,Number(e.target.value))})}/></label><label>Kommentar<input value={item.comment} onChange={e=>update({comment:e.target.value})}/></label></div>
          <label className="check"><input type="checkbox" checked={Boolean(item.locked)} onChange={e=>update({locked:e.target.checked})}/> Lås øvelse ved nye forslag</label>{advanced&&<><label>Overgang / rigging (min)<input type="number" min="0" value={item.transition??0} onChange={e=>update({transition:Math.max(0,Math.floor(Number(e.target.value)))})}/></label><label>Lagoppsett for øvelsen<select value={item.allocationId??''} onChange={e=>update({allocationId:e.target.value||undefined})}><option value="">Ingen kobling</option>{draft.allocations?.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></>}<div className="row wrap"><button type="button" onClick={()=>{setInsertMode('replace');setPicker(i);}}>Bytt øvelse</button><button type="button" onClick={()=>{setInsertMode('before');setPicker(i);}}>Sett inn før</button><button type="button" onClick={()=>{setInsertMode('after');setPicker(i);}}>Sett inn etter</button><button type="button" onClick={()=>change({items:[...draft.items.slice(0,i+1),{...item,id:uid()},...draft.items.slice(i+1)]})}>Dupliser øvelse</button>{exercise&&<a className="button" href={'#/ovelse/'+exercise.id}>Vis beskrivelse</a>}</div>
          {exercise&&!fits(catalog.find(e=>e.id===exercise.id)!,draft)&&<p className="notice">Registrerte rammer passer ikke med denne øvelsen. Du kan beholde den eller velge et alternativ.</p>}
          {exercise&&<details><summary>Foreslå alternativ</summary>{alternatives(catalog.find(e=>e.id===exercise.id)!,draft,catalog).map(e=><button type="button" key={e.id} onClick={()=>update({exerciseId:e.id,variant:undefined,comment:''})}>{e.title} · Felles ferdighet eller kategori{e.players?' · '+e.players.join('–')+' spillere':''}</button>)}</details>}
        </div>;
      })}
      </div></div>
    </section>
    <div className="row wrap"><button className="primary">Lagre {draft.template?'mal':'trening'}</button><button type="button" onClick={newDraft}>Ny trening</button>{start&&<button type="button" disabled={!draft.items.length||draft.template} onClick={start}>Lagre og start trening</button>}</div>
  </form>;
}
export function Saved({data,edit,update,exercises,drafts=[],targets=[],copyTo}:{data:Data;drafts?:Session[];targets?:{id:string;name:string}[];copyTo?:(s:Session,teamId:string)=>void;exercises:Exercise[];edit:(s:Session)=>void;update:(fn:(d:Data)=>Data)=>void}){
  const [q,set]=useState('');
  const [mode,setMode]=useState('all');
  const [hall,setHall]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[maxMinutes,setMaxMinutes]=useState('');
  const filtered=data.sessions.filter(s=>(!hall||s.hall===hall)&&(!from||s.date>=from)&&(!to||s.date<=to)&&(!maxMinutes||plannedMinutes(s)<=Number(maxMinutes))&&(!s.archived||mode==='archived')&&(mode==='archived'?s.archived:mode==='favorites'?s.favorite:mode==='running'?statusOf(s)==='Pågår':mode==='completed'?s.completed:(mode==='all'||(mode==='templates'?s.template:!s.template&&(mode==='upcoming'?s.date>=dateToday():mode==='past'?s.date<dateToday():true))))&&norm([s.name,s.date,s.focus,...s.items.map(i=>exercises.find(e=>e.id===i.exerciseId)?.title??'')].join(' ')).includes(norm(q.trim()))).sort((a,b)=>b.date.localeCompare(a.date));
  return <div className="page stack"><div className="heading row between wrap"><h1>Mine treninger</h1><a className="button primary" href="#/lag-trening"><Plus size={18}/> Lag trening</a></div>
    <div className="fields"><label>Søk<input type="search" value={q} onChange={e=>set(e.target.value)} placeholder="Navn, dato eller fokus"/></label><label>Vis<select value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Alle</option><option value="sessions">Treninger</option><option value="upcoming">Kommende</option><option value="past">Tidligere</option><option value="templates">Maler</option><option value="running">Pågående</option><option value="completed">Gjennomførte</option><option value="archived">Arkiverte</option><option value="favorites">Favorittøkter</option></select></label></div>
    <details className="panel"><summary>Flere treningsfiltre</summary><div className="fields"><label>Hallfilter<select value={hall} onChange={e=>setHall(e.target.value)}><option value="">Alle</option>{halls.map(h=><option key={h}>{h}</option>)}</select></label><label>Fra dato<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Til dato<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label>Maks minutter<input type="number" min="1" value={maxMinutes} onChange={e=>setMaxMinutes(e.target.value)}/></label></div></details><details className="panel"><summary>Utkast ({drafts.length})</summary>{drafts.map(d=><button type="button" key={d.id} onClick={()=>edit(d)}>{d.name||'Uten navn'} · {d.date}</button>)}</details>{!filtered.length&&<p className="panel muted">{data.sessions.length?'Ingen treff.':'De lagrede treningene dine vises her.'}</p>}
    <SessionHistory sessions={data.sessions} exercises={exercises}/>{filtered.map(s=><section className="panel stack" key={s.id}><div className="row between wrap"><h2>{s.name}</h2><span className="chip">{statusOf(s)}</span>{s.template&&<span className="chip">Mal</span>}</div><p className="row muted"><CalendarDays size={18}/> {s.date} · {s.items.length} øvelser · {total(s)} min</p>{s.focus&&<p className="muted">{s.focus}</p>}
      <label className="check"><input type="checkbox" checked={Boolean(s.completed)} disabled={Boolean(s.runner)} onChange={e=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,completed:e.target.checked}:x)}))}/> Gjennomført</label><ShareSession session={s} team={data.team} exercises={exercises}/><div className="row wrap">{!s.template&&<a className="button primary" href={'#/trening/'+s.id}><Play size={18}/> Treningsvisning</a>}<button onClick={()=>edit(s)}>Åpne / rediger</button><button onClick={()=>edit(cloneSession(s))}>{s.template?'Bruk mal':'Kopier til ny dato'}</button>{!s.template&&<button onClick={()=>edit(cloneSession(s,true))}>Lagre som mal</button>}<button onClick={()=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,archived:!x.archived}:x)}))}>{s.archived?'Gjenopprett':'Arkiver'}</button><button onClick={()=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,favorite:!x.favorite}:x)}))}>{s.favorite?'Fjern øktfavoritt':'Merk øktfavoritt'}</button><button onClick={()=>{if(confirm('Slette «'+s.name+'»?'))update(d=>({...d,sessions:d.sessions.filter(x=>x.id!==s.id)}));}}>Slett</button></div>
      {copyTo&&targets.length>0&&<label>Kopier til et annet lag<select value="" onChange={e=>{if(e.target.value)copyTo(s,e.target.value);}}><option value="">Velg lag</option>{targets.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}{!s.template&&<details><summary>Evaluering etter trening</summary><div className="stack"><label>Hvordan fungerte treningen?<select value={s.evaluation?.rating??''} onChange={e=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,evaluation:{...x.evaluation,note:x.evaluation?.note??'',rating:e.target.value}}:x)}))}><option value="">Ikke vurdert</option><option value="bra">Fungerte bra</option><option value="middels">Fungerte middels</option><option value="dårlig">Fungerte dårlig</option></select></label><label>Eget notat<textarea value={s.evaluation?.note??''} onChange={e=>update(d=>({...d,sessions:d.sessions.map(x=>x.id===s.id?{...x,evaluation:{...x.evaluation,rating:x.evaluation?.rating??'',note:e.target.value}}:x)}))}/></label></div></details>}
    </section>)}
  </div>;
}
export {SessionRunner as HallMode} from './SessionRunner';
