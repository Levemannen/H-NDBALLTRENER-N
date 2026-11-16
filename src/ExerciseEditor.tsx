import {useState} from 'react';
import {halls,section,type Exercise,type ExerciseMeta} from './model';
import {editorial,skillNames,typeNames} from './catalog';

const blocks=['Kort forklart','Hva trener vi?','Du trenger','Slik setter du opp','Slik gjør dere','Trenerens fokus','Varianter og progresjon','Nivåtilpasning','Trenerrop'];
const csv=(value:string)=>[...new Set(value.split(',').map(s=>s.trim()).filter(Boolean))];
const lines=(value:string)=>value.split('\n').map(s=>s.trim()).filter(Boolean);
export function ExerciseEditor({exercise,metadata,onSave,onClose}:{exercise:Exercise;metadata?:ExerciseMeta;onSave:(meta:ExerciseMeta,exercise?:Exercise)=>boolean;onClose:()=>void}){
  const own=exercise.id.startsWith('egen-');
  const initial={...exercise,...metadata};
  const suggested=editorial(initial);
  const [title,setTitle]=useState(exercise.title);
  const [values,setValues]=useState(Object.fromEntries(blocks.map(label=>[label,section(exercise,label).join('\n')])));
  const [category,setCategory]=useState(initial.categories.join(', '));
  const [skills,setSkills]=useState(suggested.skills);
  const [types,setTypes]=useState(suggested.types);
  const [rooms,setRooms]=useState(initial.halls??[]);
  const [players,setPlayers]=useState(initial.players?.join('–')??'');
  const [minutes,setMinutes]=useState(initial.minutes?.join('–')??'');
  const [coaches,setCoaches]=useState(initial.coaches?.toString()??'');
  const [error,setError]=useState('');
  function parseRange(text:string){
    if(!text.trim())return undefined;
    const m=/^\s*(\d+)\s*(?:[–-]\s*(\d+))?\s*$/.exec(text);
    const min=Number(m?.[1]), max=Number(m?.[2]??m?.[1]);
    if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min<1||max<min)throw new Error('Skriv ett positivt tall eller et intervall som 6–12.');
    return [min,max];
  }
  const toggles=(legend:string,options:string[],selected:string[],change:(v:string[])=>void)=><fieldset><legend>{legend}</legend><div className="attendance">{options.map(s=><label className="check" key={s}><input type="checkbox" checked={selected.includes(s)} onChange={e=>change(e.target.checked?[...selected,s]:selected.filter(x=>x!==s))}/>{s}</label>)}</div></fieldset>;
  return <form className="panel stack" onSubmit={event=>{
    event.preventDefault();
    try{
      if(own&&!title.trim())throw new Error('Gi øvelsen et navn.');
      const coachCount=coaches?Number(coaches):undefined;
      if(coachCount!==undefined&&(!Number.isSafeInteger(coachCount)||coachCount<1))throw new Error('Antall trenere må være et positivt heltall.');
      const meta:ExerciseMeta={categories:csv(category),skillTags:skills,types,players:parseRange(players),minutes:parseRange(minutes),halls:rooms,coaches:coachCount};
      const updated=own?{...exercise,...meta,title:title.trim(),categories:meta.categories??[],sections:[...blocks.map(label=>({label,lines:lines(values[label])})).filter(s=>s.lines.length),...exercise.sections.filter(s=>!blocks.includes(s.label))]}:undefined;
      const defined=Object.fromEntries(Object.entries(meta).filter(([,value])=>value!==undefined));
      if(onSave(defined,updated))onClose();
    }catch(e){setError(e instanceof Error?e.message:'Sjekk opplysningene.');}
  }}>
    <h2>{own?'Rediger egen øvelse':'Rediger egne metadata'}</h2>
    {own&&<label>Øvelsesnavn<input required value={title} onChange={e=>setTitle(e.target.value)}/></label>}
    <label>Kategorier, skilt med komma<input value={category} onChange={e=>setCategory(e.target.value)}/></label>
    {toggles('Ferdighetstagger',skillNames,skills,setSkills)}
    {toggles('Øvelsestyper',typeNames,types,setTypes)}
    {toggles('Hallstørrelse',halls,rooms,setRooms)}
    <div className="fields">
      <label>Antall spillere<input value={players} placeholder="F.eks. 6–12" onChange={e=>setPlayers(e.target.value)}/></label>
      <label>Varighet i minutter<input value={minutes} placeholder="F.eks. 8–15" onChange={e=>setMinutes(e.target.value)}/></label>
      <label>Antall trenere<input type="number" min="1" value={coaches} onChange={e=>setCoaches(e.target.value)}/></label>
    </div>
    {own&&blocks.map(label=><label key={label}>{label}<textarea value={values[label]} onChange={e=>setValues({...values,[label]:e.target.value})}/></label>)}
    {error&&<p role="alert">{error}</p>}
    <div className="row wrap"><button className="primary">Lagre {own?'øvelse':'metadata'}</button><button type="button" onClick={onClose}>Avbryt</button></div>
  </form>;
}
