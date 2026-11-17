import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,newSession,cloneSession,archivePlayer,deletePlayer,activePlayers,groups,playerCount,fits,suggest,saveData,parseData} from '../src/model.ts';
import {checkedWrite,draftText,parseDraft,serializeData} from '../src/storage.ts';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const players=levels=>levels.map((level,i)=>({id:'p-'+i,name:'Test '+i,level}));
test('kritisk lagdeling: 1,1,2,2,2,4 gir 9–9',()=>{
 const p=players([1,1,2,2,2,4]);const g=groups(p,2,false);
 assert.deepEqual(g.map(t=>t.reduce((n,p)=>n+5-p.level,0)),[9,9]);assert.deepEqual(groups(p,2,false),g);
});
for(const [size,count] of [[9,2],[11,2],[12,3],[15,3],[18,3],[1,5],[0,3],[40,4]])test(`lagdeling ${size}/${count} bevarer alle`,()=>{
 for(const values of [Array(size).fill(1),Array.from({length:size},(_,i)=>i%4+1),Array.from({length:size},(_,i)=>i?4:1)]){
 const p=players(values),g=groups(p,count,false);assert.equal(g.flat().length,size);assert.equal(new Set(g.flat().map(p=>p.id)).size,size);
 if(size)assert.ok(Math.max(...g.map(t=>t.length))-Math.min(...g.map(t=>t.length))<=1);
 assert.deepEqual(p,players(values));
 }
});
test('arkivering og gjenaktivering beholder tre økters historikk',()=>{
 const d=fresh();d.players=players([1,2]);d.sessions=Array.from({length:3},()=>({...newSession(),attendees:['p-0','p-1'],allocation:[{name:'Blå',players:['p-0','p-1']}]}));
 const archived=archivePlayer(d,'p-0');assert.equal(activePlayers(archived).length,1);assert.deepEqual(archived.sessions,d.sessions);assert.equal(archived.players[0].name,d.players[0].name);
 const restored=archivePlayer(parseData(serializeData(archived)),'p-0',false);assert.equal(activePlayers(restored).length,2);assert.deepEqual(restored.sessions,d.sessions);
 const deleted=deletePlayer(archived,'p-0');assert.ok(deleted.sessions.every(s=>!s.attendees.includes('p-0')&&!s.allocation[0].players.includes('p-0')));
});
test('kopi og bruk av mal nullstiller historikk og har uavhengige objekter',()=>{
 const s={...newSession(),attendees:['p-0'],allocation:[{name:'A',players:['p-0']}],evaluation:{rating:'bra',note:'Historikk'},items:[{id:'i',exerciseId:'master-16',minutes:10,comment:'Behold',variant:'Variant'}]};
 for(const template of [true,false]){const copy=cloneSession(s,template);assert.notEqual(copy.id,s.id);assert.notEqual(copy.items[0].id,s.items[0].id);assert.deepEqual(copy.attendees,[]);assert.equal(copy.allocation,undefined);assert.equal(copy.evaluation,undefined);copy.items[0].comment='Endret';assert.equal(s.items[0].comment,'Behold');}
});
test('utkast overlever serialisering med varighet, variant og redigerings-ID',()=>{
 const s={...newSession(),name:'Uferdig',items:[{id:'a',exerciseId:'master-16',minutes:13,comment:'Notat',variant:'Variant'}]};assert.deepEqual(parseDraft(draftText(s)),s);assert.throws(()=>parseDraft('{'));assert.throws(()=>parseDraft(JSON.stringify({version:2,session:s})));
});
test('konflikt stopper både overskriving og sletting av en annen fanes endringer',()=>{
 const store=memory();checkedWrite(store,'key',null,'a');checkedWrite(store,'key','a','b');assert.throws(()=>checkedWrite(store,'key','a','c'));assert.throws(()=>checkedWrite(store,'key','a',null));assert.equal(store.getItem('key'),'b');
});
test('ugyldig lagring overskriver ikke en gyldig sikkerhetskopi',()=>{
 const store=memory(),d=fresh();saveData(store,d);const saved=store.getItem('handballtrenern.v1');assert.throws(()=>saveData(store,{...d,players:[{id:'a',name:'A',level:9}]}));assert.equal(store.getItem('handballtrenern.v1'),saved);
});
test('oppmøte styrer forslag, gymsal matcher liten, tilgjengelige trenere er et maksimum',()=>{
 const s={...newSession(),players:15,attendees:['a','b','c'],hall:'gymsal',coaches:2};const e={id:'test',title:'Pasning',categories:['Oppvarming'],skills:[],sections:[],players:[2,4],halls:['liten'],coaches:1,minutes:[5,10]};
 assert.equal(playerCount(s),3);assert.ok(fits(e,s));assert.equal(suggest(s,[e]).length,1);assert.equal(fits({...e,coaches:3},s),false);assert.equal(fits({...e,halls:undefined,coaches:undefined},s),true);assert.equal(playerCount({...s,attendees:[]}),15);
});
test('eldre sikkerhetskopier forblir uendret; ugyldige nye felt avvises',()=>{
 const d=fresh();d.players=players([2]);assert.deepEqual(parseData(JSON.stringify(d)),d);assert.throws(()=>parseData(JSON.stringify({...d,players:[{...d.players[0],archived:'yes'}]})));
});

test('registrert null oppmøte bruker ikke forventet antall',()=>{
 const s={...newSession(),players:15,attendanceRegistered:true,attendees:[]};assert.equal(playerCount(s),0);assert.deepEqual(suggest(s,[]),[]);const copy=cloneSession(s);assert.equal(copy.attendanceRegistered,false);
});
test('sikkerhetskopi inkluderer utkast og avviser ugyldig utkast',()=>{
 const d={...fresh(),draft:{...newSession(),name:'Bevar meg'}};assert.deepEqual(parseData(serializeData(d)),d);assert.throws(()=>serializeData({...d,draft:{...d.draft,duration:-1}}));
});
