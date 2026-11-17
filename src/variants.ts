import {type Exercise,type Session,section,total} from './model.ts';
export type Variant={id:string;name:string;description:string[];equipment:string[];levels:string[];minutes?:number[];diagramKey?:string};
export function variants(e:Exercise):Variant[]{
 return e.sections.flatMap((s,index)=>{
  if(!/variant/i.test(s.label))return [];
  const independent=s.lines.length>0&&s.lines.every(line=>/^• /.test(line))&&!s.lines.some(line=>/nivå\s*\d|deretter|forrige|neste trinn/i.test(line));
  const groups=independent?s.lines.map(line=>[line]):[s.lines];
  return groups.map((lines,i)=>({id:e.id+'-variant-'+index+'-'+i,name:independent?lines[0].replace(/^• /,''):s.label,description:lines,equipment:e.id==='master-16'?['6 kjegler og én ball per gruppe (valgt variant)']:section(e,'Du trenger'),levels:section(e,'Nivåtilpasning'),diagramKey:e.id+'-variant-'+index+'-'+i}));
 });
}
export const chosenVariant=(e:Exercise,value?:string)=>variants(e).find(v=>v.id===value)??(value&&e.sections.some(s=>s.label===value)?{id:value,name:value,description:section(e,value),equipment:section(e,'Du trenger'),levels:section(e,'Nivåtilpasning')}:undefined);
export function sessionText(s:Session,team:string,exercises:Exercise[],mode:'short'|'full'='full'):string{
 const rows=[s.name||'Trening',team,s.date.split('-').reverse().join('.')+(s.startTime?' kl. '+s.startTime:''),s.players+' planlagte spillere · '+s.coaches+' trener(e) · '+s.hall+' hall',total(s)+' minutter'+(s.focus?' · Fokus: '+s.focus:''),''];
 let elapsed=0;
 for(const [i,item] of s.items.entries()){
  const e=exercises.find(e=>e.id===item.exerciseId),v=e?chosenVariant(e,item.variant):undefined;
  let clock='';if(s.startTime){const [h,m]=s.startTime.split(':').map(Number);const t=h*60+m+elapsed;clock=String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0')+' · ';}elapsed+=item.minutes;
  rows.push((i+1)+'. '+clock+(e?.title??'Ukjent øvelse')+' – '+item.minutes+' min');
  if(v)rows.push('Variant: '+v.name,...(mode==='full'?v.description:v.description.slice(0,2)));else if(e)rows.push(...(mode==='full'?section(e,'Slik gjør dere'):section(e,'Kort forklart')));
  if(mode==='full'&&e)rows.push(...section(e,'Slik setter du opp'));
  if(e){const gear=v?.equipment??section(e,'Du trenger'),focus=section(e,'Trenerens fokus');if(mode==='full'&&gear.length)rows.push('Utstyr: '+gear.join(' '));if(focus.length)rows.push('Trenerfokus: '+focus.join(' '));}
  if(item.comment)rows.push('Kommentar: '+item.comment);rows.push('');
 }
 return rows.join('\n').trim();
}
