import {type Session,type RunState,type RunRecord,type Item,cloneSession,total,uid} from './model.ts';
export const isActiveSession=(s:Session)=>Boolean(s.runner&&!s.runner.endedAt&&!s.completed&&!s.cancelled);
export const statusOf=(s:Session)=>s.cancelled?'Avlyst':isActiveSession(s)?'Pågår':s.evaluation?.rating?'Evaluert':s.completed?'Gjennomført':s.state==='draft'?'Utkast':'Klar';
export const snapshotPlan=(s:Session)=>s.originalPlan??structuredClone(s.planBOriginal??{items:s.items,players:s.players,attendees:s.attendees,attendanceRegistered:s.attendanceRegistered,allocation:s.allocation});
export const millisecondsLeft=(r:RunState,now=Date.now())=>r.deadline===undefined?(r.remainingMs??r.remaining*1000):Math.max(0,r.deadline-now);
export const secondsLeft=(r:RunState,now=Date.now())=>Math.ceil(millisecondsLeft(r,now)/1000);
export const recordMilliseconds=(r:RunRecord)=>r.elapsedMs??r.seconds*1000;
export const occurrenceId=(s:Session,r:RunRecord,index:number)=>r.id??s.id+'-legacy-'+index;
export const recordedOccurrences=(s:Session)=>(s.runner?.records??[]).map((r,i)=>({...r,id:occurrenceId(s,r,i)}));
export const performed=(r:RunRecord)=>!r.skipped&&r.status!=='skipped'&&(recordMilliseconds(r)>0||r.status==='confirmed');
export function event(s:Session,kind:string,now=Date.now(),detail?:string):Session{return {...s,events:[...(s.events??[]),{id:uid(),kind,at:now,itemId:s.runner?.itemId,occurrenceId:s.runner?.activeRecordId,detail}]};}
function normalize(s:Session):RunState|undefined{if(!s.runner)return;return {...structuredClone(s.runner),records:recordedOccurrences(s)};}
function activeRecord(r:RunState,item:Item){let row=r.records.find(x=>x.id===r.activeRecordId&&x.exerciseId===item.exerciseId);if(!row){row={id:uid(),itemId:item.id,exerciseId:item.exerciseId,seconds:0,elapsedMs:0,remainingMs:r.remainingMs??r.remaining*1000,snapshot:structuredClone(item),status:'paused'};r.records.push(row);r.activeRecordId=row.id;}return row;}
export function capture(s:Session,now=Date.now()):Session{
 if(!s.runner)return {...s,originalPlan:snapshotPlan(s)};
 const r=normalize(s)!,item=s.items.find(i=>i.id===r.itemId);
 const elapsed=r.runningSince===undefined?0:Math.max(0,Math.min(now,r.deadline??now)-r.runningSince);
 if(item&&elapsed){const row=activeRecord(r,item);row.elapsedMs=recordMilliseconds(row)+elapsed;row.seconds=Math.floor(row.elapsedMs/1000);}
 r.remainingMs=millisecondsLeft(r,now);r.remaining=Math.ceil(r.remainingMs/1000);const row=r.records.find(x=>x.id===r.activeRecordId);if(row)row.remainingMs=r.remainingMs;
 r.deadline=undefined;r.runningSince=undefined;r.updatedAt=now;
 return {...s,originalPlan:snapshotPlan(s),runner:r};
}
export function clockAction(s:Session,action:'start'|'pause'|'reset'|'next'|'previous'|'skip'|'finish'|number,now=Date.now()):Session{
 if(s.runner?.endedAt||s.completed||s.cancelled)return s;
 if(!s.items.length){return action==='finish'?event({...capture(s,now),completed:true,runner:s.runner?{...capture(s,now).runner!,endedAt:now}:undefined},'finish',now):s;}
 const wasRunning=s.runner?.deadline!==undefined;
 let next=capture(s,now),r=next.runner??{itemId:s.items[0].id,remaining:s.items[0].minutes*60,remainingMs:s.items[0].minutes*60000,startedAt:now,updatedAt:now,records:[]};
 const index=Math.max(0,s.items.findIndex(i=>i.id===r.itemId)),item=s.items[index];
 if(action==='skip'&&r.settled)return s;
 if(action==='finish'){const row=r.records.find(x=>x.id===r.activeRecordId);if(row&&!row.skipped)row.status='completed';return event({...next,completed:true,runner:{...r,endedAt:now},state:'ready'},'finish',now);}
 if(action==='next'||action==='previous'||action==='skip'){
  next={...next,activeAllocationId:undefined};
  if(action==='skip'){const row=activeRecord(r,item);row.skipped=true;row.status='skipped';r.remainingMs=0;r.remaining=0;row.remainingMs=0;}
  const target=index+(action==='previous'?-1:1);
  if(target<0||target>=s.items.length){r.settled=true;return event({...next,runner:r},action,now);}
  const previous=[...r.records].reverse().find(x=>x.itemId===s.items[target].id&&x.exerciseId===s.items[target].exerciseId&&!x.skipped);
  const ms=action==='previous'&&previous?previous.remainingMs??0:s.items[target].minutes*60000;
  r={...r,itemId:s.items[target].id,activeRecordId:action==='previous'?previous?.id:undefined,remainingMs:ms,remaining:Math.ceil(ms/1000),settled:false};
 }else if(action==='reset'){r.remainingMs=item.minutes*60000;r.remaining=item.minutes*60;r.activeRecordId=undefined;r.settled=false;}
 else if(typeof action==='number'){r.remainingMs=Math.max(0,(r.remainingMs??r.remaining*1000)+action*1000);r.remaining=Math.ceil(r.remainingMs/1000);r.settled=false;}
 if(action==='start'||(typeof action==='number'&&wasRunning)){if(r.remainingMs??r.remaining){activeRecord(r,item);r.deadline=now+(r.remainingMs??r.remaining*1000);r.runningSince=now;r.settled=false;}}
 const row=r.records.find(x=>x.id===r.activeRecordId);if(row){row.remainingMs=r.remainingMs;if(action==='pause')row.status=r.remaining===0?'completed':'paused';}
 return event({...next,runner:{...r,updatedAt:now},state:'ready'},typeof action==='number'?'duration':action,now,typeof action==='number'?String(action):undefined);
}
export function replaceExercise(item:Item,exerciseId:string):Item{return {...item,exerciseId,comment:'',variant:undefined};}
export function replaceRunning(s:Session,itemId:string,exerciseId:string,minutes?:number,now=Date.now()):Session{
 if(s.completed||s.runner?.endedAt)return s;
 const active=s.runner?.itemId===itemId;let next=active?capture(s,now):{...s,originalPlan:snapshotPlan(s)};
 next={...next,items:next.items.map(i=>i.id===itemId?{...replaceExercise(i,exerciseId),minutes:minutes??i.minutes}:i)};
 if(active&&next.runner){const r=next.runner,row=r.records.find(x=>x.id===r.activeRecordId);if(row)row.status='replaced';const ms=minutes===undefined?r.remainingMs??r.remaining*1000:minutes*60000;next={...next,runner:{...r,activeRecordId:undefined,remainingMs:ms,remaining:Math.ceil(ms/1000),settled:false}};}
 return event(next,'replace',now,exerciseId);
}
export function addRunning(s:Session,item:Item,placement:'now'|'after'|'end'|'replace',now=Date.now()):Session{
 if(s.completed||s.runner?.endedAt)return s;
 const index=Math.max(0,s.items.findIndex(i=>i.id===s.runner?.itemId));
 if(placement==='replace'&&s.items[index])return replaceRunning(s,s.items[index].id,item.exerciseId,item.minutes,now);
 let next=placement==='now'?capture(s,now):{...s,originalPlan:snapshotPlan(s)};
 const at=placement==='end'?s.items.length:placement==='after'?index+1:index;
 next={...next,items:[...next.items.slice(0,at),item,...next.items.slice(at)]};
 if(placement==='now'){const r=next.runner??{itemId:item.id,remaining:item.minutes*60,startedAt:now,updatedAt:now,records:[]};next={...next,runner:{...r,itemId:item.id,activeRecordId:undefined,remaining:item.minutes*60,remainingMs:item.minutes*60000,settled:false}};next=clockAction(next,'start',now);}
 return event(next,'add',now,item.exerciseId);
}
export function confirmPerformed(s:Session,itemId:string):Session{
 const item=s.items.find(i=>i.id===itemId);if(!item)return s;
 const now=Date.now(),r=normalize(s)??{itemId,remaining:0,startedAt:now,updatedAt:now,endedAt:s.completed?now:undefined,records:[]};
 r.records.push({id:uid(),itemId,exerciseId:item.exerciseId,seconds:0,status:'confirmed',snapshot:structuredClone(item)});return event({...s,runner:r},'confirmed',now);
}
export function copyPlan(s:Session,source:boolean|'actual'=false){
 if(source==='actual'){const items=recordedOccurrences(s).filter(performed).map(r=>({...r.snapshot??{id:r.itemId,exerciseId:r.exerciseId,minutes:1,comment:''},exerciseId:r.exerciseId,minutes:recordMilliseconds(r)>0?Math.max(1,Math.ceil(recordMilliseconds(r)/60000)):r.snapshot?.minutes??1}));return cloneSession({...s,items});}
 return cloneSession(source&&s.originalPlan?{...s,...s.originalPlan}:s);
}
export function timeline(s:Session){let cursor=0;return s.items.map(item=>{const start=cursor;cursor+=item.minutes+(item.transition??0);return {item,start,end:start+item.minutes,next:cursor};});}
export const plannedMinutes=(s:Session)=>total(s)+s.items.reduce((n,i)=>n+(i.transition??0),0);
export const remainingPlannedSeconds=(s:Session,now=Date.now())=>{const index=Math.max(0,s.items.findIndex(i=>i.id===s.runner?.itemId));return (s.runner?secondsLeft(s.runner,now):(s.items[index]?.minutes??0)*60)+s.items.slice(index).reduce((n,i,j)=>n+(i.transition??0)*60+(j?i.minutes*60:0),0);};
