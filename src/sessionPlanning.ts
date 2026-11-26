import {type Session,type Exercise,type Data,type Item,suggest,total,playerCount,fits,section} from './model.ts';
import {planningMeta} from './planningMeta.ts';
import {plannedMinutes,recordedOccurrences,performed} from './sessionFlow.ts';
export function planningPreferences(data:Data,s:Session){
 const relevant=data.sessions.filter(x=>x.hall===s.hall&&Math.abs(playerCount(x)-playerCount(s))<=Math.max(4,playerCount(s)*.25)&&Math.abs(x.coaches-s.coaches)<=1);
 const rated=(rating:string)=>relevant.flatMap(x=>[...Object.entries(x.evaluation?.items??{}).filter(([,v])=>v===rating).map(([id])=>id),...recordedOccurrences(x).filter(r=>performed(r)&&x.evaluation?.occurrences?.[r.id]===rating).map(r=>r.exerciseId)]);
 return {favorites:data.favorites,successful:rated('bra'),unsuccessful:rated('dårlig'),recent:[...relevant].filter(x=>x.completed).sort((a,b)=>b.date.localeCompare(a.date)).flatMap(x=>recordedOccurrences(x).filter(performed).map(r=>r.exerciseId)),variety:s.variety??'balanced'};
}
export function fillSession(s:Session,exercises:Exercise[],data:Data,fillOnly=false,personalize=true,newVariant=false):Item[]{
 const kept=fillOnly?s.items:s.items.filter(i=>i.locked),remaining=s.duration-kept.reduce((n,i)=>n+i.minutes+(i.transition??0),0);
 if(remaining<=0)return s.items.some((i,n)=>i.locked&&s.items.slice(0,n).some(x=>!x.locked))?s.items:kept;
 const pool=exercises.filter(e=>!kept.some(i=>i.exerciseId===e.id)&&(!newVariant||!s.items.some(i=>!i.locked&&i.exerciseId===e.id)));
 const proposed=suggest({...s,duration:remaining},pool,personalize?planningPreferences(data,s):undefined);
 if(fillOnly)return [...kept,...proposed];
 if(!proposed.length)return s.items;
 const queue=[...proposed],items=s.items.map(i=>i.locked?i:queue.shift()??i);return [...items,...queue];
}
export function optimizeTime(s:Session,exercises:Exercise[]){
 const items=structuredClone(s.items);let delta=s.duration-plannedMinutes(s),changed=true;
 while(delta&&changed){changed=false;for(const item of items.filter(i=>!i.locked)){const e=exercises.find(e=>e.id===item.exerciseId);if(!e?.minutes)continue;const direction=Math.sign(delta),next=item.minutes+direction;if(next<e.minutes[0]||next>e.minutes[1])continue;item.minutes=next;delta-=direction;changed=true;if(!delta)break;}}return items;
}
export function exerciseFit(e:Exercise,s:Session){if(!fits(e,s))return 'Krever tilpasning til rammene';if(!e.players||!e.halls?.length||e.coaches===undefined)return 'Noen praktiske krav er uavklart';return 'Passer registrerte rammer';}
export function sessionCheck(s:Session,exercises:Exercise[]){
 const rows:{kind:'fact'|'advice'|'unknown'|'good';text:string}[]=[],minutes=plannedMinutes(s),known=s.items.map(i=>exercises.find(e=>e.id===i.exerciseId)).filter((e):e is Exercise=>Boolean(e));
 rows.push({kind:minutes===s.duration?'good':'fact',text:minutes===s.duration?'Planlagt tid fyller økten.':minutes>s.duration?(minutes-s.duration)+' minutter over tilgjengelig tid.':(s.duration-minutes)+' minutter ledig, inkludert registrerte overganger.'});
 for(const e of known){const fit=exerciseFit(e,s),meta=planningMeta(e);if(!fits(e,s))rows.push({kind:'fact',text:e.title+': '+fit+'.'});else if(fit.includes('uavklart'))rows.push({kind:'unknown',text:e.title+': '+fit+'.'});if(meta.queue==='høy'||meta.complexity==='krevende')rows.push({kind:'advice',text:e.title+': vurder mindre grupper eller ekstra riggetid (redaksjonell vurdering).'});if(s.coaches===1&&meta.oneCoach===false)rows.push({kind:'advice',text:e.title+': kan være krevende å følge opp alene.'});}
 if(known.length&&known.every(e=>fits(e,s)))rows.push({kind:'good',text:'Ingen kjente brudd på spiller-, hall- eller trenerkrav. Ukjente krav må fortsatt vurderes.'});
 const ids=s.items.map(i=>i.allocationId).filter(Boolean);if(ids.length>1&&new Set(ids).size===1)rows.push({kind:'good',text:'Samme lagoppsett kan gjenbrukes mellom øvelsene.'});else if(new Set(ids).size>2)rows.push({kind:'advice',text:'Flere lagoppsett kan gi ekstra omorganiseringstid.'});
 return rows;
}
export function equipmentList(s:Session,exercises:Exercise[]){const lines=s.items.flatMap(i=>{const e=exercises.find(e=>e.id===i.exerciseId);return e?(planningMeta(e).equipment??section(e,'Du trenger')):[];});return [...new Set(lines.map(l=>l.trim()).filter(Boolean))];}

