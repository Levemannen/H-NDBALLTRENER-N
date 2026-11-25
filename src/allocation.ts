import {type Player} from './model.ts';
import {constrainedGroups,ruleViolations,type GroupRule} from './groupRules.ts';
export function minimallyChanged(players:Player[],previous:string[][],rules:GroupRule[]){
 const ids=new Set(players.map(p=>p.id));
 const groups=previous.map(g=>g.filter(id=>ids.has(id)));
 if(!groups.length)return constrainedGroups(players,2,false,rules).map(g=>g.map(p=>p.id));
 for(const p of players.filter(p=>!groups.flat().includes(p.id))){const min=Math.min(...groups.map(g=>g.length));groups[groups.findIndex(g=>g.length===min)].push(p.id);}
 const spread=Math.max(...groups.map(g=>g.length))-Math.min(...groups.map(g=>g.length));
 if(spread<=1&&!ruleViolations(groups,rules).length)return groups;
 const result=constrainedGroups(players,groups.length,false,rules).map(g=>g.map(p=>p.id));
 // Relabel balanced groups to preserve as many assignments as possible, subject to locks.
 const retained=(g:string[][])=>g.reduce((n,row,i)=>n+row.filter(id=>previous[i]?.includes(id)).length,0);
 let improved=true;while(improved){improved=false;for(let a=0;a<result.length;a++)for(let b=a+1;b<result.length;b++){const candidate=result.map(g=>[...g]);[candidate[a],candidate[b]]=[candidate[b],candidate[a]];if(!ruleViolations(candidate,rules).length&&retained(candidate)>retained(result)){candidate.forEach((g,i)=>result[i]=g);improved=true;}}}
 return result;
}
export const fixedLevels=(players:Player[],boundary=2)=>[players.filter(p=>p.level<=boundary).map(p=>p.id),players.filter(p=>p.level>boundary).map(p=>p.id)];
export function randomGroups(players:Player[],count:number,rules:GroupRule[],random= Math.random){
 const groups=constrainedGroups(players,count,false,rules).map(g=>g.map(p=>p.id));
 // Random legal swaps retain team sizes and never silently discard group rules.
 for(let step=0;step<players.length*20;step++){
  const a=Math.floor(random()*groups.length),b=Math.floor(random()*groups.length);
  if(a===b||!groups[a]?.length||!groups[b]?.length)continue;
  const i=Math.floor(random()*groups[a].length),j=Math.floor(random()*groups[b].length);
  [groups[a][i],groups[b][j]]=[groups[b][j],groups[a][i]];
  if(ruleViolations(groups,rules).length)[groups[a][i],groups[b][j]]=[groups[b][j],groups[a][i]];
 }
 return groups;
}
export function roundRobin(count:number){const games:{a:number;b:number;rest:number[]}[]=[];for(let a=0;a<count;a++)for(let b=a+1;b<count;b++)games.push({a,b,rest:Array.from({length:count},(_,i)=>i).filter(i=>i!==a&&i!==b)});return games;}
