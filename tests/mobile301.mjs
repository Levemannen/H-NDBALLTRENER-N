import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const dir=join(process.cwd(),'qa','3.0.1');await mkdir(dir,{recursive:true});
const baseline=Boolean(process.env.CAPTURE_BASELINE),prefix=baseline?'before':'after';
const server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname.replace(/^\/handball\//,'')||'index.html';const data=await readFile(join(process.env.DIST_DIR||'dist',file));res.writeHead(200,{'Content-Type':({html:'text/html',js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',webmanifest:'application/manifest+json'})[file.split('.').at(-1)]??'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/handball/';

const {fresh,newSession}=await import('../src/model.ts');const {migrateV1}=await import('../src/workspace.ts');
const legacy=fresh();legacy.team='Syntetisk testlag med langt norsk navn';legacy.players=Array.from({length:15},(_,i)=>({id:'test-'+i,name:'Syntetisk spiller med langt etternavn '+i,level:i%4+1}));legacy.favorites=['master-121','master-16'];const session={...newSession(),name:'Trening med pasninger og bevegelse uten ball i små grupper',players:15,coaches:1,focus:'Pasninger, orientering og bevegelse uten ball',attendees:legacy.players.map(p=>p.id),attendanceRegistered:true,items:[{id:'item-one',exerciseId:'master-121',minutes:12,comment:'La alle spillerne få god tid til å forstå organiseringen.'},{id:'item-two',exerciseId:'master-16',minutes:15,comment:'',variant:'master-16-variant-5-0'}]};legacy.sessions=[session];const fixture=migrateV1(legacy,{...session,id:'draft-test'});
const errors=[];const results=[];
async function inspect(page,label){
 const defects=await page.evaluate(width=>{
  const failures=[];if(document.documentElement.scrollWidth>width+1||innerWidth>width+1){failures.push('sideoverflow');for(const e of document.querySelectorAll('main *')){const r=e.getBoundingClientRect();if(r.width&&r.right>width+1)failures.push(e.tagName+'.'+e.className+' right='+Math.round(r.right)+(e.tagName==='INPUT'?e.outerHTML+e.parentElement.outerHTML:''));}}
  const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  for(const group of document.querySelectorAll('.picker,.cards,.fields,.player-row,.attendance,.home,.legend,.nav,.stack')){
   const children=[...group.children].filter(e=>e.getClientRects().length&&getComputedStyle(e).position!=='absolute');
   for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++)if(overlap(children[i].getBoundingClientRect(),children[j].getBoundingClientRect()))failures.push('overlapp i '+group.className);
  }
  for(const card of document.querySelectorAll('.picker-card')){const box=card.getBoundingClientRect();for(const e of card.querySelectorAll('h3,p,.picker-actions')){const r=e.getBoundingClientRect();if(r.left<box.left-1||r.right>box.right+1||r.bottom>box.bottom+1)failures.push('tekst utenfor velgerkort');}const title=card.querySelector('h3').getBoundingClientRect();if(title.width<box.width*.7)failures.push('sammenpresset tittel');}
  return [...new Set(failures)];
 },page.viewportSize().width);if(!baseline)assert.deepEqual(defects,[],label);results.push({label,defects});
}
try{
 for(const mode of (baseline?['light']:process.env.MOBILE_MODE?[process.env.MOBILE_MODE]:['light','dark','large','forced-dark'])){
  const browser=await chromium.launch({executablePath:process.env.EDGE_PATH,headless:true,args:mode==='forced-dark'?['--enable-features=WebContentsForceDark']:[]});
  try{for(const width of (baseline?[390]:mode==='light'?[320,360,390,412,768,1280]:mode==='forced-dark'?[390]:[320,390])){
   const context=await browser.newContext({viewport:{width,height:950},colorScheme:mode==='dark'?'dark':'light',hasTouch:width<768,isMobile:width<768});
   await context.addInitScript(w=>{if(!localStorage.getItem('seeded')){localStorage.setItem('handballtrenern.v3',JSON.stringify(w));localStorage.setItem('seeded','yes');}},fixture);
   const page=await context.newPage();page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'#/');await page.getByRole('button',{name:'Fortsett forrige trening'}).click();await page.goto(url+'#/');if(mode==='large')await page.addStyleTag({content:'html{font-size:200%!important}'});
   const headings={'ovelsesbank':'Øvelsesbank','detalj':'Håndballhinderløype – ball hele veien','diagrameditor':'Rediger illustrasjon','lag-okt':'Lag trening','teksteksport':'Del treningstekst','mine-treninger':'Mine treninger','mitt-lag':'Mitt lag','spillere':'Spillere','oppmote':'Lagdeling'};
   const shot=async name=>{await page.locator('.toast').waitFor({state:'hidden'});if(headings[name])await page.getByRole('heading',{name:headings[name],exact:true}).evaluate(e=>e.scrollIntoView({block:'start'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await inspect(page,mode+'-'+width+'-'+name);await page.screenshot({path:join(dir,prefix+'-'+mode+'-'+width+'-'+name+'.png')});};
   await shot('hjem');await page.goto(url+'#/ovelser');await page.getByLabel('Søk i øvelsesbanken').fill('ball');await shot('ovelsesbank');
   await page.goto(url+'#/ovelse/master-121');await shot('detalj');await page.getByRole('button',{name:'Rediger illustrasjon',exact:true}).click();await page.getByRole('heading',{name:'Rediger illustrasjon',exact:true}).scrollIntoViewIfNeeded();await shot('diagrameditor');
   await page.goto(url+'#/lag-trening');await shot('lag-okt');await page.getByRole('button',{name:'Legg til øvelse',exact:true}).click();await page.locator('.plan-picker').scrollIntoViewIfNeeded();await page.getByLabel('Søk etter øvelser').fill('håndballhinder');await shot('velger-langtekst');await page.locator('.plan-picker').screenshot({path:join(dir,prefix+'-picker-'+mode+'-'+width+'.png')});
   await page.getByLabel('Søk etter øvelser').fill('');await inspect(page,mode+'-'+width+'-velger-alle-kort');await page.locator('.picker').evaluate(e=>e.scrollTop=e.scrollHeight);await page.locator('.picker button').last().click();await page.getByRole('button',{name:'Lukk',exact:true}).click();assert.equal(await page.locator('.plan-picker').count(),0);
   await page.getByRole('button',{name:'Del / eksporter økt',exact:true}).click();await page.getByRole('heading',{name:'Del treningstekst'}).scrollIntoViewIfNeeded();await shot('teksteksport');
   await page.goto(url+'#/treninger');await shot('mine-treninger');await page.goto(url+'#/lag');await page.getByRole('heading',{name:'Mitt lag',exact:true}).scrollIntoViewIfNeeded();await shot('mitt-lag');await page.getByRole('heading',{name:'Spillere',exact:true}).scrollIntoViewIfNeeded();await shot('spillere');await page.getByRole('heading',{name:'Lagdeling',exact:true}).scrollIntoViewIfNeeded();await shot('oppmote');await page.getByRole('button',{name:'Lag jevne lag',exact:true}).click();await page.getByRole('heading',{name:/Lag 1 ·/}).scrollIntoViewIfNeeded();await shot('lagdeling');
   await page.locator('.sync-panel').first().locator('summary').click();await page.getByLabel('Supabase-prosjektadresse').scrollIntoViewIfNeeded();await shot('synkronisering');
   await page.goto(url+'#/trening/'+session.id);await page.getByRole('button',{name:'Start',exact:true}).scrollIntoViewIfNeeded();await shot('hall');await page.getByText('Plan B – tilpass treningen',{exact:true}).click();await page.getByLabel('Hva har endret seg?').selectOption('fewer');await page.getByLabel('Antall spillere nå').scrollIntoViewIfNeeded();await shot('plan-b');
   await context.close();console.log((baseline?'CAPTURE baseline ':'PASS layout ')+mode+' '+width);
  }}finally{await browser.close();}
 }
 assert.deepEqual(errors,[]);await (await import('node:fs/promises')).writeFile(join(dir,prefix+'-screen-checks.json'),JSON.stringify(results,null,2));
}finally{server.close();}
