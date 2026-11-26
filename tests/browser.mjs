import {quality321} from './browser-quality321.mjs';
import {workflow320} from './browser-workflow320.mjs';
import {testSync} from './browser-sync.mjs';
import {auditDiagrams} from './browser-diagrams.mjs';
import {runV3} from './browser-v3.mjs';
import {testRosters,testActualRoster} from './browser-rosters.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
let revision=0;
let rosterOverride;
const types={json:'application/json',html:'text/html',css:'text/css',js:'text/javascript',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 try{
  let file=path.startsWith('/handball/')?path.slice(10)||'index.html':'missing';
  const requested=/--test(\d+)\.(js|css)$/.exec(file);if(requested)file=file.replace(/--test\d+\.(js|css)$/,'.$1');
  let body=await readFile(join(process.cwd(),'dist',file));
  if(file==='rosters.json')body=Buffer.from(typeof rosterOverride==='string'?rosterOverride:JSON.stringify(rosterOverride??{schemaVersion:1,revision:1,updatedAt:'2026-11-18T00:00:00Z',teams:[]}));
  const newName=text=>text.replace(/(assets\/index-[\w-]+)\.(js|css)/g,'$1--test'+revision+'.$2');
  if(file==='sw.js'&&revision)body=Buffer.from(newName(body.toString().replace("const cacheName=prefix+","const cacheName=prefix+'update-"+revision+":'+")));
  if(file==='index.html'&&revision)body=Buffer.from(newName(body.toString()));
  if(/assets\/index-.*\.js$/.test(file))body=Buffer.from('window.__TEST_BUILD='+Number(requested?.[1]??0)+';\n'+body.toString());
  if(/assets\/index-.*\.css$/.test(file))body=Buffer.from(body.toString()+'\n:root{--test-css-build:'+Number(requested?.[1]??0)+'}');
  res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)]??'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/handball/';
