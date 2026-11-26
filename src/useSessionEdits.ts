import {useState} from 'react';
import type {Session} from './model';
import {sessionEdit,applySessionEdit,type SessionEdit} from './sessionEdits';
export type ChangeSession=(fn:(s:Session)=>Session)=>boolean|void;
export function useSessionEdits(save:ChangeSession,report:(message:string)=>void){
 const [undo,setUndo]=useState<SessionEdit[]>([]),[redo,setRedo]=useState<SessionEdit[]>([]);
 function change(fn:(s:Session)=>Session){let edit:SessionEdit|undefined;try{const ok=save(current=>{const next=fn(current);edit=sessionEdit(current,next);return next;});if(ok!==false&&edit?.changes.length){setUndo(old=>[...old.slice(-29),edit!]);setRedo([]);}return ok!==false;}catch(e){report((e as Error).message);return false;}}
 function travel(reverse:boolean){const list=reverse?undo:redo,edit=list.at(-1);if(!edit)return;try{const ok=save(current=>applySessionEdit(current,edit,reverse));if(ok===false)return;if(reverse){setUndo(old=>old.slice(0,-1));setRedo(old=>[...old,edit]);}else{setRedo(old=>old.slice(0,-1));setUndo(old=>[...old,edit]);}}catch(e){report((e as Error).message);}}
 return {change,undo:()=>travel(true),redo:()=>travel(false),canUndo:undo.length>0,canRedo:redo.length>0};
}
