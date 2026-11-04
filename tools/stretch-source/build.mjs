import {build} from 'esbuild';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const result=await build({entryPoints:['app/main.tsx'],bundle:true,platform:'browser',format:'esm',target:'es2022',jsx:'automatic',minify:true,outfile:'../../stretch/assets/app.js',define:{'process.env.NODE_ENV':JSON.stringify('production')},metafile:true});
await copyFile('app/globals.css','../../stretch/assets/app.css');
await mkdir('.sites-runtime',{recursive:true});
await writeFile('.sites-runtime/local-build-meta.json',JSON.stringify(result.metafile));
