import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,newSession} from '../src/model.ts';
import {migrateV1,parseWorkspace} from '../src/workspace.ts';
import {parseRoster,planRoster} from '../src/rosters.ts';
const file=(count=15,revision=1)=>({schemaVersion:1,revision,updatedAt:'2026-11-17T12:00:00Z',teams:[{id:'team-a',name:'Syntetisk lag A',players:Array.from({length:count},(_,i)=>({id:'a-'+i,name:'Syntetisk spiller '+i}))}]});
test('tom app importerer 15; ny revisjon gir 16 uten dubletter, også etter backup',()=>{
 let w=planRoster(migrateV1(fresh()),parseRoster(JSON.stringify(file()))).workspace;
 assert.equal(w.teams.find(t=>t.id===w.activeTeamId).players.length,15);
 w=parseWorkspace(JSON.stringify(w));assert.equal(planRoster(w,file()).changed,false);
 w=planRoster(w,file(16,2)).workspace;assert.equal(w.teams.find(t=>t.id===w.activeTeamId).players.length,16);assert.equal(planRoster(w,file(16,2)).changed,false);
});
test('lokale nivåer, arkiv, utkast og historisk oppmøte bevares; sletting i filen sletter ikke lokalt',()=>{
 let w=planRoster(migrateV1(fresh()),file()).workspace;const t=w.teams.find(t=>t.id===w.activeTeamId);t.players[0].level=1;t.players[0].archived=true;t.sessions=[{...newSession(),attendees:[t.players[0].id],attendanceRegistered:true}];t.draft.name='Behold utkast';const before=structuredClone(t);
 const next=file(14,2);next.teams[0].players.shift();w=planRoster(w,next).workspace;const after=w.teams.find(t=>t.id===w.activeTeamId);assert.deepEqual(after.players,before.players);assert.deepEqual(after.sessions,before.sessions);assert.deepEqual(after.draft,before.draft);
});
test('flere lag er adskilt og endring av navn bruker ID',()=>{
 const r=file(2);r.teams.push({id:'team-b',name:'Syntetisk B',players:[{id:'b-1',name:'Syntetisk spiller 0'}]});let w=planRoster(migrateV1(fresh()),r).workspace;
 const next=structuredClone(r);next.revision++;next.teams[0].players[0].name='Nytt navn';w=planRoster(w,next).workspace;
 assert.equal(w.teams.find(t=>t.id==='github-team-a').players[0].name,'Nytt navn');assert.equal(w.teams.find(t=>t.id==='github-team-b').players[0].name,'Syntetisk spiller 0');
});
test('konflikt mellom lokal og ekstern navneendring krever et valg og er atomisk',()=>{
 let w=planRoster(migrateV1(fresh()),file(1)).workspace;w.teams.find(t=>t.id===w.activeTeamId).players[0].name='Lokalt navn';const next=file(2,2);next.teams[0].players[0].name='GitHub-navn';const before=JSON.stringify(w);const pending=planRoster(w,next);assert.equal(pending.conflicts.length,1);assert.equal(JSON.stringify(w),before);assert.equal(pending.workspace,w);
 const kept=planRoster(w,next,{'player-name:a-0':'local'}).workspace;assert.equal(kept.teams.find(t=>t.id===kept.activeTeamId).players[0].name,'Lokalt navn');assert.equal(planRoster(kept,next).changed,false);
 const accepted=planRoster(w,next,{'player-name:a-0':'remote'}).workspace;assert.equal(accepted.teams.find(t=>t.id===accepted.activeTeamId).players[0].name,'GitHub-navn');
});
test('eldre 3.0-spillere kobles bare etter avklaring; eksisterende nivå og ID beholdes',()=>{
 const d=fresh();d.team='Syntetisk lag A';d.players=[{id:'local-player',name:'Syntetisk spiller 0',level:1}];const w=migrateV1(d);const pending=planRoster(w,file(1));assert.equal(pending.conflicts[0].key,'team:team-a');
 const answers={'team:team-a':w.activeTeamId,'player:a-0':'local-player'};const linked=planRoster(w,file(1),answers);assert.equal(linked.conflicts.length,0);assert.equal(linked.workspace.teams.length,1);assert.deepEqual(linked.workspace.teams[0].players,d.players);
});
test('ugyldig JSON, privat innhold, dupliserte ID-er og gamle revisjoner avvises',()=>{
 for(const text of ['broken','{}',JSON.stringify({...file(),teams:[{id:'bad',name:'Bad',players:[{id:'p',name:'Test',level:1}]}]})])assert.throws(()=>parseRoster(text));
 const duplicate=file(2);duplicate.teams[0].players[1].id='a-0';assert.throws(()=>parseRoster(JSON.stringify(duplicate)));
 const w=planRoster(migrateV1(fresh()),file(1,3)).workspace;assert.throws(()=>planRoster(w,file(1,2)),/eldre/);assert.throws(()=>planRoster(w,file(2,3)),/revision/);
 const malformed=structuredClone(w);malformed.rosterImport.teams['team-a'].localId={};assert.throws(()=>parseWorkspace(JSON.stringify(malformed)));
});
test('lokalt fjernet spiller og flytting mellom lag overskrives ikke automatisk',()=>{
 const w=planRoster(migrateV1(fresh()),file(1)).workspace;w.teams.find(t=>t.id===w.activeTeamId).players=[];
 assert.equal(planRoster(w,file(1,2)).conflicts[0].key,'missing:a-0');const keep=planRoster(w,file(1,2),{'missing:a-0':'keep'});assert.equal(keep.conflicts.length,0);assert.equal(keep.workspace.teams.find(t=>t.id===keep.workspace.activeTeamId).players.length,0);
 const moved=file(1,2);moved.teams[0].id='different-team';assert.throws(()=>planRoster(w,moved,{'team:different-team':'new'}),/annet lag/);
});
