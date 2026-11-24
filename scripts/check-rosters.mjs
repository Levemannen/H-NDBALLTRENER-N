import {readFile} from 'node:fs/promises';
import {parseRoster} from '../src/rosters.ts';
const roster=parseRoster(await readFile(new URL('../public/rosters.json',import.meta.url),'utf8'));
console.log('Kontrollert offentlig spillerfil: revisjon '+roster.revision+', '+roster.teams.length+' lag');
