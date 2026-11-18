import {useId,useRef,useState, type MouseEvent, type PointerEvent} from 'react';
import {type Diagram,type Point,type SymbolKind,uid} from './model';
import {reviewed,originalDiagram,nextPosition} from './diagrams';
import generated from './illustrations.json';

export const blankDiagram:Diagram={court:'full',marks:[],arrows:[]};
export {originalDiagram,nextPosition} from './diagrams';
export const diagramFor=(id:string, diagrams:Record<string,Diagram>)=>diagrams[id]??(id==='master-16'?originalDiagram:reviewed[id]??(generated as Record<string,{frames:Diagram[]}>)[id]?.frames[0]);
const symbols:Record<SymbolKind,string>={player:'Spiller',keeper:'Målvakt',cone:'Kjegle',ball:'Ball',goal:'Mål',hurdle:'Hinder',mat:'Matte',empty:'Ledig plass',text:'Tekst',hoop:'Rockering',bench:'Benk',wall:'Vegg'};
const arrowLabels={run:'Løp',pass:'Pasning',carry:'Ballføring'};
const arrowColors={run:'#0656ac',pass:'#dc2328',carry:'#6835a1'};
const coords=(p:Point)=>[p.x*5.6+10,p.y*2.8+10] as const;
export function Court({diagram=blankDiagram,onPlace,onSelect,onMove,selected}:{diagram?:Diagram;onPlace?:(p:Point)=>void;onSelect?:(id:string)=>void;onMove?:(id:string,p:Point)=>void;selected?:string}) {
  const id=useId();
  const svg=useRef<SVGSVGElement>(null);
  const drag=useRef<{id:string;pointer:number;x:number;y:number} | null>(null);
  const [preview,setPreview]=useState<(Point&{id:string})>();
  const view=diagram.court==='half'?'-15 -15 330 330':diagram.court==='crop'?'115 25 370 250':'-15 -15 610 330';
  function ground(event:{clientX:number;clientY:number}){
    const matrix=svg.current?.getScreenCTM();
    if(!matrix)return;
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,Math.round(n)));
    return {x:clamp((p.x-10)/5.6,diagram.court==='crop'?21:0,diagram.court==='half'?51:diagram.court==='crop'?82:100),y:clamp((p.y-10)/2.8,diagram.court==='crop'?9:0,diagram.court==='crop'?91:100)};
  }
  function place(event:MouseEvent<SVGSVGElement>){const point=ground(event);if(point)onPlace?.(point);}
  function release(event:PointerEvent<SVGGElement>){
    const active=drag.current;
    if(!active||active.pointer!==event.pointerId)return;
    const point=ground(event);
    if(event.type==='pointerup'&&point&&Math.hypot(event.clientX-active.x,event.clientY-active.y)>3)onMove?.(active.id,point);
    drag.current=null;
    setPreview(undefined);
  }
  return <svg ref={svg} className={'court '+(onPlace?'editable':'')+(onMove?' move-tool':'')} viewBox={view} onClick={place} aria-label="Håndballbane sett ovenfra" role="img">
    <defs>
      <linearGradient id={id+'floor'} x2="1" y2="1"><stop stopColor="#d9f0fa"/><stop offset="1" stopColor="#a9daf2"/></linearGradient>
      {Object.entries(arrowColors).map(([kind,color])=><marker key={kind} id={id+kind} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill={color}/></marker>)}
    </defs>
    <rect x="10" y="10" width="560" height="280" rx="14" fill={'url(#'+id+'floor)'} stroke="#0c346d" strokeWidth="4"/>
    <path d="M290 12V288" stroke="#fff" strokeWidth="2" opacity=".55"/>
    <circle cx="290" cy="150" r="28" fill="none" stroke="#fff" strokeWidth="2" opacity=".55"/>
    {[false,true].map(right=><g key={String(right)} transform={right?'translate(580 0) scale(-1 1)':undefined}>
      <path d="M10 45A84 84 0 0 1 94 129V171A84 84 0 0 1 10 255" fill="#83bce5" stroke="white" strokeWidth="3"/>
      <path d="M51 10A126 126 0 0 1 136 129V171A126 126 0 0 1 51 290" fill="none" stroke="#4f9bdb" strokeWidth="2" strokeDasharray="9 9"/>
      <path d="M108 143v14M66 147.5v5" stroke="white" strokeWidth="2"/>
      <path d="M9 129H2v42h7" fill="none" stroke="#d4222a" strokeWidth="4"/>
    </g>)}
    {diagram.arrows.map(a=>{
      const start=coords(a.from).join(' '),end=coords(a.to).join(' ');
      return <path onClick={onSelect?e=>{e.stopPropagation();onSelect(a.id);}:undefined} key={a.id} d={a.via?.length?'M'+start+a.via.map(p=>' L'+coords(p).join(' ')).join('')+' L'+end:a.bend?'M'+start+' Q'+coords(a.bend).join(' ')+' '+end:'M'+start+' L'+end} fill="none" stroke={arrowColors[a.kind]} strokeWidth={selected===a.id?6:3.5} strokeDasharray={a.kind==='pass'?'8 7':a.kind==='carry'?'12 4 2 4':undefined} markerEnd={'url(#'+id+a.kind+')'} />;
    })}
    {diagram.marks.map(m=><g key={m.id} transform={'translate('+coords(preview?.id===m.id?preview:m).join(' ')+')'} onClick={onSelect?e=>{e.stopPropagation();onSelect(m.id);}:undefined}
      onPointerDown={onMove?event=>{
        if(event.button!==0)return;
        onSelect?.(m.id);
        drag.current={id:m.id,pointer:event.pointerId,x:event.clientX,y:event.clientY};
        event.currentTarget.setPointerCapture(event.pointerId);
      }:undefined} onPointerMove={onMove?event=>{
        if(drag.current?.pointer!==event.pointerId||Math.hypot(event.clientX-drag.current.x,event.clientY-drag.current.y)<=3&&!preview)return;
        const point=ground(event);if(point)setPreview({...point,id:m.id});
      }:undefined} onPointerUp={onMove?release:undefined} onPointerCancel={onMove?release:undefined}>
      <title>{symbols[m.kind]} {m.label}</title>
      {selected===m.id&&<circle r="23" fill="none" stroke="#262c39" strokeDasharray="3 4"/>}
      {m.kind==='player'&&<><circle r="20" fill={m.team?'#be2c42':'#0761b7'} stroke="white" strokeWidth="2"/><text textAnchor="middle" dominantBaseline="central" className="player-label" style={m.label.length>2?{fontSize:Math.max(8,23-m.label.length*2)}:undefined}>{m.label}</text></>}
      {m.kind==='keeper'&&<><rect x="-18" y="-18" width="36" height="36" rx="8" fill="#136346" stroke="white" strokeWidth="2"/><text textAnchor="middle" dominantBaseline="central" className="player-label">{m.label||'M'}</text></>}
      {m.kind==='cone'&&<path d="M-12 11L0-15L12 11Z" fill="#fa9216" stroke="#fff5d8"/>}
      {m.kind==='empty'&&<circle r="19" fill="#e5fbdf" fillOpacity=".6" stroke="#14803e" strokeWidth="2.5" strokeDasharray="5 4"/>}
      {m.kind==='ball'&&<><circle r="10" fill="#f28b1a" stroke="#fff" strokeWidth="2"/><path d="M-7-5L7 5M-7 5L7-5M-9 0H9" stroke="#fff"/></>}
      {m.kind==='goal'&&<path d="M-16 9V-10H16V9" fill="none" stroke="#bb2031" strokeWidth="4"/>}
      {m.kind==='hurdle'&&<path d="M-12 9V-7H12V9" fill="none" stroke="#a86713" strokeWidth="4"/>}
      {m.kind==='mat'&&<rect x="-27" y="-13" width="54" height="26" rx="4" fill="#6674a6" stroke="white" strokeWidth="2"/>}
      {m.kind==='hoop'&&<ellipse rx="22" ry="15" fill="none" stroke="#f28b1a" strokeWidth="3"/>}{m.kind==='bench'&&<rect x="-30" y="-8" width="60" height="16" fill="#a86713"/>}{m.kind==='wall'&&<path d="M-40 0H40" stroke="#334155" strokeWidth="8"/>}
      {m.kind==='text'&&<text textAnchor="middle" fill="#102a51" fontSize="15">{m.label}</text>}
    </g>)}
  </svg>;
}
export function DiagramCard({diagram,steps=true}:{diagram?:Diagram;steps?:boolean}){
  const [after,setAfter]=useState(false);
  const shown=after&&diagram===originalDiagram?nextPosition:diagram;
  return <div className="diagram"><Court diagram={shown}/>{shown&&<p className="muted">Prinsippskisse. Les organiseringen og valgt variant før gjennomføring.</p>}{shown?<div className="legend">
    {Object.entries(arrowLabels).filter(([kind])=>shown.arrows.some(a=>a.kind===kind)).map(([kind,label])=><span key={kind}><i className={kind}/> {label}</span>)}
    {shown.marks.some(m=>m.kind==='player'&&!m.team)&&<span><i className="attack"/> Angrep / spiller</span>}{shown.marks.some(m=>m.kind==='player'&&m.team===1)&&<span><i className="defence"/> Forsvar / jeger</span>}{(['empty','cone','keeper','ball','goal','hurdle','mat','hoop','bench','wall'] as const).filter(kind=>shown.marks.some(m=>m.kind===kind)).map(kind=><span key={kind}><i className={kind}/> {symbols[kind]}</span>)}
  </div>:<p className="muted">Baneplassholder · ingen illustrasjon lagt inn</p>}
  {steps&&diagram===originalDiagram&&<div className="row wrap"><button aria-pressed={after} onClick={()=>setAfter(!after)}>{after?'Vis startposisjoner':'Vis den nye tomme plassen'}</button>{after&&<p className="muted">Spiller 1 har løpt til tom kjegle. Kjegla ved spillerens startposisjon er nå ledig.</p>}</div>}</div>;
}
export function DiagramEditor({initial,onSave,onClose}:{initial?:Diagram;onSave:(d:Diagram)=>void;onClose:()=>void}){
  const [history,setHistory]=useState(()=>({frames:[structuredClone(initial??blankDiagram)],index:0}));
  const d=history.frames[history.index];
  function set(diagram:Diagram){
    setHistory(h=>{
      const frames=[...h.frames.slice(Math.max(0,h.index-48),h.index+1),diagram];
      return {frames,index:frames.length-1};
    });
  }
  function step(direction:number){
    setHistory(h=>({...h,index:Math.max(0,Math.min(h.frames.length-1,h.index+direction))}));
    setStart(undefined);
  }
  const [tool,setTool]=useState<SymbolKind|'select'|keyof typeof arrowLabels>('player');
  const [selected,select]=useState('');
  const [start,setStart]=useState<Point>();
  const [label,setLabel]=useState('');
  const [team,setTeam]=useState<0|1>(0);
  const mark=d.marks.find(m=>m.id===selected);
  const arrow=d.arrows.find(a=>a.id===selected);
  function moveMark(id:string,p:Point){set({...d,marks:d.marks.map(m=>m.id===id?{...m,...p}:m)});}
  function updatePoint(p:Point){
    if(tool==='select'){
      if(mark)moveMark(mark.id,p);
    }else if(tool==='run'||tool==='pass'||tool==='carry'){
      if(!start)setStart(p);
      else {const id=uid();set({...d,arrows:[...d.arrows,{id,kind:tool,from:start,to:p}]});select(id);setStart(undefined);}
    }else{
      const id=uid();
      set({...d,marks:[...d.marks,{id,kind:tool,label:label||(tool==='player'?String(d.marks.filter(m=>m.kind==='player').length+1):''),team,...p}]});
      select(id);
    }
  }
  return <section className="panel stack">
    <h2>Rediger illustrasjon</h2>
    <div className="fields">
      <label>Bane<select value={d.court} onChange={e=>set({...d,court:e.target.value as Diagram['court']})}><option value="full">Hel bane</option><option value="half">Halv bane</option><option value="crop">Utsnitt</option></select></label>
      <label>Verktøy<select value={tool} onChange={e=>{setTool(e.target.value as typeof tool);setStart(undefined);}}><option value="select">Velg / flytt</option>{Object.entries(symbols).map(([v,l])=><option key={v} value={v}>{l}</option>)}{Object.entries(arrowLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label>Tekst / draktnummer<input value={label} maxLength={24} onChange={e=>setLabel(e.target.value)}/></label>
      <label>Rolle for nye spillere<select value={team} onChange={e=>setTeam(Number(e.target.value) as 0|1)}><option value="0">Angrep (blå)</option><option value="1">Forsvar (rød)</option></select></label>
    </div>
    <p className="muted">{start?'Trykk der pilen skal slutte.':tool==='select'?'Dra et symbol, eller velg det og trykk på den nye plasseringen.':tool in arrowLabels?'Trykk der pilen skal starte.':'Trykk på banen for å plassere symbolet.'}</p>
    <Court diagram={d} selected={selected} onPlace={updatePoint} onSelect={tool==='select'?select:undefined} onMove={tool==='select'?moveMark:undefined}/>
    <div className="row wrap">{tool==='select'?<p>Velg et element nedenfor og rediger koordinatene med tastaturet.</p>:<button type="button" onClick={()=>{
      if(tool==='run'||tool==='pass'||tool==='carry'){const id=uid();set({...d,arrows:[...d.arrows,{id,kind:tool,from:{x:30,y:50},to:{x:70,y:50}}]});select(id);setStart(undefined);}
      else updatePoint({x:50,y:50});
    }}>{tool==='run'||tool==='pass'||tool==='carry'?'Legg til pil med start- og sluttpunkt':'Legg til valgt symbol midt på banen'}</button>}</div>
    <div className="row wrap"><button disabled={history.index===0} onClick={()=>step(-1)}>Angre</button><button disabled={history.index===history.frames.length-1} onClick={()=>step(1)}>Gjør om</button></div>
    <div className="row wrap">
      <label>Valgt element<select value={mark||arrow?selected:''} onChange={e=>select(e.target.value)}><option value="">Ingen</option>{d.marks.map((m,i)=><option key={m.id} value={m.id}>{i+1}. {symbols[m.kind]} {m.label}</option>)}{d.arrows.map((a,i)=><option key={a.id} value={a.id}>Pil {i+1} – {arrowLabels[a.kind]}</option>)}</select></label>
      {mark&&<><label>Merkelapp<input value={mark.label} maxLength={24} onChange={e=>set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,label:e.target.value}:m)})}/></label>{(['x','y'] as const).map(axis=><label key={axis}>{axis.toUpperCase()}<input type="number" min="0" max="100" value={mark[axis]} onChange={e=>set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,[axis]:Math.min(100,Math.max(0,Number(e.target.value)))}:m)})}/></label>)}</>}
      {mark?.kind==='player'&&<label>Valgt spillers rolle<select value={mark.team} onChange={e=>set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,team:Number(e.target.value) as 0|1}:m)})}><option value="0">Angrep</option><option value="1">Forsvar</option></select></label>}
      {arrow&&<><button onClick={()=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,via:[...(a.via??[]),{x:50,y:50}]}:a)})}>Legg til knekkpunkt</button>{arrow.via?.map((point,i)=><fieldset key={i}><legend>Knekkpunkt {i+1}</legend>{(['x','y'] as const).map(axis=><label key={axis}>{axis}<input type="number" min="0" max="100" value={point[axis]} onChange={e=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,via:a.via!.map((p,n)=>n===i?{...p,[axis]:Math.max(0,Math.min(100,Number(e.target.value)))}:p)}:a)})}/></label>)}<button onClick={()=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,via:a.via!.filter((_,n)=>n!==i)}:a)})}>Fjern knekkpunkt</button></fieldset>)}<label>Piltype<select value={arrow.kind} onChange={e=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,kind:e.target.value as typeof a.kind}:a)})}>{Object.entries(arrowLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>{(['from','to','bend'] as const).map(point=><fieldset key={point}><legend>{point==='from'?'Start':point==='to'?'Slutt':'Buepunkt'}</legend>{(['x','y'] as const).map(axis=><label key={axis}>{axis.toUpperCase()}<input type="number" min="0" max="100" value={(arrow[point]??{x:50,y:50})[axis]} onChange={e=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,[point]:{...(a[point]??{x:50,y:50}),[axis]:Math.min(100,Math.max(0,Number(e.target.value)))}}:a)})}/></label>)}</fieldset>)}<button onClick={()=>set({...d,arrows:d.arrows.map(a=>a.id===arrow.id?{...a,bend:undefined}:a)})}>Rett pil</button></>}
      {(mark||arrow)&&<button onClick={()=>{const id=uid();set(mark?{...d,marks:[...d.marks,{...mark,id,x:Math.min(100,mark.x+4),y:Math.min(100,mark.y+4)}]}:{...d,arrows:[...d.arrows,{...structuredClone(arrow!),id}]});select(id);}}>Dupliser element</button>}
      {(mark||arrow)&&<button onClick={()=>{set({...d,marks:d.marks.filter(m=>m.id!==selected),arrows:d.arrows.filter(a=>a.id!==selected)});select('');}}>Fjern element</button>}
    </div>
    <div className="row wrap"><button className="primary" onClick={()=>onSave(d)}>Lagre illustrasjon</button><button onClick={onClose}>Avbryt</button></div>
  </section>;
}
