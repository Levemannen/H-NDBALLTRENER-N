import {type Session,type RunState,type Item,cloneSession,total} from './model.ts';
export const statusOf=(s:Session)=>s.runner&&!s.runner.endedAt?'Pågår':s.evaluation?.rating?'Evaluert':s.completed?'Gjennomført':s.state==='draft'?'Utkast':'Klar';
export const snapshotPlan=(s:Session)=>s.originalPlan??structuredClone(s.planBOriginal??{items:s.items,players:s.players,attendees:s.attendees,attendanceRegistered:s.attendanceRegistered,allocation:s.allocation});
export const secondsLeft=(r:RunState,now=Date.now())=>r.deadline===undefined?r.remaining:Math.max(0,Math.ceil((r.deadline-now)/1000));
export function capture(s:Session,now=Date.now()):Session{
 if(!s.runner)return {...s,originalPlan:snapshotPlan(s)};
 const r=structuredClone(s.runner),item=s.items.find(i=>i.id===r.itemId);
 const elapsed=r.runningSince===undefined?0:Math.max(0,Math.floor((Math.min(now,r.deadline??now)-r.runningSince)/1000));
 if(item&&elapsed){const row=r.records.find(x=>x.itemId===item.id&&x.exerciseId===item.exerciseId);if(row)row.seconds+=elapsed;else r.records.push({itemId:item.id,exerciseId:item.exerciseId,seconds:elapsed});}
 r.remaining=secondsLeft(r,now);r.deadline=undefined;r.runningSince=undefined;r.updatedAt=now;
 return {...s,originalPlan:snapshotPlan(s),runner:r};
}
export function clockAction(s:Session,action:'start'|'pause'|'reset'|'next'|'previous'|'skip'|'finish'|number,now=Date.now()):Session{
 if(!s.items.length)return s;
 const wasRunning=s.runner?.deadline!==undefined;
 let next=capture(s,now),r=next.runner??{itemId:s.items[0].id,remaining:s.items[0].minutes*60,startedAt:now,updatedAt:now,records:[]};
 const index=Math.max(0,s.items.findIndex(i=>i.id===r.itemId));
 if(action==='finish')return {...next,completed:true,runner:{...r,endedAt:now},state:'ready'};
 if(r.endedAt)return s;
 if(action==='next'||action==='previous'||action==='skip'){
  if(action==='skip'){const item=s.items[index];r.records.push({itemId:item.id,exerciseId:item.exerciseId,seconds:0,skipped:true});}
  const i=Math.max(0,Math.min(s.items.length-1,index+(action==='previous'?-1:1)));r={...r,itemId:s.items[i].id,remaining:s.items[i].minutes*60};
 }else if(action==='reset')r.remaining=s.items[index].minutes*60;
 else if(typeof action==='number')r.remaining=Math.max(0,r.remaining+action);
 if(action==='start'||(typeof action==='number'&&wasRunning)){r.deadline=r.remaining?now+r.remaining*1000:undefined;r.runningSince=r.remaining?now:undefined;}
 return {...next,runner:{...r,updatedAt:now},state:'ready'};
}
export function replaceExercise(item:Item,exerciseId:string):Item{return {...item,exerciseId,comment:'',variant:undefined};}
export function copyPlan(s:Session,original=false){const plan=original&&s.originalPlan?{...s,...s.originalPlan}:s;return cloneSession(plan);}
export function timeline(s:Session){let cursor=0;return s.items.map(item=>{const start=cursor;cursor+=item.minutes+(item.transition??0);return {item,start,end:start+item.minutes,next:cursor};});}
export const plannedMinutes=(s:Session)=>total(s)+s.items.reduce((n,i)=>n+(i.transition??0),0);
