import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),wrangler=require.resolve('wrangler/package.json');
const {build}=require(require.resolve('esbuild',{paths:[wrangler]}));
await mkdir('.sites-runtime/tests',{recursive:true});
await build({entryPoints:['tests/local-records.test.tsx'],bundle:true,platform:'node',format:'esm',target:'node22',jsx:'automatic',outfile:'.sites-runtime/tests/local-records.test.mjs',packages:'external'});
const test=spawnSync(process.execPath,['--test','.sites-runtime/tests/local-records.test.mjs'],{stdio:'inherit'});process.exit(test.status??1);
