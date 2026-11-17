import assert from 'node:assert/strict';
export async function testSync(browser,url){
 let remote=null;const user={id:'00000000-0000-4000-8000-000000000001',email:'synthetic@example.invalid',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
 const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'fake'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
 const contexts=[];
 async function device(name){
  const context=await browser.newContext({viewport:{width:390,height:844}});contexts.push(context);
  await context.route('https://sync-test.supabase.co/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let body,status=200;
   if(path==='/auth/v1/token')body={access_token:token,refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,user};
   else if(path==='/auth/v1/user')body=user;
   else if(path==='/auth/v1/logout')body={};
   else if(path==='/rest/v1/coach_workspaces'){assert.ok(req.headers().authorization?.startsWith('Bearer '));body=remote;}
   else if(path==='/rest/v1/rpc/save_coach_workspace'){
    const data=req.postDataJSON();if((remote?.revision??0)!==data.expected_revision){status=409;body={code:'40001',message:'Conflict'};}else{remote={revision:(remote?.revision??0)+1,payload:data.new_payload};body=[remote];}
   }else{status=404;body={message:'Unknown mocked route '+path};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body),headers:{'Access-Control-Allow-Origin':'*'}});
  });
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('dialog',d=>d.accept());await page.goto(url+'#/lag');
  await page.getByLabel('Lagnavn',{exact:true}).fill(name);
  await page.locator('.sync-panel').first().locator('summary').click();await page.getByLabel('Supabase-prosjektadresse').fill('https://sync-test.supabase.co');await page.getByLabel('Offentlig publishable / anon-nøkkel').fill('sb_publishable_synthetic');await page.getByRole('button',{name:'Koble til prosjekt'}).click();await page.getByLabel('E-post',{exact:true}).fill(user.email);await page.getByLabel('Passord',{exact:true}).fill('synthetic-test-password');await page.getByRole('button',{name:'Logg inn og synkroniser'}).click();return {context,page};
 }
 try{
  const a=await device('Synktest A');await a.page.getByText(/Synkronisering · Synkronisert/).waitFor();assert.equal(remote.payload.teams[0].name,'Synktest A');
  const b=await device('Synktest B');await b.page.getByRole('heading',{name:'Velg hvilken versjon som skal brukes'}).waitFor();await b.page.getByRole('button',{name:'Bruk skyversjon',exact:true}).click();await b.page.getByText(/Synkronisering · Synkronisert/).waitFor();assert.equal(await b.page.getByLabel('Lagnavn',{exact:true}).inputValue(),'Synktest A');
  await a.page.getByRole('textbox',{name:'Spillernavn',exact:true}).first().fill('Syntetisk delt spiller');await a.page.getByRole('button',{name:'Legg til spiller'}).click();await a.page.waitForTimeout(2000);await a.page.getByRole('button',{name:'Synkroniser nå',exact:true}).click();await a.page.getByText(/Synkronisering · Synkronisert/).waitFor();
  await b.page.getByRole('button',{name:'Synkroniser nå',exact:true}).click();await b.page.getByRole('textbox',{name:'Spillernavn',exact:true}).nth(1).waitFor();assert.equal(await b.page.getByRole('textbox',{name:'Spillernavn',exact:true}).nth(1).inputValue(),'Syntetisk delt spiller');
  await b.context.setOffline(true);await b.page.getByRole('textbox',{name:'Spillernavn',exact:true}).nth(1).fill('Mobil offline');await a.page.getByRole('textbox',{name:'Spillernavn',exact:true}).nth(1).fill('PC samtidig');await a.page.waitForTimeout(2000);await a.page.getByRole('button',{name:'Synkroniser nå',exact:true}).click();await a.page.getByText(/Synkronisering · Synkronisert/).waitFor();await b.context.setOffline(false);await b.page.getByRole('button',{name:'Synkroniser nå',exact:true}).click();await b.page.getByRole('heading',{name:'Velg hvilken versjon som skal brukes'}).waitFor();
  assert.equal(remote.payload.teams[0].players[0].name,'PC samtidig');assert.equal(await b.page.getByRole('textbox',{name:'Spillernavn',exact:true}).nth(1).inputValue(),'Mobil offline');
  console.log('PASS synkroniseringsklient mot simulert tjeneste: to enheter, innlogging, overføring, offline og konflikt uten overskriving (ikke en live RLS-test)');
 }finally{for(const context of contexts)await context.close();}
}
