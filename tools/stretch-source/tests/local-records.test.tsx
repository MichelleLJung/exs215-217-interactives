import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import data from '../lib/manual-data.json';
import { SITE_COURSE } from '../lib/site-config';
import { resolveCourseRoute, manualSelection } from '../lib/course-routes';
import { addPractice, addObservation, emptyCourseRecord, courseBackup, restoreCourseBackup, courseRequirements, restoreCourseRequirements, summary, retiredTechniques, readCourseRecord, writeCourseRecord, courseStorageKey, today } from '../lib/local-records';
import Manual from '../app/manual';
import { Report } from '../app/tracker';
const course=SITE_COURSE as '215'|'217',other=course==='215'?'217':'215';
const active=data.catalog.filter(t=>!retiredTechniques.has(t.id));
const technique=active[0].id;
const storage=()=>{const map=new Map<string,string>();return {getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)},removeItem:(k:string)=>{map.delete(k)}}};

test('the site opens directly to its own manual and has one linked competency route',()=>{
 assert.deepEqual(resolveCourseRoute('/'),{kind:'manual',course,path:'/'});
 assert.deepEqual(resolveCourseRoute('/competency/'),{kind:'tracker',course,path:'/competency/'});
 assert.equal(resolveCourseRoute('/','?course='+other).course,course);
 assert.equal(resolveCourseRoute('/exs'+other+'/').kind,'unavailable');
 assert.equal(resolveCourseRoute('/exs'+other+'/manual/').kind,'unavailable');
 assert.equal(resolveCourseRoute('/unknown/').kind,'unavailable');
});
test('catalogue, chapters, equipment and manual navigation are scoped to this course',()=>{
 assert.ok(data.catalog.length>0&&data.chapters.length>0);
 assert.ok(data.catalog.every(t=>t.course===course));assert.ok(data.chapters.every(c=>c.course===course));
 assert.ok(data.equipment.every(k=>k.startsWith('Theragun')===(course==='217')));
 const html=renderToStaticMarkup(<Manual course={course}/>);
 assert.ok(html.includes('Open competency tracker'));assert.ok(html.includes('href="/competency/"'));
 assert.ok(!html.includes('Course selection'));assert.ok(!html.includes('EXS'+other));
 assert.equal(manualSelection(course,'?chapter=not-in-this-course').chapter.id,data.chapters[0].id);
 if(course==='215'){assert.equal(active.length,26);assert.equal(active.filter(t=>t.requiredDefault).length,26);assert.ok(!html.includes('Theragun'));}
});
test('course-specific practice backups preserve activity without granting competency',()=>{
 const r=addPractice(emptyCourseRecord(course),{course,date:today(),techniqueIds:[technique],mode:'partner',notes:'Practice station setup.'});
 const restored=restoreCourseBackup(courseBackup(r,course),course);
 assert.equal(restored.practices.length,1);assert.equal(summary(restored,course).acknowledged,0);
 const wrong=JSON.parse(courseBackup(r,course));wrong.course=other;assert.throws(()=>restoreCourseBackup(JSON.stringify(wrong),course));
 assert.equal(r.practices.length,1);
});
test('instructor results remain Met and Not met, with optional feedback and preserved history',()=>{
 const entry={course,date:today(),techniqueIds:[technique],rating:2,checkpoints:[false,false,false,false,false],feedback:''};
 let r=addObservation(emptyCourseRecord(course),entry);assert.equal(summary(r,course).skills.find(t=>t.id===technique)?.status,'Not met · student recorded');
 r=addObservation(r,{...entry,rating:3,checkpoints:[true,true,true,true,true]});
 assert.equal(summary(r,course).skills.find(t=>t.id===technique)?.status,'Met · student recorded');assert.equal(r.observations.length,2);
 assert.throws(()=>addObservation(r,{...entry,rating:3}));
});
test('requirements imports preserve existing practice and reject another course',()=>{
 const r=addPractice(emptyCourseRecord(course),{course,date:today(),techniqueIds:[technique],mode:'self',notes:''});
 if(course==='217')assert.throws(()=>restoreCourseRequirements(courseRequirements(r,course),r,course),/fixed/);else {const restored=restoreCourseRequirements(courseRequirements(r,course),r,course);assert.equal(restored.practices.length,1);}
 const file=JSON.parse(courseRequirements(r,course));file.course=other;assert.throws(()=>restoreCourseRequirements(JSON.stringify(file),r,course));
});
test('local saves survive reload, preserve another key, and block a stale tab',()=>{
 const s=storage();s.setItem(courseStorageKey(other),'untouched');
 const first=readCourseRecord(s,course);const saved=writeCourseRecord(s,{...first.record,firstName:'Lab'},first.raw,course);
 assert.equal(readCourseRecord(s,course).record.firstName,'Lab');assert.equal(s.getItem(courseStorageKey(other)),'untouched');
 assert.throws(()=>writeCourseRecord(s,first.record,first.raw,course));assert.ok(saved.saved);
});
test('the Canvas report stays course-specific and escapes student-entered text',()=>{
 const r={...emptyCourseRecord(course),firstName:'<script>bad</script>'};
 const html=renderToStaticMarkup(<Report record={r} course={course} generatedAt={r.updatedAt}/>);
 assert.ok(html.includes('EXS'+course));assert.ok(!html.includes('EXS'+other));assert.ok(!html.includes('<script>bad</script>'));
 assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));
});
test('packaged pages contain only this course and forbid application data transmission',async()=>{
 const entries=await readdir('dist');assert.ok(entries.includes('competency'));assert.ok(entries.includes('exs'+course+'-photos'));
 assert.ok(!entries.includes('exs'+other+'-photos'));assert.ok(!entries.includes('exs'+other));
 for(const file of ['dist/index.html','dist/competency/index.html']){
  const html=await readFile(file,'utf8');assert.ok(html.includes('EXS'+course));assert.ok(!html.includes('EXS'+other));assert.ok(html.includes("connect-src 'none'"));assert.ok(html.includes("form-action 'none'"));
 }
 const meta=JSON.parse(await readFile('.sites-runtime/local-build-meta.json','utf8'));
 const inputs=Object.keys(meta.inputs).join('\n');assert.ok(!inputs.includes('course-chooser'));
 assert.ok(!inputs.includes(course==='215'?'stretch-lessons.tsx':'recovery-lessons.tsx'));
 assert.ok(!inputs.includes('connectors.ts'));assert.ok(!inputs.includes('chatgpt-auth'));
});
test('every referenced course photo exists and has concise alternative text',async()=>{
 if(course==='215'){
  const source=await readFile('app/recovery-lessons.tsx','utf8');const matches=[...source.matchAll(/<Photo file="([^"]+)" alt="([^"]+)"/g)];assert.ok(matches.length>=25);
  for(const m of matches){await readFile('public/exs215-photos/'+m[1]);assert.ok(m[2].length<=120);}
  assert.ok(!source.includes('<Pending'));assert.ok(!source.includes('awaiting confirmation'));assert.ok(!source.includes('Add one photo'));
  assert.ok(source.includes('Triceps pad-location example.'));assert.ok(source.includes('Biceps pad-location example.'));assert.ok(source.includes('Lat wall-ball example.'));
 }else{
  const photos=JSON.parse(await readFile('lib/stretch-photos.json','utf8')) as Record<string,{src:string;alt:string}[]>;
  for(const list of Object.values(photos))for(const photo of list){await readFile('public'+photo.src);assert.ok(photo.alt.length<=120);}
 }
});

