export type SyncDecision='same'|'upload'|'download'|'conflict';
// Whole-workspace conflicts are deliberate: never silently lose edits to the same player.
export function syncDecision(local:string,remote:string|null,base:string|null):SyncDecision{
 local=semanticText(local);remote=remote===null?null:semanticText(remote);base=base===null?null:semanticText(base);
 if(local===remote)return 'same';
 if(remote===null)return base===null?'upload':'conflict';
 if(base===null)return 'conflict';
 if(local===base)return 'download';
 if(remote===base)return 'upload';
 return 'conflict';
}

// Import time is device-local metadata, not a user edit. Keep the complete payload in storage and transfers.
function semanticText(text:string){try{const value=JSON.parse(text);if(value?.version===3&&value.rosterImport){delete value.rosterImport.importedAt;}return stableText(value);}catch{return text;}}

export const stableText=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
