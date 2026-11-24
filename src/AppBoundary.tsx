import {Component,type ReactNode} from 'react';
import {downloadJSON} from './workspace';
export class AppBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){if(!this.state.failed)return this.props.children;return <main className="page stack"><h1>Appen kunne ikke vise denne siden</h1><p>Lagrede data er ikke slettet. Eksporter en redningskopi før du prøver igjen.</p><button onClick={()=>{const raw:Record<string,string|null>={};try{for(const key of ['handballtrenern.v3','handballtrenern.v1','handballtrenern.draft.v1'])raw[key]=localStorage.getItem(key);}catch{}downloadJSON({raw},'handball-redningskopi.json');}}>Eksporter redningskopi</button><button onClick={()=>{location.hash='/';location.reload();}}>Åpne startsiden på nytt</button></main>;}
}
