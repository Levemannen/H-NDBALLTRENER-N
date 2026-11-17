// Source-reviewed diagram recipes. All positions are schematic, never measurements.
import {readFileSync,writeFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync(new URL('../src/bank.json',import.meta.url),'utf8')).exercises;
let seq=0;
const m=(kind,x,y,label='',team=0)=>({id:'m-'+(++seq),kind,x,y,label,team});
const p=(x,y,label='',team=0)=>m('player',x,y,label,team);
const ball=(x,y)=>m('ball',x,y);
const text=(x,y,label)=>m('text',x,y,label);
const cone=(x,y)=>m('cone',x,y);
const a=(kind,x,y,u,v,bend)=>({id:'a-'+(++seq),kind,from:{x,y},to:{x:u,y:v},...(bend?{bend:{x:bend[0],y:bend[1]}}:{})});
const d=(marks,arrows=[],court='full')=>({court,marks,arrows});
const pair=(moving=false)=>d([p(28,30,'1'),p(28,70,'2'),ball(32,32)],[a('pass',32,36,moving?44:28,63),...(moving?[a('run',28,25,76,25),a('run',28,75,76,75)]:[])]);
const free=(carrying=false)=>d([p(25,30,'1'),p(55,22,'2'),p(72,65,'3'),p(35,73,'4'),...(carrying?[ball(29,33),ball(59,25),ball(76,68),ball(39,76)]:[])],[a(carrying?'carry':'run',29,40,47,55),a(carrying?'carry':'run',64,24,78,39)]);
const square=()=>[cone(32,25),cone(68,25),cone(32,75),cone(68,75)];
const recipes={
 1:{frames:[d([p(25,32,'I',1),p(58,55,'I',1),p(68,25,'1'),p(35,74,'2'),p(80,75,'3'),ball(30,33)],[a('pass',33,36,52,51),a('run',61,60,74,70)])],note:'To smittede samarbeider. Ballfører står; medspiller uten ball beveger seg. Berøring, aldri kast på spiller.'},
 2:{frames:[pair(true),d([p(42,28,'1'),p(37,47,'2'),p(47,47,'3'),p(32,67,'4'),p(52,67,'5'),p(42,50,'6'),text(73,48,'Eksempel: A')])],note:'Viser ett par i bevegelse og et eksempel på bokstaven A. Del i to lag som beskrevet.'},
 3:{frames:[d([p(25,30,'H',1),p(55,30,'Stiv'),p(55,70,'Fri'),p(80,60,'Fri'),ball(59,70),ball(84,60),ball(29,30)],[a('pass',55,62,55,39),a('carry',80,53,72,35)])],note:'En avtalt pasning befrir den stive spilleren. Heksa markeres rødt.'},
 4:{frames:[d([p(38,50,'B'),p(55,50,'P',1),ball(32,50)],[a('carry',33,42,32,25),a('run',55,41,48,25)])],note:'Ballfører beskytter ballen med kroppen mellom partner og ball. Avtal oppgaven på JA.'},
 5:{frames:[d([p(15,35,'1'),p(15,65,'2'),text(48,20,'Mobilitet → puls'),text(48,80,'Hopp / reaksjon')],[a('run',22,35,82,35),a('run',22,65,82,65)])],note:'Bevegelse over hele banen. Kroppsteknikk må demonstreres; skissen viser organisering.'},
 6:{frames:[free(true)],note:'Hver spiller har ball. Bevegelse og håndbytte; rom og posisjoner er eksempel.'},
 7:{frames:[pair(),d([p(25,50,'1'),p(75,50,'2'),p(50,50,'T',1),ball(30,50)],[a('pass',33,45,67,45,[50,15])])],note:'Grunnoppsett i par og separat Bossnivå med trener/forsvarer i midten.'},
 8:{frames:[d([p(35,30,'1'),p(35,65,'2'),ball(31,30),ball(31,65),text(10,48,'Vegg')],[a('pass',29,30,12,30),a('pass',29,65,12,65)])],note:'Vegg til venstre. Høy arm, stemfot og rotasjon demonstreres fysisk.'},
 9:{frames:[d([p(25,30,'1'),p(65,30,'2'),p(35,70,'3'),p(75,70,'4'),ball(29,33),ball(39,73)],[a('pass',33,30,58,30),a('run',25,38,42,50),a('pass',43,70,68,70)])],note:'Eksempel med halvparten av spillerne med ball. Flytt videre, ikke direkte retur.'},
 10:{frames:[d([p(12,30,'1'),p(18,55,'2'),p(11,75,'3'),p(5,52,'4'),ball(15,31)],[a('pass',15,37,18,46),a('pass',15,62,12,68)],'half')],note:'Nummerrekkefølge innenfor 9-meteren. Viser fire av gruppens nummererte spillere.'},
 11:{frames:[d([p(25,30,'1'),p(60,25,'2'),p(70,70,'3'),p(40,40,'1',1),p(65,47,'2',1),p(40,72,'3',1),ball(30,30)],[a('pass',33,28,53,25),a('run',62,30,76,40)])],note:'Eksempel med tre per lag. Pasninger i egen nummerrekkefølge; motstandere forsøker brudd.'},
 12:{frames:[pair(true)],note:'Viser parvarianten: mottakeren møter ballen i bevegelse.'},
 13:{frames:[pair(true)],note:'To side ved side løper fremover mens de sentrer.'},
 14:{frames:[d([p(25,25,'M'),p(25,50,'1'),p(25,65,'2'),p(25,80,'3'),p(72,25,'M',1),p(72,50,'1',1),p(72,65,'2',1),p(72,80,'3',1),ball(29,50),ball(76,50)],[a('pass',23,44,23,33),a('pass',28,32,28,43),a('pass',70,44,70,33),a('pass',75,32,75,43)])],note:'To rekker med mottaker omtrent fem meter foran. Kjegler brukes i sidebyttevarianten.'},
 15:{frames:[d([...square(),p(45,43,'1'),p(55,60,'2'),p(22,42,'A'),p(50,15,'B'),p(78,55,'C'),p(48,86,'D'),ball(25,43),ball(54,16),ball(81,56)],[a('pass',29,43,39,43),a('run',44,50,38,63)])],note:'Fire kjegler, to spillere inne og flere ballførere utenfor. Firkant ca. 6 × 6 meter.'},
 16:{frames:[d([p(30,30,'1'),p(65,35,'2'),p(50,75,'3'),ball(34,30)],[a('pass',38,31,58,34),a('run',30,39,38,64)])],note:'Grunnøvelsen angir ikke fast oppstilling. Viser kun spill videre og flytt til ny plass. Velg varianten med én tom kjegle for det konkrete sekskjegleoppsettet.'},
 17:{frames:[d([text(18,20,'1'),text(40,20,'2A'),text(60,20,'2B'),text(80,20,'3 / 4'),p(40,50,'2'),ball(43,52)],[a('run',45,50,58,50)])],status:'Trenger avklaring',note:'Kilden angir fire soner, men ikke entydig plassering av A/B eller ballrekkefølgens geometri. Kun mottak–flytt-prinsippet vises.'},
 18:{frames:[d([text(15,10,'Sone 1'),text(38,10,'Sone 2'),text(62,10,'Sone 3'),text(85,10,'Sone 4'),...Array.from({length:4},(_,i)=>[p(15+i*23,35,'A'),p(15+i*23,65,'B')]).flat(),ball(19,35),ball(42,65),cone(26,15),cone(26,85),cone(50,15),cone(50,85),cone(74,15),cone(74,85)],[a('pass',21,35,31,35),a('pass',44,65,55,65),a('pass',68,35,79,35)])],note:'Fire soner på tvers. Viser to i hver sone; alle blir i egen sone. Ballene går frem og tilbake.'},
 19:{frames:[d([p(22,30,'1'),p(32,68,'2'),p(70,25,'3'),p(80,70,'4'),ball(27,31),text(50,90,'Ingen krysser')],[a('pass',30,30,63,25),a('run',76,67,63,55)])],note:'Grunnversjon: alle samarbeider, ingen forsvarere. Bare ballen krysser midtlinjen.'}
};
// Further reviewed recipes are appended below.
export {recipes,d,p,m,ball,text,cone,a,pair,free,square};
Object.assign(recipes,(await import('./diagram-recipes-21-40.mjs')).default({d,p,m,ball,text,cone,a,square}));
Object.assign(recipes,(await import('./diagram-recipes-41-60.mjs')).default({d,p,m,ball,text,cone,a,free}));
Object.assign(recipes,(await import('./diagram-recipes-61-80.mjs')).default({d,p,m,ball,text,cone,a,free}));
Object.assign(recipes,(await import('./diagram-recipes-81-100.mjs')).default({d,p,m,ball,text,cone,a,pair}));
Object.assign(recipes,(await import('./diagram-recipes-101-122.mjs')).default({d,p,m,ball,text,cone,a,free}));
if(process.argv.includes('--write')){
 const output={};for(const [number,recipe] of Object.entries(recipes)){const e=bank.find(e=>e.number===Number(number));output[e.id]={...recipe,status:recipe.status??'Gjennomgått mot kilden',sourceTitle:e.title};}
 writeFileSync(new URL('../src/illustrations.json',import.meta.url),JSON.stringify(output,null,2)+'\n');console.log(Object.keys(output).length+' nye oppsett');
}
