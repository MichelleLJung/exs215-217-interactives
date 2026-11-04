import {build} from 'esbuild';
await build({entryPoints:['app/main.tsx'],bundle:true,platform:'browser',format:'esm',target:'es2022',jsx:'automatic',minify:true,outfile:'../../stretch/assets/app.js',define:{'process.env.NODE_ENV':'\"production\"'}});
