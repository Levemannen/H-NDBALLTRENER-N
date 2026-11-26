import {type Player} from './model.ts';
import {constrainedGroups,ruleViolations,type GroupRule} from './groupRules.ts';
export function minimallyChanged(players:Player[],previous:string[][],rules:GroupRule[],options:{count?:number;kind?:string;boundary?:number}={}){
 if(options.kind==='fixed'){const result=fixedLevels(players,options.boundary??2);if(ruleViolations(result,rules).length)throw Error('Faste nivågrupper strider mot lagreglene. Endre regelen eller velg en annen fordeling.');return result;}
 const ids=new Set(players.map(p=>p.id));
 const groups=Array.from({length:Math.max(0,options.count??previous.length)},(_,i)=>(previous[i]??[]).filter(id=>ids.has(id)));
 if(!groups.length)return constrainedGroups(players,2,false,rules).map(g=>g.map(p=>p.id));
 for(const p of players.filter(p=>!groups.flat().includes(p.id))){const min=Math.min(...groups.map(g=>g.length));groups[groups.findIndex(g=>g.length===min)].push(p.id);}
 const spread=Math.max(...groups.map(g=>g.length))-Math.min(...groups.map(g=>g.length));
 if(spread<=1&&!ruleViolations(groups,rules).length){
  const strength=(g:string[])=>g.length?g.reduce((n,id)=>n+5-players.find(p=>p.id===id)!.level,0)/g.length:0;
  const imbalance=(g:string[][])=>Math.max(...g.map(strength))-Math.min(...g.map(strength));
  for(let step=0;step<players.length&&imbalance(groups)>.7;step++){
   let best=imbalance(groups),swap:number[]|undefined;
   for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++)for(let i=0;i<groups[a].length;i++)for(let j=0;j<groups[b].length;j++){
    [groups[a][i],groups[b][j]]=[groups[b][j],groups[a][i]];
    const score=imbalance(groups);if(score<best&&!ruleViolations(groups,rules).length){best=score;swap=[a,b,i,j];}
    [groups[a][i],groups[b][j]]=[groups[b][j],groups[a][i]];
   }
   if(!swap)break;const [a,b,i,j]=swap;[groups[a][i],groups[b][j]]=[groups[b][j],groups[a][i]];
  }
  return groups;
 }
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
export function roundRobin(count:number){
 const pending:{a:number;b:number;rest:number[]}[]=[];for(let a=0;a<count;a++)for(let b=a+1;b<count;b++)pending.push({a,b,rest:Array.from({length:count},(_,i)=>i).filter(i=>i!==a&&i!==b)});
 const games:typeof pending=[],last=Array(count).fill(-1);
 while(pending.length){const previous=games.at(-1);const score=(g:typeof pending[number])=>Number(previous?.a===g.a||previous?.b===g.a)+Number(previous?.a===g.b||previous?.b===g.b)+(last[g.a]+last[g.b])/(count*count+1);pending.sort((a,b)=>score(a)-score(b));const game=pending.shift()!;last[game.a]=games.length;last[game.b]=games.length;games.push(game);}return games;
}
export function allocationSummary(players:Player[],before:string[][],after:string[][]){const moved=after.reduce((n,g,i)=>n+g.filter(id=>before.some(x=>x.includes(id))&&!before[i]?.includes(id)).length,0),averages=after.map(g=>g.length?g.reduce((n,id)=>n+(players.find(p=>p.id===id)?.level??0),0)/g.length:0);return {moved,averages,spread:Math.max(...averages)-Math.min(...averages)};}
