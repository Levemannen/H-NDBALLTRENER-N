import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const {version}=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Appversjonen må være på formen major.minor.patch i package.json.');

export default defineConfig({
  define:{__APP_VERSION__:JSON.stringify(version)},
  base:'./',
  build:{rollupOptions:{output:{manualChunks(id){if(id.endsWith('/src/bank.json'))return 'exercise-bank';if(id.endsWith('/src/illustrations.json'))return 'illustrations';if(id.includes('@supabase/'))return 'sync';}}}},
  plugins:[{
    name:'handball-offline',
    apply:'build',
    generateBundle(_opts,bundle){
      this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({version})+'\n'});
      const assets=['./','index.html','manifest.webmanifest','club-icon.svg','valerenga-handball.png',...Object.keys(bundle).filter(f=>f!=='index.html')];
      const worker=readFileSync(new URL('./scripts/sw.js',import.meta.url),'utf8');
      const content=[
        worker,
        ...['index.html','public/manifest.webmanifest','public/club-icon.svg','public/valerenga-handball.png'].map(path=>readFileSync(new URL(path,import.meta.url))),
        ...Object.values(bundle).map(file=>file.type==='chunk'?file.code:file.source)
      ];
      const hash=createHash('sha256');
      for(const file of content)hash.update(file);
      this.emitFile({type:'asset',fileName:'sw.js',source:worker
        .replace('BUILD_ID',hash.digest('hex').slice(0,16))
        .replace('BUILD_FILES',JSON.stringify(assets))});
    }
  }]
});
