import type {Session,Item} from './model.ts';
export const rememberPlan=(s:Session)=>s.planBOriginal??{items:structuredClone(s.items),players:s.players,attendees:[...s.attendees],attendanceRegistered:s.attendanceRegistered,allocation:structuredClone(s.allocation)};
export function adjustRemaining(items:Item[],index:number,delta:number){
 const copy=structuredClone(items);if(!copy[index])return copy;
 if(delta>0){copy[index].minutes+=delta;return copy;}
 let remove=-delta;for(let i=copy.length-1;i>=index&&remove>0;i--){const amount=Math.min(remove,copy[i].minutes-1);copy[i].minutes-=amount;remove-=amount;}
 return copy;
}
