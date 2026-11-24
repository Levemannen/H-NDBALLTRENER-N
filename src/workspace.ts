import {validRosterState,type RosterState} from './rosters.ts';
import {type Data,type Session,fresh,newSession,parseData,validSession,uid,storageKey} from './model.ts';
import {parseDraft,draftKey} from './storage.ts';
export const workspaceKey='handballtrenern.v3';
export type Settings={players:number;coaches:number;duration:number;hall:string;age:string;focus:string};
export type SeasonBlock={sessionsPerWeek?:number;id:string;from:string;to:string;focus:string;note:string};
export type ClubTeam={groupRules?:Data['groupRules'];id:string;name:string;archived:boolean;players:Data['players'];sessions:Session[];draft:Session;settings:Settings;season:SeasonBlock[]};
export type Workspace={rosterImport?:RosterState;version:3;activeTeamId:string;teams:ClubTeam[];shared:Pick<Data,'favorites'|'notes'|'diagrams'|'exercises'|'diagramSteps'|'diagramReview'>;quickCollection:string[];personalize:boolean};
export const defaultQuick=[101,2,112,100,109,94,91,111,113].map(n=>'master-'+n);
export const defaultSettings=():Settings=>({players:15,coaches:1,duration:60,hall:'stor',age:'',focus:''});
export const sessionFor=(settings:Settings):Session=>({...newSession(),players:settings.players,coaches:settings.coaches,duration:settings.duration,hall:settings.hall,focus:settings.focus});
export const activeTeam=(w:Workspace)=>w.teams.find(t=>t.id===w.activeTeamId)!;
export const project=(w:Workspace):Data=>{const t=activeTeam(w);return {version:1,team:t.name,players:t.players,sessions:t.sessions,draft:t.draft,groupRules:t.groupRules,...w.shared};};
export function migrateV1(data:Data,draft?:Session):Workspace{
 const id=uid(),settings=defaultSettings();
 return {version:3,activeTeamId:id,teams:[{id,name:data.team,archived:false,groupRules:data.groupRules,players:structuredClone(data.players),sessions:structuredClone(data.sessions),draft:structuredClone(draft??data.draft??sessionFor(settings)),settings,season:[]}],shared:structuredClone({favorites:data.favorites,notes:data.notes,diagrams:data.diagrams,exercises:data.exercises,diagramSteps:data.diagramSteps,diagramReview:data.diagramReview}),quickCollection:[...defaultQuick],personalize:true};
}
export function parseWorkspace(text:string):Workspace{
 const w=JSON.parse(text) as Workspace;
 if(!w||w.version!==3||!Array.isArray(w.teams)||!w.teams.length||new Set(w.teams.map(t=>t.id)).size!==w.teams.length||!Array.isArray(w.quickCollection)||!w.quickCollection.every(id=>typeof id==='string')||new Set(w.quickCollection).size!==w.quickCollection.length||typeof w.personalize!=='boolean')throw new Error('Ugyldig 3.0-sikkerhetskopi.');
 if(w.rosterImport!==undefined&&!validRosterState(w.rosterImport))throw new Error('Ugyldig importhistorikk for spillerfilen.');
 if(!activeTeam(w)||activeTeam(w).archived)throw new Error('Aktivt lag mangler eller er arkivert.');
 for(const t of w.teams){
  if(!t||typeof t.id!=='string'||!t.id||typeof t.name!=='string'||typeof t.archived!=='boolean'||!validSession(t.draft)||!t.settings||!['players','coaches','duration'].every(k=>Number.isSafeInteger(t.settings[k as 'players'])&&t.settings[k as 'players']>=(k==='duration'?1:0))||!['hall','age','focus'].every(k=>typeof t.settings[k as 'hall']==='string')||!Array.isArray(t.season)||!t.season.every(b=>b&&['id','from','to','focus','note'].every(k=>typeof b[k as 'id']==='string')&&(b.sessionsPerWeek===undefined||Number.isInteger(b.sessionsPerWeek)&&b.sessionsPerWeek>=1&&b.sessionsPerWeek<=7)))throw new Error('Ugyldige lagdata eller innstillinger.');
  parseData(JSON.stringify({version:1,team:t.name,players:t.players,sessions:t.sessions,draft:t.draft,...w.shared,groupRules:t.groupRules}));
  const ids=new Set(t.players.map(p=>p.id));
  if(t.sessions.some(s=>s.attendees.some(id=>!ids.has(id)))){
   // Legacy files may contain removed players. Keep their IDs and display them as unknown; never erase history.
  }
 }
 return w;
}
export function readWorkspace(storage:Pick<Storage,'getItem'>){
 const current=storage.getItem(workspaceKey);if(current)return {workspace:parseWorkspace(current),migrated:false};
 const legacy=storage.getItem(storageKey),draft=storage.getItem(draftKey);
 return {workspace:migrateV1(legacy?parseData(legacy):fresh(),draft?parseDraft(draft):undefined),migrated:Boolean(legacy||draft)};
}
export function updateCurrent(w:Workspace,data:Data,draft:Session):Workspace{
 return {...w,teams:w.teams.map(t=>t.id===w.activeTeamId?{...t,name:data.team,players:data.players,sessions:data.sessions,groupRules:data.groupRules,draft}:t),shared:{favorites:data.favorites,notes:data.notes,diagrams:data.diagrams,exercises:data.exercises,diagramSteps:data.diagramSteps,diagramReview:data.diagramReview}};
}
export function addTeam(w:Workspace,name:string):Workspace{
 if(!name.trim())throw new Error('Skriv et lagnavn.');const id=uid(),settings=defaultSettings();
 return {...w,activeTeamId:id,teams:[...w.teams,{id,name:name.trim(),archived:false,players:[],sessions:[],draft:sessionFor(settings),settings,season:[]}]};
}
export function selectTeam(w:Workspace,id:string):Workspace{
 if(!w.teams.some(t=>t.id===id&&!t.archived))throw new Error('Laget finnes ikke eller er arkivert.');return {...w,activeTeamId:id};
}
export function archiveTeam(w:Workspace,id:string,archived:boolean):Workspace{
 if(!w.teams.some(t=>t.id===id))throw new Error('Laget finnes ikke.');
 const other=w.teams.find(t=>t.id!==id&&!t.archived);
 if(archived&&id===w.activeTeamId&&!other)throw new Error('Minst ett lag må være aktivt.');
 return {...w,activeTeamId:archived&&id===w.activeTeamId?other!.id:w.activeTeamId,teams:w.teams.map(t=>t.id===id?{...t,archived}:t)};
}
export const parseBackup=(text:string)=>{const value=JSON.parse(text);return value.version===3?parseWorkspace(text):migrateV1(parseData(text));};
export function downloadJSON(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
