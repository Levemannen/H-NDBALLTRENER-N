import {defineConfig} from 'vite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export default defineConfig({
  base:'./',
  build:{rollupOptions:{output:{manualChunks(id){if(id.endsWith('/src/bank.json'))return 'exercise-bank';}}}},
  plugins:[{
    name:'handball-offline',
    apply:'build',
    generateBundle(_opts,bundle){
      const assets=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png',...Object.keys(bundle).filter(f=>f!=='index.html')];
      const worker=readFileSync(new URL('./scripts/sw.js',import.meta.url),'utf8');
      const content=[
        worker,
        ...['index.html','public/manifest.webmanifest','public/icon.svg','public/icon-192.png','public/icon-512.png'].map(path=>readFileSync(new URL(path,import.meta.url))),
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
