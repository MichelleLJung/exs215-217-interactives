'use client';
import { Children, createContext, isValidElement, useContext, useId, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
const FullChapter = createContext(false);
const labels: Record<string,string> = {
 'compression-intro':'Overview','compression-prepare':'Before You Begin','compression-equipment':'Equipment & Setup','compression-session':'Session & Cleanup','compression-check':'Check Yourself',
 role:'Your Role',hygiene:'Hygiene',consent:'Professionalism & Consent',overview:'Overview',prepare:'Before You Begin',areas:'Practice Areas',devices:'Devices & Placement',finish:'Finish & Clean','stick-ball':'Stick & Balls',powered:'Roller & Wrap','check-yourself':'Check Yourself'
};
export function Tabs({items,label,full=false,previousNext=false,initialActive=0}:{items:{label:string;content:ReactNode}[];label:string;full?:boolean;previousNext?:boolean;initialActive?:number}) {
 const [active,setActive]=useState(initialActive); const uid=useId(); const refs=useRef<(HTMLButtonElement|null)[]>([]);
 function move(index:number,focus=true){setActive(index);if(focus)refs.current[index]?.focus();}
 function keys(e:KeyboardEvent<HTMLButtonElement>,index:number){let next=index;if(e.key==='ArrowRight')next=(index+1)%items.length;else if(e.key==='ArrowLeft')next=(index+items.length-1)%items.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();move(next);}
 return <div className="lesson-tab-set">{!full&&<div role="tablist" aria-label={label} className="lesson-tablist">{items.map((item,i)=><button key={i} ref={el=>{refs.current[i]=el}} id={uid+'-tab-'+i} type="button" role="tab" aria-selected={i===active} aria-controls={uid+'-panel-'+i} tabIndex={i===active?0:-1} onClick={()=>move(i,false)} onKeyDown={e=>keys(e,i)}>{item.label}</button>)}</div>}{items.map((item,i)=><div key={i} id={uid+'-panel-'+i} role={full?undefined:'tabpanel'} aria-labelledby={full?undefined:uid+'-tab-'+i} hidden={!full&&active!==i} tabIndex={full?undefined:0} className="lesson-tab-panel">{item.content}</div>)}{!full&&previousNext&&<div className="lesson-pagination"><button type="button" className="secondary" disabled={active===0} onClick={()=>move(active-1)}>Previous</button><span>{active+1} of {items.length}</span><button type="button" className="secondary" disabled={active===items.length-1} onClick={()=>move(active+1)}>Next</button></div>}</div>;
}
export function LessonTabs({children}:{children:ReactNode}) {
 const [full,setFull]=useState(false);const nodes=Children.toArray(children);
 const panels:{label:string;content:ReactNode}[]=[]; const before:ReactNode[]=[];const after:ReactNode[]=[];
 for(const child of nodes){if(!isValidElement<Record<string,unknown>>(child))continue;
  if(child.type==='nav'||child.props.items)continue;
  if(child.type==='section'||child.props.prompt){const id=String(child.props.id??'check-yourself');panels.push({label:labels[id]??id,content:child});}
  else if(child.type==='details')after.push(child);else before.push(child);
 }
 return <FullChapter.Provider value={full}><div className="guided-lesson">{before}<div className="lesson-view-control"><button type="button" className="secondary" aria-pressed={full} onClick={()=>setFull(!full)}>{full?'Return to tabs':'View full chapter'}</button></div><Tabs items={panels} label="Lesson sections" full={full} previousNext/>{after}</div></FullChapter.Provider>;
}
export function EquipmentTabs({children,label='Equipment and practice setups'}:{children:ReactNode;label?:string}) {
 const full=useContext(FullChapter);const items=Children.toArray(children).filter(isValidElement).map(child=>{const el=child as React.ReactElement<{children:ReactNode}>;const heading=Children.toArray(el.props.children).find(node=>isValidElement(node)&&node.type==='h3') as React.ReactElement<{children:ReactNode}>|undefined;return {label:heading?String(heading.props.children):'Setup',content:el};});
 return <Tabs items={items} label={label} full={full}/>;
}
