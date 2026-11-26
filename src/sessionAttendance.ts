import {type Session,type AllocationSet} from './model.ts';
export function changeAttendance(s:Session,attendees:string[],now=Date.now()):Session{
 const unique=[...new Set(attendees)],active=s.runner&&!s.runner.endedAt&&!s.completed;
 const events=active?[...unique.filter(id=>!s.attendees.includes(id)).map(playerId=>({playerId,kind:'arrive' as const,at:now})),...s.attendees.filter(id=>!unique.includes(id)).map(playerId=>({playerId,kind:'leave' as const,at:now}))]:[];
 return {...s,attendees:unique,attendanceRegistered:true,allocation:s.allocation?.map(g=>({...g,players:g.players.filter(id=>unique.includes(id))})),attendanceEvents:events.length?[...(s.attendanceEvents??[]),...events]:s.attendanceEvents};
}
export const allocationSets=(s:Session):AllocationSet[]=>s.allocations??(s.allocation?[{id:'legacy',name:'Lagdeling',approved:false,groups:s.allocation}]:[]);
export function allocationStatus(s:Session,set:AllocationSet){const assigned=set.groups.flatMap(g=>g.players),missing=s.attendees.filter(id=>!assigned.includes(id)),absent=assigned.filter(id=>!s.attendees.includes(id));return {missing,absent,duplicates:assigned.length!==new Set(assigned).size,stale:Boolean(missing.length||absent.length||assigned.length!==new Set(assigned).size)};}
export function saveAllocation(s:Session,set:AllocationSet){const sets=allocationSets(s);return {...s,allocations:sets.some(x=>x.id===set.id)?sets.map(x=>x.id===set.id?set:x):[...sets,set],allocation:set.groups.map(g=>({...g,players:g.players.filter(id=>s.attendees.includes(id))}))};}
export function activeAllocation(s:Session,itemId?:string){const requested=s.activeAllocationId??s.items.find(i=>i.id===itemId)?.allocationId,sets=allocationSets(s);return {set:requested?sets.find(x=>x.id===requested):sets[0],missing:Boolean(requested&&!sets.some(x=>x.id===requested)),requested};}
export function removeAllocation(s:Session,id:string){return {...s,allocations:allocationSets(s).filter(x=>x.id!==id),items:s.items.map(i=>i.allocationId===id?{...i,allocationId:undefined}:i),activeAllocationId:s.activeAllocationId===id?undefined:s.activeAllocationId};}
