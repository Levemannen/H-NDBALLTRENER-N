import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,newSession,parseData} from '../src/model.ts';
import {migrateV1,parseWorkspace,project,addTeam,selectTeam,archiveTeam,updateCurrent} from '../src/workspace.ts';
import {variants,sessionText} from '../src/variants.ts';
import {constrainedGroups,ruleViolations} from '../src/groupRules.ts';
import {syncDecision,stableText} from '../src/syncDecision.ts';
import {weeksPlan,sessionFromWeek} from '../src/season.ts';
import {defaultSettings,defaultQuick} from '../src/workspace.ts';
import {rememberPlan,adjustRemaining} from '../src/planB.ts';
import {suggest,playerCount} from '../src/model.ts';
import {planningMeta} from '../src/planningMeta.ts';
import {illustration} from '../src/illustrationRegistry.ts';
const bank=JSON.parse(readFileSync(new URL('../src/bank.json',import.meta.url))).exercises;
test('migrering til flere lag bevarer alle eksisterende data og utkast',()=>{
 const old=fresh();old.players=[{id:'p',name:'Syntetisk',level:2,archived:true}];old.sessions=[{...newSession(),attendees:['p'],allocation:[{name:'Blå',players:['p']}]}];old.favorites=['master-16'];old.notes={'master-16':{note:'Behold',variant:'',difficulty:''}};old.diagrams={'master-16':{court:'full',marks:[],arrows:[]}};const draft={...newSession(),name:'Uferdig'};
 const w=parseWorkspace(JSON.stringify(migrateV1(old,draft)));assert.deepEqual(JSON.parse(JSON.stringify(project(w))),{...old,draft});assert.deepEqual(old.players[0].level,2);
});
test('lagbytte blander aldri spillere, økter eller utkast',()=>{
 const w=migrateV1(fresh());const first=w.activeTeamId;const d={...project(w),players:[{id:'a',name:'A',level:1}]};let next=updateCurrent(w,d,{...newSession(),name:'Lag A utkast'});next=addTeam(next,'Lag B');assert.deepEqual(project(next).players,[]);assert.equal(project(next).draft.name,'');next=selectTeam(next,first);assert.equal(project(next).players[0].id,'a');assert.equal(project(next).draft.name,'Lag A utkast');assert.equal(parseWorkspace(JSON.stringify(next)).teams.length,2);assert.throws(()=>archiveTeam(migrateV1(fresh()),first,true));
});
test('strukturerte varianter beholder originalrekkefølge og sammenhengende oppsett',()=>{
 const e=bank.find(e=>e.id==='master-16');assert.equal(variants(e).length,1);assert.deepEqual(variants(e)[0].description,e.sections.find(s=>s.label.startsWith('Variant')).lines);const basic=bank.find(e=>e.id==='master-4');assert.equal(variants(basic).length,4);
});
test('teksteksport har variant, tider, kommentarer og ingen spillerliste',()=>{
 const e=bank.find(e=>e.id==='master-4'),v=variants(e)[0];const s={...newSession(),name:'Økt',startTime:'18:00',attendees:['privat-spiller-id'],items:[{id:'i',exerciseId:e.id,minutes:5,comment:'Se opp',variant:v.id}]};const text=sessionText(s,'Testlag',bank);assert.ok(text.includes(v.name));assert.ok(text.includes('18:00'));assert.ok(text.includes('Se opp'));assert.ok(!text.includes('privat-spiller-id'));
});
test('alle produserte diagramtrinn har gyldige symboler, ID-er og koordinater',()=>{
 const generated=JSON.parse(readFileSync(new URL('../src/illustrations.json',import.meta.url)));const d=fresh();for(const [id,value] of Object.entries(generated)){assert.ok(bank.some(e=>e.id===id));assert.ok(value.frames.length);d.diagramSteps={[id]:value.frames};assert.doesNotThrow(()=>parseData(JSON.stringify(d)));for(const f of value.frames){assert.equal(new Set(f.marks.map(m=>m.id)).size,f.marks.length);assert.equal(new Set(f.arrows.map(a=>a.id)).size,f.arrows.length);}}
});
test('regler med 15 spillere: låser, sammen, adskilt og arkiverte',()=>{
 const players=Array.from({length:15},(_,i)=>({id:'p-'+i,name:'Test '+i,level:i%4+1}));
 const rules=[{id:'r1',kind:'together',a:'p-0',b:'p-1',group:0},{id:'r2',kind:'apart',a:'p-0',b:'p-2',group:0},{id:'r3',kind:'locked',a:'p-0',b:'',group:1}];
 const result=constrainedGroups([...players,{id:'archived',name:'Arkiv',level:1,archived:true}],3,false,rules);
 assert.deepEqual(result.map(g=>g.length),[5,5,5]);assert.equal(new Set(result.flat().map(p=>p.id)).size,15);assert.ok(result[1].some(p=>p.id==='p-0'));assert.deepEqual(ruleViolations(result.map(g=>g.map(p=>p.id)),rules),[]);
 assert.throws(()=>constrainedGroups(players,3,false,[...rules,{id:'bad',kind:'apart',a:'p-0',b:'p-1',group:0}]),/både sammen/);
 assert.throws(()=>constrainedGroups(players,3,false,[{id:'bad',kind:'locked',a:'p-0',b:'',group:8}]),/ikke finnes/);
 assert.deepEqual(constrainedGroups([],3,false,rules),[]);
});
test('synkronisering krever eksplisitt valg ved første møte og samtidige endringer',()=>{
 assert.equal(syncDecision('local','remote',null),'conflict');assert.equal(syncDecision('A',null,null),'upload');assert.equal(syncDecision('A','B','A'),'download');assert.equal(syncDecision('B','A','A'),'upload');assert.equal(syncDecision('B','C','A'),'conflict');assert.equal(syncDecision('A','A',null),'same');assert.equal(syncDecision('A',null,'A'),'conflict');
 assert.equal(stableText({a:1,b:{c:2,d:3}}),stableText({b:{d:3,c:2},a:1}));
});
test('ukeplan og konkrete økter bevarer læringsmål, lagets rammer og original bank',()=>{
 const before=JSON.stringify(bank);const blocks=weeksPlan('2026-11-17','pasning',4,2,'Spill og løp\nGjør deg spillbar');assert.equal(blocks[1].from,'2026-11-24');assert.equal(blocks[0].sessionsPerWeek,2);assert.equal(blocks[1].note,'Gjør deg spillbar');const s=sessionFromWeek(blocks[0],defaultSettings(),bank);assert.equal(s.players,15);assert.equal(s.coaches,1);assert.equal(s.focus,'pasning');assert.ok(s.items.length);assert.equal(JSON.stringify(bank),before);assert.throws(()=>weeksPlan('2026-11-17','pasning',0,2,''));
});
test('kort og detaljert tekst har riktig rekkefølge og skjuler persondata',()=>{
 const s={...newSession(),items:[{id:'one',exerciseId:'master-16',minutes:12,variant:variants(bank.find(e=>e.id==='master-16'))[0].id,comment:'Hold tempo'},{id:'two',exerciseId:'master-101',minutes:5,comment:''}],attendees:['secret'],allocation:[{name:'privat',players:['secret']}]};const short=sessionText(s,'Testlag',bank,'short'),full=sessionText(s,'Testlag',bank,'full');assert.ok(full.length>short.length);for(const text of [short,full]){assert.ok(text.includes('17 minutter'));assert.ok(text.indexOf('Pasningsøvelse')<text.indexOf('Snipp og snapp'));assert.ok(!text.includes('secret'));assert.ok(!text.includes('privat'));assert.ok(text.includes('Hold tempo'));}
});
test('femminuttersbanken har alle ni godkjente øvelser i riktig rekkefølge',()=>{assert.deepEqual(defaultQuick,[101,2,112,100,109,94,91,111,113].map(n=>'master-'+n));for(const id of defaultQuick)assert.ok(bank.find(e=>e.id===id));});
test('Plan B kan gjenopprettes etter lagring og korter bare ned gjenværende tid',()=>{
 const s={...newSession(),items:[{id:'a',exerciseId:'master-16',minutes:5,comment:''},{id:'b',exerciseId:'master-101',minutes:5,comment:''},{id:'c',exerciseId:'master-100',minutes:9,comment:''}]};const modified={...s,planBOriginal:rememberPlan(s),items:adjustRemaining(s.items,1,-10)};assert.deepEqual(modified.items.map(i=>i.minutes),[5,3,1]);assert.deepEqual(modified.planBOriginal.items,s.items);const d=fresh();d.sessions=[modified];assert.deepEqual(parseData(JSON.stringify(d)).sessions[0].planBOriginal.items,s.items);assert.deepEqual(adjustRemaining(s.items,2,-30).map(i=>i.minutes),[5,5,1]);
});
test('forslag med én trener unngår krevende oppsett og respekterer null oppmøte',()=>{
 const s={...newSession(),coaches:1,players:15,focus:'pasning'};const items=suggest(s,bank);assert.ok(items.length);assert.ok(items.every(i=>planningMeta(bank.find(e=>e.id===i.exerciseId)).oneCoach!==false));assert.deepEqual(suggest({...s,attendanceRegistered:true,attendees:[]},bank),[]);assert.equal(playerCount({...s,attendanceRegistered:true,attendees:[]}),0);
});
test('egne diagramtrinn, status, regler og ukeplan beholdes ved alle lagoppdateringer',()=>{
 let w=migrateV1(fresh());const diagram={court:'full',marks:[],arrows:[]};w.shared.diagramSteps={'master-16':[diagram,diagram]};w.shared.diagramReview={'master-16':'Trenger avklaring'};w.teams[0].groupRules=[{id:'r',kind:'apart',a:'p',b:'q',group:0}];w.teams[0].season=weeksPlan('2026-11-17','forsvar',2,1,'');const next=parseWorkspace(JSON.stringify(updateCurrent(w,project(w),{...project(w).draft,name:'Nytt navn'})));assert.deepEqual(next.shared,w.shared);assert.deepEqual(next.teams[0].season,w.teams[0].season);assert.deepEqual(next.teams[0].groupRules,w.teams[0].groupRules);
});
test('alle 122 har diagram, og variantoverstyring holdes adskilt fra grunnøvelsen',()=>{
 const main=bank.filter(e=>e.number);assert.equal(main.length,122);for(const e of main){const info=illustration(e,fresh());assert.ok(info.frames.length,e.id);assert.doesNotThrow(()=>parseData(JSON.stringify({...fresh(),diagramSteps:{[e.id]:info.frames}})));}
 const e=main.find(e=>e.id==='master-16'),variant=variants(e)[0].id,custom={court:'half',marks:[],arrows:[]},data={...fresh(),diagramSteps:{[variant]:[custom,custom,custom]},diagramReview:{[variant]:'Trenger avklaring'}};
 assert.equal(illustration(e,data,variant).frames.length,3);assert.equal(illustration(e,data,variant).status,'Trenger avklaring');assert.equal(illustration(e,data,'').frames.length,1);assert.equal(illustration(e,data).frames.length,3);
});
