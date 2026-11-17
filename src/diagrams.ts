import type {Diagram,Point,SymbolKind} from './model.ts';

const mark=(kind:SymbolKind,x:number,y:number,label='',team:0|1=0):Diagram['marks'][number]=>({id:kind+'-'+x+'-'+y,kind,x,y,label,team});
const player=(x:number,y:number,label:string,team:0|1=0)=>mark('player',x,y,label,team);
const arrow=(kind:Diagram['arrows'][number]['kind'],from:Point,to:Point,bend?:Point):Diagram['arrows'][number]=>({id:kind+'-'+from.x+'-'+from.y,kind,from,to,bend});

export const reviewed:Record<string,Diagram>={
  // Schematic examples; positions are illustrative, source organization is preserved.
  'master-26':{court:'crop',marks:[mark('cone',30,25),mark('cone',70,25),mark('cone',30,75),mark('cone',70,75),player(35,28,'1'),player(65,28,'2'),player(65,72,'3'),player(35,72,'4'),player(50,50,'1',1),mark('ball',40,28)],arrows:[arrow('pass',{x:42,y:28},{x:60,y:28})]},
  'master-34':{court:'crop',marks:[player(36,50,'1'),player(44,50,'2'),player(52,50,'3'),player(60,50,'4'),player(30,28,'A',1),mark('text',54,69,'Hold på skuldrene')],arrows:[arrow('run',{x:34,y:25},{x:65,y:45},{x:65,y:15})]},
  'master-62':{court:'half',marks:[player(44,50,'1'),player(50,50,'2'),mark('ball',43,58),mark('hurdle',32,50),mark('text',30,78,'Lavt / mykt hinder'),mark('text',12,35,'Skudd mot mål')],arrows:[arrow('run',{x:41,y:50},{x:23,y:50})]},
  'master-85':{court:'crop',marks:[player(32,35,'1'),player(65,35,'2'),player(48,70,'3'),player(67,65,'S',1),mark('ball',37,36)],arrows:[arrow('pass',{x:39,y:40},{x:46,y:63}),arrow('run',{x:63,y:65},{x:54,y:68})]},
  'master-119':{court:'half',marks:[mark('cone',15,50),player(18,30,'F',1),player(29,50,'A'),mark('ball',30,59)],arrows:[arrow('run',{x:18,y:38},{x:15,y:48}),arrow('run',{x:18,y:52},{x:25,y:52})]},
  'master-24':{court:'full',marks:[mark('cone',15,15),mark('cone',15,85),mark('cone',85,15),mark('cone',85,85),mark('text',8,50,'Endesone'),mark('text',92,50,'Endesone'),player(36,30,'1'),player(57,55,'2'),player(86,65,'3'),player(45,35,'1',1),player(65,40,'2',1),player(76,65,'3',1),mark('ball',61,57)],arrows:[arrow('pass',{x:64,y:57},{x:82,y:64})]},
  'master-48':{court:'full',marks:[mark('cone',15,30),mark('cone',15,50),mark('cone',15,70),mark('cone',85,30),mark('cone',85,50),mark('cone',85,70),mark('text',15,15,'Base A'),mark('text',85,15,'Base B'),player(76,50,'1'),player(30,65,'1',1),mark('ball',84,46),mark('ball',34,65)],arrows:[arrow('run',{x:74,y:55},{x:24,y:55})]},
  'master-117':{court:'half',marks:[player(36,25,'B'),player(43,25,'B'),player(36,75,'B'),player(43,75,'B'),player(39,50,'M'),mark('ball',35,50),mark('text',12,75,'Avslutt mot mål')],arrows:[arrow('run',{x:32,y:25},{x:23,y:35}),arrow('pass',{x:34,y:47},{x:26,y:35})]},
  'master-120':{court:'half',marks:[mark('cone',18,35),mark('cone',18,65),player(28,35,'1'),player(28,65,'2'),mark('text',16,83,'Markør ved 7 m')],arrows:[arrow('run',{x:26,y:32},{x:19,y:32}),arrow('run',{x:19,y:40},{x:26,y:40}),arrow('run',{x:26,y:62},{x:19,y:62}),arrow('run',{x:19,y:70},{x:26,y:70})]},
  'master-23':{court:'crop',marks:[player(32,35,'1'),player(65,30,'2'),player(55,70,'3'),player(43,40,'1',1),player(58,43,'2',1),player(45,66,'3',1),mark('ball',36,31)],arrows:[arrow('pass',{x:39,y:30},{x:60,y:29}),arrow('run',{x:30,y:41},{x:31,y:65})]},
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

const positions=[[40,39],[50,27],[60,39],[60,61],[40,61],[50,73]];
export const originalDiagram:Diagram={
  court:'crop',
  marks:[
    ...positions.map(([x,y],i)=>({id:'cone-'+i,kind:'cone' as const,x,y:y-10,label:'',team:0 as const})),
    ...positions.slice(0,5).map(([x,y],i)=>({id:'player-'+i,kind:'player' as const,x,y,label:String(i+1),team:0 as const})),
    {id:'ball',kind:'ball',x:44,y:43,label:'',team:0},
    {id:'empty',kind:'empty',x:50,y:73,label:'',team:0}
  ],
  arrows:[
    {id:'pass',kind:'pass',from:{x:46,y:44},bend:{x:51,y:53},to:{x:57,y:44}},
    {id:'run',kind:'run',from:{x:38,y:46},bend:{x:27,y:75},to:{x:46,y:73}}
  ]
};
export const nextPosition:Diagram={...originalDiagram,arrows:[],marks:originalDiagram.marks.map(m=>m.id==='player-0'?{...m,x:50,y:73}:m.id==='empty'?{...m,x:40,y:39}:m.id==='ball'?{...m,x:64,y:43}:m)};
