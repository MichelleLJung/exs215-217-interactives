import { createRoot } from 'react-dom/client';
import Tracker from './tracker';
import Manual from './manual';
import { resolveCourseRoute } from '../lib/course-routes';
const root=document.getElementById('root');
if(!root)throw new Error('The page root is missing.');
const route=resolveCourseRoute(location.pathname,location.search);
if(route.kind!=='unavailable'&&location.pathname!==route.path)history.replaceState(null,'',route.path+location.search);
createRoot(root).render(route.kind==='unavailable'?<main className="course-home-main"><h1>Page unavailable</h1><p>This page is not part of this course site.</p><a href="/stretch/">Open the technique manual</a></main>:route.kind==='manual'?<Manual course={route.course}/>:<Tracker course={route.course}/>);
