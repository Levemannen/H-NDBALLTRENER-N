import {uid,type Exercise,type Session,suggest} from './model.ts';
import {sessionFor,type Settings,type SeasonBlock,type ClubTeam} from './workspace.ts';
export function addDays(date:string,n:number){const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw new Error('Velg en gyldig startdato.');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weeksPlan(start:string,focus:string,weeks:number,sessionsPerWeek:number,progression:string):SeasonBlock[]{
 if(!focus.trim()||!Number.isInteger(weeks)||weeks<1||weeks>52||!Number.isInteger(sessionsPerWeek)||sessionsPerWeek<1||sessionsPerWeek>7)throw new Error('Velg tema, 1–52 uker og 1–7 treninger per uke.');
 const notes=progression.split('\n').map(s=>s.trim()).filter(Boolean);
 return Array.from({length:weeks},(_,i)=>({id:uid(),from:addDays(start,i*7),to:addDays(start,i*7+6),focus:focus.trim(),note:notes[i]??['Lær grunnbevegelsen i rolig tempo','Øv i bevegelse','Legg til valg og motstand','Bruk ferdigheten i småspill'][Math.min(3,i)],sessionsPerWeek}));
}
export function sessionFromWeek(block:SeasonBlock,settings:Settings,exercises:Exercise[]):Session{
 const s={...sessionFor(settings),name:block.focus+' – '+block.note,date:block.from,focus:block.focus};return {...s,items:suggest(s,exercises)};
}
export function sessionsFromCalendar(block:SeasonBlock,settings:Settings,exercises:Exercise[]):Session[]{
 addDays(block.from,0);addDays(block.to,0);if(new Date(block.to+'T12:00:00Z').getTime()-new Date(block.from+'T12:00:00Z').getTime()>365*86400000)throw new Error('Velg en periode på høyst ett år.');
 if(block.to<block.from)throw new Error('Sluttdato må være etter startdato.');
 const output:Session[]=[];
 for(let date=block.from,n=0;date<=block.to&&n<366;date=addDays(date,1),n++){
  const day=new Date(date+'T12:00:00Z').getUTCDay();
  const slots=settings.trainingDays?.filter(d=>d.weekday===day)??[];
  for(const slot of slots){const s={...sessionFromWeek({...block,from:date},{...settings,hall:slot.hall,duration:slot.duration},exercises),startTime:slot.startTime,calendarSlot:date+'|'+(slot.startTime??''),state:'draft' as const};output.push(s);}
 }
 return output;
}

export const calendarKey=(s:Session)=>s.date+'|'+(s.startTime??'');
export function generateCalendarDrafts(team:ClubTeam,exercises:Exercise[]){const existing=[team.draft,...(team.drafts??[]),...team.sessions].filter(s=>s.name||s.items.length||s.calendarSlot);const keys=new Set([...(team.cancelledSlots??[]),...existing.flatMap(s=>[calendarKey(s),...(s.calendarSlot?[s.calendarSlot]:[])])]);const candidates=team.season.flatMap(b=>sessionsFromCalendar(b,team.settings,exercises));return candidates.filter(s=>{const key=calendarKey(s);if(keys.has(key))return false;keys.add(key);return true;});}
export function cancelCalendarSession(team:ClubTeam,id:string,cancelled:boolean):ClubTeam{const session=[team.draft,...(team.drafts??[]),...team.sessions].find(s=>s.id===id);if(!session)return team;if(session.runner&&!session.runner.endedAt)throw Error('Avslutt treningen før den avlyses.');const slot=session.calendarSlot??calendarKey(session),markers=new Set(team.cancelledSlots??[]);if(cancelled)markers.add(slot);else markers.delete(slot);const patch=(s:Session)=>s.id===id?{...s,cancelled,calendarSlot:slot}:s;return {...team,cancelledSlots:[...markers],draft:patch(team.draft),drafts:team.drafts?.map(patch),sessions:team.sessions.map(patch)};}
