'use client';
import { useId, useState } from 'react';
import data from '../lib/manual-data.json';
import photoData from '../lib/stretch-photos.json';
import instructions from '../lib/stretch-instructions.json';
import options217 from '../lib/exs217-options.json';
import { retiredTechniques } from '../lib/local-records';
import { Tabs } from './lesson-tabs';
import { PersonalHygieneGuidelines } from './personal-hygiene';

type Question = {prompt:string;options:string[];answer:number;why:string};
const questions:Record<string,Question[]>={
 lower:[
  {prompt:'In the figure-four setup, the participant asks you to pause before you move the supporting leg. What should you do?',options:['Complete the movement slowly, then pause.','Pause immediately and ask what they need before continuing.','Ask them to hold their breath while you reposition.'],answer:1,why:'The participant can pause or stop at any point. Ask before continuing or changing the position.'},
  {prompt:'You can see the foot support in the calf photo, but you are unsure how to position the rest of the participant. What is your next step?',options:['Copy only what the photo shows.','Choose whichever knee position produces more stretch.','Ask the instructor to demonstrate the complete setup before you practice.'],answer:2,why:'The calf views accompany the full lab demonstration. A close-up does not establish every support or positioning step.'},
  {prompt:'You practiced a hamstring stretch successfully with a partner. Which result belongs in the instructor-check record?',options:['The Met or Not met result your instructor gives after observing you.','Met, because your partner was comfortable.','Met, because you answered these questions correctly.'],answer:0,why:'Practice and these ungraded questions prepare you for demonstration. The instructor determines the competency result.'}
 ],
 upper:[
  {prompt:'You are selecting a shoulder-rotation example, but the photo does not clearly establish the angle or rotation direction. What should guide your setup?',options:['The closest-looking picture from another stretch.','The approved class demonstration for that specific variation.','The position that lets you move the forearm farthest.'],answer:1,why:'Different shoulder-rotation variations need the correct demonstrated setup. Do not infer the angle or direction from an unclear still photo.'},
  {prompt:'A participant agrees to an overhead triceps stretch. You decide to change to a wrist stretch. What comes before the new contact?',options:['Explain the wrist application and ask for agreement.','Begin, because both applications involve the arm.','Place the hand first and explain while stretching.'],answer:0,why:'Explain the new application and contact area and ask for agreement before beginning.'},
  {prompt:'During wrist practice the participant reports tingling in the hand. What should you do?',options:['Complete the planned hold at a smaller range.','Try the opposite wrist variation immediately.','Stop and notify the instructor before continuing.'],answer:2,why:'Tingling or altered sensation is a stop-and-ask signal, rather than a cue to keep testing positions.'}
 ],
 torso:[
  {prompt:'Before a cervical application, you are unsure where to support the participant’s head. What is the best next step?',options:['Use the nearest shoulder photo as a guide.','Ask the instructor to demonstrate the exact head support before contact.','Ask the participant to support their own head while you move it.'],answer:1,why:'Neck applications require the exact approved demonstration and support. Do not improvise from a different example.'},
  {prompt:'A participant reports dizziness during a neck stretch. What happens next?',options:['Finish the current hold before changing position.','Try the other side to compare the response.','Stop the application and involve the instructor.'],answer:2,why:'Dizziness is a stop signal. The instructor determines the next step; the student does not independently clear the participant to continue.'},
  {prompt:'Your partner says an open-book position feels comfortable. Does that confirm your competency?',options:['No. Demonstrate the technique to the instructor and record their Met or Not met result.','Yes, if you also practiced the other side.','Yes, if you checked every item yourself.'],answer:0,why:'Partner comfort matters during practice, but the instructor makes the competency decision.'}
 ],
 percussion:[
  {prompt:'You need to change the Theragun attachment. Which step comes first?',options:['Power off the device before changing the attachment.','Lower the speed while leaving it running.','Remove the attachment, then turn the device off.'],answer:0,why:'Power off before changing attachments, then check that the approved attachment is secure before use.'},
  {prompt:'The Pro Plus has an attachment you have not used in class. How should you proceed?',options:['Try it briefly at the lowest setting.','Use it if the participant has tried it before.','Wait for the instructor to approve and demonstrate that device mode.'],answer:2,why:'An available attachment is not automatically an approved application or a required competency.'},
  {prompt:'After an approved Theragun application, what should happen before the next participant?',options:['Return the device to its charger only.','Power off and complete the approved equipment cleaning and station reset.','Leave the device running while cleaning the contact surface.'],answer:1,why:'Finish the application, power off, and follow the approved device-compatible cleaning procedure before the next user.'}
 ]
};
function KnowledgeCheck({question,index}:{question:Question;index:number}){
 const uid=useId(),[choice,setChoice]=useState<number|null>(null),[checked,setChecked]=useState(false);
 return <div className="stretch-question"><fieldset className="lesson-question"><legend>{index+1}. {question.prompt}</legend>{question.options.map((option,i)=><label key={option}><input type="radio" name={uid} checked={choice===i} onChange={()=>{setChoice(i);setChecked(false)}}/>{option}</label>)}</fieldset><button disabled={choice===null} onClick={()=>setChecked(true)}>Check answer</button><p className="lesson-feedback" role="status" aria-live="polite">{checked?`${choice===question.answer?'Correct.':'Review and try again.'} ${question.why}`:''}</p></div>;
}
export function StretchLesson({chapter,initialSection='',initialSubject=''}:{chapter:string;initialSection?:string;initialSubject?:string}){
 const ch=data.chapters.find(c=>c.id===chapter&&c.course==='217')!;
 const catalog=data.catalog.filter(t=>t.course==='217'&&t.chapter===chapter&&!t.id.startsWith('217-check-')&&!retiredTechniques.has(t.id));
 const practiceSections=ch.sections.filter(s=>catalog.some(t=>!t.section||t.section===s.id));
 const [area,setArea]=useState(practiceSections.some(s=>s.id===initialSection)?initialSection:practiceSections[0]?.id??ch.sections[0].id);
 const [subject,setSubject]=useState(initialSubject);
 const section=practiceSections.find(s=>s.id===area)??practiceSections[0];
 const subjects=catalog.filter(t=>!t.section||t.section===section?.id);
 const selected=subjects.find(t=>t.id===subject)??subjects[0];
 const photos=photoData[selected?.id as keyof typeof photoData];
 const isDevice=chapter==='percussion';
 const descriptionOnly=options217.descriptionOnly.includes(selected?.id??'');
 const practice=<section className="lesson-block"><h2>{isDevice?'Device practice':'Position and practice'}</h2>{isDevice&&<><div className="manual-prose" dangerouslySetInnerHTML={{__html:ch.sections.find(s=>s.id==='safety')!.html}}/><p>Power off before changing attachments and before cleaning. Use device-compatible products, keep liquids out of controls and connections, and reset before the next participant.</p></>}{chapter==='lower'&&<details className="manual-prose">
  <summary>Acronyms &amp; Abbreviations</summary>
  <ul>
    <li><strong>ASIS</strong> = Anterior superior iliac spine</li>
    <li><strong>PPT</strong> = Posterior pelvic tilt</li>
    <li><strong>PNF</strong> = Proprioceptive neuromuscular facilitation</li>
    <li><strong>IR</strong> = Internal rotation</li>
    <li><strong>ER</strong> = External rotation</li>
    <li><strong>IT band</strong> = Iliotibial band</li>
    <li><strong>OA</strong> = Osteoarthritis</li>
    <li><strong>ACL</strong> = Anterior cruciate ligament</li>
    <li><strong>PCL</strong> = Posterior cruciate ligament</li>
    <li><strong>TKA</strong> = Total knee arthroplasty (knee replacement)</li>
    <li><strong>SLR</strong> = Straight-leg raise</li>
  </ul>
 </details>}{practiceSections.length>1&&<label>Practice area<select value={area} onChange={e=>{setArea(e.target.value);setSubject('')}}>{practiceSections.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></label>}<h3>{section?.title}</h3>{subjects.length>0&&<label>{isDevice?'Device':'Technique'}<select value={selected?.id??''} onChange={e=>setSubject(e.target.value)}>{subjects.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select></label>}<div className="manual-prose" dangerouslySetInnerHTML={{__html:isDevice?section?.html??'':instructions[selected?.id as keyof typeof instructions]?.html??''}}/>{photos?<div className="stretch-photo-grid">{photos.map(photo=><figure className="lesson-image" key={photo.src}><a href={photo.src} target="_blank" rel="noreferrer" aria-label={'Open full-size photo: '+photo.alt}><img src={photo.src} alt={photo.alt} loading="lazy"/></a><figcaption>{photo.alt}</figcaption></figure>)}</div>:descriptionOnly?null:<div className="lesson-photo"><strong>Photo under review</strong><span>{selected?.name}. Follow the approved instructor demonstration; a labeled example will be added after identification.</span></div>}{photos&&<p className="small muted">Photos support the class demonstration. They may show a detail or variation rather than every setup step. Ask before using an unfamiliar variation.</p>}</section>;
 const check=<section className="lesson-block"><p className="eyebrow">CHECK YOURSELF · UNGRADED</p><h2>Apply what you learned</h2>{questions[chapter].map((question,index)=><KnowledgeCheck question={question} index={index} key={question.prompt}/>)}<p>Practice in lab, then demonstrate to the instructor for a Met or Not met result.</p><a className="lesson-tracker" href="/competency/">Go to the EXS217 tracker</a></section>;
 const [full,setFull]=useState(false);
 return <div className="guided-lesson"><div className="reference-note"><p>Read the shared preparation and assessment guidance in Start Here. These instructions and photos support the approved lab demonstrations.</p><a href="/stretch/?chapter=start">Start Here: preparation, PNF &amp; assessment</a></div><div className="lesson-view-control"><button className="secondary" aria-pressed={full} onClick={()=>setFull(!full)}>{full?'Return to tabs':'View all lesson sections'}</button></div><Tabs full={full} previousNext initialActive={0} label={ch.title+' lesson sections'} items={[{label:isDevice?'Devices & Application':'Techniques & Photos',content:practice},{label:'Check Yourself',content:check}]}/></div>;
}
