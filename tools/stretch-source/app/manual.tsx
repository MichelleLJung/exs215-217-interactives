'use client';
import { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, ChevronRight } from 'lucide-react';
import data from '../lib/manual-data.json';
import { Brand, CourseBadge } from './tracker';
import { coursePath, type Course } from '../lib/local-records';
import { manualSelection } from '../lib/course-routes';
import { StartHere } from './start-here';
import { StretchLesson } from './stretch-lessons';
export default function Manual({ course }: { course: Course }) {
 const initial=manualSelection(course);
 const [chapter,setChapter]=useState('start'),[section,setSection]=useState(initial.section.id),[subject,setSubject]=useState('');
 useEffect(()=>{const selected=manualSelection(course,location.search);setChapter(!location.search||new URLSearchParams(location.search).get('chapter')==='start'?'start':selected.chapter.id);setSection(new URLSearchParams(location.search).get('chapter')==='start'?new URLSearchParams(location.search).get('section')??'':selected.section.id);setSubject(selected.subject);},[course]);
 const ch=data.chapters.find(c=>c.id===chapter)??data.chapters[0];
 function chooseChapter(id:string){if(id==='start'){setChapter(id);setSubject('');history.replaceState(null,'','/stretch/?chapter=start');return;}const c=data.chapters.find(c=>c.id===id);if(!c)return;setChapter(id);setSection(c.sections[0].id);setSubject('');history.replaceState(null,'','/stretch/?chapter='+id);}
 return <><a href="#manual-main" className="skip-link">Skip to manual section</a><div className="manual-shell"><header className="manual-top"><Brand course={course}/><a className="manual-competency-link" href={coursePath(course)}><ClipboardCheck size={26} aria-hidden="true"/><span><strong>Open competency tracker</strong><small>EXS{course} · Practice, instructor checks &amp; Canvas PDF</small></span></a></header><div className="manual-title"><div><p className="eyebrow">EXS{course} · TECHNIQUE MANUAL</p><h1>Stretch & Theragun technique manual</h1><p>Start here to prepare and practice. Use the linked competency tracker to record practice and the result your instructor gives you.</p></div><BookOpen size={62} strokeWidth={1} aria-hidden="true"/></div><div className="manual-layout"><aside className="manual-sidebar"><CourseBadge course={course}/><p className="sidebar-label">CONTENTS</p><nav aria-label="Manual chapters"><button aria-current={chapter==='start'?'page':undefined} onClick={()=>chooseChapter('start')}><span>01</span>Start Here<ChevronRight size={16}/></button>{data.chapters.map((c,i)=><button aria-current={chapter===c.id?'page':undefined} key={c.id} onClick={()=>chooseChapter(c.id)}><span>{String(i+2).padStart(2,'0')}</span>{c.title}<ChevronRight size={16}/></button>)}</nav><div className="manual-guidance"><a href="/stretch/?chapter=start">Shared preparation &amp; assessment guidance</a></div></aside><main id="manual-main" className="manual-content"><div className="manual-chapter-head"><p className="eyebrow">EXS{course} / STRETCH & THERAGUN</p><h2>{chapter==='start'?'Start Here':ch.title}</h2></div>{chapter==='start'?<StartHere key={section} section={section}/>:<StretchLesson key={ch.id+section+subject} chapter={ch.id} initialSection={section} initialSubject={subject}/>}</main></div></div></>;
}