const readStored=page=>page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('handballtrenern.v3'));return {...w.teams.find(t=>t.id===w.activeTeamId),...w.shared};});
let browser;
try{
 browser=await chromium.launch(process.env.EDGE_PATH?{executablePath:process.env.EDGE_PATH,headless:true}: {headless:true});
 for(const width of (process.env.WORKFLOW_ONLY||process.env.ROSTER_ONLY||process.env.V3_ONLY||process.env.AUDIT_ONLY||process.env.SYNC_ONLY?[]:[360,390,768,1280])){
  console.log('Starting '+width);
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',msg=>{if(msg.type()==='error')console.error(msg.text());});
  await page.goto(url);console.log('Loaded',width);await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker not ready')),15000))]));console.log('Offline ready',width);
  const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at '+width);
  await noOverflow();
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Testøkt '+width);await page.getByLabel('Forventet spillerantall').fill('15');await page.getByLabel('Antall trenere').fill('1');
  await page.getByRole('button',{name:'Legg til øvelse',exact:true}).click();
  await page.getByLabel('Søk etter øvelser').fill('spill og løp');await page.locator('.picker button').first().click();await page.locator('.picker button').first().click();await page.locator('.picker button').first().click();
  await page.getByRole('button',{name:'Lukk',exact:true}).click();await page.getByLabel('Minutter',{exact:true}).first().fill('13');await page.getByRole('button',{name:'Flytt ned',exact:true}).first().click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('handballtrenern.v3'))?.teams[0].draft.items.length===3);await noOverflow();
  await page.reload();await page.getByRole('button',{name:'Fortsett forrige trening'}).click();assert.equal(await page.getByLabel('Navn',{exact:true}).inputValue(),'Testøkt '+width);assert.equal(await page.getByLabel('Minutter',{exact:true}).nth(1).inputValue(),'13');
  await page.getByRole('button',{name:'Dupliser øvelse',exact:true}).first().click();await page.getByRole('button',{name:'Lagre trening',exact:true}).click();await page.getByRole('heading',{name:'Mine treninger'}).waitFor();
  let stored=await readStored(page);assert.equal(stored.sessions[0].items.length,4);assert.equal(stored.draft.items.length,0);
  await page.goto(url+'#/lag');
  for(let i=0;i<6;i++){await page.getByRole('textbox',{name:'Spillernavn',exact:true}).first().fill('Testspiller '+i);await page.locator('form select').first().selectOption(String([1,1,2,2,2,4][i]));await page.getByRole('button',{name:'Legg til spiller'}).click();}
  await page.getByLabel('Oppmøteliste').selectOption(stored.sessions[0].id);await page.getByRole('button',{name:'Velg alle',exact:true}).click();await page.getByRole('button',{name:'Lag jevne lag',exact:true}).click();await page.getByRole('button',{name:'Lagre til valgt trening'}).click();
  await page.getByRole('button',{name:'Arkiver',exact:true}).first().click();await page.getByLabel('Vis arkiverte spillere').check();await page.getByRole('button',{name:'Gjenaktiver',exact:true}).waitFor();
  stored=await readStored(page);assert.equal(stored.sessions[0].attendees.length,6);assert.equal(stored.sessions[0].allocation.flatMap(g=>g.players).length,6);
  await page.getByRole('button',{name:'Gjenaktiver',exact:true}).click();await noOverflow();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Eksporter',exact:true}).click();const download=await downloadPromise;const backup=await readFile(await download.path(),'utf8');assert.equal(JSON.parse(backup).teams[0].players.length,6);
  const importedContext=await browser.newContext();const importedPage=await importedContext.newPage();importedPage.on('dialog',d=>d.accept());await importedPage.goto(url+'#/lag');await importedPage.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});await importedPage.getByText('Sikkerhetskopien er importert.',{exact:true}).waitFor();const imported=await importedPage.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v3')));assert.deepEqual(imported,JSON.parse(backup));await importedContext.close();
  await page.goto(url+'#/treninger');await page.getByRole('button',{name:'Kopier til ny dato'}).click();await page.getByRole('button',{name:'Lagre trening',exact:true}).click();stored=await readStored(page);assert.equal(stored.sessions.length,2);assert.deepEqual(stored.sessions[1].attendees,[]);assert.equal(stored.sessions[1].allocation,undefined);
  await page.getByRole('link',{name:'Treningsvisning'}).first().click();await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'+2 min',exact:true}).click();await noOverflow();
  await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.getByRole('button',{name:'Pause',exact:true}).click();
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Fortsett',exact:true}).or(page.getByRole('button',{name:'Start',exact:true})).waitFor();await page.goto(url+'#/ovelser');await page.getByLabel('Søk i øvelsesbanken').fill('lillebror');await page.getByRole('heading',{name:/Lillebror/}).waitFor();await noOverflow();await context.setOffline(false);
  const other=await context.newPage();await other.goto(url+'#/lag');await other.getByText(/Appen er åpen for redigering/).waitFor();await other.getByRole('textbox',{name:'Spillernavn',exact:true}).first().fill('Skal ikke lagres');await other.getByRole('button',{name:'Legg til spiller'}).click();assert.equal((await readStored(other)).players.length,6);await other.close();
  await page.goto(url+'#/ovelse/master-26');await page.getByRole('button',{name:'Rediger illustrasjon',exact:true}).click();await page.getByLabel('Valgt element').selectOption({index:1});await page.getByRole('button',{name:'Dupliser element'}).click();await page.getByRole('button',{name:'Lagre illustrasjon'}).click();assert.ok((await readStored(page)).diagrams['master-26']);await noOverflow();
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Behold gjennom oppdatering');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('handballtrenern.v3'))?.teams[0].draft.name==='Behold gjennom oppdatering');revision++;await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});await page.getByRole('button',{name:'Oppdater nå',exact:true}).click();await page.getByRole('button',{name:'Fortsett forrige trening'}).click();assert.equal(await page.getByLabel('Navn',{exact:true}).inputValue(),'Behold gjennom oppdatering');assert.equal(await page.evaluate(()=>window.__TEST_BUILD),revision);assert.equal((await readStored(page)).players.length,6);await context.setOffline(true);await page.reload();assert.equal(await page.evaluate(()=>window.__TEST_BUILD),revision);await context.setOffline(false);
  const activeRun=(await readStored(page)).sessions.find(s=>s.runner&&!s.runner.endedAt);if(activeRun){await page.goto(url+'#/trening/'+activeRun.id);await page.getByRole('button',{name:'Avslutt trening',exact:true}).click();}
  await page.goto(url+'#/');revision++;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await page.waitForFunction(n=>window.__TEST_BUILD===n,revision);let reloads=0;page.on('framenavigated',()=>reloads++);await page.waitForTimeout(2200);assert.equal(reloads,0,'No reload loop');
  if(process.env.SCREENSHOT_DIR){await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:join(process.env.SCREENSHOT_DIR,'handball-30-'+width+'.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log('PASS '+width+'px: utkast, økt, lag, arkivering, kopi, backup, timer, offline, fanekonflikt, SVG');await context.close();
 }
 if(!process.env.WORKFLOW_ONLY&&!process.env.ROSTER_ONLY&&!process.env.AUDIT_ONLY&&!process.env.SYNC_ONLY)await runV3(browser,url);
 if(!process.env.WORKFLOW_ONLY&&!process.env.ROSTER_ONLY&&!process.env.V3_ONLY&&!process.env.SYNC_ONLY)await auditDiagrams(browser,url);
 if(!process.env.WORKFLOW_ONLY&&!process.env.ROSTER_ONLY&&!process.env.V3_ONLY&&!process.env.AUDIT_ONLY)await testSync(browser,url);
 if(!process.env.WORKFLOW_ONLY&&!process.env.V3_ONLY&&!process.env.AUDIT_ONLY&&!process.env.SYNC_ONLY){await testRosters(browser,url,value=>rosterOverride=value,()=>++revision);await testActualRoster(browser,url,value=>rosterOverride=value);}
 if(process.env.WORKFLOW_ONLY||(!process.env.ROSTER_ONLY&&!process.env.V3_ONLY&&!process.env.AUDIT_ONLY&&!process.env.SYNC_ONLY)){await workflow320(browser,url,()=>++revision);await quality321(browser,url);await quality321(browser,url,1280);}
}finally{await browser?.close();server.close();}
