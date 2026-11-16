import {useId,useState, type MouseEvent} from 'react';
import {type Diagram,type Point,type SymbolKind,uid} from './model';

export const blankDiagram:Diagram={court:'full',marks:[],arrows:[]};
const positions=[[31,29],[50,20],[69,29],[64,74],[36,74],[50,88]];
export const originalDiagram:Diagram={
  court:'full',
  marks:[
    ...positions.map(([x,y],i)=>({id:'cone-'+i,kind:'cone' as const,x,y:y-10,label:'',team:0 as const})),
    ...positions.slice(0,5).map(([x,y],i)=>({id:'player-'+i,kind:'player' as const,x,y,label:String(i+1),team:0 as const})),
    {id:'ball',kind:'ball',x:36,y:33,label:'',team:0},
    {id:'empty',kind:'empty',x:50,y:88,label:'',team:0}
  ],
  arrows:[
    {id:'pass',kind:'pass',from:{x:39,y:37},bend:{x:50,y:47},to:{x:65,y:33}},
    {id:'run',kind:'run',from:{x:28,y:36},bend:{x:18,y:86},to:{x:44,y:88}}
  ]
};
export const diagramFor=(id:string, diagrams:Record<string,Diagram>)=>diagrams[id]??(id==='master-16'?originalDiagram:undefined);
const symbols:Record<SymbolKind,string>={player:'Spiller',cone:'Kjegle',ball:'Ball',goal:'Mål',hurdle:'Hinder',empty:'Ledig plass',text:'Tekst'};
const coords=(p:Point)=>[p.x*5.6+10,p.y*2.8+10] as const;
export function Court({diagram=blankDiagram,onPlace,onSelect,selected}:{diagram?:Diagram;onPlace?:(p:Point)=>void;onSelect?:(id:string)=>void;selected?:string}) {
  const id=useId();
  const view=diagram.court==='half'?'0 0 300 300':diagram.court==='crop'?'125 35 350 230':'0 0 580 300';
  function place(event:MouseEvent<SVGSVGElement>){
    const matrix=event.currentTarget.getScreenCTM();
    if(!matrix||!onPlace)return;
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    onPlace({x:Math.round(Math.max(0,Math.min(100,(p.x-10)/5.6))),y:Math.round(Math.max(0,Math.min(100,(p.y-10)/2.8)))});
  }
  return <svg className={'court '+(onPlace?'editable':'')} viewBox={view} onClick={place} aria-label="Håndballbane sett ovenfra" role="img">
    <defs>
      <linearGradient id={id+'floor'} x2="1" y2="1"><stop stopColor="#d9f0fa"/><stop offset="1" stopColor="#a9daf2"/></linearGradient>
      {['run','pass'].map(kind=><marker key={kind} id={id+kind} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill={kind==='run'?'#0656ac':'#dc2328'}/></marker>)}
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
      return <path key={a.id} d={a.bend?'M'+start+' Q'+coords(a.bend).join(' ')+' '+end:'M'+start+' L'+end} fill="none" stroke={a.kind==='run'?'#0656ac':'#dc2328'} strokeWidth={selected===a.id?6:3.5} strokeDasharray={a.kind==='pass'?'8 7':undefined} markerEnd={'url(#'+id+a.kind+')'} />;
    })}
    {diagram.marks.map(m=><g key={m.id} transform={'translate('+coords(m).join(' ')+')'} onClick={onSelect?e=>{e.stopPropagation();onSelect(m.id);}:undefined}>
      <title>{symbols[m.kind]} {m.label}</title>
      {selected===m.id&&<circle r="23" fill="none" stroke="#262c39" strokeDasharray="3 4"/>}
      {m.kind==='player'&&<><circle r="20" fill={m.team?'#be2c42':'#0761b7'} stroke="white" strokeWidth="2"/><text textAnchor="middle" dominantBaseline="central" className="player-label">{m.label}</text></>}
      {m.kind==='cone'&&<path d="M-12 11L0-15L12 11Z" fill="#fa9216" stroke="#fff5d8"/>}
      {m.kind==='empty'&&<circle r="19" fill="#e5fbdf" fillOpacity=".6" stroke="#14803e" strokeWidth="2.5" strokeDasharray="5 4"/>}
      {m.kind==='ball'&&<><circle r="10" fill="#f28b1a" stroke="#fff" strokeWidth="2"/><path d="M-7-5L7 5M-7 5L7-5M-9 0H9" stroke="#fff"/></>}
      {m.kind==='goal'&&<path d="M-16 9V-10H16V9" fill="none" stroke="#bb2031" strokeWidth="4"/>}
      {m.kind==='hurdle'&&<path d="M-12 9V-7H12V9" fill="none" stroke="#a86713" strokeWidth="4"/>}
      {m.kind==='text'&&<text textAnchor="middle" fill="#102a51" fontSize="15">{m.label}</text>}
    </g>)}
  </svg>;
}
export function DiagramCard({diagram}:{diagram?:Diagram}){
  return <div className="diagram"><Court diagram={diagram}/>{diagram?<div className="legend"><span><i className="pass"/> Pasning</span><span><i className="run"/> Løp</span><span><i className="empty"/> Ledig plass</span><span><i className="cone"/> Kjegle</span></div>:<p className="muted">Baneplassholder · ingen illustrasjon lagt inn</p>}</div>;
}
export function DiagramEditor({initial,onSave,onClose}:{initial?:Diagram;onSave:(d:Diagram)=>void;onClose:()=>void}){
  const [d,set]=useState(()=>structuredClone(initial??blankDiagram));
  const [tool,setTool]=useState<SymbolKind|'select'|'run'|'pass'>('player');
  const [selected,select]=useState('');
  const [start,setStart]=useState<Point>();
  const [label,setLabel]=useState('');
  const [team,setTeam]=useState<0|1>(0);
  const mark=d.marks.find(m=>m.id===selected);
  const arrow=d.arrows.find(a=>a.id===selected);
  function updatePoint(p:Point){
    if(tool==='select'){
      if(mark)set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,...p}:m)});
    }else if(tool==='run'||tool==='pass'){
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
      <label>Verktøy<select value={tool} onChange={e=>{setTool(e.target.value as typeof tool);setStart(undefined);}}><option value="select">Velg / flytt</option>{Object.entries(symbols).map(([v,l])=><option key={v} value={v}>{l}</option>)}<option value="run">Løp</option><option value="pass">Pasning</option></select></label>
      <label>Tekst / draktnummer<input value={label} maxLength={24} onChange={e=>setLabel(e.target.value)}/></label>
      <label>Spillerfarge<select value={team} onChange={e=>setTeam(Number(e.target.value) as 0|1)}><option value="0">Blå</option><option value="1">Rød</option></select></label>
    </div>
    <p className="muted">{start?'Trykk der pilen skal slutte.':tool==='select'?'Velg et symbol og trykk på den nye plasseringen.':tool==='run'||tool==='pass'?'Trykk der pilen skal starte.':'Trykk på banen for å plassere symbolet.'}</p>
    <Court diagram={d} selected={selected} onPlace={updatePoint} onSelect={tool==='select'?select:undefined}/>
    <div className="row wrap">
      <label>Valgt element<select value={selected} onChange={e=>select(e.target.value)}><option value="">Ingen</option>{d.marks.map((m,i)=><option key={m.id} value={m.id}>{i+1}. {symbols[m.kind]} {m.label}</option>)}{d.arrows.map((a,i)=><option key={a.id} value={a.id}>Pil {i+1} – {a.kind==='run'?'løp':'pasning'}</option>)}</select></label>
      {mark&&<><label>Merkelapp<input value={mark.label} maxLength={24} onChange={e=>set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,label:e.target.value}:m)})}/></label>{(['x','y'] as const).map(axis=><label key={axis}>{axis.toUpperCase()}<input type="number" min="0" max="100" value={mark[axis]} onChange={e=>set({...d,marks:d.marks.map(m=>m.id===mark.id?{...m,[axis]:Math.min(100,Math.max(0,Number(e.target.value)))}:m)})}/></label>)}</>}
      {(mark||arrow)&&<button onClick={()=>{set({...d,marks:d.marks.filter(m=>m.id!==selected),arrows:d.arrows.filter(a=>a.id!==selected)});select('');}}>Fjern element</button>}
    </div>
    <div className="row wrap"><button className="primary" onClick={()=>onSave(d)}>Lagre illustrasjon</button><button onClick={onClose}>Avbryt</button></div>
  </section>;
}
