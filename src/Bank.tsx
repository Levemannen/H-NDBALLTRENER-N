import {useMemo,useState} from 'react';
import {Bookmark,ChevronLeft,ChevronRight,Clipboard,Search,SlidersHorizontal,Target,Timer,Users,TrafficCone} from 'lucide-react';
import raw from './bank.json';
import {type Data,type Exercise,type Annotation,halls,intro,matches,norm,section,uid} from './model';
import {DiagramCard,DiagramEditor,diagramFor} from './Court';

export const standard:Exercise[]=raw.exercises;
const difficulty=['Lett','Middels','Krevende'];
export const annotation:Annotation={note:'',variant:'',difficulty:''};
export function ExercisePicker({exercises,onSelect}:{exercises:Exercise[];onSelect:(e:Exercise)=>void}){
  const [q,set]=useState('');
  const filtered=exercises.filter(e=>!e.unresolved&&matches(e,q));
  return <div className="stack"><label>Søk etter øvelser<input type="search" value={q} onChange={e=>set(e.target.value)} placeholder="Navn, kategori eller ferdighet"/></label><div className="picker">{filtered.map(e=><button key={e.id} type="button" onClick={()=>onSelect(e)}>{e.title}<span>{e.minutes?e.minutes.join('–')+' min':'Velg'} <ChevronRight size={16}/></span></button>)}{!filtered.length&&<p>Ingen treff.</p>}</div></div>;
}
export function Bank({exercises,data,update}:{exercises:Exercise[];data:Data;update:(fn:(d:Data)=>Data)=>void}){
  const [filter,set]=useState({q:'',category:'',skill:'',players:'',hall:'',minutes:'',difficulty:'',equipment:'',favorite:false});
  const [create,setCreate]=useState(false);
  const [title,setTitle]=useState('');
  const [desc,setDesc]=useState('');
  const cats=useMemo(()=>[...new Set(exercises.flatMap(e=>e.categories))].sort((a,b)=>a.localeCompare(b,'nb')),[exercises]);
  const skills=useMemo(()=>[...new Set(exercises.flatMap(e=>e.skills))].sort((a,b)=>a.localeCompare(b,'nb')),[exercises]);
  const filtered=exercises.filter(e=>matches(e,filter.q)&&(!filter.category||e.categories.includes(filter.category))&&(!filter.skill||e.skills.includes(filter.skill))&&(!filter.players||(e.players&&Number(filter.players)>=e.players[0]&&Number(filter.players)<=e.players[1]))&&(!filter.minutes||(e.minutes&&Number(filter.minutes)>=e.minutes[0]&&Number(filter.minutes)<=e.minutes[1]))&&(!filter.hall||e.halls?.includes(filter.hall))&&(!filter.equipment||norm(section(e,'Du trenger').join(' ')).includes(norm(filter.equipment)))&&(!filter.difficulty||data.notes[e.id]?.difficulty===filter.difficulty)&&(!filter.favorite||data.favorites.includes(e.id)));
  return <div className="page stack">
    <div className="heading row between"><h1>Øvelsesbank</h1><button onClick={()=>setCreate(!create)}>{create?'Lukk':'Ny øvelse'}</button></div>
    {create&&<form className="panel stack" onSubmit={event=>{event.preventDefault();if(!title.trim())return;const e:Exercise={id:'egen-'+uid(),title:title.trim(),categories:['Egne øvelser'],skills:[],sections:[{label:'Kort forklart',lines:[desc]}]};update(d=>({...d,exercises:[...d.exercises,e]}));location.hash='/ovelse/'+e.id;}}><label>Navn<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Kort forklart<textarea value={desc} onChange={e=>setDesc(e.target.value)}/></label><button className="primary">Lagre øvelse</button></form>}
    <label className="search"><Search size={21}/><input aria-label="Søk i øvelsesbanken" type="search" placeholder="Søk etter en øvelse" value={filter.q} onChange={e=>set({...filter,q:e.target.value})}/></label>
    <details className="panel"><summary><SlidersHorizontal size={20}/> Filtre</summary><div className="fields">
      {([['category','Kategori',cats],['skill','Ferdighet',skills],['hall','Hallstørrelse',halls],['difficulty','Egen vanskelighetsgrad',difficulty]] as const).map(([k,label,options])=><label key={k}>{label}<select value={filter[k]} onChange={e=>set({...filter,[k]:e.target.value})}><option value="">Alle</option>{options.map(o=><option key={o}>{o}</option>)}</select></label>)}
      {([['players','Antall spillere'],['minutes','Varighet i minutter'],['equipment','Utstyr']] as const).map(([k,label])=><label key={k}>{label}<input type={k==='equipment'?'search':'number'} min="1" value={filter[k]} onChange={e=>set({...filter,[k]:e.target.value})}/></label>)}
    </div></details>
    <div className="row between"><p className="muted" aria-live="polite">{filtered.length} øvelser</p><label className="check"><input type="checkbox" checked={filter.favorite} onChange={e=>set({...filter,favorite:e.target.checked})}/> Favoritter</label></div>
    <div className="cards">{filtered.map(e=><a className="panel exercise-card" key={e.id} href={'#/ovelse/'+e.id}><div className="row between"><span className="chip">{e.categories.slice(0,2).join(' / ')||'Øvelse'}</span>{data.favorites.includes(e.id)&&<Bookmark size={18} fill="currentColor"/>}</div><h2>{e.number&&<small>{e.number}. </small>}{e.title}</h2><p>{intro(e)}</p><div className="row between muted"><span>{e.minutes?e.minutes.join('–')+' min':e.unresolved?'Må avklares':e.bank}</span><ChevronRight size={19}/></div></a>)}</div>
    {!filtered.length&&<p>Ingen øvelser passer med søket og filtrene.</p>}
    <details className="panel"><summary><Clipboard size={19}/> Slik brukes øvelsesbanken</summary>{raw.guides.filter(g=>['Slik brukes banken','Kildegrunnlag og redaksjonelle prinsipper'].includes(g.title)).map(g=><div key={g.id}>{g.sections.map((s,i)=><div key={i}>{s.label&&<h3>{s.label}</h3>}<Lines lines={s.lines}/></div>)}</div>)}</details>
  </div>;
}
export function Lines({lines}:{lines:string[]}){
  return <div className="lines">{lines.map((line,i)=>{
    const numbered=/^(\d+)\. (.*)$/.exec(line);
    return numbered?<p className="step" key={i}><span>{numbered[1]}</span>{numbered[2]}</p>:<p key={i}>{line}</p>;
  })}</div>;
}
export function Focus({lines}:{lines:string[]}){
  return !!lines.length&&<div className="focus"><Target size={30}/><div><h3>Trenerfokus</h3><Lines lines={lines.map(l=>l.replace(/^👉\s*/,''))}/></div></div>;
}
export function QuickExercise({e,data}:{e:Exercise;data:Data}){
  const rules=section(e,'Slik gjør dere');
  const variant=e.id==='master-16'?e.sections.find(s=>s.label.startsWith('Variant – uten rekker'))?.lines:undefined;
  const focus=variant?.filter(line=>line.startsWith('Variantfokus:')).map(line=>line.replace('Variantfokus: ',''))??section(e,'Trenerens fokus');
  return <div className="stack"><DiagramCard diagram={diagramFor(e.id,data.diagrams)}/><div><h2>{variant?'Varianten med én tom kjegle':'Slik gjør dere'}</h2><Lines lines={variant?.filter(line=>!line.startsWith('Variantfokus:'))??(rules.length?rules:section(e,'Kort forklart'))}/></div><Focus lines={focus}/></div>;
}
export function Detail({e,data,update,add}:{e:Exercise;data:Data;update:(fn:(d:Data)=>Data)=>void;add:(e:Exercise)=>void}){
  const [quick,setQuick]=useState(false);
  const [editing,setEditing]=useState(false);
  const note=data.notes[e.id]??annotation;
  const favorite=data.favorites.includes(e.id);
  const diagram=diagramFor(e.id,data.diagrams);
  const setNote=(patch:Partial<Annotation>)=>update(d=>({...d,notes:{...d.notes,[e.id]:{...(d.notes[e.id]??annotation),...patch}}}));
  const equipment=section(e,'Du trenger');
  const focus=section(e,'Trenerens fokus');
  const rules=section(e,'Slik gjør dere');
  const sections=e.sections.filter(s=>!['Kort forklart','Slik gjør dere','Trenerens fokus','Du trenger'].includes(s.label));
  return <div className="page detail stack">
    <div className="row between detail-nav"><a href="#/ovelser"><ChevronLeft size={23}/> Øvelsesbank</a><button className="icon-button" title="Favoritt" aria-label="Favoritt" aria-pressed={favorite} onClick={()=>update(d=>({...d,favorites:favorite?d.favorites.filter(id=>id!==e.id):[...d.favorites,e.id]}))}><Bookmark fill={favorite?'currentColor':'none'}/></button></div>
    <div className="heading"><span className="chip">{e.categories.slice(0,3).join(' / ')||'Øvelse'}</span><h1>{e.title}</h1>{e.number&&<p className="muted">Øvelse {e.number} · Master v3</p>}{e.unresolved&&<p className="muted">Merket som uavklart i kilden</p>}</div>
    <div className="row wrap"><button className="primary" onClick={()=>add(e)}>Legg til i trening</button><button onClick={()=>setQuick(!quick)}>{quick?'Full visning':'Hurtigvisning'}</button></div>
    {quick?<QuickExercise e={e} data={data}/>:<>
      <DiagramCard diagram={diagram}/>
      {e.id==='master-16'&&<p className="muted">Illustrasjonen viser varianten med én tom kjegle.</p>}
      {editing?<DiagramEditor initial={diagram} onClose={()=>setEditing(false)} onSave={d=>{update(s=>({...s,diagrams:{...s.diagrams,[e.id]:d}}));setEditing(false);}}/>:<button onClick={()=>setEditing(true)}>{diagram?'Rediger illustrasjon':'Lag illustrasjon'}</button>}
      {(e.meta||equipment.length>0)&&<div className="meta">{e.players&&<div><Users/><span><strong>{e.players.join('–')}</strong><br/>{e.meta?.includes('keepere')?'keepere':'spillere'}</span></div>}{e.minutes&&<div><Timer/><span><strong>{e.minutes.join('–')}</strong><br/>min</span></div>}{!!equipment.length&&<div><TrafficCone/><span>{equipment.join(' ')}</span></div>}</div>}
      {e.meta&&<p className="muted">{e.meta}</p>}
      <div><h2>Kort forklart</h2><Lines lines={section(e,'Kort forklart')}/></div>
      {!!rules.length&&<div><h2>Slik gjør dere</h2><Lines lines={rules}/></div>}
      <Focus lines={focus}/>
      {sections.map((s,i)=><details className="panel" key={i} open={s.label.startsWith('Variant – uten rekker')||undefined}><summary>{s.label||'Merknad'}</summary><Lines lines={s.lines}/></details>)}
      <details className="panel"><summary>Egne opplysninger</summary><div className="stack"><label>Egne notater<textarea value={note.note} onChange={event=>setNote({note:event.target.value})}/></label><label>Egen variant<textarea value={note.variant} onChange={event=>setNote({variant:event.target.value})}/></label><label>Egen vanskelighetsgrad<select value={note.difficulty} onChange={event=>setNote({difficulty:event.target.value})}><option value="">Ikke angitt</option>{difficulty.map(v=><option key={v}>{v}</option>)}</select></label>{e.id.startsWith('egen-')&&<><label>Navn på egen øvelse<input value={e.title} onChange={event=>update(d=>({...d,exercises:d.exercises.map(x=>x.id===e.id?{...x,title:event.target.value}:x)}))}/></label><label>Beskrivelse<textarea value={intro(e)} onChange={event=>update(d=>({...d,exercises:d.exercises.map(x=>x.id===e.id?{...x,sections:[{label:'Kort forklart',lines:[event.target.value]}]}:x)}))}/></label></>}</div></details>
    </>}
  </div>;
}
