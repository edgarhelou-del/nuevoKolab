'use client';
import {ArrowUpRight} from 'lucide-react';
import homeSections from '@/content/home-sections.json';
import {SiteFooter} from './site-shell';
import DisciplineNetwork from './discipline-network';

export default function Corporate(){return <>
 <div className="original-content original-home" dangerouslySetInnerHTML={{__html:homeSections[0]}}/>
 <section className="team-portraits section" aria-labelledby="team-title">
  <div className="section-top"><p className="eyebrow">LA EXPERIENCIA DETRÁS DE KOLAB</p><a href="/quienes-somos" className="text-link">Conoce nuestro equipo <ArrowUpRight size={17}/></a></div>
  <h2 id="team-title">Nuestra experiencia.<br/><em>Una convicción compartida.</em></h2>
  <div className="team-portrait-grid">
   <article><figure><img src="/images/original/edgar-helou.webp" alt="Retrato de Edgar Helou" width="800" height="800" loading="lazy"/></figure><h3>Edgar Helou</h3><p>Cofundador · Tecnología y negocio</p><div className="team-experience"><strong>+25 años</strong><p>Liderando en organizaciones globales como Google y Amazon.</p></div></article>
   <article><figure><img src="/images/original/ana-maria-parra.webp" alt="Retrato de Ana María Parra" width="960" height="1280" loading="lazy"/></figure><h3>Ana María Parra</h3><p>Cofundadora · Facilitación y cultura</p><div className="team-experience"><strong>+20 años</strong><p>De experiencia en educación y gestión cultural.</p></div></article>
  </div>
 </section>
 <div className="original-content original-home" dangerouslySetInnerHTML={{__html:homeSections.slice(1,4).join('')}}/>
 <section className="image-story"><div className="image-story-photo"><img src="/images/kolab-collaboration.png" width="1536" height="1024" loading="lazy" alt="Manos diversas construyen una composición común con piezas de papel."/><span className="image-footnote">LA CREACIÓN ES UN PUNTO DE ENCUENTRO.</span></div><div className="image-story-copy"><p className="eyebrow">UNA MANERA DIFERENTE DE TRABAJAR</p><h2>No basta con<br/>reunir talento.<br/><em>Hay que hacer<br/>que se encuentre.</em></h2><p>Diseñamos las condiciones para que las diferencias se escuchen, las ideas se crucen y un equipo descubra algo que ninguna persona habría imaginado sola.</p><a href="/herramientas" className="text-link">Explora nuestras herramientas <ArrowUpRight size={18}/></a></div></section>
 <div className="original-content original-home" dangerouslySetInnerHTML={{__html:homeSections.slice(4,7).join('')}}/>
 <DisciplineNetwork/>
 <section className="editorial-directory section"><div className="section-top"><p className="eyebrow">SIGUE EXPLORANDO KOLAB</p><a href="https://kolab.blog" target="_blank" rel="noreferrer" className="text-link">Bitácora de viaje <ArrowUpRight size={17}/></a></div><div className="editorial-directory-grid"><a href="/quienes-somos"><span>01 / QUIÉNES SOMOS</span><h2>Dos miradas.<br/>Una convicción.</h2><p>El equipo, los principios y la evidencia detrás de cada acompañamiento.</p><ArrowUpRight size={28}/></a><a href="/herramientas"><span>02 / HERRAMIENTAS</span><h2>Primero, entender.<br/>Después, mover.</h2><p>Diagnóstico e intervención para leer la cultura y llevarla a la práctica.</p><ArrowUpRight size={28}/></a><a href="/ideas"><span>03 / LABORATORIO</span><h2>Preguntas que<br/>abren caminos.</h2><p>Ensayos, crónicas e investigación sobre cómo colaboramos.</p><ArrowUpRight size={28}/></a></div></section>
 </>}
export function CorporateClose(){return <><div className="original-content original-home" dangerouslySetInnerHTML={{__html:homeSections[8]}}/><SiteFooter/></>}
