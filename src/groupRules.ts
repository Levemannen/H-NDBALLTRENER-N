import {groups,type Player} from './model.ts';
export type GroupRule={id:string;kind:'together'|'apart'|'locked';a:string;b:string;group:number};
export function ruleViolations(result:string[][],rules:GroupRule[]):string[]{
 const at=(id:string)=>result.findIndex(g=>g.includes(id));
 return rules.filter(r=>at(r.a)>=0&&(r.kind==='locked'?at(r.a)!==r.group:at(r.b)>=0&&(r.kind==='together'?at(r.a)!==at(r.b):at(r.a)===at(r.b)))).map(r=>r.id);
}
export function constrainedGroups(input:Player[],count:number,byLevel:boolean,rules:GroupRule[]):Player[][]{
 const players=input.filter(p=>!p.archived);if(!players.length)return [];
 const n=Math.max(1,Math.min(players.length,Math.floor(count)||1));
 if(!rules.length)return groups(players,n,byLevel);
 const ids=new Set(players.map(p=>p.id));const active=rules.filter(r=>ids.has(r.a)&&(r.kind==='locked'||ids.has(r.b)));
 const parent=new Map(players.map(p=>[p.id,p.id]));
 const root=(id:string):string=>parent.get(id)===id?id:root(parent.get(id)!);
 for(const r of active.filter(r=>r.kind==='together'))parent.set(root(r.a),root(r.b));
 const units=new Map<string,Player[]>();for(const p of players){const key=root(p.id);units.set(key,[...(units.get(key)??[]),p]);}
 const blocks=[...units.values()];const locks=new Map<string,number>();
 for(const r of active){
  if(r.kind==='apart'&&root(r.a)===root(r.b))throw new Error('Regler sier både sammen og fra hverandre for samme spillergruppe.');
  if(r.kind==='locked'){if(r.group>=n)throw new Error('En spiller er låst til et lag som ikke finnes. Øk antall lag eller endre låsen.');const key=root(r.a);if(locks.has(key)&&locks.get(key)!==r.group)throw new Error('Spillere som skal sammen er låst til ulike lag.');locks.set(key,r.group);}
 }
 const max=Math.ceil(players.length/n),min=Math.floor(players.length/n);
 if(blocks.some(b=>b.length>max))throw new Error('En sammen-gruppe er større enn tillatt lagstørrelse. Velg færre lag eller endre regelen.');
 blocks.sort((a,b)=>Number(locks.has(root(b[0].id)))-Number(locks.has(root(a[0].id)))||b.length-a.length||a[0].level-b[0].level);
 const result:Player[][]=Array.from({length:n},()=>[]);let steps=0;
 function assign(i:number):boolean{
  if(++steps>100000)return false;
  if(i===blocks.length)return result.every(g=>g.length>=min);
  const block=blocks[i],lock=locks.get(root(block[0].id));
  const score=(j:number)=>byLevel?(result[j].length?Math.abs(result[j].reduce((s,p)=>s+p.level,0)/result[j].length-block.reduce((s,p)=>s+p.level,0)/block.length):0):result[j].reduce((s,p)=>s+5-p.level,0);
  const candidates=lock===undefined?result.map((_,j)=>j).sort((a,b)=>score(a)-score(b)||result[a].length-result[b].length):[lock];
  for(const j of candidates){if(result[j].length+block.length>max)continue;result[j].push(...block);if(!ruleViolations(result.map(g=>g.map(p=>p.id)),active).length&&assign(i+1))return true;result[j].splice(result[j].length-block.length);}
  return false;
 }
 if(!assign(0))throw new Error(steps>100000?'Fant ikke en fordeling innen søkegrensen. Forenkle reglene eller fordel manuelt.':'Reglene kan ikke kombineres med jevne lagstørrelser. Endre reglene eller antall lag.');
 if(!byLevel){
  const quality=(teams:Player[][])=>teams.reduce((total,g)=>total+g.reduce((sum,p)=>sum+5-p.level,0)**2,0);
  let improved=true;
  while(improved){improved=false;let best=quality(result),next:Player[][]|undefined;
   for(let a=0;a<blocks.length;a++)for(let b=a+1;b<blocks.length;b++){
    if(blocks[a].length!==blocks[b].length)continue;
    const ga=result.findIndex(g=>g.some(p=>p.id===blocks[a][0].id)),gb=result.findIndex(g=>g.some(p=>p.id===blocks[b][0].id));if(ga===gb)continue;
    const ai=new Set(blocks[a].map(p=>p.id)),bi=new Set(blocks[b].map(p=>p.id));
    const candidate=result.map((g,i)=>i===ga?[...g.filter(p=>!ai.has(p.id)),...blocks[b]]:i===gb?[...g.filter(p=>!bi.has(p.id)),...blocks[a]]:g);
    const score=quality(candidate);if(score<best&&!ruleViolations(candidate.map(g=>g.map(p=>p.id)),active).length){best=score;next=candidate;}
   }
   if(next){next.forEach((g,i)=>result[i]=g);improved=true;}
  }
 }
 return result;
}
