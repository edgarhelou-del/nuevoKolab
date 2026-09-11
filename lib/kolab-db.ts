import {env} from 'cloudflare:workers';
export function database():D1Database{const db=(env as unknown as {DB?:D1Database}).DB;if(!db)throw new Error('Kolab database unavailable');return db;}
export type ProfileRow={user_id:string;id:string;name:string;city:string;role:string;bio:string;interests:string;visible:number;};
export function publicProfile(row:ProfileRow){return {id:row.id,name:row.name,city:row.city,role:row.role,bio:row.bio,interests:JSON.parse(row.interests) as string[]};}
export const noCache={'Cache-Control':'private, no-store'};
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
