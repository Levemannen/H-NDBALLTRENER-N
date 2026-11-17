import {variants} from './variants.ts';
import type {Data,Diagram,DiagramStatus,Exercise} from './model.ts';
import generated from './illustrations.json' with {type:'json'};
import {reviewed,originalDiagram,nextPosition} from './diagrams.ts';
export const illustrationStatuses:DiagramStatus[]=['Gjennomgått mot kilden','Til trenergjennomgang','Trenger avklaring'];
export function illustration(e:Exercise,data:Data,variant?:string){
 const source=(generated as Record<string,{frames:Diagram[];status:DiagramStatus;note:string}>)[e.id];
 variant=variant===undefined&&e.id==='master-16'?variants(e)[0]?.id:variant;
 const key=variant&&(data.diagrams[variant]||data.diagramSteps?.[variant])?variant:e.id;
 const own=Boolean(data.diagrams[key]||data.diagramSteps?.[key]);
 const frames=data.diagramSteps?.[key]??(data.diagrams[key]?[data.diagrams[key]]:e.id==='master-16'&&variant!==''?[originalDiagram,nextPosition]:source?.frames??(reviewed[e.id]?[reviewed[e.id]]:[]));
 return {frames,status:data.diagramReview?.[variant||e.id]??data.diagramReview?.[e.id]??(own?'Til trenergjennomgang':source?.status??(frames.length?'Gjennomgått mot kilden':'Trenger avklaring')),note:own?'Egen illustrasjon – bevares ved oppdatering.':e.id==='master-16'&&variant!==''?'Viser varianten med én tom kjegle.':source?.note??'Prinsippskisse basert på kildebeskrivelsen.'};
}
