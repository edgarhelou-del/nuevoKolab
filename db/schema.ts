import { sql } from 'drizzle-orm';
import { sqliteTable,text,integer,index,uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles=sqliteTable('profiles',{
 userId:text('user_id').primaryKey(),id:text('id').notNull(),name:text('name').notNull(),city:text('city').notNull().default(''),role:text('role').notNull().default(''),bio:text('bio').notNull().default(''),interests:text('interests').notNull(),visible:integer('visible').notNull().default(1),consentAt:text('consent_at').notNull(),createdAt:text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),updatedAt:text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
},t=>[uniqueIndex('idx_profiles_public_id').on(t.id),index('idx_profiles_visible_created').on(t.visible,t.createdAt)]);
