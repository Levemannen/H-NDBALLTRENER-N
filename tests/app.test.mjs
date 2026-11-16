import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,groups,loadData,newSession,parseData,saveData,suggest,total,matches} from '../src/model.ts';

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
