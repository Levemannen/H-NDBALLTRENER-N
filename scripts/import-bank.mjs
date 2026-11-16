import { readFileSync, writeFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
const exercises = [];
const guides = [];
const categories = new Map();
const supplement = new Map([
  ['Fysisk / partnerbank', 'partner'], ['Core / kjernebank', 'kjerne'],
  ['Målvakttillegg', 'maalvakt'], ['Øvelser som må avklares før de blir hovedøvelser', 'avklares']
]);
let chapter, entry, section, overview;
const slug = value => value.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').replaceAll('å','a').normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'');
function block(label) {
  section = { label, lines: [] };
  entry.sections.push(section);
}
function start(title, properties, collection) {
  entry = { title, ...properties, sections: [] };
  collection.push(entry);
  section = undefined;
}
for (const {style, text} of rows) {
  if (!chapter && style !== 'Heading1') continue;
  if (style === 'Heading1') {
    chapter = text;
    const numbered = /^(\d+)\. (.+)$/.exec(text);
    if (numbered) {
      const number = Number(numbered[1]);
      start(numbered[2], {id: 'master-' + number, number, categories: categories.get(number) ?? [], skills: []}, exercises);
    } else start(text, {id: slug(text)}, guides);
    continue;
  }
  if (chapter === 'Oversikt etter kategori') {
    if (style === 'Heading2') overview = text;
    else for (const m of text.matchAll(/(?:^| · )(\d+)\. /g)) categories.set(Number(m[1]), overview.split(' / ').map(s => s[0] + s.slice(1).toLowerCase()));
  }
  if (style === 'Heading2' && supplement.has(chapter) && !text.endsWith('– fortsettelse')) {
    start(text, {id: supplement.get(chapter) + '-' + slug(text), bank: chapter, categories:[chapter], skills:[], ...(supplement.get(chapter) === 'avklares' ? {unresolved:true} : {})}, exercises);
  } else if (style === 'Heading2' && supplement.has(chapter)) {
    continue;
  } else if (style === 'Heading2' || style === 'FieldLabel') {
    block(text);
  } else if (style === 'Meta' && entry.number) {
    entry.meta = text;
    const m = /([\d]+)–([\d]+) (?:spillere|keepere) · ([\d]+)–([\d]+) min · (.+)/.exec(text);
    if (m) {
      entry.players = [Number(m[1]), Number(m[2])];
      entry.minutes = [Number(m[3]), Number(m[4])];
      entry.halls = [...m[5].matchAll(/liten|halv|stor|gymsal/g)].map(x => x[0]);
    }
  } else {
    if (text.startsWith('Fokus: ') && entry.bank) {
      block('Trenerens fokus');
      section.lines.push(text.slice(7));
    } else {
      if (!section) block(entry.bank ? 'Kort forklart' : '');
      section.lines.push(text);
    }
  }
}
for (const e of exercises) {
  const skillText = e.sections.find(s => s.label === 'Hva trener vi?')?.lines.join(' ') ?? '';
  e.skills = [...new Set(skillText.toLowerCase().replace(/\.$/, '').split(/, | og /).map(s => s.trim()).filter(Boolean))];
}
if (exercises.filter(e => e.number).some((e,i)=>e.number !== i+1) || exercises.filter(e => e.number).length !== 122 || new Set(exercises.map(e => e.id)).size !== exercises.length) throw new Error('Ugyldig øvelsesimport');
writeFileSync(new URL('../src/bank.json',import.meta.url), JSON.stringify({exercises,guides},null,2)+'\n');
console.log(exercises.length, 'oppføringer, inkludert 122 hovedøvelser');
