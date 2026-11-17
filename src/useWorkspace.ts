import {useEffect,useRef,useState} from 'react';
import {type Data,type Session,storageKey} from './model';
import {checkedWrite} from './storage';
import {activeTeam,readWorkspace,project,parseWorkspace,workspaceKey,updateCurrent,sessionFor,type Workspace,migrateV1} from './workspace';
import {fresh} from './model';
export function useWorkspace(){
 const [initial]=useState(()=>{try{return {...readWorkspace(localStorage),error:'',raw:localStorage.getItem(workspaceKey)};}catch(error){return {workspace:migrateV1(fresh()),migrated:false,error:'Lokale data kunne ikke leses: '+(error as Error).message,raw:null};}});
 const [workspace,setWorkspace]=useState(initial.workspace),ref=useRef(workspace);
 const snapshot=useRef(initial.raw),blocked=useRef(Boolean(initial.error));
 const [error,setError]=useState(initial.error),[status,setStatus]=useState('');
 const [draft,setDraftState]=useState(activeTeam(workspace).draft),draftRef=useRef(draft);
 const [recovered,setRecovered]=useState(Boolean(initial.raw||initial.migrated)&&Boolean(draft.name||draft.items.length));
 const owns=useRef(!('locks' in navigator));
 const data=project(workspace);
 function write(next:Workspace,recover=false){
  try{
   if(!owns.current)throw new Error('Denne fanen er skrivebeskyttet. Lukk den andre appfanen og last siden på nytt.');
   if(blocked.current&&!recover)throw new Error('Eksporter de uleselige dataene før du importerer en gyldig sikkerhetskopi.');
   const text=JSON.stringify(next);parseWorkspace(text);
   checkedWrite(localStorage,workspaceKey,recover&&blocked.current?localStorage.getItem(workspaceKey):snapshot.current,text);
   snapshot.current=text;ref.current=next;setWorkspace(next);blocked.current=false;setError('');return true;
  }catch(e){setError((e as Error).message);return false;}
 }
 function flush(){
  if(blocked.current)return false;
  const next=updateCurrent(ref.current,project(ref.current),draftRef.current);
  if(!snapshot.current&&JSON.stringify(next)===JSON.stringify(initial.workspace)){setStatus('Ingen ulagrede endringer');return true;}
  if(JSON.stringify(next)===snapshot.current){setStatus('Utkast lagret på denne enheten');return true;}
  const ok=write(next);setStatus(ok?'Utkast lagret på denne enheten':'Utkastet kunne ikke lagres – eksporter før du lukker');return ok;
 }
 function setDraft(s:Session|((s:Session)=>Session)){const next=typeof s==='function'?s(draftRef.current):s;draftRef.current=next;setDraftState(next);setStatus('Lagrer utkast …');}
 function change(fn:(w:Workspace)=>Workspace){
  const next=fn(updateCurrent(ref.current,project(ref.current),draftRef.current));
  if(!write(next))return false;
  const current=activeTeam(next).draft;draftRef.current=current;setDraftState(current);return true;
 }
 function update(fn:(d:Data)=>Data){return change(w=>updateCurrent(w,fn(project(w)),draftRef.current));}
 function resetDraft(){const next=sessionFor(activeTeam(ref.current).settings);if(change(w=>updateCurrent(w,project(w),next))){setRecovered(false);return true;}return false;}
 function replace(next:Workspace){if(!write(next,true))return false;draftRef.current=activeTeam(next).draft;setDraftState(draftRef.current);setRecovered(Boolean(draftRef.current.items.length||draftRef.current.name));return true;}
 function exportValue(){return updateCurrent(ref.current,project(ref.current),draftRef.current);}
 useEffect(()=>{const timeout=setTimeout(flush,450);return ()=>clearTimeout(timeout);},[draft]);
 useEffect(()=>{
  let release=()=>{},cancelled=false;
  if('locks' in navigator)void navigator.locks.request('handballtrenern-editor',{ifAvailable:true},async lock=>{if(cancelled)return;if(!lock){setError('Appen er åpen for redigering i en annen fane. Denne fanen er skrivebeskyttet.');return;}owns.current=true;await new Promise<void>(resolve=>{release=resolve;});owns.current=false;});
  const hide=()=>{if(document.visibilityState==='hidden')flush();},leave=()=>{flush();};
  const changed=(e:StorageEvent)=>{if(e.key===workspaceKey||e.key===storageKey||e.key===null)setError('En annen fane har endret data. Eksporter denne fanens data før du laster siden på nytt.');};
  document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',leave);window.addEventListener('storage',changed);
  return ()=>{cancelled=true;release();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',leave);window.removeEventListener('storage',changed);};
 },[]);
 return {workspace,data,draft,setDraft,update,change,resetDraft,replace,flush,exportValue,error,status,recovered,setRecovered,migrated:initial.migrated};
}
