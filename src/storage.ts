import {parseData,validSession,type Data,type Session} from './model.ts';

export const draftKey='handballtrenern.draft.v1';
export function parseDraft(text:string):Session {
  const value=JSON.parse(text);
  if(value.version!==1||!validSession(value.session))throw new Error('Utkastet kunne ikke leses. Eksporter det før du forkaster det.');
  return value.session;
}
export const draftText=(session:Session)=>{
  if(!validSession(session))throw new Error('Utkastet inneholder ugyldige verdier.');
  return JSON.stringify({version:1,session});
};
// Compare the exact snapshot before each write, including imports and drafts.
// App holds an exclusive Web Lock while editing; snapshot checks also protect against older clients.
export function checkedWrite(storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,key:string,expected:string|null,next:string|null){
  if(storage.getItem(key)!==expected)throw new Error('En annen fane har endret dataene. Eksporter denne fanens data og last siden på nytt før du fortsetter.');
  if(next===null)storage.removeItem(key);else storage.setItem(key,next);
}
export function serializeData(data:Data){const text=JSON.stringify(data);parseData(text);return text;}
