import assert from 'node:assert/strict';
export async function testRosters(browser,url,setRoster,nextBuild){
 const roster={schemaVersion:1,revision:1,updatedAt:'2026-11-17T00:00:00Z',teams:[{id:'synthetic-a',name:'Syntetisk testlag A',players:Array.from({length:15},(_,i)=>({id:'synthetic-'+i,name:'Syntetisk spiller '+i}))}]};
 setRoster(roster);const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('handballtrenern.v3')));
  const revision=async n=>page.waitForFunction(n=>JSON.parse(localStorage.getItem('handballtrenern.v3'))?.rosterImport?.revision===n,n);
  const openStatus=async()=>{const panel=page.locator('.roster-import details');if(!await panel.evaluate(e=>e.open))await panel.locator('summary').click();};
  const fetch=async()=>{await openStatus();await page.getByRole('button',{name:'Hent spillerliste fra GitHub',exact:true}).click();};
  await page.goto(url+'#/lag');await revision(1);await page.evaluate(()=>navigator.serviceWorker.ready);assert.equal((await stored()).teams.find(t=>t.id==='github-synthetic-a').players.length,15);assert.equal(await page.getByLabel('Aktivt lag').inputValue(),'github-synthetic-a');
  await page.getByLabel('Nivå for Syntetisk spiller 0',{exact:true}).selectOption('2');
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Historisk syntetisk økt');await page.getByRole('button',{name:'Lagre trening',exact:true}).click();await page.goto(url+'#/lag');
  await page.getByLabel('Oppmøteliste').selectOption((await stored()).teams.find(t=>t.id==='github-synthetic-a').sessions[0].id);await page.getByRole('button',{name:'Velg alle',exact:true}).click();await page.getByRole('button',{name:'Lag jevne lag',exact:true}).click();await page.getByRole('button',{name:'Lagre til valgt trening'}).click();
  const before=(await stored()).teams.find(t=>t.id==='github-synthetic-a');assert.equal(before.sessions.length,1);assert.equal(before.sessions[0].attendees.length,15);assert.equal(before.sessions[0].allocation.flatMap(g=>g.players).length,15);
  roster.revision=2;roster.teams[0].players.push({id:'synthetic-15',name:'Syntetisk spiller 15'});roster.teams.push({id:'synthetic-b',name:'Syntetisk testlag B',players:[{id:'synthetic-b-1',name:'Syntetisk spiller B'}]});setRoster(roster);
  await fetch();await revision(2);await fetch();await page.getByRole('status').filter({hasText:'spillerfilen er uendret'}).waitFor();
  let w=await stored(),team=w.teams.find(t=>t.id==='github-synthetic-a');assert.equal(team.players.length,16);assert.equal(new Set(team.players.map(p=>p.id)).size,16);assert.equal(team.players[0].level,2);assert.deepEqual(team.sessions,before.sessions);assert.equal(w.teams.find(t=>t.id==='github-synthetic-b').players.length,1);
  await page.getByLabel('Aktivt lag').selectOption('github-synthetic-b');await page.getByLabel('Nivå for Syntetisk spiller B',{exact:true}).waitFor();assert.equal(await page.getByLabel('Nivå for Syntetisk spiller 0',{exact:true}).count(),0);await page.getByLabel('Aktivt lag').selectOption('github-synthetic-a');
  const valid=await stored();setRoster('{broken');await fetch();await page.locator('.roster-import [role=status]').filter({hasText:'Lokale data er beholdt'}).waitFor();assert.deepEqual(await stored(),valid);
  setRoster(roster);await context.setOffline(true);await page.reload();await page.getByLabel('Nivå for Syntetisk spiller 0',{exact:true}).waitFor();assert.deepEqual(await stored(),valid);await context.setOffline(false);
  // Foreground check sees mutable data through the controlling service worker.
  roster.revision=3;roster.teams[0].players[1].name='Syntetisk endret navn';setRoster(roster);await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await revision(3);await page.getByLabel('Nivå for Syntetisk endret navn',{exact:true}).waitFor();
  // Real worker installation/activation with both a new JS and CSS asset URL.
  await page.goto(url+'#/lag-trening');await page.getByLabel('Navn',{exact:true}).fill('Behold spillerne gjennom PWA-oppdatering');
  roster.revision=4;roster.teams[0].players.push({id:'synthetic-16',name:'Syntetisk spiller 16'});setRoster(roster);const build=nextBuild();await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await page.getByRole('button',{name:'Oppdater nå',exact:true}).click();await page.waitForFunction(n=>window.__TEST_BUILD===n,build);await revision(4);assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--test-css-build').trim()),String(build));
  team=(await stored()).teams.find(t=>t.id==='github-synthetic-a');assert.equal(team.players.length,17);assert.equal(team.players[0].level,2);assert.deepEqual(team.sessions,before.sessions);assert.equal(team.draft.name,'Behold spillerne gjennom PWA-oppdatering');
  await context.setOffline(true);await page.reload();assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--test-css-build').trim()),String(build));assert.equal((await stored()).teams.find(t=>t.id==='github-synthetic-a').players.length,17);await context.setOffline(false);
  await page.goto(url+'#/lag');await page.locator('.player-row input[value="Syntetisk spiller 0"]').fill('Lokalt syntetisk navn');roster.revision=5;roster.teams[0].players[0].name='Eksternt syntetisk navn';setRoster(roster);await fetch();await page.getByRole('heading',{name:'Avklar før import'}).waitFor();assert.equal((await stored()).rosterImport.revision,4);await page.getByRole('combobox',{name:/Navnekonflikt:/}).selectOption('local');await page.getByRole('button',{name:'Bruk avklarte valg'}).click();await revision(5);assert.equal((await stored()).teams.find(t=>t.id==='github-synthetic-a').players[0].name,'Lokalt syntetisk navn');assert.deepEqual(errors,[]);
  console.log('PASS GitHub-roster: 15→16, ID-er, nivå, historikk, flere lag, ugyldig JSON, offline, forgrunn, nye PWA/CSS-filer og 17 spillere');
 }finally{await context.close();setRoster(undefined);}
}
