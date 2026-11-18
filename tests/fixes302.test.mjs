import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,newSession,cloneSession,validSession} from '../src/model.ts';
import {migrateV1,parseWorkspace} from '../src/workspace.ts';
import {editingSession,mergeSession} from '../src/sessionMerge.ts';
import {planRoster} from '../src/rosters.ts';
import {stableText,syncDecision} from '../src/syncDecision.ts';
test('F01: ugyldige lagregler avvises før import og gyldige regler bevares',()=>{
 const w=migrateV1(fresh());for(const invalid of [{},'bad',[{id:'rule',kind:'locked',a:'player',b:'',group:-1}]]){w.teams[0].groupRules=invalid;assert.throws(()=>parseWorkspace(JSON.stringify(w)));}
 w.teams[0].groupRules=[{id:'rule',kind:'locked',a:'player',b:'',group:0}];assert.deepEqual(parseWorkspace(JSON.stringify(w)),JSON.parse(JSON.stringify(w)));
});
test('F03: nyere oppmøte, fordeling og evaluering beholdes ved lagring av planutkast',()=>{
 const base=newSession(),draft={...editingSession(base),name:'Endret plan'},current={...base,attendees:['player'],attendanceRegistered:true,allocation:[{name:'Lag 1',players:['player']}],evaluation:{rating:'bra',note:'Ny evaluering'}};
 const result=mergeSession(JSON.parse(JSON.stringify(draft)),current);assert.deepEqual(result.conflicts,[]);assert.equal(result.session.name,'Endret plan');assert.deepEqual(result.session.attendees,['player']);assert.deepEqual(result.session.allocation,current.allocation);assert.deepEqual(result.session.evaluation,current.evaluation);assert.equal(result.session.editBase,undefined);assert.ok(validSession(result.session));
});
test('F03: samtidige endringer i samme felt krever eksplisitt konfliktvalg',()=>{
 const base=newSession(),draft={...editingSession(base),name:'Utkast'};const result=mergeSession(draft,{...base,name:'Ny lagret'});assert.deepEqual(result.conflicts,['Navn']);assert.equal(result.session.name,'Utkast');
 const attendance=mergeSession({...editingSession(base),attendees:['a'],attendanceRegistered:true},{...base,attendees:['b'],attendanceRegistered:true});assert.deepEqual(attendance.conflicts,['Oppmøte og lagfordeling']);assert.ok(validSession(attendance.session));
});
test('F03: eldre utkast og slettede økter krever avklaring; kopier mister redigeringsgrunnlaget',()=>{
 const base=newSession();assert.ok(mergeSession({...base,name:'Eldre utkast'},base).conflicts.length);assert.ok(mergeSession(editingSession(base),undefined).conflicts.length);assert.equal(cloneSession(editingSession(base)).editBase,undefined);assert.ok(!validSession({...base,editBase:'{broken'}));assert.ok(!validSession({...base,editBase:JSON.stringify(editingSession(base))}));
});
test('F04: importtid ignoreres, men kildeendringer og nivåkonflikter oppdages',()=>{
 const file={schemaVersion:1,revision:1,updatedAt:'2026-11-18T00:00:00Z',teams:[{id:'team',name:'QA',players:[{id:'player',name:'QA spiller'}]}]};
 const base=planRoster(migrateV1(fresh()),file,{},'2026-11-18T00:00:00Z').workspace;const next={...file,revision:2};const a=planRoster(base,next,{},'2026-11-18T01:00:00Z').workspace,b=planRoster(base,next,{},'2026-11-18T02:00:00Z').workspace;
 assert.equal(syncDecision(stableText(a),stableText(b),stableText(base)),'same');a.teams.find(t=>t.id==='github-team').players[0].level=1;b.teams.find(t=>t.id==='github-team').players[0].level=2;assert.equal(syncDecision(stableText(a),stableText(b),stableText(base)),'conflict');assert.equal(typeof JSON.parse(stableText(a)).rosterImport.importedAt,'string');
});
