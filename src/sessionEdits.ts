import {type Session,validSession} from './model.ts';
import {stableText} from './syncDecision.ts';

type Segment=string|{id:string};
type Edit={path:Segment[];before:unknown;after:unknown};
export type SessionEdit={sessionId:string;changes:Edit[]};
const equal=(a:unknown,b:unknown)=>stableText(a??null)===stableText(b??null);
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const keyed=(v:unknown[]):v is {id:string}[]=>v.every(x=>object(x)&&typeof x.id==='string')&&new Set(v.map(x=>(x as {id:string}).id)).size===v.length;
// Historical measurements are append-only and are deliberately outside undo.
const history=new Set(['runner','originalPlan','planBOriginal','events','editBase']);
export function sessionEdit(before:Session,after:Session):SessionEdit{
 const changes:Edit[]=[];
 function diff(a:unknown,b:unknown,path:Segment[]){
  if(equal(a,b))return;
  if(object(a)&&object(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],[...path,k]);return;}
  if(Array.isArray(a)&&Array.isArray(b)&&keyed(a)&&keyed(b)&&equal(a.map(x=>x.id),b.map(x=>x.id))){for(const x of a)diff(x,b.find(y=>y.id===x.id),[...path,{id:x.id}]);return;}
  changes.push({path,before:structuredClone(a),after:structuredClone(b)});
 }
 for(const key of new Set([...Object.keys(before),...Object.keys(after)]))if(!history.has(key))diff(before[key as keyof Session],after[key as keyof Session],[key]);
 return {sessionId:before.id,changes};
}
function parent(value:unknown,path:Segment[]){let current:any=value;for(const part of path.slice(0,-1)){current=typeof part==='string'?current?.[part]:Array.isArray(current)?current.find(x=>x.id===part.id):undefined;if(current===undefined)throw Error('Elementet er fjernet eller endret.');}return current;}
export function applySessionEdit(current:Session,edit:SessionEdit,reverse=true):Session{
 if(current.id!==edit.sessionId)throw Error('Angrehandlingen tilhører en annen trening.');
 const next=structuredClone(current);
 for(const change of edit.changes){const target=parent(next,change.path),key=change.path.at(-1)!;if(typeof key!=='string'||!target)throw Error('Elementet finnes ikke lenger.');const expected=reverse?change.after:change.before;
  if(!equal(target[key],expected))throw Error('Kan ikke angre: det samme feltet er endret senere. Nyere arbeid er beholdt.');
  const value=reverse?change.before:change.after;if(value===undefined)delete target[key];else target[key]=structuredClone(value);
 }
 // Attendance can change independently of a group undo. Preserve the approved
 // setup as history but keep the legacy active projection referentially valid.
 if(next.allocation)next.allocation=next.allocation.map(g=>({...g,players:g.players.filter(id=>next.attendees.includes(id))}));
 const active=current.runner?.itemId;
 if(active&&!current.runner?.endedAt&&current.items.some(i=>i.id===active)&&!next.items.some(i=>i.id===active))throw Error('Velg en annen øvelse før du fjerner den aktive øvelsen. Registrert tid beholdes.');
 if(current.runner?.deadline!==undefined&&current.items.find(i=>i.id===active)?.exerciseId!==next.items.find(i=>i.id===active)?.exerciseId)throw Error('Sett timeren på pause før du angrer byttet av aktiv øvelse. Registrert tid beholdes.');
 if(!validSession(next))throw Error('Angre ville gitt ugyldige treningsdata. Nyere arbeid er beholdt.');
 return next;
}
