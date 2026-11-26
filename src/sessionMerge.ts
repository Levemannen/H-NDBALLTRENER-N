import type {Session} from './model.ts';
import {stableText} from './syncDecision.ts';
export function cleanSession(s:Session):Session{const {editBase:_,...rest}=s;return rest;}
export function editingSession(s:Session):Session{return {...structuredClone(cleanSession(s)),editBase:stableText(cleanSession(s))};}
// Attendance and its allocation are one unit: merging these fields separately can create invalid references.
const attendance=['attendees','attendanceRegistered','allocation','allocations','attendanceEvents','planBOriginal'] as const;
const labels:Record<string,string>={name:'Navn',date:'Dato',duration:'Varighet',coaches:'Antall trenere',hall:'Hall',focus:'Treningsfokus',items:'Øvelser',evaluation:'Evaluering',completed:'Gjennomført',startTime:'Starttid',template:'Treningsmal'};
export function mergeSession(draft:Session,current?:Session){
 const edited=cleanSession(draft);
 if(!current)return {session:edited,conflicts:draft.editBase?['Økten er slettet siden redigeringen startet']:[]};
 const saved=cleanSession(current);
 if(!draft.editBase)return {session:edited,conflicts:stableText(edited)===stableText(saved)?[]:['Eldre utkast uten sammenligningsgrunnlag']};
 const base=JSON.parse(draft.editBase) as Session;
 const merged={...saved},conflicts:string[]=[];
 const groups=[...Object.keys({...base,...edited,...saved}).filter(k=>k!=='editBase'&&!attendance.includes(k as typeof attendance[number])).map(k=>[k]),[...attendance]];
 for(const keys of groups){
  if(keys.length===1&&['runner','events','originalPlan'].includes(keys[0]))continue;
  const values=(s:Session)=>keys.map(k=>s[k as keyof Session]??null);
  const b=stableText(values(base)),d=stableText(values(edited)),c=stableText(values(saved));
  if(d===b)continue;
  if(c!==b&&c!==d)conflicts.push(keys.length>1?'Oppmøte og lagfordeling':labels[keys[0]]??'Øktopplysninger');
  for(const key of keys)(merged as unknown as Record<string,unknown>)[key]=edited[key as keyof Session];
 }
 return {session:merged,conflicts};
}
