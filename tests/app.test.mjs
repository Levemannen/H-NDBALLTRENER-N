import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,groups,loadData,newSession,parseData,saveData,suggest,total,matches} from '../src/model.ts';
import {editorial,searchBank} from '../src/catalog.ts';
import {reviewed} from '../src/diagrams.ts';

const {exercises,guides}=JSON.parse(readFileSync(new URL('../src/bank.json',import.meta.url),'utf8'));
test('Master v3 har komplette nummerserier, unike ID-er og fire tilleggsbanker',()=>{
  const main=exercises.filter(e=>e.number);
  assert.deepEqual(main.map(e=>e.number),Array.from({length:122},(_,i)=>i+1));
  assert.equal(new Set(exercises.map(e=>e.id)).size,205);
  assert.equal(new Set(exercises.filter(e=>e.bank).map(e=>e.bank)).size,4);
  assert.equal(exercises.filter(e=>e.unresolved).length,11);
  assert.ok(main.every(e=>e.meta&&e.categories.length&&e.sections.length>=5));
  assert.ok(guides.some(g=>g.title==='Slik brukes banken'));
  const passage=main[15].sections.find(s=>s.label.startsWith('Variant – uten rekker'));
  assert.equal(passage.lines.length,6);
  assert.ok(passage.lines[0].includes('6 kjegler'));
  assert.ok(passage.lines[0].includes('Fem spillere'));
  assert.ok(matches(main[15],'TOMME KJEGLA'));
});
test('versjonert lagring, rundtur og validering',()=>{
  const memory=new Map();
  const store={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  const original=fresh();
  assert.deepEqual(loadData(store),original);
  original.players.push({id:'a',name:'Testspiller',level:2});
  original.favorites.push('master-16');
  original.notes['master-16']={note:'Eget notat',variant:'',difficulty:'Lett'};
  original.diagrams['master-16']={court:'half',marks:[],arrows:[]};
  original.sessions.push({...newSession(),attendees:['a'],name:'Testøkt'});
  saveData(store,original);
  assert.deepEqual(loadData(store),original);
  assert.throws(()=>parseData(JSON.stringify({...original,version:2})));
  assert.throws(()=>parseData(JSON.stringify({...original,players:[{id:'a',name:'Testspiller',level:5}]})));
  assert.throws(()=>parseData(JSON.stringify({...original,diagrams:{x:{court:'half',marks:[{}],arrows:[]}}})));
});
test('treningsforslag respekterer hall, antall spillere og kildeintervaller',()=>{
  const s={...newSession(),duration:60,players:12,hall:'stor',focus:'pasning'};
  s.items=suggest(s,exercises);
  assert.ok(s.items.length>=4);
  assert.ok(total(s)<=s.duration);
  assert.equal(new Set(s.items.map(i=>i.exerciseId)).size,s.items.length);
  assert.ok(exercises.find(e=>e.id===s.items[0].exerciseId).categories.includes('Oppvarming'));
  for(const item of s.items){
    const e=exercises.find(e=>e.id===item.exerciseId);
    assert.ok(!e.unresolved);
    if(e.halls)assert.ok(e.halls.includes(s.hall));
    if(e.players)assert.ok(e.players[0]<=s.players&&s.players<=e.players[1]);
    if(e.minutes)assert.ok(e.minutes[0]<=item.minutes&&item.minutes<=e.minutes[1]);
  }
  assert.deepEqual(suggest({...s,duration:1},exercises),[]);
});
test('lagdeling bevarer spillerne og gir jevn størrelse eller nivåsorterte grupper',()=>{
  const players=[1,1,2,2,3,3,4,4,4].map((level,i)=>({id:String(i),name:'Test '+i,level}));
  const balanced=groups(players,3,false);
  assert.deepEqual(balanced.map(t=>t.length),[3,3,3]);
  assert.equal(new Set(balanced.flat().map(p=>p.id)).size,players.length);
  const totals=balanced.map(t=>t.reduce((sum,p)=>sum+5-p.level,0));
  assert.ok(Math.max(...totals)-Math.min(...totals)<=1);
  assert.deepEqual(groups(players,3,true).flat().map(p=>p.level),players.map(p=>p.level));
  assert.deepEqual(groups([],2,false),[]);
});
test('søk rangerer tittel og tåler skrivefeil uten å gjette ukjente rammer',()=>{
  assert.equal(searchBank(exercises,'pasningsovelse spill og lop')[0].id,'master-16');
  assert.equal(searchBank(exercises,'kontrnig 2 og 2')[0].id,'master-72');
  assert.ok(searchBank(exercises,'pasninger i fart').slice(0,5).some(e=>e.id==='master-12'));
  assert.ok(searchBank(exercises,'bevegelse uten ball').some(e=>e.id==='master-16'));
  assert.deepEqual(searchBank(exercises,'lite kø').map(e=>e.id),['master-121']);
  const candidates=searchBank(exercises,'15 spillere liten sal');
  assert.ok(candidates.length>0);
  assert.ok(candidates.every(e=>e.halls.includes('liten')&&e.players[0]<=15&&e.players[1]>=15));
  assert.equal(editorial(exercises[0]).coaches,undefined);
  assert.ok(editorial(exercises[15]).skills.includes('Pasning og mottak'));
});
test('nye valgfrie felt kan lagres med eksisterende lokale data og eldre ID-er',()=>{
  const v1=fresh();
  v1.players=[{id:'p1',name:'Testspiller',level:3}];
  v1.sessions=[{...newSession(),name:'Økt fra første versjon',attendees:['p1'],items:[{id:'en',exerciseId:'master-16',minutes:9,comment:'Test'}]}];
  v1.notes={'master-16':{note:'Behold tekst',variant:'Behold variant',difficulty:'Lett'}};
  v1.favorites=['master-16'];
  v1.diagrams={'master-16':{court:'half',marks:[],arrows:[]}};
  assert.deepEqual(parseData(JSON.stringify(v1)),v1);
  v1.notes['master-16'].metadata={coaches:2,skillTags:['Pasning og mottak'],players:[6,12]};
  v1.diagrams['master-16'].marks.push({id:'keeper-a',kind:'keeper',x:5,y:50,label:'M',team:0});
  v1.diagrams['master-16'].arrows.push({id:'carry-a',kind:'carry',from:{x:5,y:25},to:{x:30,y:25}});
  assert.deepEqual(parseData(JSON.stringify(v1)),v1);
  v1.notes['master-16'].metadata.players=[12,6];
  assert.throws(()=>parseData(JSON.stringify(v1)));
});
test('kildekontrollerte SVG-data har angreps- og forsvarsfordeling fra kilden',()=>{
  const count=(id,kind,team)=>reviewed[id].marks.filter(m=>m.kind===kind&&(team===undefined||m.team===team)).length;
  assert.equal(count('master-20','cone'),4);
  assert.equal(count('master-20','player',0),2);
  assert.equal(count('master-20','player',1),2);
  assert.equal(count('master-22','player',0),3);
  assert.equal(count('master-22','player',1),2);
  assert.equal(count('master-66','cone'),1);
  assert.equal(count('master-72','player'),2);
  assert.equal(count('master-72','ball'),1);
});

test('lagdeling dekker ujevne grupper og flere lag enn spillere',()=>{
  for(const [size,count] of [[15,3],[11,2],[9,2],[1,4],[2,8],[0,3]]){
    for(const uniform of [true,false]){
      const players=Array.from({length:size},(_,i)=>({id:'p-'+i,name:'Test '+i,level:uniform?2:i%4+1}));
      for(const sorted of [true,false]){
        const result=groups(players,count,sorted);
        assert.equal(result.flat().length,size);
        assert.equal(new Set(result.flat().map(p=>p.id)).size,size);
        if(size)assert.ok(Math.max(...result.map(g=>g.length))-Math.min(...result.map(g=>g.length))<=1);
        assert.deepEqual([...result.flat()].sort((a,b)=>a.id.localeCompare(b.id)),[...players].sort((a,b)=>a.id.localeCompare(b.id)));
      }
    }
  }
});

test('nye øktfelt bevares og ugyldig lagfordeling avvises',()=>{
 const d=fresh(); const s={...newSession(),attendees:['p1'],startTime:'18:30',allocation:[{name:'Blå',players:['p1']}],evaluation:{rating:'bra',note:'God flyt'}};
 d.sessions.push(s);
 assert.deepEqual(parseData(JSON.stringify(d)),d);
 s.allocation.push({name:'Rød',players:['p1']});
 assert.throws(()=>parseData(JSON.stringify(d)));
 s.allocation=[];s.startTime='25:00';
 assert.throws(()=>parseData(JSON.stringify(d)));
});
