import type {Exercise} from './model.ts';
export type Provenance='Dokumentert'|'Redaksjonell vurdering'|'Ukjent';
export type PlanningMeta={mainSkill?:string;secondarySkills?:string[];equipment?:string[];ageSuitability?:string;levelSuitability?:string;stations?:number;differentiation?:string[];phase?:string;setupMinutes?:number;activity?:'høy'|'middels'|'lav';queue?:'lav'|'middels'|'høy';complexity?:'enkel'|'middels'|'krevende';independent?:boolean;oneCoach?:boolean;provenance?:Record<string,Provenance>};
// Editorial judgments after reading organization in Master v3. Not source facts.
const simple=new Set([4,6,7,8,12,13,19,26,32,53,58,73,91,94,100,101,104,106,109,111,112]);
const supervised=new Set([43,54,56,69,110,121]);
export const planningLabels={mainSkill:'Hovedferdighet',secondarySkills:'Sekundære ferdigheter',equipment:'Utstyr',ageSuitability:'Aldersgruppe',levelSuitability:'Nivåegnethet',stations:'Antall stasjoner',differentiation:'Differensiering',phase:'Plass i økten',setupMinutes:'Riggetid i minutter',activity:'Aktivitetsnivå',queue:'Risiko for kø',complexity:'Organisering',independent:'Selvstendige grupper',oneCoach:'Egnet med én trener'};
export function planningMeta(e:Exercise):PlanningMeta{
 const base:PlanningMeta=simple.has(e.number??0)?{activity:'høy',queue:'lav',complexity:'enkel',independent:true,oneCoach:true,provenance:Object.fromEntries(['activity','queue','complexity','independent','oneCoach'].map(k=>[k,'Redaksjonell vurdering']))}:supervised.has(e.number??0)?{complexity:'krevende',independent:false,oneCoach:false,provenance:{complexity:'Redaksjonell vurdering',independent:'Redaksjonell vurdering',oneCoach:'Redaksjonell vurdering'}}:{};
 const keys=Object.keys(planningLabels) as (keyof typeof planningLabels)[];
 const explicit=Object.fromEntries(keys.filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));
 return {...base,...explicit,provenance:{...base.provenance,...e.provenance}};
}
export function planningReason(e:Exercise,coaches:number,favorite=false,successful=false){
 const meta=planningMeta(e);const reasons=[coaches===1&&meta.oneCoach?'Enkel organisering for én trener (redaksjonell vurdering)':'',meta.activity==='høy'?'Høy aktivitet': '',meta.queue==='lav'?'Lite kø':'',favorite?'Din favoritt':'',successful?'Brukt i en økt du vurderte som bra':''].filter(Boolean);
 return reasons.join(' · ')||'Passer valgte rammer og del av økten. Organisering må vurderes av trener.';
}
