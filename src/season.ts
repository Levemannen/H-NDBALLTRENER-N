import {uid,type Exercise,type Session,suggest} from './model.ts';
import {sessionFor,type Settings,type SeasonBlock} from './workspace.ts';
export function addDays(date:string,n:number){const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(d.getTime()))throw new Error('Velg en gyldig startdato.');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weeksPlan(start:string,focus:string,weeks:number,sessionsPerWeek:number,progression:string):SeasonBlock[]{
 if(!focus.trim()||!Number.isInteger(weeks)||weeks<1||weeks>52||!Number.isInteger(sessionsPerWeek)||sessionsPerWeek<1||sessionsPerWeek>7)throw new Error('Velg tema, 1–52 uker og 1–7 treninger per uke.');
 const notes=progression.split('\n').map(s=>s.trim()).filter(Boolean);
 return Array.from({length:weeks},(_,i)=>({id:uid(),from:addDays(start,i*7),to:addDays(start,i*7+6),focus:focus.trim(),note:notes[i]??['Lær grunnbevegelsen i rolig tempo','Øv i bevegelse','Legg til valg og motstand','Bruk ferdigheten i småspill'][Math.min(3,i)],sessionsPerWeek}));
}
export function sessionFromWeek(block:SeasonBlock,settings:Settings,exercises:Exercise[]):Session{
 const s={...sessionFor(settings),name:block.focus+' – '+block.note,date:block.from,focus:block.focus};return {...s,items:suggest(s,exercises)};
}
