import {readFileSync,readdirSync} from 'node:fs';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const {version}=JSON.parse(readFileSync(new URL('package.json',root),'utf8'));
const published=JSON.parse(readFileSync(new URL('dist/version.json',root),'utf8'));
assert.equal(published.version,version,'Byggets versjon må samsvare med package.json.');
const assets=new URL('dist/assets/',root);
const app=readdirSync(assets).filter(name=>/^index-.*\.js$/.test(name));
assert.ok(app.some(name=>readFileSync(new URL(name,assets),'utf8').includes(JSON.stringify(version))), 'Appens versjonsnummer mangler i produksjonsbygget.');
console.log(`Kontrollert appversjon: ${version} (lokalt bygg og GitHub Pages)`);