export function planBChoices(current:Exercise,s:Session,catalog:Exercise[],reason:string,options:{missingEquipment?:string;minutes?:number;known?:string[]}={}){
 const missing=(options.missingEquipment??'').toLocaleLowerCase('nb').split(',').map(x=>x.trim()).filter(Boolean);
 const skills=current.skillTags??current.skills;
 return catalog.filter(e=>e.id!==current.id&&!e.unresolved&&fits(e,s)&&(!options.minutes||!e.minutes||e.minutes[0]<=options.minutes)&&!missing.some(word=>(planningMeta(e).equipment??section(e,'Du trenger')).join(' ').toLocaleLowerCase('nb').includes(word))&&((e.skillTags??e.skills).some(t=>skills.includes(t))||e.categories.some(c=>current.categories.includes(c)))).map(e=>{
  const meta=planningMeta(e),reasons:string[]=[];let score=0;
  const prefer=(yes:boolean|undefined,points:number,text:string)=>{if(yes){score+=points;reasons.push(text);}};
  prefer(Boolean(e.players&&e.halls?.length&&e.coaches!==undefined),1,'Registrerte krav passer øktens rammer');
  if(reason==='queue'){prefer(meta.queue==='lav',8,'Lav kø (redaksjonell vurdering)');prefer(meta.activity==='høy',3,'Høy aktivitet');prefer((meta.stations??0)>1,2,'Flere registrerte stasjoner');if(meta.queue==='høy')score-=12;}
  if(reason==='easy')prefer(section(e,'Nivåtilpasning').some(x=>/lettere/i.test(x)),8,'Kilden beskriver en lettere tilpasning');
  if(reason==='easy'||reason==='poor'||reason==='restless')prefer(meta.complexity==='enkel',6,'Enkel organisering (redaksjonell vurdering)');
  if(reason==='hard')prefer(section(e,'Nivåtilpasning').some(x=>/vanskeligere/i.test(x)),6,'Kilden beskriver en vanskeligere tilpasning');
  if(reason==='coaches')prefer(meta.oneCoach===true||e.coaches===1,8,'Oppgitt egnet med én trener; kontroller organiseringen');
  if(reason==='space')prefer(Boolean(e.halls?.includes('liten')),8,'Oppgitt for liten hall');
  if(reason==='fewer')prefer(Boolean(e.players&&e.players[0]<=playerCount(s)),6,'Registrert spillerkrav passer');
  if(reason==='restless'){prefer(meta.activity==='høy',3,'Høy aktivitet (redaksjonell vurdering)');prefer(options.known?.includes(e.id),5,'Tidligere registrert gjennomført');prefer(section(e,'Slik gjør dere').length>0&&section(e,'Slik gjør dere').length<=3,2,'Kort registrert instruksjon');}
  if(reason==='equipment')reasons.push('Kontroller utstyret: '+(equipmentList({...s,items:[{id:'preview',exerciseId:e.id,minutes:1,comment:''}]},[e]).join(', ')||'ikke oppgitt'));
  if(!e.players||!e.halls?.length||e.coaches===undefined)reasons.push('Noen krav er uavklart');
  return {exercise:e,score,reason:reasons.join(' · ')||'Samme ferdighet eller kategori; vurder tilpasning'};
 }).sort((a,b)=>b.score-a.score).slice(0,3);
}
