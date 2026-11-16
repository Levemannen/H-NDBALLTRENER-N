import {intro,section,type Exercise} from './model.ts';

export const skillNames=['Pasning og mottak','Ballkontroll','Bevegelse uten ball','Finter og gjennombrudd','Skudd','Angrepsspill','Forsvar','Fotarbeid','Kontring og retur','Spillforståelse','Målvakt','Koordinasjon','Fysisk trening','Samarbeid'];
export const typeNames=['Oppvarming','Lek','Teknisk øvelse','Konkurranse','Småspill','Spill','Stafett','Målvaktsøvelse'];
const skillRules=[/pasning|mottak|piskekast/,/ballkontroll|stuss/,/bevegelse uten ball|bevegelse etter pasning|flytt deg etter pasning/,/fint|gjennombrudd/,/skudd/,/angrep|pådrag|innspill/,/forsvar|duell/,/fotarbeid|sideforflytning/,/kontr|retur|omstilling/,/spillforståelse|overtall|orientering|posisjoner/,/målvakt|keeper/,/koordinasjon|rytme/,/fysisk|kjernebank|balanse|styrke/,/samarbeid|kommunikasjon/];
const typeRules=[/oppvarming/,/\blek\b/,/\bkast\b|pasning|stuss|skudd|fotarbeid/,/konkurranse|challenge/,/småspill/,/\bspill\b/,/stafett/,/målvakt|keeper/];
const folded=(s:string)=>s.toLowerCase().replaceAll('ø','o').replaceAll('æ','ae').normalize('NFD').replace(/\p{M}/gu,'');
const words=(s:string)=>folded(s).match(/[a-z0-9]+/g)??[];
function tags(names:string[], rules:RegExp[], text:string){
  return names.filter((_,i)=>rules[i].test(text));
}
export const editorial=(e:Exercise)=>{
  const source=[...e.categories,e.title,...e.skills,...section(e,'Hva trener vi?')].join(' ').toLowerCase();
  const typeSource=[e.title,...e.categories].join(' ').toLowerCase();
  return {skills:e.skillTags??tags(skillNames,skillRules,source),types:e.types??tags(typeNames,typeRules,typeSource),coaches:e.coaches};
};
const indexed=new WeakMap<Exercise,{title:string;body:string;tokens:string[]}>();
function index(e:Exercise){
  let result=indexed.get(e);
  if(!result){
    const tags=editorial(e);
    const title=words(e.title).join(' ');
    const body=words([e.title,e.number,e.meta,intro(e),...e.categories,...e.skills,...tags.skills,...tags.types,...e.sections.flatMap(s=>[s.label,...s.lines])].join(' ')).join(' ');
    result={title,body,tokens:[...new Set(body.split(' '))]};
    indexed.set(e,result);
  }
  return result;
}
function near(a:string,b:string){
  if(a.length<4||Math.abs(a.length-b.length)>1)return false;
  let i=0;
  while(i<Math.min(a.length,b.length)&&a[i]===b[i])i++;
  if(a.length===b.length)return a.slice(i+1)===b.slice(i+1)||(a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
  const [short,long]=a.length<b.length?[a,b]:[b,a];
  return short.slice(i)===long.slice(i+1);
}
const roots:Record<string,string>={pasninger:'pasning',pasningene:'pasning',finter:'fint',finta:'fint',kontringer:'kontring',bevege:'beveg',bevegelse:'beveg'};
export function searchScore(e:Exercise,query:string){
  let q=words(query).join(' ');
  if(!q)return 1;
  const count=q.match(/\b(\d+) spillere?\b/);
  if(count){
    const n=Number(count[1]);
    if(!e.players||n<e.players[0]||n>e.players[1])return 0;
    q=q.replace(count[0],'').trim();
  }
  const hall=q.match(/\b(liten|halv|stor) (?:sal|hall|bane)\b/);
  if(hall){
    if(!e.halls?.includes(hall[1]))return 0;
    q=q.replace(hall[0],'').trim();
  }
  if(!q)return 1;
  const {title,body,tokens}=index(e);
  if(q==='lite ko')return /\b(?:unnga|uten|ingen|minst mulig|lite) ko\b/.test(body)?70:0;
  if(title.includes(q))return 100+Number(title===q)*30;
  if(body.includes(q))return 70;
  const parts=q.split(' ').filter(w=>!['i','og','med','til','pa'].includes(w));
  if(!parts.length)return 0;
  const name=title.split(' ');
  let score=0;
  for(const word of parts){
    const root=roots[word]??word;
    if(name.includes(word)||root.length>=3&&name.some(t=>t.startsWith(root)))score+=16;
    else if(name.some(t=>near(root,t)))score+=10;
    else if(tokens.includes(word))score+=8;
    else if(root.length>=3&&tokens.some(t=>t.startsWith(root)))score+=5;
    else if(tokens.some(t=>near(root,t)))score+=2;
    else return 0;
  }
  return score;
}
export const searchBank=(exercises:Exercise[],query:string)=>exercises.map(e=>({e,score:searchScore(e,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.e);

