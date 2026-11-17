import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
let revision=0;
const types={html:'text/html',css:'text/css',js:'text/javascript',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};
const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;try{const file=path.startsWith('/handball/')?path.slice(10)||'index.html':'missing';let body=await readFile(join(process.cwd(),'dist',file));if(file==='sw.js'&&revision)body=Buffer.from(body.toString().replace("const cacheName=prefix+","const cacheName=prefix+'update-"+revision+":'+"));res.writeHead(200,{'Content-Type':types[file.split('.').at(-1)]});res.end(body);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/handball/';
let browser;
try{
 browser=await chromium.launch(process.env.EDGE_PATH?{executablePath:process.env.EDGE_PATH,headless:true}: {headless:true});
 for(const width of [360,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.evaluate(()=>navigator.serviceWorker.ready);
  const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow at '+width);
  await noOverflow();
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Testøkt '+width);await page.getByLabel('Forventet spillerantall').fill('15');await page.getByLabel('Antall trenere').fill('1');
  await page.getByRole('button',{name:'Legg til øvelse',exact:true}).click();
  await page.getByLabel('Søk etter øvelser').fill('spill og løp');await page.locator('.picker button').first().click();await page.locator('.picker button').first().click();await page.locator('.picker button').first().click();
  await page.getByRole('button',{name:'Lukk',exact:true}).click();await page.getByLabel('Minutter',{exact:true}).first().fill('13');await page.getByRole('button',{name:'Flytt ned',exact:true}).first().click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('handballtrenern.draft.v1'))?.session.items.length===3);await noOverflow();
  await page.reload();await page.getByRole('button',{name:'Fortsett forrige trening'}).click();assert.equal(await page.getByLabel('Navn',{exact:true}).inputValue(),'Testøkt '+width);assert.equal(await page.getByLabel('Minutter',{exact:true}).nth(1).inputValue(),'13');
  await page.getByRole('button',{name:'Dupliser øvelse',exact:true}).first().click();await page.getByRole('button',{name:'Lagre trening',exact:true}).click();await page.getByRole('heading',{name:'Mine treninger'}).waitFor();
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')));assert.equal(stored.sessions[0].items.length,4);assert.equal(await page.evaluate(()=>localStorage.getItem('handballtrenern.draft.v1')),null);
  await page.goto(url+'#/lag');
  for(let i=0;i<6;i++){await page.getByRole('textbox',{name:'Spillernavn',exact:true}).first().fill('Testspiller '+i);await page.locator('form select').first().selectOption(String([1,1,2,2,2,4][i]));await page.getByRole('button',{name:'Legg til spiller'}).click();}
  await page.getByLabel('Oppmøteliste').selectOption(stored.sessions[0].id);await page.getByRole('button',{name:'Velg alle',exact:true}).click();await page.getByRole('button',{name:'Lag jevne lag',exact:true}).click();await page.getByRole('button',{name:'Lagre til valgt trening'}).click();
  await page.getByRole('button',{name:'Arkiver',exact:true}).first().click();await page.getByLabel('Vis arkiverte spillere').check();await page.getByRole('button',{name:'Gjenaktiver',exact:true}).waitFor();
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')));assert.equal(stored.sessions[0].attendees.length,6);assert.equal(stored.sessions[0].allocation.flatMap(g=>g.players).length,6);
  await page.getByRole('button',{name:'Gjenaktiver',exact:true}).click();await noOverflow();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Eksporter',exact:true}).click();const download=await downloadPromise;const backup=await readFile(await download.path(),'utf8');assert.equal(JSON.parse(backup).players.length,6);
  const importedContext=await browser.newContext();const importedPage=await importedContext.newPage();importedPage.on('dialog',d=>d.accept());await importedPage.goto(url+'#/lag');await importedPage.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});await importedPage.getByText('Sikkerhetskopien er importert.',{exact:true}).waitFor();const imported=await importedPage.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')));const {draft:exportedDraft,...expectedData}=JSON.parse(backup);assert.deepEqual(imported,expectedData);await importedContext.close();
  await page.goto(url+'#/treninger');await page.getByRole('button',{name:'Kopier til ny dato'}).click();await page.getByRole('button',{name:'Lagre trening',exact:true}).click();stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')));assert.equal(stored.sessions.length,2);assert.deepEqual(stored.sessions[1].attendees,[]);assert.equal(stored.sessions[1].allocation,undefined);
  await page.getByRole('link',{name:'Treningsvisning'}).first().click();await page.getByRole('button',{name:'Start',exact:true}).click();await page.getByRole('button',{name:'+2 min',exact:true}).click();await noOverflow();
  await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.getByRole('button',{name:'Pause',exact:true}).click();
  await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Fortsett',exact:true}).or(page.getByRole('button',{name:'Start',exact:true})).waitFor();await page.goto(url+'#/ovelser');await page.getByLabel('Søk i øvelsesbanken').fill('lillebror');await page.getByRole('heading',{name:/Lillebror/}).waitFor();await noOverflow();await context.setOffline(false);
  const other=await context.newPage();await other.goto(url+'#/lag');await other.getByText(/Appen er åpen for redigering/).waitFor();await other.getByRole('textbox',{name:'Spillernavn',exact:true}).first().fill('Skal ikke lagres');await other.getByRole('button',{name:'Legg til spiller'}).click();assert.equal(await other.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')).players.length),6);await other.close();
  await page.goto(url+'#/ovelse/master-26');await page.getByRole('button',{name:'Rediger illustrasjon',exact:true}).click();await page.getByLabel('Valgt element').selectOption({index:1});await page.getByRole('button',{name:'Dupliser element'}).click();await page.getByRole('button',{name:'Lagre illustrasjon'}).click();assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v1')).diagrams['master-26']));await noOverflow();
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Behold gjennom oppdatering');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('handballtrenern.draft.v1'))?.session.name==='Behold gjennom oppdatering');revision++;await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});await page.getByRole('button',{name:'Oppdater appen',exact:true}).click();await page.getByRole('button',{name:'Fortsett forrige trening'}).click();assert.equal(await page.getByLabel('Navn',{exact:true}).inputValue(),'Behold gjennom oppdatering');
  if(process.env.SCREENSHOT_DIR){await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:join(process.env.SCREENSHOT_DIR,'handball-21-'+width+'.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log('PASS '+width+'px: utkast, økt, lag, arkivering, kopi, backup, timer, offline, fanekonflikt, SVG');await context.close();
 }
}finally{await browser?.close();server.close();}
