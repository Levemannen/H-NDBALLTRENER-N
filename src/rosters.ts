import type {Level} from './model.ts';
import {defaultSettings,sessionFor,type Workspace,type ClubTeam} from './workspace.ts';
export type RosterFile={schemaVersion:1;revision:number;updatedAt:string;teams:{id:string;name:string;players:{id:string;name:string;level?:Level}[]}[]};
export type RosterState={revision:number;signature:string;updatedAt:string;importedAt:string;teams:Record<string,{localId:string;name:string;players:Record<string,{localId:string;name:string;level?:Level}>}>};
export type RosterConflict={key:string;message:string;options:{value:string;label:string}[]};
const obj=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9-]{0,99}$/.test(v)&&v!=='prototype'&&!Object.hasOwn(Object.prototype,v);
const name=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=180;
const keys=(v:Record<string,unknown>,allowed:string[])=>Object.keys(v).every(k=>allowed.includes(k));
export function parseRoster(text:string):RosterFile{
 let r:unknown;try{r=JSON.parse(text);}catch{throw new Error('Spillerfilen er ikke gyldig JSON. Kontroller komma og anførselstegn på GitHub.');}
 if(!obj(r)||!keys(r,['schemaVersion','revision','updatedAt','teams'])||r.schemaVersion!==1||!Number.isSafeInteger(r.revision)||Number(r.revision)<1||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))||!Array.isArray(r.teams)||r.teams.length>100)throw new Error('Spillerfilen har ugyldig format eller versjon.');
 const teams=new Set<string>(),players=new Set<string>();
 for(const t of r.teams){if(!obj(t)||!keys(t,['id','name','players'])||!id(t.id)||!name(t.name)||teams.has(t.id)||!Array.isArray(t.players)||t.players.length>1000)throw new Error('Kontroller lag-ID, lagnavn og spillerlisten.');teams.add(t.id);
  for(const p of t.players){if(!obj(p)||!keys(p,['id','name','level'])||!id(p.id)||!name(p.name)||players.has(p.id)||(p.level!==undefined&&![1,2,3,4].includes(Number(p.level)))|| (p.level!==undefined&&typeof p.level!=='number'))throw new Error('Hver spiller må ha unik ID, navn og eventuelt nivå 1–4. Oppmøte og kommentarer er ikke tillatt.');players.add(p.id);}
 }
 return r as RosterFile;
}
export function validRosterState(v:unknown):v is RosterState{
 return obj(v)&&Number.isSafeInteger(v.revision)&&Number(v.revision)>0&&typeof v.signature==='string'&&typeof v.updatedAt==='string'&&typeof v.importedAt==='string'&&obj(v.teams)&&Object.entries(v.teams).every(([key,t])=>id(key)&&obj(t)&&id(t.localId)&&typeof t.name==='string'&&obj(t.players)&&Object.entries(t.players).every(([key,p])=>id(key)&&obj(p)&&id(p.localId)&&typeof p.name==='string'&&(p.level===undefined||[1,2,3,4].includes(p.level as number))));
}
const same=(a:string,b:string)=>a.trim().toLocaleLowerCase('nb')===b.trim().toLocaleLowerCase('nb');
const untouched=(t:ClubTeam)=>!t.players.length&&!t.sessions.length&&!t.draft.items.length&&!t.draft.name&&!t.season.length;
export function planRoster(current:Workspace,file:RosterFile,answers:Record<string,string>={},now=new Date().toISOString()){
 const signature=JSON.stringify(file),old=current.rosterImport;
 if(old&&file.revision<old.revision)throw new Error('GitHub-filen er eldre enn sist importert. Øk revision ved nye endringer.');
 if(old&&file.revision===old.revision&&signature!==old.signature)throw new Error('Spillerfilen er endret uten nytt revision-nummer. Øk revision på GitHub.');
 if(signature===old?.signature)return {workspace:current,conflicts:[] as RosterConflict[],changed:false,count:Object.values(old.teams).reduce((n,t)=>n+Object.keys(t.players).length,0)};
 const w=structuredClone(current),conflicts:RosterConflict[]=[];
 const state:RosterState=w.rosterImport??{revision:0,signature:'',updatedAt:'',importedAt:'',teams:{}};
 function ask(key:string,message:string,options:RosterConflict['options']){const value=answers[key];if(options.some(o=>o.value===value))return value;conflicts.push({key,message,options});return undefined;}
 function rename(key:string,local:{name:string},previous:string,remote:string){
  if(remote===previous||remote===local.name)return;
  if(local.name===previous){local.name=remote;return;}
  const choice=ask(key,'Navnekonflikt: lokalt «'+local.name+'», GitHub «'+remote+'».',[{value:'local',label:'Behold lokalt navn'},{value:'remote',label:'Bruk navnet fra GitHub'}]);if(choice==='remote')local.name=remote;
 }
 for(const remote of file.teams){
  let link=state.teams[remote.id],team=link?w.teams.find(t=>t.id===link.localId):undefined;
  if(link&&!team)throw new Error('Et tidligere importert lag mangler lokalt. Gjenopprett backup før ny import.');
  if(!team){
   const matches=w.teams.filter(t=>same(t.name,remote.name)&&!Object.values(state.teams).some(l=>l.localId===t.id));
   if(matches.length===1&&untouched(matches[0]))team=matches[0];
   else if(matches.length){const choice=ask('team:'+remote.id,'Koble GitHub-laget «'+remote.name+'» til eksisterende lag?', [...matches.map(t=>({value:t.id,label:'Bruk '+t.name+' ('+t.players.length+' spillere)'})),{value:'new',label:'Opprett separat lag'}]);if(!choice)continue;if(choice!=='new')team=matches.find(t=>t.id===choice);}
   if(!team){const localId='github-'+remote.id;if(w.teams.some(t=>t.id===localId))throw new Error('Lag-ID er allerede i bruk lokalt. Velg en annen stabil ID i filen.');const settings=defaultSettings();team={id:localId,name:remote.name,archived:false,players:[],sessions:[],draft:sessionFor(settings),settings,season:[]};w.teams.push(team);}
   link={localId:team.id,name:remote.name,players:{}};state.teams[remote.id]=link;
  }
  rename('team-name:'+remote.id,team,link!.name,remote.name);link!.name=remote.name;
  for(const p of remote.players){
   let pl=link!.players[p.id],local=pl?team.players.find(x=>x.id===pl.localId):undefined;
   const moved=Object.entries(state.teams).find(([teamId,t])=>teamId!==remote.id&&t.players[p.id]);if(moved)throw new Error('Spiller-ID '+p.id+' tilhører et annet lag. Flytting mellom lag må avklares; ingen historikk er flyttet.');
   if(pl&&!local){const choice=ask('missing:'+p.id,'«'+p.name+'» er tidligere fjernet lokalt.',[{value:'keep',label:'Behold lokal sletting'},{value:'restore',label:'Legg spilleren til igjen'}]);if(choice!=='restore')continue;}
   if(!local&&!pl){
    const candidates=team.players.filter(x=>!Object.values(link!.players).some(l=>l.localId===x.id));
    const exact=candidates.filter(x=>same(x.name,p.name));const matches=exact.length?exact:candidates;
    if(matches.length){const choice=ask('player:'+p.id,'Finnes «'+p.name+'» allerede i dette laget, eventuelt med forkortet navn?', [...matches.map(x=>({value:x.id,label:'Koble til eksisterende '+x.name+' – behold nivå og historikk'})),{value:'new',label:'Dette er en ny spiller'}]);if(!choice)continue;if(choice!=='new')local=matches.find(x=>x.id===choice);}
   }
   if(!local){const localId=pl?.localId??'github-'+p.id;if(team.players.some(x=>x.id===localId))throw new Error('Spiller-ID er allerede i bruk lokalt.');local={id:localId,name:p.name,level:p.level??4};team.players.push(local);}
   rename('player-name:'+p.id,local,pl?.name??local.name,p.name);
   if(p.level!==undefined&&p.level!==pl?.level&&local.level!==p.level){const choice=ask('player-level:'+p.id,'Nivå for «'+p.name+'»: lokalt '+local.level+', GitHub '+p.level+'.',[{value:'local',label:'Behold lokalt nivå '+local.level},{value:'remote',label:'Bruk nivå '+p.level+' fra GitHub'}]);if(choice==='remote')local.level=p.level;}
   link!.players[p.id]={localId:local.id,name:p.name,...(p.level!==undefined?{level:p.level}:{})};
  }
 }
 if(!Object.keys(old?.teams??{}).length&&untouched(current.teams.find(t=>t.id===current.activeTeamId)!)){const first=Object.values(state.teams).map(link=>w.teams.find(t=>t.id===link.localId)).find(t=>t&&!t.archived&&t.players.length);if(first)w.activeTeamId=first.id;}
 state.revision=file.revision;state.signature=signature;state.updatedAt=file.updatedAt;state.importedAt=now;w.rosterImport=state;
 return {workspace:conflicts.length?current:w,conflicts,changed:!conflicts.length,count:Object.values(state.teams).reduce((n,t)=>n+Object.keys(t.players).length,0)};
}
