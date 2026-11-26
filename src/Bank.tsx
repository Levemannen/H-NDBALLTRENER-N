import {ExerciseFiltersControl} from './ExerciseFiltersControl';
import {emptyFilters,normalizeFilters,filteredExercises} from './exerciseFilters';
import {plannedMinutes} from './sessionFlow';
export {emptyFilters} from './exerciseFilters';
import {exerciseFit} from './sessionPlanning';
import type {Session} from './model';
import {planningMeta,planningLabels} from './planningMeta';
import {useEffect,useMemo,useState} from 'react';
import {Bookmark,ChevronLeft,ChevronRight,Clipboard,Search,SlidersHorizontal,Target,Timer,Users,TrafficCone} from 'lucide-react';
import raw from './bank.json';
import {type Data,type Exercise,type Annotation,halls,intro,playerCount,norm,section,uid,hallFits} from './model';
import {Court,diagramFor} from './Court';
import {editorial,searchBank,skillNames,typeNames} from './catalog';
import {ExerciseEditor} from './ExerciseEditor';
import {Illustration,illustration} from './Illustration';
import {chosenVariant,variants} from './variants';

export const standard:Exercise[]=raw.exercises;
const difficulty=['Lett','Middels','Krevende'];
export const annotation:Annotation={note:'',variant:'',difficulty:''};
export function ExercisePicker({exercises,onSelect,onSelectMany,favorites=[],session,data}:{exercises:Exercise[];session?:Session;data?:Data;favorites?:string[];onSelect:(e:Exercise)=>void;onSelectMany?:(e:Exercise[])=>void}){
 const [filter,setFilter]=useState(()=>{try{return normalizeFilters(JSON.parse(localStorage.getItem('handball.picker.filters')??'{}'));}catch{return {...emptyFilters};}}),[sort,setSort]=useState('relevance'),[context,setContext]=useState(true),[selected,setSelected]=useState<string[]>([]),[compact,setCompact]=useState(false);
 useEffect(()=>{try{localStorage.setItem('handball.picker.filters',JSON.stringify(filter));}catch{}},[filter]);
 const source=data??{favorites,notes:{},sessions:[]},filtered=filteredExercises(exercises.filter(e=>!e.unresolved),filter,source,sort,context?session:undefined);
 return <div className="stack">{session&&<><p>{session.hall} hall · {playerCount(session)} spillere · {session.coaches} trenere · {session.duration-plannedMinutes(session)} min ledig · {session.focus||'Ingen valgt fokus'}</p><label className="check"><input type="checkbox" checked={context} onChange={e=>setContext(e.target.checked)}/> Bruk øktens rammer som filter</label></>}<ExerciseFiltersControl value={filter} set={setFilter} exercises={exercises} searchLabel="Søk etter øvelser" sort={sort} setSort={setSort}/><label className="check"><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/> Kompakt velger</label><p>{filtered.length} treff</p>{onSelectMany&&<button type="button" disabled={!selected.length} onClick={()=>{onSelectMany(exercises.filter(e=>selected.includes(e.id)));setSelected([]);}}>Velg markerte ({selected.length})</button>}<div className="picker" onScroll={e=>{try{sessionStorage.setItem('handball.picker.scroll',String(e.currentTarget.scrollTop));}catch{}}} ref={element=>{if(element)try{element.scrollTop=Number(sessionStorage.getItem('handball.picker.scroll')??0);}catch{}}}>{filtered.map(e=><article className="picker-card" key={e.id}><h3>{e.title}</h3>{!compact&&<p>{intro(e)}</p>}{session&&<p>{exerciseFit(e,session)}{session.items.some(i=>i.exerciseId===e.id)?' · Allerede valgt':''}</p>}<div className="picker-actions"><span>{e.minutes?e.minutes.join('–')+' min':'Varighet ikke oppgitt'}</span><button type="button" aria-label={'Velg '+e.title} onClick={()=>onSelect(e)}>Velg øvelse <ChevronRight size={16}/></button>{onSelectMany&&<label className="check"><input type="checkbox" checked={selected.includes(e.id)} onChange={event=>setSelected(event.target.checked?[...selected,e.id]:selected.filter(id=>id!==e.id))}/>Velg flere</label>}</div></article>)}{!filtered.length&&<p>Ingen treff. Slå eventuelt av øktens rammefilter.</p>}</div></div>;
}
export function Bank({exercises,data,update,add,notify,filter,set,addMany,undoAdd}:{exercises:Exercise[];data:Data;update:(fn:(d:Data)=>Data)=>boolean;add:(e:Exercise)=>void;notify:(message:string)=>void;filter:typeof emptyFilters;set:(filters:typeof emptyFilters)=>void;addMany?:(items:Exercise[])=>void;undoAdd?:()=>void}){
  const [selection,setSelection]=useState<string[]>([]);
  const [view,setView]=useState(()=>{try{return localStorage.getItem('handball.bank.view')||'cards';}catch{return 'cards';}});
  const [sort,setSort]=useState('relevance');
  useEffect(()=>{try{localStorage.setItem('handball.bank.view',view);}catch{}},[view]);
  useEffect(()=>{let y=0;try{y=Number(sessionStorage.getItem('handball.bank.scroll')??0);}catch{}requestAnimationFrame(()=>window.scrollTo(0,y));return ()=>{};},[]);
  const [create,setCreate]=useState(false);
  const [title,setTitle]=useState('');
  const [desc,setDesc]=useState('');
  const catalog=useMemo(()=>exercises.map(e=>({...e,...data.notes[e.id]?.metadata})),[exercises,data.notes]);
  const displayed=filteredExercises(catalog,filter,data,sort),filtered=displayed;
  return <div className="page stack">
    <a className="button" href="#/fem-min">5 min til overs</a><div className="heading row between"><h1>Øvelsesbank</h1><button onClick={()=>setCreate(!create)}>{create?'Lukk':'Ny øvelse'}</button></div>
    {create&&<form className="panel stack" onSubmit={event=>{
      event.preventDefault();
      if(!title.trim())return;
      const e:Exercise={id:'egen-'+uid(),title:title.trim(),categories:['Egne øvelser'],skills:[],sections:desc.trim()?[{label:'Kort forklart',lines:[desc.trim()]}]:[]};
      if(update(d=>({...d,exercises:[...d.exercises,e]}))){notify('Egen øvelse opprettet');location.hash='/ovelse/'+e.id;}
    }}><label>Navn<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Kort forklart<textarea value={desc} onChange={e=>setDesc(e.target.value)}/></label><button className="primary">Lagre øvelse</button></form>}
    <ExerciseFiltersControl value={filter} set={set} exercises={catalog} searchLabel="Søk i øvelsesbanken" sort={sort} setSort={setSort}/><p className="muted" aria-live="polite">{filtered.length} øvelser</p><label>Visning<select value={view} onChange={e=>setView(e.target.value)}><option value="cards">Kort med illustrasjoner</option><option value="compact">Kompakte kort</option><option value="list">Liste</option></select></label>{addMany&&<div className="row wrap"><button type="button" disabled={!selection.length} onClick={()=>{addMany(catalog.filter(e=>selection.includes(e.id)));setSelection([]);}}>Legg til valgte ({selection.length})</button><button type="button" onClick={undoAdd}>Angre siste tillegg</button></div>}<p className="muted">Hall og trenerfilter inkluderer øvelser med ukjente krav. Kontroller organiseringen før bruk.</p><div className={'cards bank-'+view}>{displayed.map(e=>{
      const diagram=diagramFor(e.id,data.diagrams);
      const favorite=data.favorites.includes(e.id);
      return <article className="panel exercise-card" key={e.id}>
        <div className="row between"><span className="chip">{e.categories[0]||'Øvelse'}</span><button className="icon-button favorite" aria-label={'Favoritt: '+e.title} aria-pressed={favorite} onClick={()=>update(d=>({...d,favorites:favorite?d.favorites.filter(id=>id!==e.id):[...d.favorites,e.id]}))}><Bookmark size={19} fill={favorite?'currentColor':'none'}/></button></div>
        <a className="exercise-link stack" onClick={()=>{try{sessionStorage.setItem('handball.bank.scroll',String(scrollY));}catch{}}} href={'#/ovelse/'+e.id}>{view==='cards'&&diagram&&<div className="exercise-preview"><Court diagram={diagram}/></div>}<h2>{e.number&&<small>{e.number}. </small>}{e.title}</h2>{view!=='list'&&<p>{intro(e)}</p>}<div className="row between muted"><span>{[e.minutes&&e.minutes.join('–')+' min',e.players&&e.players.join('–')+' '+(e.meta?.includes('keepere')?'keepere':'spillere'),e.unresolved&&'Må avklares'].filter(Boolean).join(' · ')}</span><ChevronRight size={19}/></div></a>
        {!e.unresolved&&<div className="row wrap"><button onClick={()=>add(e)}>Legg til i trening</button>{addMany&&<label className="check"><input type="checkbox" checked={selection.includes(e.id)} onChange={event=>setSelection(event.target.checked?[...selection,e.id]:selection.filter(id=>id!==e.id))}/> Velg flere</label>}</div>}
      </article>;
    })}</div>
    {!filtered.length&&<p className="panel muted">{filter.favorite?'Ingen favoritter passer med søket. Bruk bokmerket på en øvelse for å lagre den her.':'Ingen øvelser passer med søket og filtrene.'}</p>}
    <details className="panel"><summary><Clipboard size={19}/> Slik brukes øvelsesbanken</summary>{raw.guides.filter(g=>['Slik brukes banken','Kildegrunnlag og redaksjonelle prinsipper'].includes(g.title)).map(g=><div key={g.id}>{g.sections.map((s,i)=><div key={i}>{s.label&&<h3>{s.label}</h3>}<Lines lines={s.lines}/></div>)}</div>)}</details>
  </div>;
}
export function Lines({lines}:{lines:string[]}){
  return <div className="lines">{lines.map((line,i)=>{
    const numbered=/^(\d+)\. (.*)$/.exec(line);
    const text=numbered?.[2]??line;
    const content=text.split(/(«2 mot 2 – legg ballen i mål»|Planke med ball under navlen)/g).map((part,n)=>{
      const id=part==='«2 mot 2 – legg ballen i mål»'?'master-20':part==='Planke med ball under navlen'?'partner-planke-med-ball-under-navlen':undefined;
      return id?<a className="source-reference" key={n} href={'#/ovelse/'+id}>{part}</a>:part;
    });
    return numbered?<p className="step" key={i}><span>{numbered[1]}</span><span className="step-content">{content}</span></p>:<p key={i}>{content}</p>;
  })}</div>;
}
export function Focus({lines}:{lines:string[]}){
  return !!lines.length&&<div className="focus"><Target size={30}/><div><h3>Trenerfokus</h3><Lines lines={lines.map(l=>l.replace(/^👉\s*/,''))}/></div></div>;
}
export function QuickExercise({e,data,variant:selectedVariant}:{e:Exercise;data:Data;variant?:string}){
  const rules=section(e,'Slik gjør dere');
  const variant=selectedVariant!==undefined?chosenVariant(e,selectedVariant)?.description:e.id==='master-16'?e.sections.find(s=>s.label.startsWith('Variant – uten rekker'))?.lines:undefined;
  const variantFocus=variant?.filter(line=>line.startsWith('Variantfokus:')).map(line=>line.replace('Variantfokus: ',''));
  const focus=variantFocus?.length?variantFocus:section(e,'Trenerens fokus');
  return <div className="stack"><Illustration e={e} data={data} variant={selectedVariant}/><div><h2>{variant?(chosenVariant(e,selectedVariant)?.name||'Varianten med én tom kjegle'):'Slik gjør dere'}</h2><Lines lines={variant?.filter(line=>!line.startsWith('Variantfokus:'))??(rules.length?rules:section(e,'Kort forklart'))}/></div><Focus lines={focus}/></div>;
}
export function Detail({e,data,update,add,notify}:{e:Exercise;data:Data;update:(fn:(d:Data)=>Data)=>boolean;add:(e:Exercise)=>void;notify:(message:string)=>void}){
  const [quick,setQuick]=useState(false);
  const [selectedDiagramVariant,setSelectedDiagramVariant]=useState(e.id==='master-16'?variants(e)[0]?.id??'':'');
  const [editingMetadata,setEditingMetadata]=useState(false);
  const note=data.notes[e.id]??annotation;
  const favorite=data.favorites.includes(e.id);
  const diagram=diagramFor(e.id,data.diagrams);
  const setNote=(patch:Partial<Annotation>)=>update(d=>({...d,notes:{...d.notes,[e.id]:{...(d.notes[e.id]??annotation),...patch}}}));
  const equipment=section(e,'Du trenger');
  const focus=section(e,'Trenerens fokus');
  const rules=section(e,'Slik gjør dere');
  const shown={...e,...note.metadata};
  const sections=e.sections.filter(s=>!['Kort forklart','Hva trener vi?','Slik setter du opp','Slik gjør dere','Trenerens fokus','Du trenger'].includes(s.label));
  function duplicate(){
    const id='egen-'+uid();
    const copy:Exercise={id,title:e.title+' – kopi',categories:shown.categories,skills:shown.skills,skillTags:shown.skillTags,types:shown.types,players:shown.players,minutes:shown.minutes,halls:shown.halls,coaches:shown.coaches,sections:structuredClone(e.sections)};
    if(update(d=>({...d,exercises:[...d.exercises,copy],diagrams:diagram?{...d.diagrams,[id]:structuredClone(diagram)}:d.diagrams,diagramSteps:illustration(e,data,selectedDiagramVariant).frames.length?{...d.diagramSteps,[id]:structuredClone(illustration(e,data,selectedDiagramVariant).frames)}:d.diagramSteps}))){
      notify('Egen øvelse opprettet');
      location.hash='/ovelse/'+id;
    }
  }
  return <div className="page detail stack">
    <div className="row between detail-nav"><a href="#/ovelser"><ChevronLeft size={23}/> Øvelsesbank</a><button className="icon-button" title="Favoritt" aria-label="Favoritt" aria-pressed={favorite} onClick={()=>update(d=>({...d,favorites:favorite?d.favorites.filter(id=>id!==e.id):[...d.favorites,e.id]}))}><Bookmark fill={favorite?'currentColor':'none'}/></button></div>
    <div className="heading"><span className="chip">{shown.categories.slice(0,3).join(' / ')||'Øvelse'}</span><h1>{e.title}</h1>{e.number&&<p className="muted">Øvelse {e.number} · Master v3</p>}{e.unresolved&&<p className="muted">Merket som uavklart i kilden</p>}</div>
    <div className="row wrap">{!e.unresolved&&<button className="primary" onClick={()=>add(shown)}>Legg til i trening</button>}<button onClick={()=>setQuick(!quick)}>{quick?'Full visning':'Hurtigvisning'}</button></div>
    {quick?<QuickExercise e={e} data={data}/>:<>
      <label>Illustrasjon for<select value={selectedDiagramVariant} onChange={event=>setSelectedDiagramVariant(event.target.value)}><option value="">Grunnøvelse</option>{variants(e).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label><Illustration key={selectedDiagramVariant} e={e} data={data} update={update} variant={selectedDiagramVariant}/>
      {(e.meta||equipment.length>0)&&<div className="meta">{e.players&&<div><Users/><span><strong>{e.players.join('–')}</strong><br/>{e.meta?.includes('keepere')?'keepere':'spillere'}</span></div>}{e.minutes&&<div><Timer/><span><strong>{e.minutes.join('–')}</strong><br/>min</span></div>}{!!equipment.length&&<div><TrafficCone/><span>{equipment.join(' ')}</span></div>}</div>}
      {e.meta&&<p className="muted">{e.meta}</p>}
      {note.metadata&&<div className="muted"><strong>Egne metadata</strong><p>{[shown.players&&shown.players.join('–')+' spillere',shown.minutes&&shown.minutes.join('–')+' min',shown.halls?.length&&shown.halls.join(', '),shown.coaches&&shown.coaches+' trener(e)'].filter(Boolean).join(' · ')}</p></div>}
      {!!section(e,'Kort forklart').length&&<div><h2>Kort forklart</h2><Lines lines={section(e,'Kort forklart')}/></div>}
      {!!section(e,'Hva trener vi?').length&&<div><h2>Hva trener vi?</h2><Lines lines={section(e,'Hva trener vi?')}/></div>}
      {!!section(e,'Slik setter du opp').length&&<details className="panel"><summary>Utstyr og organisering</summary><Lines lines={[...equipment,...section(e,'Slik setter du opp')]}/></details>}
      {!!rules.length&&<div><h2>Slik gjør dere</h2><Lines lines={rules}/></div>}
      <Focus lines={focus}/>
      {sections.map((s,i)=><details className="panel" key={i} open={s.label.startsWith('Variant – uten rekker')||undefined}><summary>{s.label||'Merknad'}</summary><Lines lines={s.lines}/></details>)}
      <details className="panel"><summary>Planleggingsgrunnlag</summary><p>Spillerantall, varighet, hall og utstyr over er fra kilden. Vurderinger nedenfor er veiledning.</p>{Object.entries(planningLabels).map(([key,label])=>{const meta=planningMeta(shown),value=meta[key as keyof typeof planningLabels];return <p key={key}><strong>{label}:</strong> {value===undefined?'Ukjent':Array.isArray(value)?value.join(', '):typeof value==='boolean'?value?'Ja':'Nei':value} · {meta.provenance?.[key]??(value===undefined?'Ukjent':'Redaksjonell vurdering')}</p>;})}</details><details className="panel"><summary>Egne opplysninger</summary><div className="stack">
        <label>Egne notater<textarea value={note.note} onChange={event=>setNote({note:event.target.value})}/></label>
        <label>Egen variant<textarea value={note.variant} onChange={event=>setNote({variant:event.target.value})}/></label>
        <label>Egen vanskelighetsgrad<select value={note.difficulty} onChange={event=>setNote({difficulty:event.target.value})}><option value="">Ikke angitt</option>{difficulty.map(v=><option key={v}>{v}</option>)}</select></label>
        <div className="row wrap"><button onClick={()=>setEditingMetadata(true)}>{e.id.startsWith('egen-')?'Rediger øvelse':'Rediger egne metadata'}</button><button onClick={duplicate}>Dupliser som egen øvelse</button></div>
      </div></details>
      {editingMetadata&&<ExerciseEditor exercise={e} metadata={note.metadata} onClose={()=>setEditingMetadata(false)} onSave={(metadata,own)=>{
        const saved=own?update(d=>({...d,exercises:d.exercises.map(x=>x.id===own.id?own:x)})):setNote({metadata});
        if(saved)notify(own?'Øvelse lagret':'Metadata lagret');
        return saved;
      }}/>}
    </>}
  </div>;
}
