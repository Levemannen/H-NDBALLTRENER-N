export type Section = {label:string; lines:string[]};
export type ExerciseMeta = {categories?:string[]; skillTags?:string[]; types?:string[]; players?:number[]; minutes?:number[]; halls?:string[]; coaches?:number};
export type Exercise = ExerciseMeta & {id:string; title:string; number?:number; bank?:string; unresolved?:boolean; categories:string[]; skills:string[]; meta?:string; sections:Section[]};
export type Level = 1|2|3|4;
export type Player = {id:string; name:string; level:Level};
export type Point = {x:number;y:number};
export type SymbolKind = 'player'|'keeper'|'cone'|'ball'|'goal'|'hurdle'|'mat'|'empty'|'text';
export type Diagram = {court:'full'|'half'|'crop'; marks:({id:string;kind:SymbolKind;label:string;team:0|1}&Point)[]; arrows:{id:string;kind:'run'|'pass'|'carry';from:Point;to:Point;bend?:Point}[]};
export type Item = {id:string; exerciseId:string; minutes:number; comment:string};
export type Session = {startTime?:string; allocation?:{name:string;players:string[]}[]; evaluation?:{rating:string;note:string};id:string; name:string; date:string; duration:number; players:number; coaches:number; hall:string; focus:string; attendees:string[]; items:Item[]; template:boolean};
export type Annotation = {note:string; variant:string; difficulty:string; metadata?:ExerciseMeta};
export type Data = {version:1; team:string; players:Player[]; sessions:Session[]; favorites:string[]; notes:Record<string,Annotation>; diagrams:Record<string,Diagram>; exercises:Exercise[]};
export const storageKey = 'handballtrenern.v1';
export const halls = ['liten','halv','stor','gymsal'];
export const levels = ['Svært øvet','Øvet','Litt øvet','Uøvet'];
export const uid = () => globalThis.crypto.randomUUID();
export const dateToday = () => {
  const now = new Date();
  return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
};
export const fresh = ():Data => ({version:1,team:'Vålerenga G2016/17',players:[],sessions:[],favorites:[],notes:{},diagrams:{},exercises:[]});
export const newSession = ():Session => ({id:uid(),name:'',date:dateToday(),duration:60,players:12,coaches:2,hall:'stor',focus:'',attendees:[],items:[],template:false});
export const section = (exercise:Exercise, label:string) => exercise.sections.find(s=>s.label===label)?.lines ?? [];
export const intro = (e:Exercise) => section(e,'Kort forklart')[0] ?? e.sections[0]?.lines[0] ?? '';
export const itemFor = (e:Exercise, minutes = e.minutes?.[0] ?? 5):Item => ({id:uid(),exerciseId:e.id,minutes,comment:''});
export const total = (s:Session) => s.items.reduce((sum,item)=>sum+item.minutes,0);
export const norm = (s:string) => s.toLocaleLowerCase('nb');
export const matches = (e:Exercise, q:string) => norm([e.title,e.number,e.bank,...e.categories,...e.skills,...e.sections.flatMap(s=>[s.label,...s.lines])].join(' ')).includes(norm(q.trim()));
type Obj = Record<string,unknown>;
const object = (v:unknown):v is Obj => typeof v==='object' && v!==null && !Array.isArray(v);
const string = (v:unknown):v is string => typeof v==='string';
const integer = (v:unknown,min=0) => typeof v==='number' && Number.isSafeInteger(v) && v>=min;
const list = (v:unknown,check:(x:unknown)=>boolean) => Array.isArray(v) && v.every(check);
const strings = (v:unknown) => list(v,string);
const record = (v:unknown,check:(x:unknown)=>boolean) => object(v) && Object.entries(v).every(([k,x])=>!['__proto__','constructor','prototype'].includes(k) && check(x));
const key = (v:unknown) => string(v) && /^[a-zA-Z0-9-]+$/.test(v);
const range = (v:unknown) => Array.isArray(v) && v.length===2 && v.every(x=>integer(x,1)) && v[0]<=v[1];
const metadata = (v:unknown) => object(v) && ['categories','skillTags','types','halls'].every(k=>v[k]===undefined||strings(v[k])) && ['players','minutes'].every(k=>v[k]===undefined||range(v[k])) && (v.coaches===undefined||integer(v.coaches,1));
const exercise = (v:unknown) => object(v) && metadata(v) && key(v.id) && string(v.title) && strings(v.categories) && strings(v.skills) && list(v.sections,s=>object(s)&&string(s.label)&&strings(s.lines));
const point = (v:unknown) => object(v) && [v.x,v.y].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100);
const diagram = (v:unknown) => object(v) && ['full','half','crop'].includes(String(v.court)) && list(v.marks,m=>object(m)&&key(m.id)&&point(m)&&['player','keeper','cone','ball','goal','hurdle','mat','empty','text'].includes(String(m.kind))&&string(m.label)&&(m.team===0||m.team===1)) && list(v.arrows,a=>object(a)&&key(a.id)&&['run','pass','carry'].includes(String(a.kind))&&point(a.from)&&point(a.to)&&(a.bend===undefined||point(a.bend)));
const sessionExtras=(v:Obj)=>{
  if(v.startTime!==undefined&&(!string(v.startTime)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.startTime)))return false;
  if(v.evaluation!==undefined&&(!object(v.evaluation)||!['','bra','middels','dårlig'].includes(String(v.evaluation.rating))||!string(v.evaluation.note)))return false;
  if(v.allocation!==undefined){
    if(!list(v.allocation,g=>object(g)&&string(g.name)&&list(g.players,key)))return false;
    const ids=(v.allocation as {players:string[]}[]).flatMap(g=>g.players);
    if(new Set(ids).size!==ids.length||!Array.isArray(v.attendees)||ids.some(id=>!(v.attendees as unknown[]).includes(id)))return false;
  }
  return true;
};
const session = (v:unknown) => object(v)&&sessionExtras(v)&&key(v.id)&&string(v.name)&&string(v.date)&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&integer(v.duration,1)&&integer(v.players)&&integer(v.coaches)&&string(v.hall)&&string(v.focus)&&strings(v.attendees)&&typeof v.template==='boolean'&&list(v.items,i=>object(i)&&key(i.id)&&key(i.exerciseId)&&integer(i.minutes,1)&&string(i.comment));
export function parseData(text:string):Data {
  const v:unknown = JSON.parse(text);
  if (!object(v)||v.version!==1||!string(v.team)||!list(v.players,p=>object(p)&&key(p.id)&&string(p.name)&&[1,2,3,4].includes(p.level as number))||!list(v.sessions,session)||!list(v.favorites,key)||!record(v.notes,n=>object(n)&&string(n.note)&&string(n.variant)&&string(n.difficulty)&&(n.metadata===undefined||metadata(n.metadata)))||!record(v.diagrams,diagram)||!list(v.exercises,exercise)) throw new Error('Ugyldig sikkerhetskopi eller dataversjon.');
  const data = v as Data;
  for (const rows of [data.players,data.sessions,data.exercises,...data.sessions.map(s=>s.items)]) {
    if (new Set(rows.map(r=>r.id)).size!==rows.length) throw new Error('Sikkerhetskopien har dupliserte ID-er.');
  }
  if(data.exercises.some(e=>e.id.startsWith('master-'))) throw new Error('Egne øvelser bruker reserverte ID-er.');
  return data;
}
export function loadData(storage:Pick<Storage,'getItem'>):Data {
  const saved = storage.getItem(storageKey);
  return saved ? parseData(saved) : fresh();
}
export function saveData(storage:Pick<Storage,'setItem'>,data:Data) {
  storage.setItem(storageKey,JSON.stringify(data));
}
export function suggest(s:Session, exercises:Exercise[]):Item[] {
  const eligible = exercises.filter(e=>!e.unresolved && (!e.players || (s.players>=e.players[0]&&s.players<=e.players[1])) && (!e.halls?.length || e.halls.includes(s.hall)) && (e.coaches!==undefined?s.coaches>=e.coaches:s.coaches>0||!e.sections.some(b=>/treneren/i.test(b.lines.join(' ')))));
  const stages = ['Oppvarming',s.focus || 'Pasning','Småspill','Avsluttende'];
  const selected:Item[] = [];
  let remaining = s.duration;
  while (remaining>0) {
    const before = remaining;
    for (const [index,stage] of stages.entries()) {
      const target = Math.ceil(remaining/(stages.length-index));
      const ranked = eligible.filter(e=>!selected.some(i=>i.exerciseId===e.id) && (e.minutes?.[0]??5)<=remaining);
      const score = (e:Exercise) => Number(matches(e,stage))*10 + Number(Boolean(s.focus&&matches(e,s.focus)))*2 + Number(Boolean(e.minutes));
      ranked.sort((a,b)=>score(b)-score(a));
      const e = ranked[0];
      if (!e) continue;
      const duration = Math.min(remaining, e.minutes?.[1]??5, Math.max(e.minutes?.[0]??5,target));
      selected.push(itemFor(e,duration));
      remaining -= duration;
    }
    if (remaining===before) break;
  }
  return selected;
}
export function groups(players:Player[], count:number, byLevel:boolean):Player[][] {
  if(!players.length) return [];
  const size = Math.max(1,Math.min(players.length,Math.floor(count)||1));
  const result:Player[][] = Array.from({length:size},()=>[]);
  const sorted = [...players].sort((a,b)=>a.level-b.level);
  const capacities = result.map((_,i)=>Math.floor(players.length/size)+(i<players.length%size?1:0));
  if (byLevel) {
    let offset=0;
    return capacities.map(n=>{const team=sorted.slice(offset,offset+n);offset+=n;return team;});
  }
  const scores = result.map(()=>0);
  for(const player of sorted) {
    const index = scores.reduce((best,score,i)=>result[i].length<capacities[i] && (best<0 || score<scores[best] || (score===scores[best]&&result[i].length<result[best].length))?i:best,-1);
    result[index].push(player);
    scores[index]+=5-player.level;
  }
  return result;
}
