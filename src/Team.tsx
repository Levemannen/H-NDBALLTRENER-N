import {useRef,useState} from 'react';
import {Download,Trash2,Upload,UserPlus,Users} from 'lucide-react';
import {type Data,type Level,type Session,groups,levels,parseData,uid,dateToday} from './model';
import {Attendance} from './Training';

export function Team({data,draft,update,replace}:{data:Data;draft:Session;update:(fn:(d:Data)=>Data)=>void;replace:(d:Data)=>boolean}){
  const [name,setName]=useState('');
  const [level,setLevel]=useState<Level>(4);
  const [selection,setSelection]=useState<string[]>(draft.attendees.length?draft.attendees:data.players.map(p=>p.id));
  const [source,setSource]=useState(draft.attendees.length?'draft':'all');
  const [count,setCount]=useState(2);
  const [teams,setTeams]=useState<string[][]>([]);
  const [message,setMessage]=useState('');
  const file=useRef<HTMLInputElement>(null);
  const playerExists=(id:string)=>data.players.some(p=>p.id===id);
  function distribute(byLevel:boolean){
    const players=data.players.filter(p=>selection.includes(p.id));
    setTeams(groups(players,count,byLevel).map(g=>g.map(p=>p.id)));
  }
  function exportData(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');
    a.href=url;a.download='handball-'+dateToday()+'.backup.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importData(f:File){
    try {
      const imported=parseData(await f.text());
      if(confirm('Sikkerhetskopien har '+imported.players.length+' spillere og '+imported.sessions.length+' treningsplaner. Erstatte alle lokale brukerdata?')){
        if(!replace(imported)){setMessage('Importen kunne ikke lagres.');return;}
        setSource('all');setSelection(imported.players.map(p=>p.id));setTeams([]);
        setMessage('Sikkerhetskopien er importert.');
      }
    }catch{setMessage('Filen er ikke en gyldig sikkerhetskopi for denne versjonen.');}
  }
  return <div className="page stack">
    <div className="heading"><h1>Mitt lag</h1></div>
    <label>Lagnavn<input value={data.team} onChange={e=>update(d=>({...d,team:e.target.value}))}/></label>
    <section className="panel stack">
      <h2>Spillere</h2>
      <form className="fields" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const id=uid();update(d=>({...d,players:[...d.players,{id,name:name.trim(),level}]}));if(source==='all')setSelection([...selection,id]);setName('');}}>
        <label>Spillernavn<input value={name} required onChange={e=>setName(e.target.value)}/></label><label>Nivå<select value={level} onChange={e=>setLevel(Number(e.target.value) as Level)}>{levels.map((s,i)=><option key={s} value={i+1}>{i+1} · {s}</option>)}</select></label><button className="primary"><UserPlus size={18}/> Legg til spiller</button>
      </form>
      {!data.players.length&&<p className="muted">Spillerlisten er tom.</p>}
      {data.players.map(p=><div className="player-row" key={p.id}>
        <input aria-label="Spillernavn" value={p.name} onChange={e=>update(d=>({...d,players:d.players.map(x=>x.id===p.id?{...x,name:e.target.value}:x)}))}/>
        <select aria-label={'Nivå for '+p.name} value={p.level} onChange={e=>update(d=>({...d,players:d.players.map(x=>x.id===p.id?{...x,level:Number(e.target.value) as Level}:x)}))}>{levels.map((s,i)=><option key={s} value={i+1}>{i+1} · {s}</option>)}</select>
        <button className="icon-button" aria-label={'Slett '+p.name} onClick={()=>{if(confirm('Slette '+p.name+' fra spillerlisten?'))update(d=>({...d,players:d.players.filter(x=>x.id!==p.id),sessions:d.sessions.map(s=>({...s,attendees:s.attendees.filter(id=>id!==p.id)}))}));}}><Trash2 size={18}/></button>
      </div>)}
    </section>
    <section className="panel stack">
      <h2 className="row"><Users size={22}/> Lagdeling</h2>
      <div className="fields"><label>Oppmøteliste<select value={source} onChange={e=>{const id=e.target.value;setSource(id);setSelection(id==='all'?data.players.map(p=>p.id):id==='draft'?draft.attendees:data.sessions.find(s=>s.id===id)?.attendees??[]);setTeams([]);}}><option value="all">Alle spillere</option><option value="draft">Trening under planlegging</option>{data.sessions.filter(s=>!s.template).map(s=><option key={s.id} value={s.id}>{s.date} · {s.name}</option>)}</select></label>
      <label>Antall lag<input type="number" min="1" value={count} onChange={e=>setCount(Math.max(1,Math.floor(Number(e.target.value))))}/></label></div>
      <Attendance data={data} selected={selection} change={ids=>{setSelection(ids);setTeams([]);}}/>
      <div className="row wrap"><button className="primary" disabled={!selection.some(playerExists)} onClick={()=>distribute(false)}>Lag jevne lag</button><button disabled={!selection.some(playerExists)} onClick={()=>distribute(true)}>Del etter nivå</button></div>
      <div className="cards">{teams.map((t,i)=><section className="panel stack" key={i}><h3>Lag {i+1} · {t.filter(playerExists).length} spillere</h3>{t.filter(playerExists).map(id=><div className="row between wrap" key={id}><span>{data.players.find(p=>p.id===id)?.name}</span><select aria-label={'Flytt '+data.players.find(p=>p.id===id)?.name} value={i} onChange={e=>{const target=Number(e.target.value);setTeams(teams.map((row,j)=>j===i?row.filter(x=>x!==id):j===target?[...row,id]:row));}}>{teams.map((_,j)=><option key={j} value={j}>Lag {j+1}</option>)}</select></div>)}</section>)}</div>
    </section>
    <section className="panel stack"><h2>Sikkerhetskopi</h2><p className="muted">Overfør lokale brukerdata mellom enhetene dine med en JSON-fil.</p>
      <input className="visually-hidden" type="file" tabIndex={-1} ref={file} accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void importData(f);}}/>
      <div className="row wrap"><button onClick={exportData}><Download size={18}/> Eksporter</button><button onClick={()=>file.current?.click()}><Upload size={18}/> Importer</button></div>
      {message&&<p role="status">{message}</p>}
    </section>
  </div>;
}
