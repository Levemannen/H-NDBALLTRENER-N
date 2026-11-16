import type {Diagram,Point,SymbolKind} from './model.ts';

const mark=(kind:SymbolKind,x:number,y:number,label='',team:0|1=0):Diagram['marks'][number]=>({id:kind+'-'+x+'-'+y,kind,x,y,label,team});
const player=(x:number,y:number,label:string,team:0|1=0)=>mark('player',x,y,label,team);
const arrow=(kind:Diagram['arrows'][number]['kind'],from:Point,to:Point,bend?:Point):Diagram['arrows'][number]=>({id:kind+'-'+from.x+'-'+from.y,kind,from,to,bend});

export const reviewed:Record<string,Diagram>={
  // The source describes one ball, two players per team and two cones in each end.
  'master-20':{court:'crop',marks:[
    mark('cone',24,42),mark('cone',24,50),mark('cone',76,42),mark('cone',76,50),
    player(38,33,'1'),player(61,64,'2'),player(56,38,'1',1),player(45,64,'2',1),mark('ball',40,45)
  ],arrows:[]},
  // Three attackers spread out, two defenders close the passing lanes.
  'master-22':{court:'crop',marks:[
    player(32,48,'1'),player(61,25,'2'),player(65,71,'3'),player(51,40,'1',1),player(49,63,'2',1),mark('ball',37,44)
  ],arrows:[arrow('pass',{x:40,y:41},{x:57,y:26})]},
  // The cone represents a defender. The example shows one of the two directions.
  'master-66':{court:'crop',marks:[
    player(29,55,'1'),mark('ball',34,57),mark('cone',53,52),mark('text',53,72,'Kjegle som forsvarer')
  ],arrows:[arrow('carry',{x:35,y:51},{x:47,y:58}),arrow('carry',{x:47,y:58},{x:65,y:39},{x:52,y:25})]},
  // First pair starts by its own end line and attacks the opposite, empty goal.
  'master-72':{court:'full',marks:[player(17,32,'1'),player(17,71,'2'),mark('ball',22,33)],arrows:[
    arrow('run',{x:23,y:29},{x:80,y:29}),arrow('run',{x:23,y:75},{x:80,y:75}),
    arrow('pass',{x:26,y:35},{x:42,y:65}),arrow('pass',{x:47,y:66},{x:63,y:36})
  ]}
};
