import data from './manual-data.json';
import { type Course } from './local-records';
import { SITE_COURSE } from './site-config';
export function resolveCourseRoute(pathname:string,_search=''):{kind:'manual'|'tracker'|'unavailable';course:Course;path:string}{
 const path=(pathname.startsWith('/stretch/')?pathname.slice(8):pathname).replace(/\/+$/,'')||'/';
 if(path==='/'||path==='/manual'||path==='/exs'+SITE_COURSE+'/manual')return {kind:'manual',course:SITE_COURSE,path:'/stretch/'};
 if(path==='/competency'||path==='/exs'+SITE_COURSE)return {kind:'tracker',course:SITE_COURSE,path:'/stretch/competency/'};
 return {kind:'unavailable',course:SITE_COURSE,path:pathname};
}
export function manualSelection(course: Course, search = '') {
  const q = new URLSearchParams(search), chapters = data.chapters.filter(c => c.course === course), chapter = chapters.find(c => c.id === q.get('chapter')) ?? chapters[0];
  const section = chapter.sections.find(s => s.id === q.get('section')) ?? chapter.sections[0];
  const subject = data.catalog.find(t => t.id === q.get('technique') && t.course === course && t.chapter === chapter.id && (!t.section || t.section === section.id))?.id ?? '';
  return { chapter, section, subject };
}
