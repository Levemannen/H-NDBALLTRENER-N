import {useEffect,useRef,useState} from 'react';
export function Updates({route,flush,error}:{route:string;flush:()=>boolean;error:string}){
 const [waiting,setWaiting]=useState<ServiceWorker>(),[changed,setChanged]=useState(false),[later,setLater]=useState(false),[last,setLast]=useState('Ikke kontrollert ennå'),[message,setMessage]=useState('');
 const activating=useRef(false),latest=useRef(flush);latest.current=flush;
 async function check(){
  if(!('serviceWorker' in navigator)){setMessage('Denne nettleseren støtter ikke offlineoppdatering.');return;}
  if(!navigator.onLine){setMessage('Du er frakoblet. Prøver igjen når nettet er tilbake.');return;}
  try{const reg=await navigator.serviceWorker.getRegistration();if(!reg){setMessage('Oppdateringssjekk er tilgjengelig i den installerte produksjonsappen.');return;}await reg.update();setLast(new Date().toLocaleString('nb-NO'));if(reg.waiting)setWaiting(reg.waiting);setMessage(reg.waiting?'Ny versjon er klar.':'Sjekket etter ny versjon. En nedlasting kan fortsatt pågå.');}catch{setMessage('Kunne ikke sjekke nå. Appen fungerer fortsatt offline. Prøv igjen senere.');}
 }
 function activate(){if(activating.current||!latest.current())return;activating.current=true;if(changed){location.reload();return;}waiting?.postMessage('ACTIVATE_UPDATE');}
 useEffect(()=>{
  const ready=(event:Event)=>{setWaiting((event as CustomEvent<ServiceWorker>).detail);setMessage('Ny versjon er ferdig lastet ned.');};
  let wasControlled=Boolean(navigator.serviceWorker?.controller);
  const controller=()=>{if(!wasControlled){wasControlled=true;return;}if(activating.current)location.reload();else if(navigator.serviceWorker.controller)setChanged(true);};
  const visible=()=>{if(document.visibilityState==='visible')void check();};
  window.addEventListener('handball-update',ready);window.addEventListener('handball-registered',visible);navigator.serviceWorker?.addEventListener('controllerchange',controller);document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible);
  const timer=setInterval(visible,5*60*1000);void check();
  return ()=>{window.removeEventListener('handball-update',ready);window.removeEventListener('handball-registered',visible);navigator.serviceWorker?.removeEventListener('controllerchange',controller);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible);clearInterval(timer);};
 },[]);
 useEffect(()=>{
  // Never interrupt a hall session, editor, or a tab with an unresolved save error.
  if((!waiting&&!changed)||later||error||route!=='/'||document.visibilityState!=='visible')return;
  const timer=setTimeout(()=>{if(!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName??''))activate();},1800);
  return ()=>clearTimeout(timer);
 },[waiting,changed,later,error,route]);
 return <><details className="sync-panel"><summary>Appversjon {__APP_VERSION__} · oppdateringer</summary><p>Sist kontrollert: {last}</p><button onClick={()=>void check()}>Se etter oppdateringer</button><p role="status">{message}</p></details>{(waiting||changed)&&<section className="notice"><p>Ny versjon er klar. Lagrede data og utkast beholdes. På startsiden oppdateres appen automatisk når det er trygt.</p><div className="row wrap"><button onClick={activate}>Oppdater nå</button><button onClick={()=>setLater(true)}>Senere</button></div>{later&&<p>Oppdateringen venter til du velger Oppdater nå eller åpner appen på nytt.</p>}</section>}</>;
}
