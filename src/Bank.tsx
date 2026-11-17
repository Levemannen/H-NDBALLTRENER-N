import {useMemo,useState} from 'react';
import {Bookmark,ChevronLeft,ChevronRight,Clipboard,Search,SlidersHorizontal,Target,Timer,Users,TrafficCone} from 'lucide-react';
import raw from './bank.json';
import {type Data,type Exercise,type Annotation,halls,intro,norm,section,uid,hallFits} from './model';
import {Court,DiagramCard,DiagramEditor,diagramFor} from './Court';
import {editorial,searchBank,skillNames,typeNames} from './catalog';
import {ExerciseEditor} from './ExerciseEditor';

export const standard:Exercise[]=raw.exercises;
const difficulty=['Lett','Middels','Krevende'];
export const annotation:Annotation={note:'',variant:'',difficulty:''};
export function ExercisePicker({exercises,onSelect,favorites=[]}:{exercises:Exercise[];favorites?:string[];onSelect:(e:Exercise)=>void}){
  const [q,set]=useState('');
  const [favorite,setFavorite]=useState(false);
  const [category,setCategory]=useState('');
  const filtered=searchBank(exercises.filter(e=>!e.unresolved&&(!favorite||favorites.includes(e.id))&&(!category||e.categories.includes(category))),q);
  return <div className="stack"><label>Søk etter øvelser<input type="search" value={q} onChange={e=>set(e.target.value)} placeholder="Navn, kategori eller ferdighet"/></label><label>Kategori<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Alle</option>{[...new Set(exercises.flatMap(e=>e.categories))].map(c=><option key={c}>{c}</option>)}</select></label><label className="check"><input type="checkbox" checked={favorite} onChange={e=>setFavorite(e.target.checked)}/> Favoritter</label><p>{filtered.length} treff</p><div className="picker">{filtered.map(e=><button key={e.id} type="button" onClick={()=>onSelect(e)}>{e.title}<small>{intro(e)}</small><span>{e.minutes?e.minutes.join('–')+' min':'Velg'} <ChevronRight size={16}/></span></button>)}{!filtered.length&&<p>Ingen treff.</p>}</div></div>;
}
export const emptyFilters={q:'',category:'',skill:'',type:'',players:'',hall:'',minutes:'',coaches:'',difficulty:'',equipment:'',favorite:false};
export function Bank({exercises,data,update,add,notify,filter,set}:{exercises:Exercise[];data:Data;update:(fn:(d:Data)=>Data)=>boolean;add:(e:Exercise)=>void;notify:(message:string)=>void;filter:typeof emptyFilters;set:(filters:typeof emptyFilters)=>void}){
  const [create,setCreate]=useState(false);
  const [title,setTitle]=useState('');
  const [desc,setDesc]=useState('');
  const catalog=useMemo(()=>exercises.map(e=>({...e,...data.notes[e.id]?.metadata})),[exercises,data.notes]);
  const cats=useMemo(()=>[...new Set(catalog.flatMap(e=>e.categories))].sort((a,b)=>a.localeCompare(b,'nb')),[catalog]);
  const filtered=useMemo(()=>searchBank(catalog,filter.q).filter(e=>{
    const meta=editorial(e);
    return (!filter.category||e.categories.includes(filter.category))&&(!filter.skill||meta.skills.includes(filter.skill))&&(!filter.type||meta.types.includes(filter.type))&&(!filter.players||(e.players&&Number(filter.players)>=e.players[0]&&Number(filter.players)<=e.players[1]))&&(!filter.minutes||(e.minutes&&Number(filter.minutes)>=e.minutes[0]&&Number(filter.minutes)<=e.minutes[1]))&&(!filter.hall||hallFits(e.halls,filter.hall))&&(!filter.coaches||meta.coaches===undefined||meta.coaches<=Number(filter.coaches))&&(!filter.equipment||norm(section(e,'Du trenger').join(' ')).includes(norm(filter.equipment)))&&(!filter.difficulty||data.notes[e.id]?.difficulty===filter.difficulty)&&(!filter.favorite||data.favorites.includes(e.id));
  }),[catalog,data.notes,data.favorites,filter]);
  return <div className="page stack">
    <div className="heading row between"><h1>Øvelsesbank</h1><button onClick={()=>setCreate(!create)}>{create?'Lukk':'Ny øvelse'}</button></div>
    {create&&<form className="panel stack" onSubmit={event=>{
      event.preventDefault();
      if(!title.trim())return;
      const e:Exercise={id:'egen-'+uid(),title:title.trim(),categories:['Egne øvelser'],skills:[],sections:desc.trim()?[{label:'Kort forklart',lines:[desc.trim()]}]:[]};
      if(update(d=>({...d,exercises:[...d.exercises,e]}))){notify('Egen øvelse opprettet');location.hash='/ovelse/'+e.id;}
    }}><label>Navn<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Kort forklart<textarea value={desc} onChange={e=>setDesc(e.target.value)}/></label><button className="primary">Lagre øvelse</button></form>}
    <label className="search"><Search size={21}/><input aria-label="Søk i øvelsesbanken" type="search" placeholder="Søk etter en øvelse" value={filter.q} onChange={e=>set({...filter,q:e.target.value})}/></label>
    <details className="panel"><summary><SlidersHorizontal size={20}/> Filtre</summary><div className="fields">
      {([['category','Kategori',cats],['skill','Ferdighet',skillNames],['type','Øvelsestype',typeNames],['hall','Hallstørrelse',halls],['difficulty','Egen vanskelighetsgrad',difficulty]] as const).map(([k,label,options])=><label key={k}>{label}<select value={filter[k]} onChange={e=>set({...filter,[k]:e.target.value})}><option value="">Alle</option>{options.map(o=><option key={o}>{o}</option>)}</select></label>)}
      {([['players','Antall spillere'],['minutes','Varighet i minutter'],['coaches','Tilgjengelige trenere'],['equipment','Utstyr']] as const).map(([k,label])=><label key={k}>{label}<input type={k==='equipment'?'search':'number'} min="1" value={filter[k]} onChange={e=>set({...filter,[k]:e.target.value})}/></label>)}
    </div></details>
    <div className="row between wrap"><p className="muted" aria-live="polite">{filtered.length} øvelser</p><div className="row wrap"><label className="check"><input type="checkbox" checked={filter.favorite} onChange={e=>set({...filter,favorite:e.target.checked})}/> Favoritter</label>{Object.values(filter).some(Boolean)&&<button onClick={()=>set(emptyFilters)}>Nullstill søk og filtre</button>}</div></div>
    <p className="muted">Hall og trenerfilter inkluderer øvelser med ukjente krav. Kontroller organiseringen før bruk.</p><div className="cards">{filtered.map(e=>{
      const diagram=diagramFor(e.id,data.diagrams);
      const favorite=data.favorites.includes(e.id);
      return <article className="panel exercise-card" key={e.id}>
        <div className="row between"><span className="chip">{e.categories[0]||'Øvelse'}</span><button className="icon-button favorite" aria-label={'Favoritt: '+e.title} aria-pressed={favorite} onClick={()=>update(d=>({...d,favorites:favorite?d.favorites.filter(id=>id!==e.id):[...d.favorites,e.id]}))}><Bookmark size={19} fill={favorite?'currentColor':'none'}/></button></div>
        <a className="exercise-link stack" href={'#/ovelse/'+e.id}>{diagram&&<div className="exercise-preview"><Court diagram={diagram}/></div>}<h2>{e.number&&<small>{e.number}. </small>}{e.title}</h2><p>{intro(e)}</p><div className="row between muted"><span>{[e.minutes&&e.minutes.join('–')+' min',e.players&&e.players.join('–')+' '+(e.meta?.includes('keepere')?'keepere':'spillere'),e.unresolved&&'Må avklares'].filter(Boolean).join(' · ')}</span><ChevronRight size={19}/></div></a>
        {!e.unresolved&&<button onClick={()=>add(e)}>Legg til i trening</button>}
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
  const variant=selectedVariant!==undefined?e.sections.find(s=>s.label===selectedVariant)?.lines:e.id==='master-16'?e.sections.find(s=>s.label.startsWith('Variant – uten rekker'))?.lines:undefined;
  const focus=variant?.filter(line=>line.startsWith('Variantfokus:')).map(line=>line.replace('Variantfokus: ',''))??section(e,'Trenerens fokus');
  return <div className="stack"><DiagramCard diagram={diagramFor(e.id,data.diagrams)}/><div><h2>{variant?(selectedVariant||'Varianten med én tom kjegle'):'Slik gjør dere'}</h2><Lines lines={variant?.filter(line=>!line.startsWith('Variantfokus:'))??(rules.length?rules:section(e,'Kort forklart'))}/></div><Focus lines={focus}/></div>;
}
export function Detail({e,data,update,add,notify}:{e:Exercise;data:Data;update:(fn:(d:Data)=>Data)=>boolean;add:(e:Exercise)=>void;notify:(message:string)=>void}){
  const [quick,setQuick]=useState(false);
  const [editing,setEditing]=useState(false);
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
    if(update(d=>({...d,exercises:[...d.exercises,copy],diagrams:diagram?{...d.diagrams,[id]:structuredClone(diagram)}:d.diagrams}))){
      notify('Egen øvelse opprettet');
      location.hash='/ovelse/'+id;
    }
  }
  return <div className="page detail stack">
    <div className="row between detail-nav"><a href="#/ovelser"><ChevronLeft size={23}/> Øvelsesbank</a><button className="icon-button" title="Favoritt" aria-label="Favoritt" aria-pressed={favorite} onClick={()=>update(d=>({...d,favorites:favorite?d.favorites.filter(id=>id!==e.id):[...d.favorites,e.id]}))}><Bookmark fill={favorite?'currentColor':'none'}/></button></div>
    <div className="heading"><span className="chip">{shown.categories.slice(0,3).join(' / ')||'Øvelse'}</span><h1>{e.title}</h1>{e.number&&<p className="muted">Øvelse {e.number} · Master v3</p>}{e.unresolved&&<p className="muted">Merket som uavklart i kilden</p>}</div>
    <div className="row wrap">{!e.unresolved&&<button className="primary" onClick={()=>add(shown)}>Legg til i trening</button>}<button onClick={()=>setQuick(!quick)}>{quick?'Full visning':'Hurtigvisning'}</button></div>
    {quick?<QuickExercise e={e} data={data}/>:<>
      <DiagramCard diagram={diagram}/>
      {e.id==='master-16'&&<p className="muted">Illustrasjonen viser varianten med én tom kjegle.</p>}
      {editing?<DiagramEditor initial={diagram} onClose={()=>setEditing(false)} onSave={d=>{if(update(s=>({...s,diagrams:{...s.diagrams,[e.id]:d}}))){setEditing(false);notify('Illustrasjon lagret');}}}/>:<button onClick={()=>setEditing(true)}>{diagram?'Rediger illustrasjon':'Lag illustrasjon'}</button>}
      {(e.meta||equipment.length>0)&&<div className="meta">{e.players&&<div><Users/><span><strong>{e.players.join('–')}</strong><br/>{e.meta?.includes('keepere')?'keepere':'spillere'}</span></div>}{e.minutes&&<div><Timer/><span><strong>{e.minutes.join('–')}</strong><br/>min</span></div>}{!!equipment.length&&<div><TrafficCone/><span>{equipment.join(' ')}</span></div>}</div>}
      {e.meta&&<p className="muted">{e.meta}</p>}
      {note.metadata&&<div className="muted"><strong>Egne metadata</strong><p>{[shown.players&&shown.players.join('–')+' spillere',shown.minutes&&shown.minutes.join('–')+' min',shown.halls?.length&&shown.halls.join(', '),shown.coaches&&shown.coaches+' trener(e)'].filter(Boolean).join(' · ')}</p></div>}
      {!!section(e,'Kort forklart').length&&<div><h2>Kort forklart</h2><Lines lines={section(e,'Kort forklart')}/></div>}
      {!!section(e,'Hva trener vi?').length&&<div><h2>Hva trener vi?</h2><Lines lines={section(e,'Hva trener vi?')}/></div>}
      {!!section(e,'Slik setter du opp').length&&<details className="panel"><summary>Utstyr og organisering</summary><Lines lines={[...equipment,...section(e,'Slik setter du opp')]}/></details>}
      {!!rules.length&&<div><h2>Slik gjør dere</h2><Lines lines={rules}/></div>}
      <Focus lines={focus}/>
      {sections.map((s,i)=><details className="panel" key={i} open={s.label.startsWith('Variant – uten rekker')||undefined}><summary>{s.label||'Merknad'}</summary><Lines lines={s.lines}/></details>)}
      <details className="panel"><summary>Egne opplysninger</summary><div className="stack">
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
