import {constrainedGroups,ruleViolations} from './groupRules';
import {GroupRulesEditor} from './GroupRulesEditor';
import {useRef,useState} from 'react';
import {Download,Upload,UserPlus,Users} from 'lucide-react';
import {type Data,type Level,type Session,levels,uid,activePlayers,archivePlayer,deletePlayer,removeFromSession} from './model';
import {Attendance} from './Training';
import {parseBackup,project,type Workspace} from './workspace';

export function Team({data,draft,setDraft,update,replace,notify,exportAll}:{data:Data;draft:Session;setDraft:(s:Session)=>void;update:(fn:(d:Data)=>Data)=>boolean;replace:(d:Workspace)=>boolean;exportAll:()=>void;notify:(message:string)=>void}){
  const [name,setName]=useState('');
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('name');
  const [archived,setArchived]=useState(false);
  const [swap,setSwap]=useState('');
  const visiblePlayers=data.players.filter(p=>Boolean(p.archived)===archived&&p.name.toLocaleLowerCase('nb').includes(query.trim().toLocaleLowerCase('nb'))).sort((a,b)=>sort==='level'?a.level-b.level||a.name.localeCompare(b.name,'nb'):a.name.localeCompare(b.name,'nb'));
  const [level,setLevel]=useState<Level>(4);
  const [manualSelection,setSelection]=useState<string[]>((draft.attendanceRegistered||draft.attendees.length)?draft.attendees:activePlayers(data).map(p=>p.id));
  const [source,setSource]=useState((draft.attendanceRegistered||draft.attendees.length)?'draft':'all');
  const [useAll,setUseAll]=useState(true);
  const selection=source==='all'&&useAll?activePlayers(data).map(p=>p.id):manualSelection;
  const [count,setCount]=useState(2);
  const [groupSize,setGroupSize]=useState(0);
  const [teams,setTeams]=useState<string[][]>(draft.allocation?.map(g=>g.players)??[]);
  const [names,setNames]=useState<string[]>(draft.allocation?.map(g=>g.name)??[]);
  const [message,setMessage]=useState('');
  const file=useRef<HTMLInputElement>(null);
  const playerExists=(id:string)=>data.players.some(p=>p.id===id);
  function distribute(byLevel:boolean){
    if(teams.length&&!confirm('Erstatte den eksisterende lagfordelingen med en ny?'))return;
    const players=data.players.filter(p=>!p.archived&&selection.includes(p.id));
    try{setTeams(constrainedGroups(players,groupSize?Math.ceil(players.length/groupSize):count,byLevel,data.groupRules??[]).map(g=>g.map(p=>p.id)));setMessage('');}catch(error){setMessage((error as Error).message);}
  }
  async function importData(f:File){
    try {
      const backup=parseBackup(await f.text());const imported=project(backup);
      if(confirm('Sikkerhetskopien har '+imported.players.length+' spillere og '+imported.sessions.length+' treningsplaner. Erstatte alle lokale brukerdata?')){
        if(!replace(backup)){setMessage('Importen kunne ikke lagres.');return;}
        setSource('all');setSelection(activePlayers(imported).map(p=>p.id));setTeams([]);
        setMessage('Sikkerhetskopien er importert.');notify('Sikkerhetskopien er importert.');
      }
    }catch{setMessage('Filen er ikke en gyldig sikkerhetskopi for denne versjonen.');}
  }
  return <div className="page stack">
    <div className="heading"><h1>Mitt lag</h1></div>
    <label>Lagnavn<input value={data.team} onChange={e=>update(d=>({...d,team:e.target.value}))}/></label>
    <section className="panel stack">
      <h2>{archived?'Arkiverte spillere':'Spillere'}</h2><label className="check"><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Vis arkiverte spillere</label>
      <form className="fields" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const id=uid();if(!update(d=>({...d,players:[...d.players,{id,name:name.trim(),level}]})))return;if(source==='all')setSelection([...selection,id]);setName('');notify('Spiller lagt til');}}>
        <label>Spillernavn<input value={name} required onChange={e=>setName(e.target.value)}/></label><label>Nivå<select value={level} onChange={e=>setLevel(Number(e.target.value) as Level)}>{levels.map((s,i)=><option key={s} value={i+1}>{i+1} · {s}</option>)}</select></label><button className="primary"><UserPlus size={18}/> Legg til spiller</button>
      </form>
      {!data.players.length&&<p className="muted">Spillerlisten er tom.</p>}
      <div className="fields"><label>Søk etter spiller<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Sorter spillere<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Navn</option><option value="level">Nivå</option></select></label></div>
      {!!data.players.length&&!visiblePlayers.length&&<p className="muted">Ingen spillere passer med søket.</p>}
      {visiblePlayers.map(p=><div className="player-row" key={p.id}>
        <input aria-label="Spillernavn" value={p.name} onChange={e=>update(d=>({...d,players:d.players.map(x=>x.id===p.id?{...x,name:e.target.value}:x)}))}/>
        <select aria-label={'Nivå for '+p.name} value={p.level} onChange={e=>{if(update(d=>({...d,players:d.players.map(x=>x.id===p.id?{...x,level:Number(e.target.value) as Level}:x)})))notify('Spiller oppdatert');}}>{levels.map((s,i)=><option key={s} value={i+1}>{i+1} · {s}</option>)}</select>
        <button onClick={()=>{if(update(d=>archivePlayer(d,p.id,!p.archived))){setSelection(selection.filter(id=>id!==p.id));setTeams([]);notify(p.archived?'Spiller gjenaktivert':'Spiller arkivert – historikken er bevart');}}}>{p.archived?'Gjenaktiver':'Arkiver'}</button>
        {p.archived&&<button aria-label={'Slett permanent '+p.name} onClick={()=>{if(confirm('Slette '+p.name+' permanent? Navn, nivå, oppmøte og lagreferanser fjernes fra alle lagrede treninger. Eksporter en sikkerhetskopi først dersom du vil beholde historikken.')&&update(d=>deletePlayer(d,p.id))){setDraft(removeFromSession(draft,p.id));setSelection(selection.filter(id=>id!==p.id));setTeams([]);}}}>Slett permanent</button>}
      </div>)}
    </section>
    <section className="panel stack">
      <h2 className="row"><Users size={22}/> Lagdeling</h2><GroupRulesEditor players={data.players} rules={data.groupRules??[]} change={groupRules=>update(d=>({...d,groupRules}))}/>{message&&<p role="status">{message}</p>}{ruleViolations(teams,data.groupRules??[]).length>0&&<p role="alert">Den manuelle fordelingen bryter en eller flere regler. Endre fordelingen eller reglene før lagring.</p>}
      <div className="fields"><label>Oppmøteliste<select value={source} onChange={e=>{const id=e.target.value;setSource(id);setUseAll(id==='all');setSelection(id==='all'?activePlayers(data).map(p=>p.id):id==='draft'?draft.attendees:data.sessions.find(s=>s.id===id)?.attendees??[]);const saved=id==='draft'?draft:data.sessions.find(s=>s.id===id);setTeams(saved?.allocation?.map(g=>g.players)??[]);setNames(saved?.allocation?.map(g=>g.name)??[]);}}><option value="all">Alle spillere</option><option value="draft">Trening under planlegging</option>{data.sessions.filter(s=>!s.template).map(s=><option key={s.id} value={s.id}>{s.date} · {s.name}</option>)}</select></label>
      <label>Ønsket gruppestørrelse (0 = bruk antall lag)<input type="number" min="0" value={groupSize} onChange={e=>setGroupSize(Math.max(0,Math.floor(Number(e.target.value))))}/></label><label>Antall lag<input type="number" min="1" value={count} onChange={e=>setCount(Math.max(1,Math.floor(Number(e.target.value))))}/></label></div>
      <Attendance data={data} selected={selection} change={ids=>{setUseAll(source==='all'&&ids.length===activePlayers(data).length&&activePlayers(data).every(p=>ids.includes(p.id)));setSelection(ids);setTeams([]);}}/>
      <div className="row wrap"><button className="primary" disabled={!selection.some(playerExists)} onClick={()=>distribute(false)}>Lag jevne lag</button><button disabled={!selection.some(playerExists)} onClick={()=>distribute(true)}>Del etter nivå</button></div>
      {!!teams.length&&<div className="fields"><label>Bytt spiller<select value={swap} onChange={e=>setSwap(e.target.value)}><option value="">Velg første spiller</option>{teams.flat().map(id=><option key={id} value={id}>{data.players.find(p=>p.id===id)?.name}</option>)}</select></label>{swap&&<label>Med spiller<select value="" onChange={e=>{const other=e.target.value;if(!other)return;setTeams(teams.map(g=>g.map(id=>id===swap?other:id===other?swap:id)));setSwap('');}}><option value="">Velg andre spiller</option>{teams.flat().filter(id=>id!==swap).map(id=><option key={id} value={id}>{data.players.find(p=>p.id===id)?.name}</option>)}</select></label>}</div>}
      <div className="cards">{teams.map((t,i)=><section className="panel stack" key={i}><h3>Lag {i+1} · {t.filter(playerExists).length} spillere</h3><label>Lagnavn<input value={names[i]??'Lag '+(i+1)} onChange={e=>setNames(teams.map((_,n)=>n===i?e.target.value:names[n]??'Lag '+(n+1)))}/></label>{t.filter(playerExists).map(id=><div className="row between wrap" key={id}><span>{data.players.find(p=>p.id===id)?.name}</span><select aria-label={'Flytt '+data.players.find(p=>p.id===id)?.name} value={i} onChange={e=>{const target=Number(e.target.value);setTeams(teams.map((row,j)=>j===i?row.filter(x=>x!==id):j===target?[...row,id]:row));}}>{teams.map((_,j)=><option key={j} value={j}>Lag {j+1}</option>)}</select></div>)}</section>)}</div>
    </section>
    <section className="panel stack"><h2>Lagre oppmøte og lag</h2>
    <p>Jevne lag balanserer nivåene mellom lagene. Nivådeling samler spillere med lignende nivå.</p>
    <button disabled={source==='all'||ruleViolations(teams,data.groupRules??[]).length>0} onClick={()=>{
      const attendees=selection.filter(playerExists);
      const allocation=teams.map((g,i)=>({name:names[i]??'Lag '+(i+1),players:g.filter(id=>attendees.includes(id))}));
      const patch={attendees,attendanceRegistered:true,allocation};
      if(source==='draft'){setDraft({...draft,...patch});notify('Oppmøte og lag lagt til treningsplanen');}
      else if(update(d=>({...d,sessions:d.sessions.map(s=>s.id===source?{...s,...patch}:s)})))notify('Oppmøte og lag lagret');
    }}>Lagre til valgt trening</button>
    {source==='all'&&<p className="muted">Velg en trening under Oppmøteliste for å lagre fordelingen.</p>}
    </section>
    <section className="panel stack"><h2>Sikkerhetskopi</h2><p className="muted">Overfør lokale brukerdata mellom enhetene dine med en JSON-fil.</p>
      <input className="visually-hidden" type="file" tabIndex={-1} ref={file} accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)void importData(f);}}/>
      <div className="row wrap"><button onClick={exportAll}><Download size={18}/> Eksporter</button><button onClick={()=>file.current?.click()}><Upload size={18}/> Importer</button></div>
      {message&&<p role="status">{message}</p>}
    </section>
  </div>;
}
