'use client';

import {useState} from 'react';
import styles from './discipline-network.module.css';

const disciplines = [
  {name:'Ingeniería y Matemáticas', idea:'Modelar sistemas, reconocer patrones y convertir preguntas en experimentos.'},
  {name:'Interactividad', idea:'Diseñar experiencias donde participar cambia lo que sucede.'},
  {name:'Antropología', idea:'Comprender los significados, los rituales y las prácticas de cada equipo.'},
  {name:'Coaching', idea:'Abrir preguntas que ayudan a revisar hábitos y ensayar nuevas respuestas.'},
  {name:'Sociología', idea:'Leer las relaciones, los roles y las condiciones que facilitan la colaboración.'},
  {name:'Artes escénicas', idea:'Practicar escucha, presencia e improvisación con otras personas.'},
  {name:'Música', idea:'Explorar el ritmo compartido, la escucha y la coordinación colectiva.'},
  {name:'Literatura', idea:'Encontrar relatos y perspectivas para imaginar otras formas de trabajar.'},
];
const points = disciplines.map((_,i)=>({x:500+350*Math.sin(i*Math.PI/4),y:500-350*Math.cos(i*Math.PI/4)}));
const edges = points.flatMap((_,i)=>[1,3].map(step=>[i,(i+step)%8]));

export default function DisciplineNetwork(){
  const [selected,setSelected]=useState<number|null>(null);
  return <section className={styles.section} aria-labelledby="discipline-title">
    <header className={styles.heading}>
      <p className="eyebrow">CÓMO LO HACEMOS</p>
      <h2 id="discipline-title">No trabajamos solos.<br/><em>Trabajamos en red.</em></h2>
      <p>KOLAB conecta especialistas de mundos que rara vez se encuentran. La ventaja no está en cada disciplina por separado, sino en lo que pasa entre ellas.</p>
    </header>
    <div className={styles.layout}>
      <div className={styles.diagram} role="group" aria-label="Explora las ocho puntas de nuestra red de disciplinas">
        <svg viewBox="0 0 1000 1000" aria-hidden="true" className={styles.lines}>
          {edges.map(([a,b])=><line key={`${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} className={selected===null?styles.base:styles.dim}/>)}
          {selected!==null&&points.map((p,i)=>i!==selected&&<line key={i} x1={points[selected].x} y1={points[selected].y} x2={p.x} y2={p.y} className={styles.connection}/>)}
          {points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="11" className={styles.vertex}/>)}
        </svg>
        <span className={styles.center} aria-hidden="true">KOLAB<span>ENTRE DISCIPLINAS</span></span>
        {disciplines.map((d,i)=><button key={d.name} className={`${styles.node} ${styles[`node${i}`]}`} aria-pressed={selected===i} aria-controls="discipline-detail" onClick={()=>setSelected(selected===i?null:i)}>{d.name}</button>)}
      </div>
      <div className={styles.detail} id="discipline-detail" aria-live="polite" aria-atomic="true">
        <p className={styles.kicker}>{selected===null?'TOCA UNA DISCIPLINA':'UNA MIRADA, MÚLTIPLES CONEXIONES'}</p>
        <h3>{selected===null?'Lo valioso pasa entre ellas.':disciplines[selected].name}</h3>
        <p>{selected===null?'Explora una punta del octograma para descubrir cómo se conecta con las otras disciplinas.':disciplines[selected].idea}</p>
        {selected!==null&&<><p className={styles.kicker}>EN DIÁLOGO CON</p><ul>{disciplines.map((d,i)=>i!==selected&&<li key={d.name}><button onClick={()=>setSelected(i)}>{d.name}<span aria-hidden="true">↗</span></button></li>)}</ul><button className={styles.reset} onClick={()=>setSelected(null)}>Ver el octograma completo ↺</button></>}
      </div>
    </div>
  </section>;
}