test('fixed assessment areas survive backup tampering and preserve earlier history without granting credit',()=>{
 const r=addPractice(emptyCourseRecord('217'),{course:'217',date:today(),techniqueIds:[technique],mode:'partner',notes:'Earlier technique practice'});
 const file=JSON.parse(courseBackup(r,'217'));file.record.settings['217']={requiredIds:[],equipmentKeys:[],rulesConfirmed:false};
 const restored=restoreCourseBackup(JSON.stringify(file),'217'),s=summary(restored,'217');
 assert.equal(s.required,16);assert.equal(s.acknowledged,0);assert.equal(s.complete,false);assert.equal(restored.practices.length,1);
 assert.ok(restored.settings['217'].requiredIds.includes('217-check-pnf'));assert.ok(restored.settings['217'].requiredIds.includes('217-check-adaptation'));
});
test('completion requires all areas including PNF, adaptation and devices, with reassessment revoking met',()=>{
 let r=emptyCourseRecord('217');const ids=r.settings['217'].requiredIds;
 for(const id of ids.filter(x=>x!=='217-check-pnf'))r=addObservation(r,{course:'217',date:today(),techniqueIds:[id],rating:3,checkpoints:[true,true,true,true,true],feedback:'Approved demonstration'});
 assert.equal(summary(r,'217').complete,false);
 r=addObservation(r,{course:'217',date:today(),techniqueIds:['217-check-pnf'],rating:3,checkpoints:[true,true,true,true,true],feedback:'Hamstrings hold-relax'});
 assert.equal(summary(r,'217').complete,true);
 r=addObservation(r,{course:'217',date:today(),techniqueIds:['217-check-pnf'],rating:2,checkpoints:[false,false,false,false,false],feedback:'Reassess support'});
 assert.equal(summary(r,'217').complete,false);
});
test('assessment links resolve the matching body area and Start Here has opening and warm-up guidance',async()=>{
 const areas=JSON.parse(await readFile('lib/assessment-areas.json','utf8')) as {id:string;chapter:string;section:string}[];
 for(const area of areas.filter(a=>a.chapter!=='start')){
  const selection=manualSelection('217','?chapter='+area.chapter+'&section='+area.section);
  assert.equal(selection.chapter.id,area.chapter);assert.equal(selection.section.id,area.section);
 }
 const html=renderToStaticMarkup(<Manual course="217"/>);
 assert.ok(html.includes('Warm-Up'));
 const source=await readFile('app/start-here.tsx','utf8');assert.ok(source.includes('I’ll be guiding you through assisted stretches today'));assert.ok(source.includes('use my hands to support and gently guide'));
});
test('PDF summary includes the demonstrated technique with its result, not only in history',()=>{
 const r=addObservation(emptyCourseRecord('217'),{course:'217',date:today(),techniqueIds:['217-check-hamstrings'],rating:3,checkpoints:[true,true,true,true,true],feedback:'Supine 90/90 hamstring; stable support and consent.'});
 const html=renderToStaticMarkup(<Report record={r} course="217" generatedAt={r.updatedAt}/>);
 const summaryTable=html.slice(html.indexOf('<table'),html.indexOf('</table>'));
 assert.ok(summaryTable.includes('Supine 90/90 hamstring'));assert.ok(summaryTable.includes('Met'));assert.ok(summaryTable.includes('PNF: one approved lower-body demonstration'));assert.ok(html.includes('private checklist is the authoritative sign-off'));
});
