'use client';
import { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, ChevronRight } from 'lucide-react';
import data from '../lib/manual-data.json';
import { Brand, CourseBadge } from './tracker';
import { coursePath, type Course } from '../lib/local-records';
import { manualSelection } from '../lib/course-routes';
import { StartHere } from './start-here';
import { StretchLesson } from './stretch-lessons';
function AbbreviationGuide(){
 return <details className="manual-prose">
  <summary>Acronyms &amp; Abbreviations</summary>
  <ul>
   <li><strong>AC</strong> = Acromioclavicular joint</li>
   <li><strong>ACL</strong> = Anterior cruciate ligament</li>
   <li><strong>ASIS</strong> = Anterior superior iliac spine</li>
   <li><strong>C-spine</strong> = Cervical spine (neck)</li>
   <li><strong>ER</strong> = External rotation</li>
   <li><strong>GH</strong> = Glenohumeral joint</li>
   <li><strong>IR</strong> = Internal rotation</li>
   <li><strong>IT band</strong> = Iliotibial band</li>
   <li><strong>L-spine</strong> = Lumbar spine (low back)</li>
   <li><strong>LS</strong> = Levator scapulae</li>
   <li><strong>OA</strong> = Osteoarthritis</li>
   <li><strong>PCL</strong> = Posterior cruciate ligament</li>
   <li><strong>PNF</strong> = Proprioceptive neuromuscular facilitation</li>
   <li><strong>PPT</strong> = Posterior pelvic tilt</li>
   <li><strong>QL</strong> = Quadratus lumborum</li>
   <li><strong>RC / RTC</strong> = Rotator cuff</li>
   <li><strong>SC</strong> = Sternoclavicular joint</li>
   <li><strong>SLR</strong> = Straight-leg raise</li>
   <li><strong>T-spine</strong> = Thoracic spine (mid back)</li>
   <li><strong>TKA</strong> = Total knee arthroplasty (knee replacement)</li>
   <li><strong>UT</strong> = Upper trapezius</li>
  </ul>
 </details>;
}

export default function Manual({ course }: { course: Course }) {
 const initial=manualSelection(course);
 const [chapter,setChapter]=useState('start'),[section,setSection]=useState(initial.section.id),[subject,setSubject]=useState('');
 useEffect(()=>{const selected=manualSelection(course,location.search);setChapter(!location.search||new URLSearchParams(location.search).get('chapter')==='start'?'start':selected.chapter.id);setSection(new URLSearchParams(location.search).get('chapter')==='start'?new URLSearchParams(location.search).get('section')??'':selected.section.id);setSubject(selected.subject);},[course]);
 const ch=data.chapters.find(c=>c.id===chapter)??data.chapters[0];
 function chooseChapter(id:string){if(id==='start'){setChapter(id);setSubject('');history.replaceState(null,'','/stretch/?chapter=start');return;}const c=data.chapters.find(c=>c.id===id);if(!c)return;setChapter(id);setSection(c.sections[0].id);setSubject('');history.replaceState(null,'','/stretch/?chapter='+id);}
 return <><a href="#manual-main" className="skip-link">Skip to manual section</a><div className="manual-shell"><header className="manual-top"><Brand course={course}/><a className="manual-competency-link" href={coursePath(course)}><ClipboardCheck size={26} aria-hidden="true"/><span><strong>Open competency tracker</strong><small>EXS{course} · Practice, instructor checks &amp; Canvas PDF</small></span></a></header><div className="manual-title"><div><p className="eyebrow">EXS{course} · TECHNIQUE MANUAL</p><h1>Stretch & Theragun technique manual</h1><p>Start here to prepare and practice. Use the linked competency tracker to record practice and the result your instructor gives you.</p></div><BookOpen size={62} strokeWidth={1} aria-hidden="true"/></div><div className="manual-layout"><aside className="manual-sidebar"><CourseBadge course={course}/><p className="sidebar-label">CONTENTS</p><nav aria-label="Manual chapters"><button aria-current={chapter==='start'?'page':undefined} onClick={()=>chooseChapter('start')}><span>01</span>Start Here<ChevronRight size={16}/></button>{data.chapters.map((c,i)=><button aria-current={chapter===c.id?'page':undefined} key={c.id} onClick={()=>chooseChapter(c.id)}><span>{String(i+2).padStart(2,'0')}</span>{c.title}<ChevronRight size={16}/></button>)}</nav><div className="manual-guidance"><a href="/stretch/?chapter=start">Shared preparation &amp; assessment guidance</a></div></aside><main id="manual-main" className="manual-content"><div className="manual-chapter-head"><p className="eyebrow">EXS{course} / STRETCH & THERAGUN</p><h2>{chapter==='start'?'Start Here':ch.title}</h2></div><AbbreviationGuide/>{chapter==='start'?<StartHere key={section} section={section}/>:<StretchLesson key={ch.id+section+subject} chapter={ch.id} initialSection={section} initialSubject={subject}/>}</main></div></div></>;
}
