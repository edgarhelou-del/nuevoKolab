import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import rawContent from '@/content/original-site.json';
import {SiteHeader,SiteFooter} from '../site-shell';
import ContactForm from '../contact-form';
import LabIndex,{type LabArticle} from '../lab-index';
type OriginalPage={title:string;description:string;heading:string;html:string;sections:string[];articles?:LabArticle[];intro?:string;formHtml?:string;contactHeadingHtml?:string;contactInfoHtml?:string};
const pages=rawContent as Record<string,OriginalPage>;
type Props={params:Promise<{slug:string[]}>};
export function generateStaticParams(){return Object.keys(pages).filter(path=>path!=='/').map(path=>({slug:path.slice(1).split('/')}))}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const page=pages['/'+slug.join('/')];return page?{title:page.title,description:page.description}:{};}
export default async function Page({params}:Props){const {slug}=await params;const path='/'+slug.join('/');const page=pages[path];if(!page)notFound();const en=path==='/en'||path.startsWith('/en/');const isArticle=path.includes('/ideas/');const kind=isArticle?'article':path.endsWith('/quienes-somos')?'about':path.endsWith('/herramientas')?'tools':path.includes('/servicios/')?'service':path.endsWith('/contacto')?'contact':'overview';let html=page.html;
 if(path==='/en')html=html.replace('<h2','<h1').replace('</h2>','</h1>');
 // These are checked-in, sanitized HTML snapshots of the owner's original site.
 // No external scripts, inline handlers, styles or runtime-generated HTML are rendered.
 return <><SiteHeader en={en} path={path}/><main lang={en?'en':'es'} className={'original-content original-'+kind}>{page.articles?<LabIndex en={en} heading={page.heading} intro={page.intro||''} articles={page.articles}/>:page.formHtml?<><div dangerouslySetInnerHTML={{__html:page.contactHeadingHtml||''}}/><div className="contact-page-layout section"><div className="contact-information" dangerouslySetInnerHTML={{__html:page.contactInfoHtml||''}}/><ContactForm en={en}/></div></>:<div lang={isArticle?'es':undefined} dangerouslySetInnerHTML={{__html:html}}/>}</main><SiteFooter en={en}/></>;
}
